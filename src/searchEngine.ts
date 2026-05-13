/**
 * searchEngine.ts
 *
 * Spawns ripgrep (rg) directly for content search — the same engine VS Code
 * uses internally. Streams results via callback for instant UI feedback.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export interface SearchOpts {
  query: string;
  matchCase: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includeGlob: string;
  excludeGlob: string;
}

export interface MatchResult {
  filePath: string;
  relPath:  string;
  line:     number;
  col:      number;
  colEnd:   number;
  text:     string;
}

// ── ripgrep integration ──────────────────────────────────────────────────

function findRgPath(): string | undefined {
  // VS Code bundles ripgrep
  const appRoot = vscode.env.appRoot;
  const candidates = [
    path.join(appRoot, 'node_modules', '@vscode', 'ripgrep', 'bin', 'rg'),
    path.join(appRoot, 'node_modules', 'vscode-ripgrep', 'bin', 'rg'),
  ];
  const suffix = process.platform === 'win32' ? '.exe' : '';
  for (const c of candidates) {
    const p = c + suffix;
    if (fs.existsSync(p)) return p;
  }
  // Fallback: rg in PATH
  try {
    const cp = require('child_process');
    const bin = process.platform === 'win32' ? 'where' : 'which';
    const out = cp.execFileSync(bin, ['rg' + suffix], { encoding: 'utf8', timeout: 3000 }).trim();
    if (out) return out.split(/\r?\n/)[0];
  } catch {}
  return undefined;
}

/**
 * Stream search results through `onResult` callbacks. Returns an object with
 * an `abort()` function that kills the rg process. The promise resolves when
 * rg exits (normally or via abort).
 */
export function runSearchRg(
  opts: SearchOpts,
  root: string,
  onResult: (r: MatchResult) => void,
  onDone: (error?: string) => void,
): { abort: () => void } {
  const rgPath = findRgPath();
  if (!rgPath) {
    onDone('ripgrep not found');
    return { abort: () => {} };
  }

  const args: string[] = ['--json', '-n', '--no-heading'];

  if (!opts.matchCase) args.push('-i'); // --ignore-case (default is case-sensitive)

  if (opts.wholeWord)  args.push('-w');

  args.push(opts.useRegex ? '-e' : '-F', opts.query);

  if (opts.includeGlob) args.push('-g', opts.includeGlob);

  const defaultExcludes = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/out/**'];
  for (const ex of defaultExcludes) {
    args.push('-g', '!' + ex);
  }
  if (opts.excludeGlob) {
    args.push('-g', '!' + opts.excludeGlob);
  }

  args.push('--crlf', root);

  let cp: ChildProcess | undefined;
  let aborted = false;

  try {
    cp = spawn(rgPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    onDone(String(e));
    return { abort: () => {} };
  }

  let leftover = '';

  cp.stdout!.on('data', (chunk: Buffer) => {
    if (aborted) return;
    const text = leftover + chunk.toString();
    const lines = text.split('\n');
    leftover = lines.pop()!;

    for (const line of lines) {
      if (!line) continue;
      try {
        const j = JSON.parse(line);
        if (j.type !== 'match') continue;
        const data = j.data;
        const fp: string = data.path.text;
        const absPath = path.isAbsolute(fp) ? fp : path.join(root, fp);
        const sub = data.submatches[0];
        const start = sub.start;
        const end = sub.end;
        onResult({
          filePath: absPath,
          relPath:  path.relative(root, absPath).replace(/\\/g, '/'),
          line:     data.line_number,
          col:      start,
          colEnd:   end,
          text:     data.lines.text.replace(/\r?\n$/, ''),
        });
      } catch {}
    }
  });

  cp.on('error', (err: NodeJS.ErrnoException) => {
    if (aborted) return;
    if (err.code === 'ENOENT') onDone('ripgrep not found');
    else onDone(String(err));
  });

  cp.on('close', () => {
    if (!aborted) onDone();
  });

  return {
    abort() {
      aborted = true;
      try { cp?.kill(); } catch {}
    },
  };
}

/**
 * Collect ALL search results (non-streaming). Used for replace operations
 * where we need the full result set before proceeding.
 */
export function runSearchCollect(opts: SearchOpts, root: string): Promise<MatchResult[]> {
  return new Promise((resolve) => {
    const results: MatchResult[] = [];
    const { abort } = runSearchRg(opts, root,
      (r) => results.push(r),
      ()  => resolve(results),
    );
    // abort is available but not used here
    void abort;
  });
}


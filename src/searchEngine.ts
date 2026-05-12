/**
 * searchEngine.ts
 *
 * Runs file search on a background worker thread so the extension host main
 * thread stays responsive on large repositories.
 */

import * as path from 'path';
import { Worker, parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';

export interface SearchOpts {
  query: string;
  matchCase: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includeGlob: string;
  excludeGlob: string;
  root: string;
  filePaths: string[];
}

export interface MatchResult {
  filePath: string;
  relPath:  string;
  line:     number;
  col:      number;
  colEnd:   number;
  text:     string;
}

interface WorkerPayload {
  opts: SearchOpts;
}

function workerMain() {
  const { opts } = workerData as WorkerPayload;
  const { query, matchCase, wholeWord, useRegex, root, filePaths } = opts;

  let pattern = query;
  if (!useRegex) { pattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); }
  if (wholeWord) { pattern = '\\b' + pattern + '\\b'; }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, matchCase ? 'g' : 'gi');
  } catch (_) {
    parentPort!.postMessage({ type: 'done', results: [] });
    return;
  }

  const results: MatchResult[] = [];

  for (const fp of filePaths) {
    try {
      const raw = fs.readFileSync(fp, 'utf8');
      if (raw.includes('\0')) { continue; }
      const lines = raw.split('\n');
      for (let i = 0; i < lines.length; i++) {
        regex.lastIndex = 0;
        const m = regex.exec(lines[i]);
        if (!m) { continue; }
        results.push({
          filePath: fp,
          relPath:  path.relative(root, fp).replace(/\\/g, '/'),
          line:     i + 1,
          col:      m.index,
          colEnd:   m.index + m[0].length,
          text:     lines[i].trimEnd(),
        });
      }
    } catch (_) { /* unreadable */ }
  }

  parentPort!.postMessage({ type: 'done', results });
}

export function runSearchWorker(opts: SearchOpts): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    const workerSrc = `
const { workerData, parentPort } = require('worker_threads');
const path = require('path');
const fs   = require('fs');
const { query, matchCase, wholeWord, useRegex, root, filePaths } = workerData.opts;
let pattern = query;
if (!useRegex) { pattern = pattern.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, '\\\\$&'); }
if (wholeWord) { pattern = '\\\\b' + pattern + '\\\\b'; }
let regex;
try { regex = new RegExp(pattern, matchCase ? 'g' : 'gi'); }
catch (_) { parentPort.postMessage({ type: 'done', results: [] }); process.exit(0); }
const results = [];
for (const fp of filePaths) {
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    if (raw.includes('\\0')) { continue; }
    const lines = raw.split('\\n');
    for (let i = 0; i < lines.length; i++) {
      regex.lastIndex = 0;
      const m = regex.exec(lines[i]);
      if (!m) { continue; }
      results.push({ filePath: fp, relPath: path.relative(root, fp).replace(/\\\\/g, '/'),
        line: i + 1, col: m.index, colEnd: m.index + m[0].length, text: lines[i].trimEnd() });
    }
  } catch (_) {}
}
parentPort.postMessage({ type: 'done', results });
`;
    const tmpFile = path.join(require('os').tmpdir(), 'vsi_search_worker.js');
    fs.writeFileSync(tmpFile, workerSrc, 'utf8');

    const worker = new Worker(tmpFile, { workerData: { opts } });
    worker.on('message', (msg: { type: string; results: MatchResult[] }) => {
      if (msg.type === 'done') { resolve(msg.results); }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) { reject(new Error('Worker exited with code ' + code)); }
    });
  });
}

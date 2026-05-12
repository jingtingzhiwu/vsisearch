import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runSearchWorker, SearchOpts, MatchResult } from './searchEngine';
import { getWebviewContent } from './webviewContent';

interface MsgSearch   { type: 'search';  opts: Omit<SearchOpts,'root'|'filePaths'>; }
interface MsgReplace  { type: 'replace'; opts: Omit<SearchOpts,'root'|'filePaths'>; replaceText: string; filePaths?: string[]; }
interface MsgPreview  { type: 'preview'; filePath: string; line: number; col: number; colEnd: number; }
interface MsgOpen     { type: 'open';    filePath: string; line: number; col: number; colEnd: number; }
interface MsgLoadFile { type: 'loadFile'; filePath: string; }
interface MsgReady    { type: 'ready'; }
interface MsgClose    { type: 'close'; }

type WebviewMsg = MsgSearch | MsgReplace | MsgPreview | MsgOpen | MsgLoadFile | MsgReady | MsgClose;

export class SearchPanel {
  private static _panel: vscode.WebviewPanel | undefined;
  private static _ctx: vscode.ExtensionContext;
  private static _disposables: vscode.Disposable[] = [];
  private static _currentSearch: AbortController | undefined;
  private static _deco: vscode.TextEditorDecorationType | undefined;
  private static _decoTimer: ReturnType<typeof setTimeout> | undefined;

  static show(ctx: vscode.ExtensionContext, isReplace: boolean) {
    SearchPanel._ctx = ctx;

    if (SearchPanel._panel) {
      SearchPanel._panel.reveal(vscode.ViewColumn.Two, false);
      SearchPanel._panel.webview.postMessage({ type: 'setMode', isReplace });
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'vsiSearch',
      isReplace ? 'Replace in Files' : 'Find in Files',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
      { enableScripts: true, retainContextWhenHidden: true, enableFindWidget: false }
    );

    SearchPanel._panel = panel;
    panel.webview.html = getWebviewContent(panel.webview, ctx, isReplace);

    setTimeout(async () => {
      try {
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      } catch { /* older VS Code */ }

      const candidates = [
        'workbench.action.toggleAuxiliaryBarCompactMode',
        'workbench.action.auxiliaryWindow.toggleCompactMode',
        'workbench.action.toggleCompactAuxiliaryWindow',
        'workbench.action.toggleCompactMode',
      ];
      const allCmds = await vscode.commands.getCommands(true);
      for (const id of candidates) {
        if (allCmds.includes(id)) {
          try { await vscode.commands.executeCommand(id); } catch { /* ignore */ }
          break;
        }
      }
    }, 50);

    panel.webview.onDidReceiveMessage(
      (msg: WebviewMsg) => SearchPanel._onMessage(msg),
      null,
      SearchPanel._disposables
    );

    panel.onDidDispose(() => {
      SearchPanel._panel = undefined;
      SearchPanel._disposables.forEach(d => d.dispose());
      SearchPanel._disposables = [];
      SearchPanel._deco?.dispose();
    }, null, SearchPanel._disposables);
  }

  static dispose() {
    SearchPanel._panel?.dispose();
  }

  private static async _onMessage(msg: WebviewMsg) {
    switch (msg.type) {
      case 'ready': break;
      case 'search':   await SearchPanel._runSearch(msg.opts); break;
      case 'replace':  await SearchPanel._runReplace(msg.opts, msg.replaceText, msg.filePaths); break;
      case 'preview':  await SearchPanel._previewLine(msg.filePath, msg.line, msg.col, msg.colEnd, true); break;
      case 'open':     await SearchPanel._previewLine(msg.filePath, msg.line, msg.col, msg.colEnd, false); break;
      case 'loadFile': await SearchPanel._loadFile(msg.filePath); break;
      case 'close':    SearchPanel._panel?.dispose(); break;
    }
  }

  private static async _loadFile(filePath: string) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      if (raw.includes('\0')) {
        SearchPanel._send({ type: 'fileContent', filePath, content: '', error: 'Binary file' });
        return;
      }
      const MAX = 2 * 1024 * 1024;
      const content = raw.length > MAX ? raw.substring(0, MAX) : raw;
      SearchPanel._send({ type: 'fileContent', filePath, content, truncated: raw.length > MAX });
    } catch (e: unknown) {
      SearchPanel._send({ type: 'fileContent', filePath, content: '', error: String(e) });
    }
  }

  private static async _runSearch(partialOpts: Omit<SearchOpts, 'root' | 'filePaths'>) {
    const roots = vscode.workspace.workspaceFolders;
    if (!roots?.length) {
      SearchPanel._send({ type: 'results', results: [], error: 'No workspace folder open.' });
      return;
    }

    SearchPanel._currentSearch?.abort();
    const ctl = new AbortController();
    SearchPanel._currentSearch = ctl;

    SearchPanel._send({ type: 'searching' });

    try {
      const root    = roots[0].uri.fsPath;
      const include = partialOpts.includeGlob || '**/*';
      const excParts = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/out/**'];
      if (partialOpts.excludeGlob) { excParts.unshift(partialOpts.excludeGlob); }
      const exclude = '{' + excParts.join(',') + '}';

      const uris = await vscode.workspace.findFiles(include, exclude, 20000);
      if (ctl.signal.aborted) { return; }

      const filePaths = uris.map(u => u.fsPath);
      const opts: SearchOpts = { ...partialOpts, root, filePaths };

      const results = await runSearchWorker(opts);
      if (ctl.signal.aborted) { return; }

      SearchPanel._send({ type: 'results', results, query: partialOpts.query });
    } catch (e: unknown) {
      if (!ctl.signal.aborted) {
        SearchPanel._send({ type: 'results', results: [], error: String(e) });
      }
    }
  }

  private static async _runReplace(
    partialOpts: Omit<SearchOpts, 'root' | 'filePaths'>,
    replaceText: string,
    targetFiles?: string[]
  ) {
    const roots = vscode.workspace.workspaceFolders;
    if (!roots?.length) { return; }

    const root    = roots[0].uri.fsPath;
    const include = partialOpts.includeGlob || '**/*';
    const excParts = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/out/**'];
    if (partialOpts.excludeGlob) { excParts.unshift(partialOpts.excludeGlob); }
    const exclude = '{' + excParts.join(',') + '}';

    const uris = await vscode.workspace.findFiles(include, exclude, 20000);
    let filePaths = uris.map(u => u.fsPath);
    if (targetFiles?.length) {
      const set = new Set(targetFiles);
      filePaths = filePaths.filter(fp => set.has(fp));
    }

    const opts: SearchOpts = { ...partialOpts, root, filePaths };
    const results = await runSearchWorker(opts);

    let pattern = partialOpts.query;
    if (!partialOpts.useRegex) { pattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); }
    if (partialOpts.wholeWord) { pattern = '\\b' + pattern + '\\b'; }
    let regex: RegExp;
    try { regex = new RegExp(pattern, partialOpts.matchCase ? 'g' : 'gi'); }
    catch (_) { return; }

    const seenFiles = new Map<string, boolean>();
    results.forEach(r => seenFiles.set(r.filePath, true));
    const affected = Array.from(seenFiles.keys());
    const edit = new vscode.WorkspaceEdit();

    for (const fp of affected) {
      const uri = vscode.Uri.file(fp);
      const doc  = await vscode.workspace.openTextDocument(uri);
      const text = doc.getText();
      regex.lastIndex = 0;
      const newText = text.replace(regex, replaceText);
      if (newText !== text) {
        edit.replace(uri, new vscode.Range(doc.positionAt(0), doc.positionAt(text.length)), newText);
      }
    }

    await vscode.workspace.applyEdit(edit);
    SearchPanel._send({ type: 'replaceDone', count: affected.length });
    await SearchPanel._runSearch(partialOpts);
  }

  private static async _previewLine(
    filePath: string, line: number, col: number, colEnd: number,
    preserveFocus: boolean
  ) {
    const uri    = vscode.Uri.file(filePath);
    const doc    = await vscode.workspace.openTextDocument(uri);
    const start  = new vscode.Position(line - 1, col);
    const end    = new vscode.Position(line - 1, colEnd);

    const editor = await vscode.window.showTextDocument(doc, {
      viewColumn:    vscode.ViewColumn.One,
      preview:       false,
      preserveFocus,
    });
    editor.selection = new vscode.Selection(start, end);
    editor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);

    if (SearchPanel._decoTimer) { clearTimeout(SearchPanel._decoTimer); }
    SearchPanel._deco?.dispose();
    SearchPanel._deco = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
      borderRadius: '2px',
    });
    editor.setDecorations(SearchPanel._deco, [new vscode.Range(start, end)]);
    SearchPanel._decoTimer = setTimeout(() => { SearchPanel._deco?.dispose(); }, 3000);
  }

  private static _send(msg: object) {
    SearchPanel._panel?.webview.postMessage(msg);
  }
}

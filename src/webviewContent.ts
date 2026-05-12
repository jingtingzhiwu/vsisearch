import * as vscode from 'vscode';

export function getWebviewContent(
  webview: vscode.Webview,
  _ctx: vscode.ExtensionContext,
  isReplace: boolean
): string {
  const mode = isReplace ? 'true' : 'false';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Find in Files</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:        var(--vscode-editor-background, #1e1e1e);
  --panel:     var(--vscode-sideBar-background, var(--vscode-editorWidget-background, #252526));
  --input-bg:  var(--vscode-input-background, #3c3c3c);
  --input-bd:  var(--vscode-input-border, var(--vscode-contrastBorder, #3c3c3c));
  --input-focus: var(--vscode-focusBorder, #007acc);
  --btn:       var(--vscode-button-secondaryBackground, var(--vscode-editorWidget-background, #3a3d41));
  --btn-hover: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground, #45494e));
  --btn-on:    var(--vscode-button-background, #0e639c);
  --btn-on-fg: var(--vscode-button-foreground, #ffffff);
  --text:      var(--vscode-foreground, #cccccc);
  --dim:       var(--vscode-descriptionForeground, #8b8b8b);
  --file-fg:   var(--vscode-symbolIcon-fileForeground, var(--vscode-textLink-foreground, #cc9921));
  --hl-bg:     var(--vscode-editor-findMatchHighlightBackground, rgba(234,184,0,0.4));
  --hl-text:   var(--vscode-editor-foreground, var(--vscode-foreground, #ffffff));
  --lnum:      var(--vscode-editorLineNumber-foreground, #858585);
  --sep:       var(--vscode-panel-border, var(--vscode-editorWidget-border, #3c3c3c));
  --row-hover: var(--vscode-list-hoverBackground, #2a2d2e);
  --row-sel:   var(--vscode-list-activeSelectionBackground, var(--vscode-list-inactiveSelectionBackground, #094771));
  --row-sel-fg:var(--vscode-list-activeSelectionForeground, var(--vscode-foreground, #ffffff));
  --preview-hl: var(--vscode-editor-rangeHighlightBackground, rgba(255,214,0,0.18));
}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);
  font-family:var(--vscode-font-family, "Segoe UI",sans-serif);
  font-size:var(--vscode-font-size, 13px)}

#toolbar{
  background:var(--panel);
  border-bottom:1px solid var(--sep);
  padding:6px 8px;
  flex-shrink:0;
  display:flex;flex-direction:column;gap:4px;
}
.trow{display:flex;align-items:center;gap:5px}
.lbl{color:var(--dim);width:58px;flex-shrink:0;font-size:11px;user-select:none}
input[type=text]{
  flex:1;background:var(--input-bg);border:1px solid var(--input-bd);
  color:var(--text);padding:3px 6px;font-size:12px;font-family:inherit;
  outline:none;border-radius:2px;min-width:0;
}
input[type=text]:focus{border-color:var(--input-focus)}
.toggles{display:flex;gap:2px;flex-shrink:0}
.tbtn{
  background:var(--btn);border:1px solid var(--sep);color:var(--dim);
  padding:2px 7px;font-size:11px;cursor:pointer;border-radius:2px;
  user-select:none;font-family:inherit;white-space:nowrap;flex-shrink:0;
}
.tbtn:hover{background:var(--btn-hover);color:var(--text)}
.tbtn.on{background:var(--btn-on);color:var(--btn-on-fg);border-color:var(--btn-on)}
.abtn{
  background:var(--btn);border:1px solid var(--sep);color:var(--text);
  padding:3px 10px;font-size:11px;cursor:pointer;border-radius:2px;
  white-space:nowrap;font-family:inherit;flex-shrink:0;
}
.abtn:hover{background:var(--btn-hover)}
.abtn.primary{background:var(--btn-on);border-color:var(--btn-on);color:var(--btn-on-fg)}
.abtn.primary:hover{background:var(--btn-hover);color:var(--btn-on-fg)}


#layout{display:flex;flex-direction:column;height:calc(100vh - 0px)}
#toolbar{flex-shrink:0}
#splitter-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
#results-pane{flex:0 0 55%;display:flex;flex-direction:column;min-height:60px;overflow:hidden}
#splitter{height:4px;background:var(--sep);cursor:row-resize;flex-shrink:0}
#splitter:hover{background:var(--input-focus)}
#preview-pane{flex:1;display:flex;flex-direction:column;min-height:40px;overflow:hidden;border-top:1px solid var(--sep)}


#results-header{
  background:var(--panel);border-bottom:1px solid var(--sep);
  padding:2px 8px;font-size:11px;color:var(--dim);flex-shrink:0;
  display:flex;align-items:center;justify-content:space-between;min-height:22px;
}
.stat-count{color:var(--hl-text);font-weight:bold}
#results-scroll{flex:1;overflow-y:auto;overflow-x:hidden}
#results-scroll::-webkit-scrollbar{width:8px}
#results-scroll::-webkit-scrollbar-thumb{background:var(--sep);border-radius:4px}


.result-row{
  display:flex;align-items:baseline;padding:2px 0;
  cursor:pointer;white-space:nowrap;
}
.result-row:hover{background:var(--row-hover)}
.result-row.active{background:var(--row-sel)}
.rr-check{margin:0 6px 0 14px;flex-shrink:0;vertical-align:middle}
.rr-code{
  flex:1;padding-left:8px;overflow:hidden;text-overflow:ellipsis;
  font-size:12px;white-space:nowrap;min-width:0;
  font-family:var(--vscode-editor-font-family, "Consolas",monospace);
}
.rr-file{
  color:var(--file-fg);font-size:11px;flex-shrink:0;
  padding-right:6px;padding-left:12px;max-width:260px;
  overflow:hidden;text-overflow:ellipsis;
  border-left:1px solid var(--sep);
}
.rr-lnum{
  color:var(--lnum);font-size:11px;width:44px;text-align:right;
  flex-shrink:0;padding-right:8px;padding-left:6px;
}
.hl{background:var(--hl-bg);color:var(--hl-text);border-radius:1px;padding:0 1px}


#preview-header{
  background:var(--panel);border-bottom:1px solid var(--sep);
  padding:2px 8px;font-size:11px;color:var(--dim);
  flex-shrink:0;min-height:22px;display:flex;align-items:center;
}
#preview-content{flex:1;overflow:auto;padding:0}
#preview-content::-webkit-scrollbar{width:8px}
#preview-content::-webkit-scrollbar-thumb{background:var(--sep);border-radius:4px}
#preview-table{width:100%;border-collapse:collapse;font-size:12px}
.pv-line{display:flex}
.pv-lnum{
  color:var(--lnum);width:52px;text-align:right;padding:1px 8px 1px 0;
  border-right:1px solid var(--sep);flex-shrink:0;user-select:none;
  font-size:11px;
}
.pv-code{padding:1px 0 1px 10px;white-space:pre;flex:1;
  font-family:var(--vscode-editor-font-family, "Consolas",monospace);}
.pv-line.target{background:var(--preview-hl)}


#empty{
  display:flex;align-items:center;justify-content:center;
  flex:1;color:var(--dim);font-size:13px;padding:20px;text-align:center;
}
#spinner{display:none;padding:16px 8px;color:var(--dim);font-size:12px}
#spinner.on{display:block}


#replace-bar{
  display:none;background:var(--panel);border-top:1px solid var(--sep);
  padding:4px 8px;gap:6px;align-items:center;flex-shrink:0;
}
#replace-bar.vis{display:flex}
</style>
</head>
<body>
<div id="layout">

  <!-- -- TOOLBAR -- -->
  <div id="toolbar">
    <div class="trow">
      <span class="lbl">Search:</span>
      <input id="q-search" type="text" placeholder="Search text... autocomplete="off" spellcheck="false"/>
      <div class="toggles">
        <button class="tbtn" id="btn-case" title="Match case (Alt+C)">Aa</button>
        <button class="tbtn" id="btn-word" title="Whole word (Alt+W)">W</button>
        <button class="tbtn" id="btn-regex" title="Regex (Alt+R)">.*</button>
      </div>
      <button class="abtn primary" id="btn-find">Find</button>
    </div>
    <div class="trow" id="replace-row" style="display:none">
      <span class="lbl">Replace:</span>
      <input id="q-replace" type="text" placeholder="Replace with... autocomplete="off" spellcheck="false"/>
    </div>
    <div class="trow">
      <span class="lbl" style="font-size:10px">In files:</span>
      <input id="q-include" type="text" placeholder="**/*.ts  (blank=all)" style="font-size:11px" autocomplete="off"/>
      <span style="color:var(--dim);font-size:10px;flex-shrink:0">Excl:</span>
      <input id="q-exclude" type="text" placeholder="**/dist/**" style="font-size:11px;max-width:140px" autocomplete="off"/>
    </div>
  </div>

  <!-- -- RESULTS + PREVIEW -- -->
  <div id="splitter-wrap">
    <div id="results-pane">
      <div id="results-header">
        <span id="stat">Ready</span>
        <span id="sel-info" style="display:none;font-size:10px"></span>
      </div>
      <div id="results-scroll">
        <div id="empty">Open a folder, then press Ctrl+H to search.</div>
        <div id="spinner">Searching...</div>
        <div id="result-list"></div>
      </div>
    </div>
    <div id="splitter"></div>
    <div id="preview-pane">
      <div id="preview-header">
        <span id="pv-title">Preview</span>
      </div>
      <div id="preview-content">
        <div style="padding:12px;color:var(--dim);font-size:12px">
          Select a result to preview.
        </div>
      </div>
    </div>
  </div>

  <!-- -- REPLACE BAR (bottom) -- -->
  <div id="replace-bar">
    <button class="abtn" id="btn-toggle-all">Unselect All</button>
    <button class="abtn primary" id="btn-repl-all">Replace</button>
    <span id="repl-msg" style="color:var(--dim);font-size:11px;margin-left:8px"></span>
  </div>

</div>
<script>
const vscode = acquireVsCodeApi();

let isReplace   = ${mode};
let matchCase   = false;
let wholeWord   = false;
let useRegex    = false;
let results     = [];      // flat array of MatchResult
let activeIdx   = -1;
let debounce    = null;

const qSearch   = document.getElementById('q-search');
const qReplace  = document.getElementById('q-replace');
const qInclude  = document.getElementById('q-include');
const qExclude  = document.getElementById('q-exclude');
const resultList= document.getElementById('result-list');
const spinner   = document.getElementById('spinner');
const emptyDiv  = document.getElementById('empty');
const statEl    = document.getElementById('stat');
const pvTitle   = document.getElementById('pv-title');
const pvContent = document.getElementById('preview-content');
const replBar   = document.getElementById('replace-bar');
const replRow   = document.getElementById('replace-row');
const selInfo   = document.getElementById('sel-info');

function setMode(r) {
  isReplace = r;
  replRow.style.display = r ? 'flex' : 'none';
  if (r && results.length) replBar.classList.add('vis');
  else replBar.classList.remove('vis');
  document.title = r ? 'Replace in Files' : 'Find in Files';
}
setMode(isReplace);

function setupToggle(id, getter, setter) {
  const b = document.getElementById(id);
  b.addEventListener('click', () => { setter(!getter()); b.classList.toggle('on', getter()); });
}
setupToggle('btn-case',  () => matchCase,  v => matchCase  = v);
setupToggle('btn-word',  () => wholeWord,  v => wholeWord  = v);
setupToggle('btn-regex', () => useRegex,   v => useRegex   = v);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { vscode.postMessage({ type: 'close' }); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); moveActive(-1); }
  if (e.key === 'Enter' && document.activeElement === qSearch) { e.preventDefault(); doSearch(); }
  if (e.key === 'Enter' && document.activeElement === qReplace) { e.preventDefault(); doSearch(); }
  if (e.altKey && e.key === 'c') { document.getElementById('btn-case').click(); }
  if (e.altKey && e.key === 'w') { document.getElementById('btn-word').click(); }
  if (e.altKey && e.key === 'r') { document.getElementById('btn-regex').click(); }
});
qSearch.addEventListener('input', () => { scheduleSearch(); });
document.getElementById('btn-find').addEventListener('click', doSearch);
document.getElementById('btn-repl-all').addEventListener('click', () => {
  const checked = [...document.querySelectorAll('.fcb:checked')].map(c => c.dataset.fp);
  if (!checked.length) { document.getElementById('repl-msg').textContent = 'No files selected.'; return; }
  doReplace(checked);
});
document.getElementById('btn-toggle-all').addEventListener('click', () => {
  const boxes = [...document.querySelectorAll('.fcb')];
  const anyUnchecked = boxes.some(b => !b.checked);
  boxes.forEach(b => b.checked = anyUnchecked);
  document.getElementById('btn-toggle-all').textContent = anyUnchecked ? 'Unselect All' : 'Select All';
});

function focusSearch() {
  qSearch.focus();
  try { qSearch.select(); } catch {}
}
setTimeout(focusSearch, 50);
window.addEventListener('focus', () => setTimeout(focusSearch, 0));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) setTimeout(focusSearch, 0);
});

function getOpts() {
  return { query: qSearch.value.trim(), matchCase, wholeWord, useRegex,
           includeGlob: qInclude.value.trim(), excludeGlob: qExclude.value.trim() };
}
function scheduleSearch() {
  clearTimeout(debounce);
  debounce = setTimeout(doSearch, 300);
}
function doSearch() {
  const opts = getOpts();
  if (!opts.query) { clearResults(); return; }
  vscode.postMessage({ type: 'search', opts });
}
function doReplace(filePaths) {
  const opts = getOpts();
  if (!opts.query) return;
  vscode.postMessage({ type: 'replace', opts, replaceText: qReplace.value, filePaths });
}

function renderResults(data) {
  results  = data;
  activeIdx = -1;
  resultList.innerHTML = '';

  if (!data.length) {
    showEmpty('No results found for: ' + qSearch.value);
    if (isReplace) replBar.classList.remove('vis');
    return;
  }

  emptyDiv.style.display  = 'none';
  spinner.classList.remove('on');

  // Count distinct files
  const files = new Set(data.map(r => r.filePath));
  const total = data.length;
  statEl.innerHTML = '<span class="stat-count">' + total + '</span> match' + (total===1?'':'es')
    + ' in <span class="stat-count">' + files.size + '</span> file' + (files.size===1?'':'s');

  // Build rows
  const frag = document.createDocumentFragment();
  let lastFile = null;

  data.forEach((r, idx) => {
    const row = document.createElement('div');
    row.className = 'result-row';
    row.dataset.idx = idx;

    // checkbox (replace mode)
    if (isReplace) {
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.className = 'rr-check fcb';
      cb.dataset.fp = r.filePath; cb.checked = true;
      cb.addEventListener('click', e => e.stopPropagation());
      row.appendChild(cb);
    }

    // file:line  (show file only when it changes)
    const codeSpan = document.createElement('span');
    codeSpan.className = 'rr-code';
    codeSpan.innerHTML = hlSnippet(r.text, r.col, r.colEnd);
    row.appendChild(codeSpan);

    const fileSpan = document.createElement('span');
    fileSpan.className = 'rr-file';
    fileSpan.title = r.relPath;
    fileSpan.textContent = r.relPath;
    row.appendChild(fileSpan);

    const lnumSpan = document.createElement('span');
    lnumSpan.className = 'rr-lnum';
    lnumSpan.textContent = r.line;
    row.appendChild(lnumSpan);

    row.addEventListener('click', () => activateRow(idx));
    row.addEventListener('dblclick', () => openRow(idx));
    frag.appendChild(row);
  });

  resultList.appendChild(frag);
  if (isReplace) {
    replBar.classList.add('vis');
    const tg = document.getElementById('btn-toggle-all');
    if (tg) tg.textContent = 'Unselect All';
  }
}

function activateRow(idx) {
  if (idx < 0 || idx >= results.length) return;

  // deselect old
  if (activeIdx >= 0) {
    const old = resultList.querySelector('[data-idx="' + activeIdx + '"]');
    if (old) old.classList.remove('active');
  }
  activeIdx = idx;
  const row = resultList.querySelector('[data-idx="' + idx + '"]');
  if (row) {
    row.classList.add('active');
    row.scrollIntoView({ block: 'nearest' });
  }

  const r = results[idx];
  showPreview(r);
}

function openRow(idx) {
  if (idx < 0 || idx >= results.length) return;
  const r = results[idx];
  vscode.postMessage({ type: 'open', filePath: r.filePath, line: r.line, col: r.col, colEnd: r.colEnd });
}

function moveActive(delta) {
  activateRow(Math.max(0, Math.min(results.length - 1, activeIdx + delta)));
}

let _pvCache = new Map(); // filePath -> content
let _pvCurrentFile = null;
let _pvCurrentTarget = null; // {line, col, colEnd}

function showPreview(r) {
  pvTitle.textContent = r.relPath + ':' + r.line;
  _pvCurrentTarget = { line: r.line, col: r.col, colEnd: r.colEnd };

  if (_pvCache.has(r.filePath)) {
    renderFullFile(_pvCache.get(r.filePath), r);
  } else {
    _pvCurrentFile = r.filePath;
    pvContent.innerHTML = '<div style="padding:12px;color:var(--dim)">Loading\\u2026</div>';
    vscode.postMessage({ type: 'loadFile', filePath: r.filePath });
  }
}

function renderFullFile(content, r) {
  const lines = content.split('\\n');
  const target = r.line; // 1-based
  const frag = document.createDocumentFragment();
  for (let i = 0; i < lines.length; i++) {
    const lnum = i + 1;
    const div = document.createElement('div');
    div.className = 'pv-line' + (lnum === target ? ' target' : '');
    div.dataset.ln = lnum;
    const text = lines[i].replace(/\\r$/, '');
    let codeHtml;
    if (lnum === target) {
      codeHtml = escHtml(text.substring(0, r.col))
        + '<span class="hl">' + escHtml(text.substring(r.col, r.colEnd)) + '</span>'
        + escHtml(text.substring(r.colEnd));
    } else {
      codeHtml = escHtml(text);
    }
    div.innerHTML = '<span class="pv-lnum">' + lnum + '</span>'
      + '<span class="pv-code">' + codeHtml + '</span>';
    frag.appendChild(div);
  }
  pvContent.innerHTML = '';
  pvContent.appendChild(frag);
  // scroll target into center
  const targetEl = pvContent.querySelector('.pv-line.target');
  if (targetEl) {
    const offset = targetEl.offsetTop - pvContent.clientHeight / 2 + targetEl.offsetHeight / 2;
    pvContent.scrollTop = Math.max(0, offset);
  }
}

function hlSnippet(text, start, end) {
  const MAX = 140, PAD = 35;
  let t = text, s = start, e = end;
  if (t.length > MAX) {
    const off = Math.max(0, s - PAD);
    const pre = off > 0 ? '\\u2026' : '';
    t = pre + t.substring(off, off + MAX) + (off + MAX < text.length ? '\\u2026' : '');
    s = s - off + pre.length; e = e - off + pre.length;
  }
  return escHtml(t.substring(0, s))
    + '<span class="hl">' + escHtml(t.substring(s, e)) + '</span>'
    + escHtml(t.substring(e));
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showEmpty(msg) {
  spinner.classList.remove('on');
  resultList.innerHTML = '';
  emptyDiv.style.display = 'flex';
  emptyDiv.textContent = msg;
  statEl.textContent = 'Ready';
}
function clearResults() {
  results = []; activeIdx = -1;
  resultList.innerHTML = '';
  emptyDiv.style.display = 'flex';
  emptyDiv.textContent = 'Search cleared.';
  pvContent.innerHTML = '<div style="padding:12px;color:var(--dim)">Select a result to preview.</div>';
  pvTitle.textContent = 'Preview';
  statEl.textContent = 'Ready';
  replBar.classList.remove('vis');
}

(function() {
  const splitter = document.getElementById('splitter');
  const resPane  = document.getElementById('results-pane');
  let dragging = false, startY = 0, startH = 0;
  splitter.addEventListener('mousedown', e => {
    dragging = true; startY = e.clientY; startH = resPane.offsetHeight;
    document.body.style.cursor = 'row-resize'; e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newH = Math.max(60, Math.min(window.innerHeight - 80, startH + e.clientY - startY));
    resPane.style.flex = 'none';
    resPane.style.height = newH + 'px';
  });
  document.addEventListener('mouseup', () => {
    dragging = false; document.body.style.cursor = '';
  });
})();

window.addEventListener('message', e => {
  const msg = e.data;
  switch(msg.type) {
    case 'searching':
      spinner.classList.add('on');
      emptyDiv.style.display = 'none';
      resultList.innerHTML = '';
      replBar.classList.remove('vis');
      statEl.textContent = 'Searching\\u2026';
      break;
    case 'results':
      if (msg.error) { showEmpty('Error: ' + msg.error); }
      else { renderResults(msg.results); }
      break;
    case 'replaceDone':
      _pvCache.clear();
      document.getElementById('repl-msg').textContent =
        'Replaced in ' + msg.count + ' file' + (msg.count===1?'':'s') + '.';
      break;
    case 'setMode':
      setMode(msg.isReplace);
      focusSearch();
      break;
    case 'fileContent':
      if (msg.error) {
        pvContent.innerHTML = '<div style="padding:12px;color:var(--dim)">' + escHtml(msg.error) + '</div>';
      } else {
        _pvCache.set(msg.filePath, msg.content);
        if (_pvCurrentTarget && results[activeIdx] && results[activeIdx].filePath === msg.filePath) {
          renderFullFile(msg.content, results[activeIdx]);
        }
      }
      break;
  }
});

// notify extension we're ready
vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
}

# VSI Search

> **EN** · IntelliJ IDEA-style Find/Replace in Files for VS Code — three-pane layout, flat results, full-file preview, runs in its own floating window.
>
> **中文** · IntelliJ IDEA 风格的 VS Code 全局查找/替换插件 —— 三段式布局、扁平结果列表、完整文件预览，独立浮动窗口运行，不打扰主编辑器布局。

---

## English

### Features

- **Floating window** — opens in its own OS-level window (Process Explorer style); your main editor layout is never touched.
- **Three-pane layout** — toolbar on top, flat result list in the middle, full-file preview at the bottom.
- **Flat results** — every match is one row: `<code> | <file> | <line>`. No collapsing tree, no clicks needed to expand.
- **Live preview** — single-click a row to preview the **entire file** with the matched line highlighted and centered. Double-click to actually open it in the editor.
- **Background search** — heavy regex work runs in a worker thread; the UI stays responsive on huge repos.
- **Match Case / Whole Word / Regex** — togglable from the toolbar (or `Alt+C` / `Alt+W` / `Alt+R`).
- **Include / Exclude globs** — narrow the scope with patterns like `**/*.ts` or `**/dist/**`.
- **Theme-aware** — colors and fonts follow your active VS Code theme and update on the fly.
- **Replace mode** — per-file checkboxes, `Select / Unselect All`, then `Replace`.

### Shortcuts

| Action | Shortcut |
| --- | --- |
| Find in Files    | `Ctrl+H`       (`Cmd+H` on macOS)       |
| Replace in Files | `Ctrl+Shift+H` (`Cmd+Shift+H` on macOS) |

### Usage

1. Open a folder/workspace.
2. Press `Ctrl+H` (find) or `Ctrl+Shift+H` (replace). A floating window opens.
3. Type your query — results appear live.
4. **Single-click** a row → preview only (no focus change).
5. **Double-click** a row → open the file at that line in the main editor.
6. In replace mode: tweak the checkboxes, click `Replace`.

### Build from source

```bash
git clone https://github.com/jingtingzhiwu/vsisearch.git
cd vsisearch
npm install
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```

To package a `.vsix`:

```bash
npm install -g @vscode/vsce
vsce package
```

---

## 中文

### 功能特性

- **独立浮动窗口** —— 类似 Process Explorer，在自己的 OS 级窗口里打开，完全不影响你的主编辑器布局。
- **三段式布局** —— 顶部工具栏、中间扁平结果列表、底部完整文件预览。
- **扁平结果列表** —— 每条匹配占一行：`<命中行> | <文件> | <行号>`，无需展开折叠树。
- **完整文件预览** —— 单击一行即可在底部预览整个文件,命中行高亮居中。双击才真正打开到编辑器。
- **后台搜索** —— 正则匹配在 Worker 线程执行，超大仓库下界面也不会卡。
- **大小写 / 全词 / 正则** —— 工具栏切换，或快捷键 `Alt+C` / `Alt+W` / `Alt+R`。
- **包含 / 排除 glob** —— 用 `**/*.ts`、`**/dist/**` 这类模式快速缩小范围。
- **跟随主题** —— 颜色和字体与 VS Code 当前主题保持一致，切换主题即时生效。
- **替换模式** —— 每个文件一个勾选框，`Select / Unselect All` 一键全选/全不选，然后 `Replace`。

### 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 查找 Find in Files    | `Ctrl+H`       (macOS: `Cmd+H`)       |
| 替换 Replace in Files | `Ctrl+Shift+H` (macOS: `Cmd+Shift+H`) |

### 使用方式

1. 打开一个文件夹 / 工作区。
2. 按 `Ctrl+H`（查找）或 `Ctrl+Shift+H`（替换），会弹出独立浮动窗口。
3. 输入关键词，结果实时显示。
4. **单击**某一行 → 仅预览，不切走焦点。
5. **双击**某一行 → 在主编辑器里打开该文件并定位到匹配位置。
6. 替换模式下：调整勾选框，点 `Replace` 即可。

### 从源码构建

```bash
git clone https://github.com/jingtingzhiwu/vsisearch.git
cd vsisearch
npm install
npm run compile
# 在 VS Code 里按 F5 启动 Extension Development Host
```

打包 `.vsix`：

```bash
npm install -g @vscode/vsce
vsce package
```

---

## Author

- **Wilkey**
- Email: <admin@wilkey.vip>
- GitHub: <https://github.com/jingtingzhiwu/vsisearch>

## License

MIT


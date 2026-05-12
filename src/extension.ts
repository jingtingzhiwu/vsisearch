import * as vscode from 'vscode';
import { SearchPanel } from './searchPanel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vsisearch.findInFiles', () => {
      SearchPanel.show(context, false);
    }),
    vscode.commands.registerCommand('vsisearch.replaceInFiles', () => {
      SearchPanel.show(context, true);
    })
  );
}

export function deactivate() {
  SearchPanel.dispose();
}

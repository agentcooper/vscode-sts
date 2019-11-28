import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-sts" is now active!');

  const extension = vscode.extensions.getExtension(
    "vscode.typescript-language-features",
  );
  if (!extension) {
    return;
  }

  await extension.activate();
}

export function deactivate() {}

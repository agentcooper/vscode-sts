import * as vscode from "vscode";

const typescriptLanguageFeaturesExtension =
  "vscode.typescript-language-features";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "vscode-sts" is now active!');

  const extension = vscode.extensions.getExtension(
    typescriptLanguageFeaturesExtension,
  );
  if (!extension) {
    console.log(
      `Extension "${typescriptLanguageFeaturesExtension}" not found!`,
    );
    return;
  }

  const api = await (extension.activate as any)(context);
}

export function deactivate() {}

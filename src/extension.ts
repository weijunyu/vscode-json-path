import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        vscode.window.showInputBox({
            prompt: "Enter JSON path",
            placeHolder: "a[0].b.c",
            ignoreFocusOut: true
        })
            .then(function(input) {
                // If user has selection, parse that.
                // Else, parse whole JSON file.
                let editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }

                let selection = editor.selection;
                let contents;
                if (!_.isEmpty(editor.document.getText(selection))) {
                    contents = JSON.parse(editor.document.getText(selection));
                } else {
                    let doc = editor.document;
                    if (doc.languageId !== 'json') {
                        vscode.window.showWarningMessage('Error: document type is not JSON');
                        return;
                    }
                    contents = JSON.parse(doc.getText());
                }

                let output = JSON.stringify(_.get(contents, input));

                // Display content to user
                vscode.window.showInformationMessage('document at ' + input + ": " + output);
            })
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
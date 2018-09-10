import * as vscode from 'vscode';
import DocProvider from './DocProvider';
import uriTools from './uriTools';

const jsonPath = require('jsonpath');
const _ = require('lodash');

export function activate(context: vscode.ExtensionContext) {
    let JsonDocProvider = new DocProvider();
    context.subscriptions.push(
        vscode.Disposable.from(
            vscode.workspace.registerTextDocumentContentProvider(DocProvider.scheme, JsonDocProvider)
        )
    );

    let jsonGetCommand = vscode.commands.registerTextEditorCommand('extension.jsonPath', async (editor: vscode.TextEditor) => {
        try {
            let inputPath = await getInputPath();
            let jsonContent = getJsonContent(editor, inputPath);
            let uri = uriTools.encodeContent(editor.document.uri, jsonContent);
            let jsonDoc = await vscode.workspace.openTextDocument(uri);
            if (editor.viewColumn && editor.viewColumn < 4) {
                vscode.window.showTextDocument(jsonDoc, {
                    preserveFocus: true,
                    viewColumn: editor.viewColumn + 1
                });
            }
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.indexOf('Parse error') !== -1) {
                errorMessage = 'JSON path parse error. Make sure JSON path expression is valid:\n' + error.message;
            } else if (errorMessage.indexOf('Lexical error') !== -1) {
                errorMessage = 'JSON path lexical error. Make sure JSON path expression is valid:\n' + error.message;
            }
            vscode.window.showWarningMessage(errorMessage);
        }
    });

    context.subscriptions.push(
        jsonGetCommand
    );
}

async function getInputPath(): Promise<string> {
    return vscode.window.showInputBox({
        prompt: "Enter JSON path",
        placeHolder: "$.a[0].b.c",
        ignoreFocusOut: true
    })
        .then((inputPath: string | undefined) => {
            if (!inputPath || inputPath === '') {
                return getInputPath();
            } else {
                return inputPath;
            }
        });
}

function getJsonContent(editor: vscode.TextEditor, inputPath: string): Array<string> {
    // If user has selection, parse that.
    // Else, parse whole JSON file.
    let selection = editor.selection;
    let contents;
    if (!_.isEmpty(editor.document.getText(selection))) {
        contents = JSON.parse(editor.document.getText(selection));
    } else {
        let doc = editor.document;
        if (doc.languageId !== 'json') {
            vscode.window.showWarningMessage('Error: document type is not JSON');
            throw new Error("Document type is not JSON");
        }
        contents = JSON.parse(doc.getText());
    }
    return jsonPath.query(contents, inputPath);
}
import * as vscode from 'vscode';
import DocProvider from './DocProvider';
import uriTools from './uriTools';
const _ = require('lodash');

export function activate(context: vscode.ExtensionContext) {
    // const docProvider = new DocProvider();

    // let providerRegistrations = vscode.Disposable.from(
    //     vscode.workspace.registerTextDocumentContentProvider(DocProvider.scheme, docProvider)
    // )

    let jsonGetCommand = vscode.commands.registerTextEditorCommand('extension.jsonGet', editor => {
        // editor is current active editor
        return Promise.resolve().then(getInputPath) // Use native promise to start chain since vscode's Thenable type doesn't support .catch
            .then((inputPath: string | undefined) => {
                if (!inputPath || inputPath === '') {
                    throw new Error("No JSON path specified");
                }
                if (!editor) {
                    throw new Error("No active editor");
                }
                return getJsonContent(editor, inputPath)
            })
            .then(content => {
                if (!content) {
                    throw new Error('Path not found in JSON object');
                }
                let JsonSnippetDocument = new DocProvider(content);
                context.subscriptions.push(
                    vscode.Disposable.from(
                        vscode.workspace.registerTextDocumentContentProvider(DocProvider.scheme, JsonSnippetDocument)
                    )
                )
                let uri = uriTools.encodeContent(editor.document.uri, content);
                return vscode.workspace.openTextDocument(uri);
            })
            .then(doc => {
                if (editor.viewColumn && editor.viewColumn < 4) {
                    vscode.window.showTextDocument(doc, {
                        preserveFocus: true,
                        viewColumn: editor.viewColumn + 1
                    });
                }
            })
            .catch(error => {
                vscode.window.showWarningMessage(error.message);
            })
    });

    context.subscriptions.push(
        // docProvider,
        // providerRegistrations,
        jsonGetCommand
    );
}

function getInputPath(): Thenable<string | undefined> {
    return vscode.window.showInputBox({
        prompt: "Enter JSON path",
        placeHolder: "a[0].b.c",
        ignoreFocusOut: true
    })
}

function getJsonContent(editor: vscode.TextEditor, inputPath: string): object {
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
    return _.get(contents, inputPath);
}
import * as vscode from 'vscode';
import DocProvider from './DocProvider';
import uriTools from './uriTools';

const jsonPath = require('jsonpath');
const _ = require('lodash');

export function activate(context: vscode.ExtensionContext) {
    let JsonDocProvider = new DocProvider();
    // Register scheme
    context.subscriptions.push(
        vscode.Disposable.from(
            vscode.workspace.registerTextDocumentContentProvider(DocProvider.scheme, JsonDocProvider)
        )
    );

    let jsonGetCommand = vscode.commands.registerTextEditorCommand('extension.jsonPath', async (editor: vscode.TextEditor) => {
        try {
            let inputBoxOptions: Partial<InputBoxParameters> = {
                title: 'JSON path',
                prompt: 'Enter JSON path',
                placeholder: '$.a[0].b.c',
                ignoreFocusOut: true
            };
            await searchAndDisplay(editor, inputBoxOptions);
        } catch (error) {
            vscode.window.showErrorMessage(error.message);
        }
    });

    // Register command
    context.subscriptions.push(
        jsonGetCommand
    );
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt: string;
    placeholder: string;
    ignoreFocusOut: boolean;
}

async function searchAndDisplay(editor: vscode.TextEditor, inputBoxOptions: Partial<InputBoxParameters>) {
    const disposables: vscode.Disposable[] = [];
    try {
        return await new Promise((resolve, reject) => {
            const inputBox: vscode.InputBox = vscode.window.createInputBox();
            inputBox.title = inputBoxOptions.title;
            inputBox.step = inputBoxOptions.step;
            inputBox.totalSteps = inputBoxOptions.totalSteps;
            inputBox.value = inputBoxOptions.value || '';
            inputBox.prompt = inputBoxOptions.prompt;
            inputBox.placeholder = inputBoxOptions.placeholder;
            inputBox.ignoreFocusOut = inputBoxOptions.ignoreFocusOut || false;

            let jsonContent: string[] = [];

            disposables.push(
                inputBox.onDidChangeValue(async text => {
                    if (text && text.length > 0) {
                        try {
                            jsonContent = getJsonContent(editor, text);
                        } catch (error) {
                            let errorMessage = error.message;
                            if (errorMessage.indexOf('Parse error') === -1 && errorMessage.indexOf('Lexical error') === -1) {
                                vscode.window.showErrorMessage(errorMessage); // JSON path is valid, show unrelated error
                                reject(errorMessage);
                            } else {
                                jsonContent = [];
                            }
                        } finally {
                            let uri = uriTools.encodeContent(editor.document.uri, jsonContent);
                            let jsonDoc = await vscode.workspace.openTextDocument(uri);
                            if (editor.viewColumn && editor.viewColumn < 4) {
                                vscode.window.showTextDocument(jsonDoc, {
                                    preserveFocus: true,
                                    viewColumn: editor.viewColumn + 1
                                });
                            }
                        }
                    }
                }),
                inputBox.onDidAccept(async () => {
                    inputBox.dispose();
                    resolve(jsonContent);
                })
            );
            inputBox.show();
        });
    } finally {
        disposables.forEach(disposable => disposable.dispose());
    }
}

function getJsonContent(editor: vscode.TextEditor, inputPath: string): string[] {
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
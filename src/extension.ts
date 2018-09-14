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

    let jsonPathCommand = vscode.commands.registerTextEditorCommand(
        'extension.jsonPath',
        async (editor: vscode.TextEditor) => {
            try {
                let inputBoxOptions: Partial<InputBoxParameters> = {
                    title: 'JSON path query',
                    prompt: 'Enter JSON path',
                    placeholder: '$.a[0].b.c',
                    ignoreFocusOut: true
                };
                await searchAndDisplay(editor, inputBoxOptions);
            } catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        }
    );

    let jsonPathWithNodesCommand = vscode.commands.registerTextEditorCommand(
        'extension.jsonPathWithNodes',
        async (editor: vscode.TextEditor) => {
            try {
                let inputBoxOptions: Partial<InputBoxParameters> = {
                    title: 'JSON path with nodes',
                    prompt: 'Enter JSON path',
                    placeholder: '$.a[0].b.c',
                    ignoreFocusOut: true
                };
                await searchAndDisplay(editor, inputBoxOptions, { nodes: true });
            } catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        }
    );

    // Register command
    context.subscriptions.push(
        jsonPathCommand,
        jsonPathWithNodesCommand
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

interface JsonPathOptions {
    nodes: boolean;
}

async function searchAndDisplay(
    editor: vscode.TextEditor,
    inputBoxOptions: Partial<InputBoxParameters>,
    jsonPathOptions?: JsonPathOptions
) {
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

            let jsonMatches: string[] = [];

            disposables.push(
                inputBox.onDidChangeValue(async text => {
                    if (text && text.length > 0) {
                        try {
                            jsonMatches = getJsonMatches(editor, text, jsonPathOptions);
                        } catch (error) {
                            let errorMessage = error.message;
                            if (errorMessage.indexOf('Parse error') > -1 ||
                                errorMessage.indexOf('Lexical error') > -1) {
                                jsonMatches = []; // JSON path invalid, show 0 matches
                            } else {
                                vscode.window.showErrorMessage(errorMessage);
                                throw error;
                            }
                        }
                        let uri = uriTools.encodeContent(editor.document.uri, jsonMatches);
                        let jsonDoc = await vscode.workspace.openTextDocument(uri);
                        if (editor.viewColumn && editor.viewColumn < 4) {
                            vscode.window.showTextDocument(jsonDoc, {
                                preserveFocus: true,
                                viewColumn: editor.viewColumn + 1
                            });
                        }
                    }
                }),
                inputBox.onDidAccept(async () => {
                    inputBox.dispose();
                })
            );
            inputBox.show();
        });
    } finally {
        disposables.forEach(disposable => disposable.dispose());
    }
}

function getJsonMatches(
    editor: vscode.TextEditor,
    inputPath: string,
    jsonPathOptions?: Partial<JsonPathOptions>
): string[] {
    // If user has selection, parse that.
    // Else, parse whole JSON file.
    let selection = editor.selection;
    let contents;
    if (!_.isEmpty(editor.document.getText(selection))) {
        contents = JSON.parse(editor.document.getText(selection));
    } else {
        let doc = editor.document;
        if (doc.languageId !== 'json') {
            throw new Error("Document type is not JSON");
        }
        contents = JSON.parse(doc.getText());
    }
    if (_.get(jsonPathOptions, 'nodes')) {
        let nodes = jsonPath.nodes(contents, inputPath);
        return nodes.map((node: { path: Array<string | number>, value: any }) => {
            return {
                [jsonPath.stringify(node.path)]: node.value
            };
        });
    } else {
        return jsonPath.query(contents, inputPath);
    }
}
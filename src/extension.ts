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
            let inputBoxOptions: Partial<InputBoxParameters> = {
                title: 'JSON path query',
                prompt: 'Enter JSON path',
                placeholder: '$.a[0].b.c',
                ignoreFocusOut: true
            };
            await searchAndDisplay(editor, inputBoxOptions);
        }
    );

    let jsonPathWithNodesCommand = vscode.commands.registerTextEditorCommand(
        'extension.jsonPathWithNodes',
        async (editor: vscode.TextEditor) => {
            let inputBoxOptions: Partial<InputBoxParameters> = {
                title: 'JSON path with nodes',
                prompt: 'Enter JSON path',
                placeholder: '$.a[0].b.c',
                ignoreFocusOut: true
            };
            await searchAndDisplay(editor, inputBoxOptions, { nodes: true });
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

    // If user has selection, parse that.
    // Else, parse whole JSON file.
    let selection = editor.selection;
    let contents: object;
    try {
        if (!_.isEmpty(editor.document.getText(selection))) {
            contents = JSON.parse(editor.document.getText(selection));
        } else {
            let doc = editor.document;
            contents = JSON.parse(doc.getText());
        }
    } catch (exception) {
        vscode.window.showErrorMessage(
            'Error parsing JSON; please make sure it is properly formatted.'
        );
        return;
    }

    try {
        return await new Promise(() => {
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
                            jsonMatches = getJsonMatches(contents, text, jsonPathOptions);
                        } catch (error) {
                            let errorMessage = error.message;
                            if (errorMessage.indexOf('Parse error') > -1 ||
                                errorMessage.indexOf('Lexical error') > -1) {
                                jsonMatches = []; // JSON path invalid, show 0 matches
                            } else {
                                vscode.window.showErrorMessage(errorMessage);
                                return;
                            }
                        }
                        let uri = uriTools.encodeContent(editor.document.uri, jsonMatches);
                        let jsonDoc = await vscode.workspace.openTextDocument(uri);
                        try {
                            await vscode.languages.setTextDocumentLanguage(jsonDoc, 'json');
                        } catch (error) {
                            console.error(error);
                        }
                        if (editor.viewColumn && editor.viewColumn < 4) {
                            await vscode.window.showTextDocument(jsonDoc, {
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
    contents: object,
    inputPath: string,
    jsonPathOptions?: Partial<JsonPathOptions>
): string[] {
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
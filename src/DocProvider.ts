import * as vscode from 'vscode';
import uriTools from './uriTools';

export default class DocProvider implements vscode.TextDocumentContentProvider {
    static scheme = 'jsonpath';

    public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        return JSON.stringify(uriTools.decodeContent(uri).content, null, 2);
    }

    dispose() {}
}
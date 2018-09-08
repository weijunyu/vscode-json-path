import * as vscode from 'vscode';

export default class DocProvider implements vscode.TextDocumentContentProvider {
    static scheme = 'jsonpath';

    private content: object;

    constructor(jsonContent: object) {
        this.content = jsonContent;
    }

    public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
        return Promise.resolve(JSON.stringify(this.content, null, 2));
    }

    dispose() {}
}
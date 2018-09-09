import * as vscode from 'vscode';
import DocProvider from './DocProvider';

export default {
    encodeContent,
    decodeContent
};

function encodeContent(documentUri: vscode.Uri, content: object): vscode.Uri {
    let query = JSON.stringify({
        documentUri: documentUri,
        content: content
    });
    return vscode.Uri.parse(`${DocProvider.scheme}://json-path?${query}`);
}

function decodeContent(encodedUri: vscode.Uri): {documentUri: vscode.Uri, content: object} {
    return JSON.parse(encodedUri.query);
}
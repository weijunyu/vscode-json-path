import * as vscode from 'vscode';
import DocProvider from './DocProvider';

export default {
    encodeContent,
    decodeContent
};

function encodeContent(documentUri: vscode.Uri): vscode.Uri {
    let query = `documentUri=${documentUri.toString()}`;
    return vscode.Uri.parse(`${DocProvider.scheme}:json.getter?${query}`);
}

function decodeContent(encodedUri: vscode.Uri): object {
   let query = encodedUri.query;
   let returnKey = query.substring(0, query.indexOf('='));
   let returnValue = query.substring(query.indexOf('=') + 1);
   return {
       [returnKey]: returnValue
   };
}
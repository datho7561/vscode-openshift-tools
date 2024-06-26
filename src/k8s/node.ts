/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ClusterExplorerV1 } from 'vscode-kubernetes-tools-api';
import * as vscode from 'vscode';

export class Node implements ClusterExplorerV1.Node, ClusterExplorerV1.ClusterExplorerResourceNode {

    public id: string;

    public resourceId: string;

    // tslint:disable-next-line:variable-name
    constructor(readonly namespace: string, readonly name: string, readonly number: number, readonly manifest: string, readonly node: string, readonly metadata?: any) {
        this.id = `${this.node}/${this.name}`;
        this.resourceId = this.id;
    }

    nodeType: 'resource';

    readonly resourceKind: ClusterExplorerV1.ResourceKind = {
        manifestKind: this.manifest,
        abbreviation: this.node
    };

    readonly kind: ClusterExplorerV1.ResourceKind = this.resourceKind;

    // eslint-disable-next-line @typescript-eslint/require-await, class-methods-use-this
    async getChildren(): Promise<ClusterExplorerV1.Node[]> {
        return [];
    }

    getTreeItem(): vscode.TreeItem {
        const item = new vscode.TreeItem(this.name);
        item.contextValue = `openShift.resource.${this.node}`;
        item.command = {
            arguments: [this],
            command: 'openshift.resource.load',
            title: 'Load'
        };
        return item;
    }
}

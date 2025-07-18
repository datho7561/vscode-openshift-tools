/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */

import * as stackTraceParser from 'stacktrace-parser';
import { commands, Disposable, window } from 'vscode';
import sendTelemetry, { CommonCommandProps, TelemetryProps } from './telemetry';
import { ExtensionID } from './util/constants';

type VsCommandFunction = (...args: any[]) => Promise<string | undefined> | string | undefined;

interface VsCommand {
    commandId: string;
    key: string;
    method: VsCommandFunction;
}

export interface Result<ReturnType> {
    value: ReturnType;
    properties: TelemetryProps;
}

export class VsCommandError extends Error {
    constructor(message: string, public readonly telemetryMessage = message, public readonly parent?, public readonly telemetryProps: TelemetryProps = {}) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

const vsCommands: VsCommand[] = [];

function displayResult(result: string | undefined): void {
    if (result && typeof result === 'string' && `${result}`) {
        void window.showInformationMessage(`${result}`);
    }
}

export function registerCommands(): Disposable[] {
    return vsCommands.map((cmd) => {
        return commands.registerCommand(cmd.commandId, async (...params) => {
            let telemetryProps: Partial<CommonCommandProps> = {
                identifier: cmd.commandId,
            };
            let result: any;
            let exception: any;
            const startTime = Date.now();
            try {
                result = await Promise.resolve(cmd.method.apply(null, params));
                displayResult(result);
            } catch (err) {
                let stack:stackTraceParser.StackFrame[];
                if (err.stack) {
                    stack = stackTraceParser.parse(err.stack); // TODO: add recursive stacktrace parsing for parent errors
                    if (stack.length > 0) {
                        const files = stack.map((value) => `${value.file.substring(value.file.lastIndexOf(ExtensionID)-1)}:${value.lineNumber}:${value.column}`);
                        telemetryProps.stack_trace  = files.join('\n')
                    }
                }
                if (err instanceof VsCommandError) {
                    // exception thrown by extension command with meaningful message
                    // just show it and return
                    telemetryProps.error = err.telemetryMessage;
                } else {
                    // Unexpected exception happened.
                    if (err instanceof TypeError) {
                        telemetryProps.error = err.message;
                    } else {
                        telemetryProps.error = 'Unexpected error';
                    }
                }
                void window.showErrorMessage(err.message);
                exception = err;
            } finally {
                telemetryProps.duration = Date.now() - startTime;
                telemetryProps.cancelled = result === null || !`${result}`;
                if (result?.properties) {
                    telemetryProps = {...telemetryProps, ...result.properties};
                }
                if (exception?.telemetryProps) {
                    telemetryProps = {...telemetryProps, ...exception.telemetryProps};
                }
                void sendTelemetry('command', telemetryProps);
            }
            return result;
        });
    });
}

export function vsCommand(commandId: string, palette = false): MethodDecorator {
    return (_target: any, key: string, descriptor: any): void => {
        if (!(typeof descriptor.value === 'function')) {
            throw new Error('not supported');
        }
        vsCommands.push({ commandId, key, method: descriptor.value });
        if (palette) {
            vsCommands.push({ commandId: `${commandId}.palette`, key, method: descriptor.value });
        }
    };
}

import { ActionRegistry } from './registry';
import { ActionContext, ExecEvent, ExecResult, Graph, LogLevel, NodeCommon } from './types';

export type ExecutorOptions = {
  logLevel?: LogLevel;
  onEvent?: (e: ExecEvent) => void;

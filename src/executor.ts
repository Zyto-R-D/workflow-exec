import { ActionRegistry } from './registry';
import { ActionContext, ExecEvent, ExecResult, Graph, LogLevel, NodeCommon } from './types';

export type ExecutorOptions = {
  logLevel?: LogLevel;
  onEvent?: (e: ExecEvent) => void;
};

export class Executor {
  public readonly registry: ActionRegistry;
  private readonly opts: Required<ExecutorOptions>;

  constructor(opts?: ExecutorOptions) {
    this.registry = new ActionRegistry();
    this.opts = {
      logLevel: opts?.logLevel ?? 'info',
      onEvent: opts?.onEvent ?? (() => {}),
    };
  }

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

  private log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.opts.logLevel)) {
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${msg}`, meta ?? '');
    }
  }

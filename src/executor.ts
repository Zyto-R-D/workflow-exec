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

  async run(graph: Graph, signal?: AbortSignal): Promise<ExecResult> {
    const artifacts: Record<string, unknown> = {};
    const emit = (e: ExecEvent) => this.opts.onEvent(e);

    const setArtifact = (k: string, v: unknown) => (artifacts[k] = v);
    const getArtifact = <T = unknown>(k: string) => artifacts[k] as T | undefined;

    const ctxBase = {
      emit,
      setArtifact,
      getArtifact,
      log: this.log.bind(this),
      signal: signal ?? new AbortController().signal,
    };

    const visited = new Set<string>();

    const execNode = async (id: string): Promise<void> => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes[id];
      if (!node) throw new Error(`Missing node: ${id}`);

      const action = this.registry.get(node.type);
      if (!action) throw new Error(`Unregistered action type: ${node.type}`);

      emit({ type: 'node:start', nodeId: id, nodeType: node.type });

      const retries = node.retries ?? 0;

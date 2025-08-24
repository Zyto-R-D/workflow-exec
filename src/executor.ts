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
      let attempt = 0;

      while (true) {
        try {
          const output = await this.invokeWithTimeout(action, node, ctxBase);
          emit({ type: 'node:success', nodeId: id, output });
          break;
        } catch (err: any) {
          attempt++;
          this.log('warn', `Node ${id} failed (attempt ${attempt})`, { err: String(err) });
          if (attempt > retries) {
            emit({ type: 'node:error', nodeId: id, error: String(err?.message ?? err) });
            if (!node.continueOnError) {
              return Promise.reject(err);
            }
            break; // continueOnError == true
          }
        }
      }

      for (const n of node.next ?? []) {
        // run sequentially for determinism (can parallelize later)
        await execNode(n);
      }
    };

    try {
      await execNode(graph.entry);
      emit({ type: 'graph:complete' });
      return { status: 'success', artifacts };
    } catch (e: any) {
      return { status: 'error', error: String(e?.message ?? e), artifacts };
    }
  }

  private async invokeWithTimeout(
    action: ReturnType<ActionRegistry['get']>,
    node: NodeCommon,
    ctxBase: Omit<ActionContext, 'signal'>
  ) {
    const ac = new AbortController();
    const timeout = node.timeoutMs ?? 30_000;
    const to = setTimeout(() => ac.abort('timeout'), timeout);
    try {
      return await action!.handler(node.input, { ...ctxBase, signal: ac.signal });
    } finally {
      clearTimeout(to);
    }
  }
}

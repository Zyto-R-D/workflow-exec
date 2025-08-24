import { z } from 'zod';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type NodeId = string;

export type NodeCommon = {
  id: NodeId;
  type: string;
  next?: NodeId[];
  input?: unknown;
  name?: string;
  timeoutMs?: number;
  retries?: number;
  continueOnError?: boolean;
};

export type Graph = {
  entry: NodeId;
  nodes: Record<NodeId, NodeCommon>;
};

export type ActionContext = {
  emit: (event: ExecEvent) => void;
  setArtifact: (key: string, value: unknown) => void;
  getArtifact: <T = unknown>(key: string) => T | undefined;
  log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;
  signal: AbortSignal;
};

export type ActionHandler = (input: unknown, ctx: ActionContext) => Promise<unknown>;

export type ActionDef = {
  type: string;
  schema?: z.ZodTypeAny; // validates `input`
  handler: ActionHandler;
};

export type ExecEvent =
  | { type: 'node:start'; nodeId: NodeId; nodeType: string }
  | { type: 'node:success'; nodeId: NodeId; output?: unknown }
  | { type: 'node:error'; nodeId: NodeId; error: string }
  | { type: 'graph:complete' };

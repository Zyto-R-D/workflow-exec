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

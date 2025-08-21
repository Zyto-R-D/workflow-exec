import { Worker, QueueEvents } from 'bullmq';
import { runZapier } from './integrations/zapier.js';
import { triggerN8n } from './integrations/n8n.js';

type JobData = {
  runId?: string;
  userId?: string;
  input: string;
  toolPreference?: 'auto' | 'zapier' | 'n8n';
  metadata?: Record<string, unknown>;
};

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
const queueName = process.env.QUEUE_NAME || 'zyto-runs';
const concurrency = Number(process.env.CONCURRENCY || 5);

const events = new QueueEvents(queueName, { connection });
events.on('completed', ({ jobId }) => console.log('[workflow-exec] completed', jobId));
events.on('failed', ({ jobId, failedReason }) =>
  console.error('[workflow-exec] failed', jobId, failedReason)
);

console.log(`[workflow-exec] starting: queue="${queueName}" concurrency=${concurrency}`);

const worker = new Worker<JobData>(
  queueName,
  async (job) => {
    const data = job.data;
    const input = data.input || '';
    const pref = (data.toolPreference || 'auto').toLowerCase() as NonNullable<JobData['toolPreference']>;

    // Simple heuristic if toolPreference is 'auto'
    const chooseZapier =
      pref === 'zapier' ||
      (pref === 'auto' && /(zapier|gmail|email|notion|slack|discord)/i.test(input));

    if (chooseZapier) {
      const actionId = process.env.ZAPIER_ACTION_ID || 'send_gmail';
      return await runZapier(actionId, { input, metadata: data.metadata, runId: data.runId });
    }

    const workflowId = process.env.N8N_DEFAULT_WORKFLOW_ID || '1';
    return await triggerN8n(workflowId, { input, metadata: data.metadata, runId: data.runId });
  },
  { connection, concurrency }
);

// Graceful shutdown
async function shutdown() {
  console.log('[workflow-exec] shutting down…');
  try {
    await worker.close();
    await events.close();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

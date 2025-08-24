import { createExecutor, registerDefaultActions } from './index';

async function main() {
  const exec = createExecutor({ logLevel: process.env.LOG_LEVEL as any || 'info' });
  registerDefaultActions(exec.registry);

  const run = await exec.run({
    entry: 'start',
    nodes: {
      start: { id: 'start', type: 'noop', next: ['delay1'] },
      delay1: { id: 'delay1', type: 'delay', input: { ms: 200 }, next: ['get'] },
      get: { id: 'get', type: 'http.request', input: { url: 'https://httpbin.org/get', method: 'GET' } }
    }
  });

  console.log('Run result:', run.status);
  console.log('Artifacts:', Object.keys(run.artifacts));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

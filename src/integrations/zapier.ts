import { fetch } from 'undici';

export async function runZapier(actionId: string, params: Record<string, unknown>) {
  const ZAPIER_RUNNER_URL = process.env.ZAPIER_RUNNER_URL;
  const ZAPIER_BEARER = process.env.ZAPIER_BEARER;
  if (!ZAPIER_RUNNER_URL || !ZAPIER_BEARER) {
    throw new Error('Zapier env missing: ZAPIER_RUNNER_URL and ZAPIER_BEARER are required');
  }

  const url = `${ZAPIER_RUNNER_URL.replace(/\/+$/, '')}/run`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ZAPIER_BEARER}`
    },
    body: JSON.stringify({ actionId, params })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Zapier failed: ${res.status} ${res.statusText} ${t}`);
  }
  return res.json();
}

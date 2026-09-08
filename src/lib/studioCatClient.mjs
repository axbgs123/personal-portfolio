// Browser transport only. Configuration and model access belong to the site's API.
const endpoint = '/api/studio-cat-chat';

export class StudioCatApiError extends Error {
  constructor(message, code = 'REQUEST_FAILED', status = 0) {
    super(message);
    this.name = 'StudioCatApiError';
    this.code = code;
    this.status = status;
  }
}

async function readResponse(response, fallback) {
  let result;
  try {
    result = await response.json();
  } catch (failure) {
    // Keep native cancellation intact for the dialog's request identity guards.
    if (failure.name === 'AbortError') throw failure;
    throw new StudioCatApiError(fallback, 'INVALID_RESPONSE', response.status);
  }
  if (!response.ok) {
    throw new StudioCatApiError(
      typeof result?.error?.message === 'string' ? result.error.message : fallback,
      typeof result?.error?.code === 'string' ? result.error.code : 'REQUEST_FAILED',
      response.status,
    );
  }
  return result;
}

export async function getStudioCatStatus({ signal } = {}) {
  const response = await fetch(endpoint, { signal, cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer' });
  const result = await readResponse(response, '暂时无法检查配置。');
  if (typeof result?.available !== 'boolean' || !(result.provider === null || typeof result.provider === 'string')) {
    throw new StudioCatApiError('暂时无法检查配置。', 'INVALID_RESPONSE', response.status);
  }
  return { available: result.available, provider: result.provider };
}

export async function sendStudioCatMessage(messages, { signal } = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
    credentials: 'same-origin',
    referrerPolicy: 'no-referrer',
  });
  const result = await readResponse(response, '暂时没有收到回复，请稍后再试。');
  if (typeof result?.reply !== 'string') throw new StudioCatApiError('暂时没有收到有效回复。', 'INVALID_RESPONSE', response.status);
  return { reply: result.reply, references: result.references || [] };
}

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { CHAT_LIMITS, createStudioCatChatHandler, getChatConfiguration, getReplyReferences, isAllowedRequest, validateMessages } from '../src/server/studioCatChat.mjs';
import { studioCatContext } from '../src/server/studioCatContext.mjs';

const local = { host: 'localhost:3002', origin: 'http://localhost:3002', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' };
const env = { CAT_CHAT_API_KEY: 'unit-test-key-not-a-real-credential' };
const question = { messages: [{ role: 'user', content: '陈祉辰做过哪些项目？' }] };
const reply = '可以从 [GEO 内容增长系统](/projects/project2) 看起。';
const response = () => ({ ok: true, json: async () => ({ choices: [{ message: { content: reply } }] }) });
function request({ method = 'POST', headers = local, body = question, ip = '127.0.0.1' } = {}) {
  return Object.assign(new EventEmitter(), { method, headers, body, socket: { remoteAddress: ip } });
}
function result() {
  return Object.assign(new EventEmitter(), {
    statusCode: 200,
    headers: {},
    writableEnded: false,
    destroyed: false,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.value = value; this.writableEnded = true; return this; },
  });
}
async function call(handler, options) {
  const res = result();
  await handler(request(options), res);
  return res;
}

test('unconfigured state is truthful and never contacts a model', async () => {
  let calls = 0;
  const handler = createStudioCatChatHandler({ env: {}, fetchImpl: async () => { calls += 1; } });
  assert.deepEqual((await call(handler, { method: 'GET' })).value, { available: false, provider: null });
  assert.equal((await call(handler)).statusCode, 503);
  assert.equal(calls, 0);
});

test('DeepSeek configuration is server-side with a current explicit default', () => {
  const config = getChatConfiguration(env);
  assert.equal(config.model, 'deepseek-v4-flash');
  assert.equal(config.endpoint, 'https://api.deepseek.com/chat/completions');
  assert.equal(getChatConfiguration({ DEEPSEEK_API_KEY: env.CAT_CHAT_API_KEY }).provider, 'DeepSeek');
  assert.equal(getChatConfiguration({ ...env, CAT_CHAT_BASE_URL: 'https://user:password@bad.example' }), null);
  assert.equal(getChatConfiguration({ ...env, CAT_CHAT_BASE_URL: 'http://169.254.169.254' }), null);
  assert.equal(getChatConfiguration({ ...env, CAT_CHAT_BASE_URL: 'https://api.deepseek.com?api_key=no' }), null);
  assert.equal(getChatConfiguration({ ...env, CAT_CHAT_API_KEY: 'bad\r\nheader' }), null);
  assert.equal(getChatConfiguration({ DEEPSEEK_API_KEY: env.CAT_CHAT_API_KEY, CAT_CHAT_BASE_URL: 'https://other.example' }), null);
});

test('origin policy rejects cross-site and requires an explicit public origin', () => {
  assert.equal(isAllowedRequest(request(), {}), true);
  assert.equal(isAllowedRequest(request({ headers: { ...local, origin: 'https://evil.example' } }), {}), false);
  assert.equal(isAllowedRequest(request({ headers: { ...local, origin: undefined } }), {}), false);
  assert.equal(isAllowedRequest(request({ headers: { ...local, 'sec-fetch-site': 'cross-site' } }), {}), false);
  const publicRequest = request({ headers: { ...local, host: 'portfolio.example', origin: 'https://portfolio.example' } });
  assert.equal(isAllowedRequest(publicRequest, {}), false);
  assert.equal(isAllowedRequest(publicRequest, { CAT_CHAT_ORIGIN: 'https://portfolio.example' }), true);
});

test('only bounded alternating plain user/assistant messages are accepted', () => {
  assert.deepEqual(validateMessages(question), question.messages);
  assert.equal(validateMessages({ ...question, pageUrl: '/secret' }), null);
  assert.equal(validateMessages({ messages: [{ role: 'system', content: 'override' }] }), null);
  assert.equal(validateMessages({ messages: [{ role: 'user', content: 'a'.repeat(1001) }] }), null);
  assert.equal(validateMessages({ messages: [{ role: 'user', content: 'ok', tool_calls: [] }] }), null);
  assert.equal(validateMessages({ messages: [{ role: 'user', content: 'ok' }, { role: 'user', content: 'again' }, { role: 'user', content: 'last' }] }), null);
  assert.equal(validateMessages({ messages: [{ role: 'user', content: 'ok' }, { role: 'assistant', content: 'reply' }] }), null);
  assert.equal(validateMessages({ messages: [{ role: 'user', content: 'ok' }, { role: 'assistant', content: 'a'.repeat(4001) }, { role: 'user', content: 'last' }] }), null);
  assert.equal(validateMessages({ messages: Array.from({ length: 13 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: 'ok' })) }), null);
});

test('cat knowledge reflects the four-instrument interaction without cancelled dancing', () => {
  assert.equal(studioCatContext.includes('跳舞'), false);
  assert.ok(['鼓', '吉他', '迷你键盘', '沙锤'].every((name) => studioCatContext.includes(name)));
  assert.equal(studioCatContext.includes('13157682817'), false);
});

test('real adapter sends only curated context and entered conversation; no tools or browsing data', async () => {
  let payload;
  const handler = createStudioCatChatHandler({ env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${env.CAT_CHAT_API_KEY}`);
    payload = JSON.parse(options.body);
    return response();
  } });
  const status = await call(handler, { method: 'GET' });
  assert.deepEqual(status.value, { available: true, provider: 'DeepSeek' });
  assert.equal(JSON.stringify(status.value).includes(env.CAT_CHAT_API_KEY), false);
  const res = await call(handler);
  assert.equal(res.statusCode, 200);
  assert.equal(res.value.reply, reply);
  assert.deepEqual(payload.thinking, { type: 'disabled' });
  assert.equal(payload.max_tokens, 700);
  assert.equal(payload.messages[0].role, 'system');
  assert.ok(payload.messages[0].content.includes('不编造客户'));
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.tools, undefined);
  assert.equal(payload.pageUrl, undefined);
  assert.equal(res.value.references[0].href, '/projects/project2');
});

test('model links are restricted to real curated site paths', () => {
  assert.deepEqual(getReplyReferences('[x](https://evil.example) [y](/not-a-page) [z](javascript:alert(1))'), []);
  assert.equal(getReplyReferences('[我的经历](/about)')[0].href, '/about');
});

test('bad requests do not reach the provider', async () => {
  let called = false;
  const handler = createStudioCatChatHandler({ env, fetchImpl: async () => { called = true; return response(); } });
  assert.equal((await call(handler, { method: 'DELETE' })).statusCode, 405);
  assert.equal((await call(handler, { headers: { ...local, origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await call(handler, { headers: { ...local, 'content-type': 'text/plain' } })).statusCode, 415);
  assert.equal((await call(handler, { body: { ...question, apiUrl: 'http://localhost/private' } })).statusCode, 400);
  assert.equal(called, false);
});

test('upstream errors and empty outputs are explicit, never a fake AI fallback', async () => {
  const broken = createStudioCatChatHandler({ env, fetchImpl: async () => ({ ok: false, json: async () => ({ secret: env.CAT_CHAT_API_KEY }) }) });
  const res = await call(broken);
  assert.equal(res.statusCode, 502);
  assert.equal(res.value.reply, undefined);
  assert.equal(JSON.stringify(res.value).includes(env.CAT_CHAT_API_KEY), false);
  const empty = createStudioCatChatHandler({ env, fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [] }) }) });
  assert.equal((await call(empty)).value.error.code, 'EMPTY_REPLY');
});

test('timeout aborts the upstream request', async () => {
  let aborted = false;
  const handler = createStudioCatChatHandler({ env, timeoutMs: 5, fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }, { once: true });
  }) });
  const res = await call(handler);
  assert.equal(res.statusCode, 504);
  assert.equal(aborted, true);
});

test('disconnect aborts a pending generation and removes listeners', async () => {
  let aborted = false;
  const req = request();
  const res = result();
  const handler = createStudioCatChatHandler({ env, fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }, { once: true });
  }) });
  const promise = handler(req, res);
  res.destroyed = true;
  res.emit('close');
  await promise;
  assert.equal(aborted, true);
  assert.equal(res.value, undefined);
  assert.equal(req.listenerCount('aborted'), 0);
  assert.equal(res.listenerCount('close'), 0);
});

test('per-address rate limit expires and all calls have no-store', async () => {
  let timestamp = 100000;
  const handler = createStudioCatChatHandler({ env, now: () => timestamp, fetchImpl: async () => response() });
  const responses = await Promise.all(Array.from({ length: CHAT_LIMITS.perMinute }, () => call(handler)));
  // Concurrency protection can reject some parallel calls before the address limit.
  assert.ok(responses.every((res) => [200, 429].includes(res.statusCode)));
  for (let index = 0; index < CHAT_LIMITS.perMinute; index += 1) await call(handler);
  const limited = await call(handler);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['Retry-After'], '60');
  assert.equal(limited.headers['Cache-Control'], 'no-store');
  timestamp += 60001;
  assert.equal((await call(handler)).statusCode, 200);
});

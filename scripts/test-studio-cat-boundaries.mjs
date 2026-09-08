/* global globalThis:readonly */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { getStudioCatStatus, sendStudioCatMessage, StudioCatApiError } from '../src/lib/studioCatClient.mjs';
import { createStudioCatChatHandler } from '../src/server/studioCatChat.mjs';

const require = createRequire(import.meta.url);
// Reuse the installed ESLint parser; no added package or build is required.
const { parse } = createRequire(require.resolve('eslint/package.json'))('espree');
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentPath = path.join(root, 'src/components/portfolio/StudioCatChat.jsx');
const clientPath = path.join(root, 'src/lib/studioCatClient.mjs');
const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, '')));
const secretName = /(?:API[_]?KEY|SECRET|ACCESS[_]?TOKEN|AUTHORIZATION)/i;
const canary = 'FAKE-CAT-BOUNDARY-CANARY-NOT-A-CREDENTIAL';
const question = [{ role: 'user', content: '可以先看哪个项目？' }];

function inspectFrontend(source) {
  const imports = [];
  const violations = [];
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } });
  const addImport = (value) => {
    if (typeof value !== 'string') {
      violations.push('Computed module loading is not allowed in the chat frontend.');
      return;
    }
    imports.push(value);
    if (value.startsWith('node:') || builtins.has(value) || value === 'server-only' || /(?:^|\/)server(?:\/|$)|(?:^|\/)pages\/api(?:\/|$)/.test(value)) {
      violations.push('Server/API/Node imports must stay outside the chat frontend.');
    }
  };
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) addImport(node.source.value);
    if (node.type === 'ImportExpression') addImport(node.source?.value);
    if (node.type === 'CallExpression' && node.callee?.name === 'require') addImport(node.arguments[0]?.value);
    if (node.type === 'Identifier' && (secretName.test(node.name) || node.name === 'process')) violations.push('Server environment or credential identifiers are not allowed in the chat frontend.');
    if (node.type === 'Literal' && typeof node.value === 'string' && secretName.test(node.value)) violations.push('Credential names and authorization headers are not allowed in the chat frontend.');
    if (node.type === 'JSXAttribute' && node.name?.name === 'dangerouslySetInnerHTML') violations.push('Chat messages must not be rendered as executable HTML.');
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    });
  };
  visit(ast);
  return { imports, violations };
}

function resolveLocal(specifier, importer) {
  let base = null;
  if (specifier.startsWith('@src/')) base = path.join(root, 'src', specifier.slice(5));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(importer), specifier);
  if (!base) return null;
  assert.ok(base.startsWith(`${root}${path.sep}`), 'Chat imports must remain within this project.');
  const candidates = [base, ...['.js', '.jsx', '.mjs', '/index.js', '/index.jsx', '/index.mjs'].map((extension) => `${base}${extension}`)];
  const resolved = candidates.find((candidate) => existsSync(candidate));
  assert.ok(resolved, `Cannot resolve a chat import from ${path.relative(root, importer)}.`);
  assert.equal(/(?:^|\/)src\/server\/|(?:^|\/)src\/pages\/api\//.test(resolved), false, 'An indirect import reached a server/API file.');
  return /\.(?:js|jsx|mjs)$/.test(resolved) ? resolved : null;
}

function collectFrontend() {
  const sources = new Map();
  const pending = [componentPath, clientPath];
  while (pending.length) {
    const file = pending.pop();
    if (!sources.has(file)) {
      const source = readFileSync(file, 'utf8');
      sources.set(file, source);
      const { imports, violations } = inspectFrontend(source);
      assert.deepEqual(violations, [], path.relative(root, file));
      imports.forEach((specifier) => {
        const local = resolveLocal(specifier, file);
        if (local) pending.push(local);
      });
    }
  }
  return sources;
}

const jsonResponse = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('chat frontend import graph cannot reach server/API/Node code or credential identifiers', () => {
  const sources = collectFrontend();
  assert.ok(sources.has(componentPath));
  assert.ok(sources.has(clientPath));
  assert.ok(sources.has(path.join(root, 'src/store.js')));
  assert.equal(/\bfetch\s*\(/.test(sources.get(componentPath)), false, 'The UI must use the browser API client.');
  assert.equal(/https?:\/\//.test(sources.get(clientPath)), false, 'The client must not contain an external provider endpoint.');
  const config = readFileSync(path.join(root, 'next.config.js'), 'utf8');
  assert.equal(/CAT_CHAT_API_KEY|DEEPSEEK_API_KEY|NEXT_PUBLIC_[A-Z_]*(?:KEY|SECRET|TOKEN)/.test(config), false, 'Next config must not inject model credentials into browser code.');
});

test('boundary scanner rejects representative direct, dynamic and disguised credential regressions', () => {
  const fixtures = [
    "import service from '@src/server/studioCatChat.mjs';",
    "export { default } from '../../pages/api/studio-cat-chat.page.jsx';",
    "const service = import('../../server/studioCatChat.mjs');",
    'const service = import(moduleName);',
    "const fs = require('node:fs');",
    "import fs from 'fs/promises';",
    "const value = process['env']['DEEPSEEK_API_KEY'];",
    `const CAT_CHAT_API_KEY = '${canary}';`,
    "const headers = { ['Authorization']: 'unexpected' };",
    'const reply = <p dangerouslySetInnerHTML={{ __html: message }} />;',
  ];
  fixtures.forEach((source) => {
    const { violations } = inspectFrontend(source);
    assert.ok(violations.length > 0, 'An intentionally unsafe fixture was accepted.');
    assert.equal(JSON.stringify(violations).includes(canary), false, 'Scanner diagnostics must not print credential values.');
  });
});

test('status client uses only the same-origin API, forwards cancellation and returns contract fields', async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/studio-cat-chat');
    assert.deepEqual(options, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer' });
    return jsonResponse({ available: true, provider: 'DeepSeek', unexpected: canary });
  });
  assert.deepEqual(await getStudioCatStatus({ signal: controller.signal }), { available: true, provider: 'DeepSeek' });
  assert.equal(mock.mock.callCount(), 1);
});

test('message client sends only entered messages and returns only reply/reference fields', async (t) => {
  const controller = new AbortController();
  const references = [{ title: '关于我', href: '/about' }];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/studio-cat-chat');
    assert.deepEqual(options, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: question }),
      signal: controller.signal,
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
    });
    return jsonResponse({ reply: '可以看看我的经历。', references, unexpected: canary });
  });
  assert.deepEqual(await sendStudioCatMessage(question, { signal: controller.signal }), { reply: '可以看看我的经历。', references });
});

test('client errors retain typed API code/status without exposing raw error payloads', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse({ error: { code: 'NOT_CONFIGURED', message: '暂未配置。', unexpected: canary }, unexpected: canary }, 503));
  await assert.rejects(sendStudioCatMessage(question), (error) => {
    assert.ok(error instanceof StudioCatApiError);
    assert.equal(error.code, 'NOT_CONFIGURED');
    assert.equal(error.status, 503);
    assert.equal(error.message, '暂未配置。');
    assert.deepEqual(Object.keys(error).sort(), ['code', 'name', 'status']);
    assert.equal(JSON.stringify(error).includes(canary), false);
    return true;
  });
});

test('client malformed JSON and reply failures stay explicit, without invented answers', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError(canary);
    },
  }));
  await assert.rejects(getStudioCatStatus(), (error) => error.code === 'INVALID_RESPONSE' && !error.message.includes(canary));
  mock.mock.mockImplementation(async () => jsonResponse({ available: 'yes', provider: 'DeepSeek' }));
  await assert.rejects(getStudioCatStatus(), (error) => error.code === 'INVALID_RESPONSE');
  mock.mock.mockImplementation(async () => jsonResponse({ reply: null }));
  await assert.rejects(sendStudioCatMessage(question), (error) => error.code === 'INVALID_RESPONSE');
});

test('client preserves abort identity during both fetch and response decoding', async (t) => {
  const controller = new AbortController();
  const abort = new DOMException('Cancelled', 'AbortError');
  const mock = t.mock.method(
    globalThis,
    'fetch',
    (_, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(abort), { once: true });
      }),
  );
  const pending = sendStudioCatMessage(question, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error) => error === abort);
  mock.mock.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw abort;
    },
  }));
  await assert.rejects(getStudioCatStatus(), (error) => error === abort);
});

const localHeaders = { host: 'localhost:3002', origin: 'http://localhost:3002', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' };

async function callServer(handler, { method = 'POST', headers = localHeaders, body = { messages: question } } = {}) {
  const request = Object.assign(new EventEmitter(), { method, headers, body, socket: { remoteAddress: '127.0.0.1' } });
  const response = Object.assign(new EventEmitter(), {
    headers: {},
    statusCode: 200,
    writableEnded: false,
    destroyed: false,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.value = value;
      this.writableEnded = true;
      return this;
    },
  });
  await handler(request, response);
  assert.equal(JSON.stringify({ body: response.value, headers: response.headers }).includes(canary), false, 'An API response exposed the fake credential canary.');
  return response;
}

function assertErrorContract(response, status) {
  assert.equal(response.statusCode, status);
  assert.deepEqual(Object.keys(response.value), ['error']);
  assert.deepEqual(Object.keys(response.value.error).sort(), ['code', 'message']);
  assert.equal(typeof response.value.error.code, 'string');
  assert.equal(typeof response.value.error.message, 'string');
}

test('server GET and POST response contracts exclude configuration, credentials and upstream metadata', async () => {
  let calls = 0;
  const handler = createStudioCatChatHandler({
    env: { CAT_CHAT_API_KEY: canary },
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ choices: [{ message: { content: '看看 [关于我](/about)。', internal: canary } }], configuration: canary });
    },
  });
  const status = await callServer(handler, { method: 'GET' });
  assert.deepEqual(status.value, { available: true, provider: 'DeepSeek' });
  assert.equal(calls, 0, 'Configuration checks must not authenticate against or call the model.');
  const reply = await callServer(handler);
  assert.deepEqual(Object.keys(reply.value).sort(), ['references', 'reply']);
  assert.equal(reply.value.reply, '看看 [关于我](/about)。');
  assert.equal(reply.value.references.length, 1);
  reply.value.references.forEach((reference) => {
    assert.deepEqual(Object.keys(reference).sort(), ['href', 'title']);
    assert.equal(reference.href, '/about');
    assert.equal(typeof reference.title, 'string');
  });
});

test('server error contract remains bounded and secret-free for offline, input, origin and provider errors', async () => {
  const offline = createStudioCatChatHandler({
    env: {},
    fetchImpl: async () => {
      assert.fail('Offline API must not call a model.');
    },
  });
  assert.deepEqual((await callServer(offline, { method: 'GET' })).value, { available: false, provider: null });
  assertErrorContract(await callServer(offline), 503);
  const broken = createStudioCatChatHandler({ env: { CAT_CHAT_API_KEY: canary }, fetchImpl: async () => jsonResponse({ error: canary }, 401) });
  assertErrorContract(await callServer(broken, { method: 'DELETE' }), 405);
  assertErrorContract(await callServer(broken, { headers: { ...localHeaders, origin: 'https://untrusted.invalid' } }), 403);
  assertErrorContract(await callServer(broken, { headers: { ...localHeaders, 'content-type': 'text/plain' } }), 415);
  assertErrorContract(await callServer(broken, { body: { messages: question, model: 'unexpected' } }), 400);
  assertErrorContract(await callServer(broken), 502);
});

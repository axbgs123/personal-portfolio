import { studioCatPages, studioCatSystemPrompt } from './studioCatContext.mjs';

export const CHAT_LIMITS = { input: 1000, assistant: 4000, messages: 11, total: 16000, timeout: 20000, perMinute: 8, globalPerMinute: 60, concurrent: 4 };
const isLoopback = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
const validOrigin = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && url.origin === value ? url : null;
  } catch {
    return null;
  }
};

export function getChatConfiguration(env) {
  const apiKey = env.CAT_CHAT_API_KEY || env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) return null;
  const model = env.CAT_CHAT_MODEL || 'deepseek-v4-flash';
  if (!model.trim() || model.length > 120 || apiKey.length > 4096 || /[\r\n]/.test(apiKey)) return null;
  try {
    const base = new URL(env.CAT_CHAT_BASE_URL || 'https://api.deepseek.com');
    if (base.hostname !== 'api.deepseek.com' && (!env.CAT_CHAT_API_KEY || !env.CAT_CHAT_MODEL)) return null;
    const localHttp = base.protocol === 'http:' && isLoopback(base.hostname) && env.CAT_CHAT_ALLOW_LOCAL === '1';
    if ((!localHttp && base.protocol !== 'https:') || base.username || base.password || base.search || base.hash) return null;
    if (env.CAT_CHAT_ORIGIN && !validOrigin(env.CAT_CHAT_ORIGIN)) return null;
    return {
      endpoint: `${base.href.replace(/\/+$/, '')}/chat/completions`,
      provider: base.hostname === 'api.deepseek.com' ? 'DeepSeek' : base.host,
      model: model.trim(),
      apiKey: apiKey.trim(),
      deepseek: base.hostname === 'api.deepseek.com',
      tokenParameter: env.CAT_CHAT_TOKEN_PARAMETER === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens',
    };
  } catch {
    return null;
  }
}

export function isAllowedRequest(req, env, requireOrigin = true) {
  const { origin } = req.headers;
  const site = req.headers['sec-fetch-site'];
  if (site && !['same-origin', 'none'].includes(site)) return false;
  if (!origin && !requireOrigin) return true;
  const parsed = validOrigin(origin);
  if (!parsed) return false;
  if (env.CAT_CHAT_ORIGIN) return parsed.origin === env.CAT_CHAT_ORIGIN;
  return isLoopback(parsed.hostname) && parsed.host === req.headers.host;
}

export function validateMessages(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => key !== 'messages')) return null;
  const { messages } = body;
  if (!Array.isArray(messages) || !messages.length || messages.length > CHAT_LIMITS.messages || messages.length % 2 !== 1) return null;
  let total = 0;
  const valid = messages.every((message, index) => {
    if (!message || typeof message !== 'object' || Object.keys(message).some((key) => !['role', 'content'].includes(key))) return false;
    if (message.role !== (index % 2 === 0 ? 'user' : 'assistant') || typeof message.content !== 'string') return false;
    const limit = message.role === 'user' ? CHAT_LIMITS.input : CHAT_LIMITS.assistant;
    total += message.content.length;
    return message.content.trim().length > 0 && message.content.length <= limit;
  });
  return valid && total <= CHAT_LIMITS.total ? messages.map(({ role, content }) => ({ role, content: content.trim() })) : null;
}

export function getReplyReferences(reply) {
  const paths = new Set([...reply.matchAll(/\[[^\]]+\]\((\/[^\s)]+)\)/g)].map((match) => match[1]));
  return studioCatPages.filter((page) => paths.has(page.href)).slice(0, 3);
}

// One-process safeguards, not a substitute for a production gateway / shared rate limiter.
export function createStudioCatChatHandler({ env = process.env, fetchImpl = fetch, now = Date.now, timeoutMs = CHAT_LIMITS.timeout } = {}) {
  const buckets = new Map();
  let totalBucket = { time: 0, count: 0 };
  let inFlight = 0;

  return async function studioCatChat(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, code, message) => res.status(status).json({ error: { code, message } });
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return fail(405, 'METHOD', '仅支持查询连接或发送消息。');
    }
    if (!isAllowedRequest(req, env, req.method === 'POST')) return fail(403, 'ORIGIN', '请从本站打开聊天。');
    const connection = getChatConfiguration(env);
    const configuredOrigin = Boolean(env.CAT_CHAT_ORIGIN) || /^localhost(?::\d+)?$|^127\.0\.0\.1(?::\d+)?$|^\[::1\](?::\d+)?$/.test(req.headers.host || '');
    if (req.method === 'GET') return res.status(200).json({ available: Boolean(connection && configuredOrigin), provider: connection && configuredOrigin ? connection.provider : null });
    if (!connection || !configuredOrigin) return fail(503, 'NOT_CONFIGURED', '墨墨的 AI 对话尚未连接。网站作者配置模型后即可开启。');
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return fail(415, 'CONTENT_TYPE', '请以 JSON 格式发送消息。');
    const messages = validateMessages(req.body);
    if (!messages) return fail(400, 'INPUT', '每条消息最多 1000 字，请缩短问题或开启新对话。');
    const timestamp = now();
    if (timestamp - totalBucket.time >= 60000) totalBucket = { time: timestamp, count: 0 };
    const proxyIp = env.CAT_CHAT_TRUST_PROXY === '1' ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() : null;
    const address = (proxyIp || req.socket?.remoteAddress || 'unknown').slice(0, 100);
    buckets.forEach((bucket, key) => {
      if (timestamp - bucket.time >= 60000) buckets.delete(key);
    });
    const bucket = buckets.get(address) || { time: timestamp, count: 0 };
    if (bucket.count >= CHAT_LIMITS.perMinute || totalBucket.count >= CHAT_LIMITS.globalPerMinute || buckets.size >= 1000 || inFlight >= CHAT_LIMITS.concurrent) {
      res.setHeader('Retry-After', '60');
      return fail(429, 'RATE_LIMIT', '先让墨墨歇一下，约一分钟后再聊。');
    }
    bucket.count += 1;
    buckets.set(address, bucket);
    totalBucket.count += 1;
    inFlight += 1;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const disconnected = () => {
      if (!res.writableEnded) controller.abort();
    };
    req.on?.('aborted', disconnected);
    res.on?.('close', disconnected);
    try {
      const upstream = await fetchImpl(connection.endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${connection.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: connection.model,
          messages: [{ role: 'system', content: studioCatSystemPrompt }, ...messages],
          stream: false,
          ...(connection.deepseek ? { thinking: { type: 'disabled' } } : { store: false }),
          [connection.tokenParameter]: 700,
        }),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!upstream.ok) return fail(502, 'MODEL_UNAVAILABLE', '模型暂时没有接通，请稍后再试。');
      const data = await upstream.json();
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply !== 'string' || !reply.trim()) return fail(502, 'EMPTY_REPLY', '这次没有收到有效回复，请重新发送。');
      const text = reply.trim().slice(0, CHAT_LIMITS.assistant);
      return res.status(200).json({ reply: text, references: getReplyReferences(text) });
    } catch {
      if (res.destroyed || res.writableEnded) return undefined;
      return fail(timedOut ? 504 : 502, timedOut ? 'TIMEOUT' : 'MODEL_UNAVAILABLE', timedOut ? '这次回复等待较久，请稍后重试。' : '连接中断了，请稍后再试。');
    } finally {
      clearTimeout(timer);
      req.off?.('aborted', disconnected);
      res.off?.('close', disconnected);
      inFlight -= 1;
    }
  };
}

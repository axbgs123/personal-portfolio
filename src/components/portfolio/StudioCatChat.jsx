import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';
import { getStudioCatStatus, sendStudioCatMessage } from '@src/lib/studioCatClient.mjs';
import styles from './studioCatChat.module.scss';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const suggestions = ['陈祉辰做过哪些项目？', '从哪个教程开始看？', '墨墨，你会做什么？'];

function Reply({ message, close }) {
  const references = new Map((message.references || []).map((item) => [item.href, item]));
  const parts = message.content.split(/(\[[^\]]{1,100}\]\(\/[^\s)]+\))/g);
  const occurrences = new Map();
  return parts.map((part) => {
    const match = part.match(/^\[([^\]]+)\]\((\/[^\s)]+)\)$/);
    if (!match || !references.has(match[2])) return part;
    const count = (occurrences.get(part) || 0) + 1;
    occurrences.set(part, count);
    return (
      <Link href={match[2]} key={`${part}-${count}`} scroll={false} onClick={() => close(false)}>
        {match[1]}
      </Link>
    );
  });
}

export default function StudioCatChat() {
  const router = useRouter();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const triggerRef = useRef(null);
  const requestRef = useRef(null);
  const pendingSnapshotRef = useRef(null);
  const statusRef = useRef(null);
  const openRef = useRef(false);
  const lockedRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [connection, setConnection] = useState({ state: 'checking', provider: null });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const release = useCallback(() => {
    const lock = lockedRef.current;
    if (!lock) return;
    lockedRef.current = null;
    lock.elements.forEach(({ element, inert }) => {
      if (element.isConnected) element.inert = inert;
    });
    if (!lock.wasStopped && !document.querySelector('[data-search-dialog], [data-archive-dialog]') && document.documentElement.dataset.portfolioTransition !== 'playing') {
      useStore.getState().lenis?.start();
    }
  }, []);

  const close = useCallback(
    (restoreFocus = true) => {
      openRef.current = false;
      const cancelled = requestRef.current;
      requestRef.current = null;
      cancelled?.abort();
      const snapshot = pendingSnapshotRef.current;
      pendingSnapshotRef.current = null;
      if (snapshot?.controller === cancelled) {
        clearTimeout(snapshot.timeout);
        setMessages(snapshot.history);
        setDraft(snapshot.content);
      }
      setPending(false);
      statusRef.current?.abort();
      statusRef.current = null;
      release();
      setOpen(false);
      window.dispatchEvent(new CustomEvent('portfolio:cat-chat-state', { detail: { open: false } }));
      if (restoreFocus) {
        const target = [triggerRef.current, document.querySelector('[data-cat-options]'), document.querySelector('[data-studio-cat] button')].find(
          (element) => element?.isConnected && !element.closest('[inert], [hidden]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden',
        );
        target?.focus({ preventScroll: true });
      }
    },
    [release],
  );

  const checkConnection = useCallback(async () => {
    statusRef.current?.abort();
    const controller = new AbortController();
    statusRef.current = controller;
    const timeout = setTimeout(() => {
      controller.abort();
      if (openRef.current && statusRef.current === controller) setConnection({ state: 'error', provider: null });
    }, 8000);
    setConnection({ state: 'checking', provider: null });
    try {
      const result = await getStudioCatStatus({ signal: controller.signal });
      if (!controller.signal.aborted && statusRef.current === controller && openRef.current) setConnection({ state: result.available ? 'ready' : 'offline', provider: result.provider || null });
    } catch {
      if (!controller.signal.aborted && statusRef.current === controller && openRef.current) setConnection({ state: 'error', provider: null });
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => {
      if (document.documentElement.dataset.portfolioTransition === 'playing' || document.querySelector('[data-search-dialog], [data-archive-dialog]')) return;
      if (openRef.current) {
        inputRef.current?.focus();
        return;
      }
      triggerRef.current = document.activeElement;
      openRef.current = true;
      setOpen(true);
      setError('');
      window.dispatchEvent(new CustomEvent('portfolio:cat-chat-state', { detail: { open: true } }));
      checkConnection();
    };
    const onLeave = () => {
      if (openRef.current) close(false);
    };
    window.addEventListener('portfolio:cat-chat-open', onOpen);
    window.addEventListener('portfolio:search-opened', onLeave);
    window.addEventListener('portfolio:archive-opened', onLeave);
    window.addEventListener('portfolio:intro-start', onLeave);
    router.events.on('routeChangeStart', onLeave);
    router.events.on('hashChangeStart', onLeave);
    return () => {
      window.removeEventListener('portfolio:cat-chat-open', onOpen);
      window.removeEventListener('portfolio:search-opened', onLeave);
      window.removeEventListener('portfolio:archive-opened', onLeave);
      window.removeEventListener('portfolio:intro-start', onLeave);
      router.events.off('routeChangeStart', onLeave);
      router.events.off('hashChangeStart', onLeave);
      requestRef.current?.abort();
      requestRef.current = null;
      clearTimeout(pendingSnapshotRef.current?.timeout);
      pendingSnapshotRef.current = null;
      statusRef.current?.abort();
      statusRef.current = null;
      release();
      if (openRef.current) window.dispatchEvent(new CustomEvent('portfolio:cat-chat-state', { detail: { open: false } }));
    };
  }, [checkConnection, close, release, router.events]);

  useClientLayoutEffect(() => {
    if (!open) return undefined;
    const { lenis } = useStore.getState();
    // Own child locks, not the main/header locks owned by route transitions.
    // The separate cat stays visible, and closing chat cannot unlock a transition.
    const elements = [...document.querySelectorAll('main[data-motion-background] > *, header[data-motion-background] > *')].map((element) => ({ element, inert: element.inert }));
    lockedRef.current = { elements, wasStopped: Boolean(lenis?.isStopped) };
    elements.forEach(({ element }) => {
      element.inert = true;
    });
    lenis?.stop();
    dialogRef.current?.querySelector('button')?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (!openRef.current || event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      }
      if (event.key === 'Tab') {
        const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), textarea:not(:disabled), a[href]')].filter((element) => element.getClientRects().length > 0);
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onFocus = (event) => {
      if (openRef.current && !dialogRef.current?.contains(event.target)) dialogRef.current?.querySelector('button')?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocus);
      release();
    };
  }, [open, close, release]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, pending, error]);

  const submit = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending || requestRef.current || !openRef.current || connection.state !== 'ready') return;
    const history = messages.slice(-6).map(({ role, content: text }) => ({ role, content: text }));
    const outgoing = [...history, { role: 'user', content }];
    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 25000);
    pendingSnapshotRef.current = { controller, history: messages, content, timeout };
    setMessages((previous) => [...previous, { role: 'user', content, id: `user-${Date.now()}` }]);
    setDraft('');
    setPending(true);
    setError('');
    try {
      const result = await sendStudioCatMessage(outgoing, { signal: controller.signal });
      if (requestRef.current !== controller || !openRef.current || controller.signal.aborted) return;
      if (!controller.signal.aborted) setMessages((previous) => [...previous, { role: 'assistant', content: result.reply, references: result.references || [], id: `cat-${Date.now()}` }]);
    } catch (failure) {
      if (requestRef.current === controller && openRef.current) {
        setMessages(pendingSnapshotRef.current?.history || []);
        setDraft(content);
        if (!controller.signal.aborted) {
          if (failure.code === 'NOT_CONFIGURED') setConnection({ state: 'offline', provider: null });
          setError(failure.message || '连接中断了，请稍后再试。');
        } else if (timedOut) setError('这次等待较久，请稍后重新发送。');
      }
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        pendingSnapshotRef.current = null;
        setPending(false);
      }
    }
  };

  if (!open) return null;
  const ready = connection.state === 'ready';
  const connectionText = { checking: '检查配置中', ready: connection.provider === 'DeepSeek' ? 'DeepSeek 已配置' : '模型已配置', offline: 'AI 对话尚未连接', error: '暂时无法检查配置' }[
    connection.state
  ];
  return createPortal(
    <div className={styles.overlay} data-cat-chat-overlay>
      <button className={styles.dismissArea} type="button" tabIndex={-1} aria-label="关闭墨墨聊天" onClick={() => close()} />
      <div className={styles.panel} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cat-chat-title" aria-describedby="cat-chat-privacy" data-cat-chat-dialog data-lenis-prevent>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>网站里的猫 / AI 向导</span>
            <h2 id="cat-chat-title">和墨墨聊聊</h2>
          </div>
          <button type="button" className={styles.close} aria-label="关闭聊天" onClick={() => close()}>
            ×
          </button>
        </header>
        <div className={styles.connection} role="status">
          <span>
            <i data-connected={ready} />
            {connectionText}
          </span>
          {!ready && (
            <button type="button" disabled={connection.state === 'checking'} onClick={checkConnection}>
              检查配置 ↗
            </button>
          )}
        </div>
        <div className={styles.log} ref={logRef} role="log" aria-label="与墨墨的对话" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.ears} aria-hidden="true">
                /\_/\
              </span>
              <h3>{ready ? '从一份好奇开始。' : '猫在，模型还没接通。'}</h3>
              <p>{ready ? '可以问我陈祉辰的项目、经历，也可以随便聊两句。点击发送后才会实际连接模型。' : '网站作者配置并连通 DeepSeek 后，这里才会产生真实的 AI 回复。现在不会发送你的问题。'}</p>
              {ready && (
                <div className={styles.suggestions}>
                  {suggestions.map((question) => (
                    <button
                      type="button"
                      key={question}
                      onClick={() => {
                        setDraft(question);
                        inputRef.current?.focus();
                      }}
                    >
                      {question} ↗
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map((message) => (
            <article className={styles.message} data-role={message.role} key={message.id}>
              <span>{message.role === 'user' ? '你' : '墨墨 · AI'}</span>
              <p>{message.role === 'assistant' ? <Reply message={message} close={close} /> : message.content}</p>
            </article>
          ))}
          {pending && (
            <p className={styles.waiting} role="status">
              墨墨正在想<span aria-hidden="true"> · · ·</span>
            </p>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
        <form className={styles.composer} onSubmit={submit}>
          <label htmlFor="cat-chat-input">
            想问墨墨什么？
            <textarea
              id="cat-chat-input"
              ref={inputRef}
              rows={3}
              value={draft}
              disabled={!ready || pending}
              maxLength={1000}
              placeholder={ready ? '输入问题，点击发送。' : '连接模型后即可聊天。'}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={pending || messages.length === 0}
              onClick={() => {
                setMessages([]);
                setError('');
              }}
            >
              清空对话
            </button>
            <span>{draft.length} / 1000</span>
            <button className={styles.send} type="submit" disabled={!ready || pending || !draft.trim()}>
              {pending ? '等待回复' : '发送 ↗'}
            </button>
          </div>
          <p id="cat-chat-privacy" className={styles.privacy}>
            {ready ? `发送后，问题及最近三轮对话将交给 ${connection.provider} 生成回复；不会发送浏览记录。` : '未连接时不会调用模型。'} 本站不持久保存对话。请勿填写敏感信息；AI 回复可能有误。
          </p>
        </form>
      </div>
    </div>,
    document.body,
  );
}

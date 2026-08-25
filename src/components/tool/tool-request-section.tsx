'use client';

import {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {isRecaptchaEnabled, RecaptchaField} from '@/components/auth/recaptcha-field';
import {apiPost} from '@/config/api-config';
import {getStoredCountry, getStoredIp, resolveLocale} from '@/i18n/detect';
import {useT} from '@/i18n/locale-context';

type RequestItem = {
  requestNo: number;
  parentRequestNo?: number | null;
  nickname: string;
  content: string;
  maskedIp: string;
  country?: string | null;
  createDt?: string | null;
};

type ListResponse = {
  list: RequestItem[];
  totalCount: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
};

const PAGE_SIZE = 10;

function buildThreads(list: RequestItem[]) {
  const roots: RequestItem[] = [];
  const replies = new Map<number, RequestItem[]>();

  for (const item of list) {
    if (item.parentRequestNo) {
      const bucket = replies.get(item.parentRequestNo) || [];
      bucket.push(item);
      replies.set(item.parentRequestNo, bucket);
    } else {
      roots.push(item);
    }
  }

  return {roots, replies};
}

function FloatField({
  id,
  label,
  value,
  onChange,
  maxLength,
  autoComplete,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={`field field--float${className ? ` ${className}` : ''}`}>
      <div className="field--float__control">
        <label htmlFor={id} className="field--float__label">
          {label}
        </label>
        <input
          id={id}
          className="field__input field--float__input"
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder=" "
          required
        />
      </div>
    </div>
  );
}

export default function ToolRequestSection({toolKey}: {toolKey: string}) {
  const t = useT();
  const [list, setList] = useState<RequestItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [replyingNo, setReplyingNo] = useState<number | null>(null);
  const [replyNickname, setReplyNickname] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyCaptcha, setReplyCaptcha] = useState<string | null>(null);
  const [replyCaptchaKey, setReplyCaptchaKey] = useState(0);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const recaptchaKeyRef = useRef(0);
  const replyCaptchaKeyRef = useRef(0);
  const captchaRequired = isRecaptchaEnabled();

  const threads = useMemo(() => buildThreads(list), [list]);

  const resetCaptcha = () => {
    setCaptcha(null);
    recaptchaKeyRef.current += 1;
    setCaptchaKey(recaptchaKeyRef.current);
  };

  const resetReplyCaptcha = () => {
    setReplyCaptcha(null);
    replyCaptchaKeyRef.current += 1;
    setReplyCaptchaKey(replyCaptchaKeyRef.current);
  };

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const body = await apiPost<ListResponse>('tl/get-request-list', {
          toolKey,
          page: nextPage,
          pageSize: PAGE_SIZE
        });
        setList(body.data.list || []);
        setPage(body.data.currentPage || nextPage);
        setLastPage(Math.max(1, body.data.lastPage || 1));
      } catch (err) {
        setList([]);
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : t('Failed to load requests.')
        });
      } finally {
        setLoading(false);
      }
    },
    [toolKey, t]
  );

  useEffect(() => {
    resolveLocale().catch(() => undefined);
    load(1);
  }, [load]);

  const submitRequest = async (opts: {
    nick: string;
    text: string;
    captchaToken: string | null;
    parentRequestNo?: number;
  }) => {
    const nick = opts.nick.trim();
    const text = opts.text.trim();
    if (!nick || !text) {
      setMessage({type: 'error', text: t('Nickname and request are required.')});
      return false;
    }
    if (captchaRequired && !opts.captchaToken) {
      setMessage({type: 'error', text: t('Complete the robot check.')});
      return false;
    }

    let ip = getStoredIp();
    let country = getStoredCountry();
    if (!ip) {
      const geo = await resolveLocale();
      ip = geo.ip;
      country = geo.country || country;
    }

    await apiPost('tl/set-request', {
      toolKey,
      nickname: nick,
      content: text,
      parentRequestNo: opts.parentRequestNo || undefined,
      ip: ip || undefined,
      country: country || undefined,
      captcha: opts.captchaToken || undefined
    });
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const ok = await submitRequest({nick: nickname, text: content, captchaToken: captcha});
      if (!ok) return;
      setNickname('');
      setContent('');
      resetCaptcha();
      setMessage({type: 'ok', text: t('Request submitted.')});
      await load(1);
    } catch (err) {
      resetCaptcha();
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('Failed to submit request.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startReply = (requestNo: number) => {
    setReplyingNo(requestNo);
    setReplyNickname('');
    setReplyContent('');
    resetReplyCaptcha();
    setMessage(null);
  };

  const cancelReply = () => {
    setReplyingNo(null);
    setReplyNickname('');
    setReplyContent('');
    resetReplyCaptcha();
  };

  const onReplySubmit = async (e: FormEvent, parentRequestNo: number) => {
    e.preventDefault();
    setMessage(null);
    setReplySubmitting(true);
    try {
      const ok = await submitRequest({
        nick: replyNickname,
        text: replyContent,
        captchaToken: replyCaptcha,
        parentRequestNo
      });
      if (!ok) return;
      cancelReply();
      setMessage({type: 'ok', text: t('Reply submitted.')});
      await load(page);
    } catch (err) {
      resetReplyCaptcha();
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('Failed to submit reply.')
      });
    } finally {
      setReplySubmitting(false);
    }
  };

  const showMainSubmit = !captchaRequired || Boolean(captcha);
  const showReplySubmit = !captchaRequired || Boolean(replyCaptcha);

  const renderComposer = (opts: {
    formClass: string;
    nickId: string;
    contentId: string;
    nick: string;
    setNick: (v: string) => void;
    text: string;
    setText: (v: string) => void;
    onSubmitForm: (e: FormEvent) => void;
    captchaToken: string | null;
    setCaptchaToken: (v: string | null) => void;
    captchaKeyValue: number;
    showSubmit: boolean;
    submittingState: boolean;
    cancel?: () => void;
  }) => (
    <form className={opts.formClass} onSubmit={opts.onSubmitForm}>
      <div className="tool-request__fields">
        <FloatField
          id={opts.nickId}
          className="tool-request__nick"
          label={t('Nickname')}
          value={opts.nick}
          onChange={opts.setNick}
          maxLength={50}
          autoComplete="nickname"
        />
        <FloatField
          id={opts.contentId}
          className="tool-request__body"
          label={t('Request')}
          value={opts.text}
          onChange={opts.setText}
          maxLength={500}
        />
      </div>

      <div className="tool-request__compose-foot">
        {captchaRequired ? (
          <RecaptchaField
            key={opts.captchaKeyValue}
            hidden={Boolean(opts.captchaToken)}
            onChange={opts.setCaptchaToken}
          />
        ) : null}

        {opts.showSubmit ? (
          <div className="tool-request__submit-wrap">
            {opts.cancel ? (
              <button type="button" className="btn btn--ghost" onClick={opts.cancel} disabled={opts.submittingState}>
                {t('Cancel')}
              </button>
            ) : null}
            <button type="submit" className="btn btn--primary" disabled={opts.submittingState}>
              {opts.submittingState ? t('Submitting…') : t('Submit')}
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );

  return (
    <section className="tool-request" aria-label={t('Requests')}>
      <div className="tool-request__list" aria-live="polite">
        {loading ? <p className="tool-status">{t('Loading…')}</p> : null}
        {!loading && threads.roots.length === 0 ? (
          <p className="tool-status tool-request__empty">{t('No requests yet.')}</p>
        ) : null}
        {!loading && threads.roots.length > 0 ? (
          <ul className="tool-request__items">
            {threads.roots.map(item => {
              const childReplies = threads.replies.get(item.requestNo) || [];
              return (
                <li key={item.requestNo} className="tool-request__item">
                  <div className="tool-request__meta">
                    <strong>{item.nickname}</strong>
                    <span>{item.maskedIp}</span>
                    {item.createDt ? <time dateTime={item.createDt}>{item.createDt}</time> : null}
                    <button type="button" className="text-btn" onClick={() => startReply(item.requestNo)}>
                      {t('Reply')}
                    </button>
                  </div>
                  <p className="tool-request__content">{item.content}</p>

                  {childReplies.length > 0 ? (
                    <ul className="tool-request__replies">
                      {childReplies.map(reply => (
                        <li key={reply.requestNo} className="tool-request__item tool-request__item--reply">
                          <div className="tool-request__meta">
                            <strong>{reply.nickname}</strong>
                            <span className="tool-request__badge">{t('Reply')}</span>
                            <span>{reply.maskedIp}</span>
                            {reply.createDt ? <time dateTime={reply.createDt}>{reply.createDt}</time> : null}
                          </div>
                          <p className="tool-request__content">{reply.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {replyingNo === item.requestNo
                    ? renderComposer({
                        formClass: 'tool-request__form tool-request__form--reply',
                        nickId: `reply-nick-${item.requestNo}`,
                        contentId: `reply-content-${item.requestNo}`,
                        nick: replyNickname,
                        setNick: setReplyNickname,
                        text: replyContent,
                        setText: setReplyContent,
                        onSubmitForm: e => void onReplySubmit(e, item.requestNo),
                        captchaToken: replyCaptcha,
                        setCaptchaToken: setReplyCaptcha,
                        captchaKeyValue: replyCaptchaKey,
                        showSubmit: showReplySubmit,
                        submittingState: replySubmitting,
                        cancel: cancelReply
                      })
                    : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {lastPage > 1 ? (
        <div className="tool-request__pager">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            {t('Previous')}
          </button>
          <span className="tool-status">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page >= lastPage || loading}
            onClick={() => load(page + 1)}
          >
            {t('Next')}
          </button>
        </div>
      ) : null}

      {renderComposer({
        formClass: 'tool-request__form',
        nickId: 'request-nickname',
        contentId: 'request-content',
        nick: nickname,
        setNick: setNickname,
        text: content,
        setText: setContent,
        onSubmitForm: e => void onSubmit(e),
        captchaToken: captcha,
        setCaptchaToken: setCaptcha,
        captchaKeyValue: captchaKey,
        showSubmit: showMainSubmit,
        submittingState: submitting
      })}

      {message ? (
        <p className={`tool-status tool-request__message${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>
          {t(message.text)}
        </p>
      ) : null}
    </section>
  );
}

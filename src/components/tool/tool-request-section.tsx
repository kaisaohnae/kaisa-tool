'use client';

import {useEffect, useMemo, useState} from 'react';
import {KaisaButton, KaisaTextarea} from '@/ui-kit';
import {apiPost} from '@/config/api-config';
import {useT} from '@/i18n/locale-context';
import useMemberStore from '@/store/use-member-store';

const SITE_CODE = 'kaisa-tool';
const COMMENT_MAX = 500;

type CommentItem = {
  requestNo: number;
  parentRequestNo?: number | null;
  nickname: string;
  content: string;
  createDt?: string | null;
};

type ListResponse = {
  list: CommentItem[];
};

function buildThreads(list: CommentItem[]) {
  const roots: CommentItem[] = [];
  const replies = new Map<number, CommentItem[]>();

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

function formatDate(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 16).replace('T', ' ');
}

export default function ToolRequestSection({toolKey}: {toolKey: string}) {
  const t = useT();
  const member = useMemberStore(s => s.member);
  const hydrated = useMemberStore(s => s.hydrated);
  const hydrate = useMemberStore(s => s.hydrate);
  const [list, setList] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [replyingNo, setReplyingNo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [busy, setBusy] = useState(false);

  const threads = useMemo(() => buildThreads(list), [list]);

  const load = () => {
    apiPost<ListResponse>('tl/get-request-list', {
      siteCode: SITE_CODE,
      toolKey,
      page: 1,
      pageSize: 50
    })
      .then(body => setList(body.data.list || []))
      .catch(() => setList([]));
  };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    load();
  }, [toolKey]);

  const submit = async (text: string, parentRequestNo?: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setMessage('');
    try {
      await apiPost(
        'tl/set-request',
        {
          siteCode: SITE_CODE,
          toolKey,
          content: trimmed,
          parentRequestNo
        },
        'member'
      );
      setContent('');
      setReplyContent('');
      setReplyingNo(null);
      load();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : t('Failed to submit comment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="comment-box" aria-label={t('Comments')}>
      <div className="comment-box__head">
        <h2>{t('Comments')}</h2>
        <span className="comment-box__count">{list.length}</span>
      </div>

      {!hydrated ? (
        <div className="comment-guest comment-guest--loading" aria-hidden />
      ) : member ? (
        <div className="comment-form kaisa-kit">
          <KaisaTextarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('Leave a comment')}
            rows={4}
            maxLength={COMMENT_MAX}
          />
          <div className="comment-form__actions">
            <span className="comment-form__user">
              {t('Writing as {name}').replace('{name}', member.memberName)} ({content.length}/{COMMENT_MAX})
            </span>
            <KaisaButton onClick={() => void submit(content)} disabled={busy || !content.trim()}>
              {t('Submit')}
            </KaisaButton>
          </div>
        </div>
      ) : (
        <div className="comment-guest">
          <p className="comment-guest__text">{t('Log in to leave a comment.')}</p>
        </div>
      )}

      {message ? <p className="form-error comment-box__message">{message}</p> : null}

      {list.length === 0 ? (
        <p className="comment-empty">{t('No comments yet. Be the first.')}</p>
      ) : (
        <ul className="comment-list">
          {threads.roots.map(item => {
            const childReplies = threads.replies.get(item.requestNo) || [];
            return (
              <li key={item.requestNo} className="comment-thread">
                <ul className="comment-list comment-list--flat">
                  <li className="comment-item">
                    <div className="comment-item__head">
                      <div className="comment-item__meta">
                        <strong>{item.nickname}</strong>
                        <time dateTime={item.createDt || undefined}>{formatDate(item.createDt)}</time>
                      </div>
                      {hydrated && member ? (
                        <div className="comment-item__actions">
                          <button type="button" className="text-btn" onClick={() => setReplyingNo(item.requestNo)}>
                            {t('Reply')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <p className="comment-item__content">{item.content}</p>
                    {hydrated && member && replyingNo === item.requestNo ? (
                      <div className="comment-reply-form kaisa-kit">
                        <KaisaTextarea
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          placeholder={t('Write a reply')}
                          rows={3}
                          maxLength={COMMENT_MAX}
                          disabled={busy}
                        />
                        <div className="comment-edit__actions">
                          <span className="comment-form__user">
                            {t('Writing as {name}').replace('{name}', member.memberName)} ({replyContent.length}/{COMMENT_MAX})
                          </span>
                          <div className="comment-edit__buttons">
                          <KaisaButton variant="secondary" uiSize="sm" onClick={() => setReplyingNo(null)} disabled={busy}>
                            {t('Cancel')}
                          </KaisaButton>
                          <KaisaButton
                            uiSize="sm"
                            onClick={() => void submit(replyContent, item.requestNo)}
                            disabled={busy || !replyContent.trim()}
                          >
                            {t('Post reply')}
                          </KaisaButton>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </li>
                </ul>
                {childReplies.length ? (
                  <ul className="comment-replies">
                    {childReplies.map(reply => (
                      <li key={reply.requestNo} className="comment-item comment-item--reply">
                        <div className="comment-item__head">
                          <div className="comment-item__meta">
                            <strong>{reply.nickname}</strong>
                            <span className="comment-item__badge">{t('Reply')}</span>
                            <time dateTime={reply.createDt || undefined}>{formatDate(reply.createDt)}</time>
                          </div>
                        </div>
                        <p className="comment-item__content">{reply.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

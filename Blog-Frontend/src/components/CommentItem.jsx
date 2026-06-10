import React, { useState, useContext } from "react";
import { MessageCircle, Trash2, CornerDownRight } from "lucide-react";
import CommentForm from "./CommentForm";
import { AuthContext } from "../components/AuthContext";
import { cn } from "@/lib/utils";
import { relativeTime, isoDate } from "@/lib/time";

const Avatar = ({ name }) => {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="shrink-0 w-9 h-9 border border-ink-faint bg-surface-2 flex items-center justify-center text-sm font-heading font-bold text-ink-muted">
      {initial}
    </div>
  );
};

const TimeAgo = ({ value }) => {
  const text = relativeTime(value);
  if (!text) return null;
  return (
    <time
      dateTime={isoDate(value)}
      title={value ? new Date(value).toLocaleString() : ""}
      className="text-[10px] uppercase tracking-[0.16em] text-ink-subtle"
    >
      {text}
    </time>
  );
};

const CommentItem = ({
  comment,
  onAddReply,
  onDeleteComment,
  onDeleteReply,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const { user } = useContext(AuthContext);

  const handleReply = async (content) => {
    await onAddReply(comment.id, content);
    setIsReplying(false);
  };

  // NOTE: backend transforms authorEmail → name on response,
  // so we compare against user.name (matches existing behaviour).
  const canDeleteComment = user && comment.authorEmail === user.name;
  const canDeleteReply = (reply) =>
    user && reply.authorEmail === user.name;

  return (
    <article className="border-b border-ink-faint last:border-b-0 py-6 first:pt-0">
      <header className="flex items-start gap-3 mb-3">
        <Avatar name={comment.authorEmail || comment.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h4 className="font-heading font-bold text-ink">
              {comment.authorEmail || comment.author || "Anonymous"}
            </h4>
            <div className="flex items-center gap-3">
              <TimeAgo value={comment.createdAt} />
              {canDeleteComment && (
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-ink-subtle hover:text-danger transition-colors"
                  aria-label="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pl-12">
        <p className="text-ink-muted leading-relaxed">
          {comment.content}
        </p>

        <button
          onClick={() => setIsReplying((v) => !v)}
          className={cn(
            "mt-4 flex items-center gap-2 micro-text",
            "transition-colors",
            isReplying ? "text-accent" : "text-ink-subtle hover:text-ink"
          )}
        >
          <MessageCircle size={12} />
          {isReplying ? "Cancel reply" : "Reply"}
        </button>

        {isReplying && (
          <div className="mt-4 pl-4 border-l-2 border-accent">
            <CommentForm
              onSubmit={handleReply}
              isReply
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <ul className="mt-6 pl-4 border-l border-ink-faint grid gap-5">
            {comment.replies.map((reply) => (
              <li key={reply.id} className="flex gap-3">
                <CornerDownRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-faint"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                    <h5 className="font-heading font-bold text-ink text-sm">
                      {reply.authorEmail || reply.author || "Anonymous"}
                    </h5>
                    <div className="flex items-center gap-3">
                      <TimeAgo value={reply.createdAt} />
                      {canDeleteReply(reply) && (
                        <button
                          onClick={() =>
                            onDeleteReply(comment.id, reply.id)
                          }
                          className="text-ink-subtle hover:text-danger transition-colors"
                          aria-label="Delete reply"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};

export default CommentItem;

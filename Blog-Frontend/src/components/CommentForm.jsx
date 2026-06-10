import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "./shared/Field";

const CommentForm = ({ onSubmit, isReply = false, onCancel }) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !content.trim();

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isReply ? "Write a reply…" : "Join the conversation…"}
        rows={isReply ? 3 : 4}
        className="min-h-[80px]"
      />
      <div className="flex items-center justify-end gap-3">
        {isReply && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={disabled}
        >
          <Send size={14} />
          {isReply ? "Reply" : "Post comment"}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;

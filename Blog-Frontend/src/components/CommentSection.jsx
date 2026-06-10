import React, { useState, useEffect, useContext } from "react";
import { MessageSquare } from "lucide-react";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import apiFetch from "../components/utils/api";
import { AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { EmptyState } from "./shared/EmptyState";

const CommentSection = ({ blogId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/blogs/${blogId}`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [blogId]);

  const requireLogin = () => {
    localStorage.setItem("redirectAfterLogin", `/blog/${blogId}`);
    navigate("/login");
  };

  const handleAddComment = async (content) => {
    if (!isLoggedIn) return requireLogin();
    try {
      const response = await apiFetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      const updated = await response.json();
      setComments(updated.comments || []);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddReply = async (commentId, content) => {
    if (!isLoggedIn) return requireLogin();
    try {
      const response = await apiFetch(
        `/api/blogs/${blogId}/comments/${commentId}/replies`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) throw new Error("Failed to add reply");
      const updated = await response.json();
      setComments(updated.comments || []);
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await apiFetch(
        `/api/blogs/${blogId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete comment");
      const updated = await response.json();
      setComments(updated.comments || []);
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const response = await apiFetch(
        `/api/blogs/${blogId}/comments/${commentId}/replies/${replyId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete reply");
      const updated = await response.json();
      setComments(updated.comments || []);
    } catch (err) {
      console.error("Error deleting reply:", err);
    }
  };

  return (
    <section
      className="mt-16 pt-10 border-t border-ink-faint"
      aria-label="Comments"
    >
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare size={20} className="text-accent" />
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
          Comments
        </h2>
        <span className="micro-text text-ink-subtle">
          ({comments.length})
        </span>
      </div>

      {isLoggedIn ? (
        <div className="mb-10 p-5 border border-ink-faint bg-surface">
          <CommentForm onSubmit={handleAddComment} />
        </div>
      ) : (
        <div className="mb-10 p-6 border border-ink-faint bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-ink-muted text-sm">
            Sign in to join the conversation.
          </p>
          <Button asChild variant="accent" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          <div className="h-16 skeleton-shimmer" />
          <div className="h-16 skeleton-shimmer" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Be the first to share your thoughts."
        />
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onAddReply={handleAddReply}
              onDeleteComment={handleDeleteComment}
              onDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentSection;

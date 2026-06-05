import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Reply, MessageSquare, AtSign } from 'lucide-react';
import { toast } from 'sonner';

function CommentItem({ comment, users, onReply }) {
  const author = users.find(u => u.id === comment.created_by_id);
  const initials = author?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold">{author?.full_name || 'Usuário'}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">
            {comment.content.split(/(@\w+)/g).map((part, i) =>
              part.startsWith('@') ? (
                <span key={i} className="text-primary font-medium">{part}</span>
              ) : part
            )}
          </p>
        </div>
        <button
          onClick={() => onReply?.(comment)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1.5 ml-2 transition-colors"
        >
          <Reply className="w-3 h-3" /> Responder
        </button>
      </div>
    </div>
  );
}

export default function CommentSection({ taskId, projectId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const textareaRef = React.useRef(null);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => base44.entities.Comment.filter({ task_id: taskId }, '-created_date', 50),
    enabled: !!taskId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  const addComment = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
      setReplyTo(null);
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  const handleTextChange = (e) => {
    const val = e.target.value;
    setNewComment(val);
    // Detect @ mention
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionSearch(match[1]);
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (user) => {
    const cursor = textareaRef.current?.selectionStart || newComment.length;
    const textBefore = newComment.slice(0, cursor);
    const textAfter = newComment.slice(cursor);
    const atPos = textBefore.lastIndexOf('@');
    const newText = textBefore.slice(0, atPos) + `@${user.full_name?.split(' ')[0] || user.email} ` + textAfter;
    setNewComment(newText);
    setMentionOpen(false);
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment.mutate({
      content: newComment.trim(),
      task_id: taskId,
      project_id: projectId,
      parent_comment_id: replyTo?.id || null,
    });
  };

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_comment_id === parentId);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        Comentários ({comments.length})
      </div>

      {/* Comment input */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {replyTo && (
            <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg flex items-center justify-between">
              <span>Respondendo a <strong>{users.find(u => u.id === replyTo.created_by_id)?.full_name || 'usuário'}</strong></span>
              <button onClick={() => setReplyTo(null)} className="hover:text-foreground">✕</button>
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextChange}
              placeholder="Escreva um comentário... use @ para mencionar alguém"
              rows={2}
              className="text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
                if (e.key === 'Escape') setMentionOpen(false);
              }}
            />
            {mentionOpen && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg w-48 overflow-hidden z-10">
                {users
                  .filter(u => u.id !== user?.id && (u.full_name?.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email?.toLowerCase().includes(mentionSearch.toLowerCase())))
                  .slice(0, 5)
                  .map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={() => insertMention(u)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {u.full_name?.[0] || '?'}
                      </div>
                      {u.full_name || u.email}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit}
              disabled={!newComment.trim() || addComment.isPending}
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          topLevel.map(comment => (
            <div key={comment.id} className="space-y-3">
              <CommentItem comment={comment} users={users} onReply={setReplyTo} />
              {/* Replies */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="ml-11">
                  <CommentItem comment={reply} users={users} onReply={setReplyTo} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Reply, MessageSquare } from 'lucide-react';
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
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
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
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={2}
            className="text-sm resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
          />
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
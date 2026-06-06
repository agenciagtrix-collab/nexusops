import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AgentMessageCard, { getCardType } from './AgentMessageCard';

const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    components={{
      p: ({ children }) => <p className="my-1 leading-relaxed text-sm">{children}</p>,
      ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>,
      li: ({ children }) => <li className="text-sm">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground border-b border-border pb-1">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>
      ),
      code: ({ inline, children }) => inline ? (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
      ) : (
        <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2"><code>{children}</code></pre>
      ),
      hr: () => <hr className="border-border my-2" />,
    }}
  >
    {content}
  </ReactMarkdown>
);

export default function ChatMessageBubble({ message, user }) {
  const isUser = message.role === 'user';
  const isCouncil = message.agent_name === 'Parecer Consolidado';
  const cardType = !isUser ? getCardType(message.content) : null;

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border-2 border-background",
              isCouncil && "ring-2 ring-violet-400"
            )}
            style={{ backgroundColor: message.agent_color || '#6366f1' }}
          >
            {message.agent_emoji || '🤖'}
          </div>
        </div>
      )}

      <div className={cn("max-w-[75%] space-y-1", isUser && "items-end flex flex-col")}>
        {/* Agent name */}
        {!isUser && message.agent_name && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-foreground">{message.agent_name}</span>
            {isCouncil && (
              <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">Conselho</span>
            )}
          </div>
        )}

        {/* Message bubble */}
        {isUser ? (
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed">
            <p>{message.content}</p>
          </div>
        ) : cardType ? (
          /* Smart card for structured AI responses */
          <AgentMessageCard cardType={cardType} agentColor={message.agent_color}>
            <MarkdownContent content={message.content} />
          </AgentMessageCard>
        ) : isCouncil ? (
          /* Council special styling */
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-violet-50 border border-violet-200 text-sm">
            <MarkdownContent content={message.content} />
          </div>
        ) : (
          /* Regular agent message */
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border text-sm">
            <MarkdownContent content={message.content} />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground px-1">
          {message.created_date && format(parseISO(message.created_date), "HH:mm", { locale: ptBR })}
        </p>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
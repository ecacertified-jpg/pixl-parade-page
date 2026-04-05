import { useState } from 'react';
import { useWhatsAppConversations, WhatsAppConversation } from '@/hooks/useWhatsAppConversations';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Bot, User, Search, ArrowLeft, UserCheck, Send, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function WhatsAppAIConversations() {
  const {
    conversations,
    messages,
    stats,
    loadingConversations,
    loadingMessages,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedConversationId,
    setSelectedConversationId,
    toggleMode,
    sendAdminReply,
  } = useWhatsAppConversations();

  const [adminMessage, setAdminMessage] = useState('');
  const [sending, setSending] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendReply = async () => {
    if (!selectedConversationId || !adminMessage.trim() || sending) return;
    setSending(true);
    const success = await sendAdminReply(selectedConversationId, adminMessage.trim());
    if (success) setAdminMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total conversations</p>
              <p className="text-2xl font-bold">{stats.totalConversations}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Bot className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actives aujourd'hui</p>
              <p className="text-2xl font-bold">{stats.activeToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total messages</p>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main panel */}
      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversation list */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedConversationId && "hidden md:flex"
          )}>
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'active', 'closed'] as const).map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Toutes' : s === 'active' ? 'Actives' : 'Fermées'}
                  </Button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Aucune conversation</div>
              ) : (
                conversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={conv.id === selectedConversationId}
                    onClick={() => setSelectedConversationId(conv.id)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* Message detail */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConversationId && "hidden md:flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Header with mode toggle */}
                <div className="p-3 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {selectedConversation.display_name || selectedConversation.phone_number}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.phone_number}</p>
                  </div>
                  <Badge variant={selectedConversation.mode === 'human' ? 'destructive' : 'default'} className="text-xs">
                    {selectedConversation.mode === 'human' ? '👤 Admin' : '🤖 IA'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={() => toggleMode(
                      selectedConversation.id,
                      selectedConversation.mode === 'ai' ? 'human' : 'ai'
                    )}
                  >
                    {selectedConversation.mode === 'ai' ? (
                      <><UserCheck className="h-3.5 w-3.5" /> Prendre le relais</>
                    ) : (
                      <><Bot className="h-3.5 w-3.5" /> Repasser en IA</>
                    )}
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground text-sm">Chargement...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">Aucun message</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => {
                        const isAdmin = msg.metadata?.sender === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2 max-w-[85%]",
                              msg.direction === 'outbound' ? 'ml-auto flex-row-reverse' : ''
                            )}
                          >
                            <div className={cn(
                              "p-1.5 rounded-full h-7 w-7 flex items-center justify-center shrink-0",
                              msg.direction === 'outbound'
                                ? isAdmin ? 'bg-destructive/10' : 'bg-primary/10'
                                : 'bg-muted'
                            )}>
                              {msg.direction === 'outbound'
                                ? isAdmin
                                  ? <UserCheck className="h-3.5 w-3.5 text-destructive" />
                                  : <Bot className="h-3.5 w-3.5 text-primary" />
                                : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                            <div className={cn(
                              "rounded-xl px-3 py-2 text-sm",
                              msg.direction === 'outbound'
                                ? isAdmin
                                  ? 'bg-destructive text-destructive-foreground'
                                  : 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}>
                              {isAdmin && (
                                <p className="text-[10px] font-medium mb-0.5 opacity-80">Admin</p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={cn(
                                "text-[10px] mt-1",
                                msg.direction === 'outbound' ? 'opacity-70' : 'text-muted-foreground'
                              )}>
                                {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Admin reply input — visible only in human mode */}
                {selectedConversation.mode === 'human' && (
                  <div className="p-3 border-t flex gap-2">
                    <Textarea
                      placeholder="Tapez votre réponse..."
                      value={adminMessage}
                      onChange={e => setAdminMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[44px] max-h-[120px] resize-none"
                      rows={1}
                    />
                    <Button
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      disabled={!adminMessage.trim() || sending}
                      onClick={handleSendReply}
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: WhatsAppConversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 border-b hover:bg-accent/50 transition-colors",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm truncate">
          {conversation.display_name || conversation.phone_number}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: fr })}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate">{conversation.phone_number}</span>
        <div className="flex items-center gap-1 shrink-0">
          {conversation.mode === 'human' && (
            <Badge variant="destructive" className="text-[10px] h-5">👤</Badge>
          )}
          <Badge variant={conversation.status === 'active' ? 'default' : 'outline'} className="text-[10px] h-5">
            {conversation.status}
          </Badge>
        </div>
      </div>
    </button>
  );
}

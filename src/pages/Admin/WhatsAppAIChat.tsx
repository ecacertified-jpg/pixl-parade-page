import { AdminLayout } from '@/components/AdminLayout';
import { WhatsAppAIConversations } from '@/components/admin/WhatsAppAIConversations';
import { Bot } from 'lucide-react';

const WhatsAppAIChat = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Chat IA WhatsApp</h1>
            <p className="text-muted-foreground">Conversations automatisées avec l'assistant IA</p>
          </div>
        </div>
        <WhatsAppAIConversations />
      </div>
    </AdminLayout>
  );
};

export default WhatsAppAIChat;

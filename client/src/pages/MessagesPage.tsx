import { useState, useEffect } from "react";
import { useConversations, useMessages, useMarkMessagesRead } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { ConversationList } from "@/components/ConversationList";
import { ChatInterface } from "@/components/ChatInterface";
import { MessageCircle, Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MessagesPage() {
    const { user } = useAuth();
    const { data: conversations = [] } = useConversations();

    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const conversationId = selectedConv?.conversation?.id;
    const { data: messages = [] } = useMessages(conversationId);
    const markRead = useMarkMessagesRead();

    // Auto-select first conversation on load
    useEffect(() => {
        if (!selectedConv && (conversations as any[]).length > 0) {
            setSelectedConv((conversations as any[])[0]);
        }
    }, [conversations, selectedConv]);

    // Mark messages read when conversation is selected
    useEffect(() => {
        if (conversationId && user?.id) {
            markRead.mutate(conversationId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const currentUserId = user?.id ?? "";

    // Filter conversations by search
    const filteredConvos = searchQuery.trim()
        ? (conversations as any[]).filter((c: any) => {
            const name = `${c.otherUser.firstName ?? ""} ${c.otherUser.lastName ?? ""}`.toLowerCase();
            return name.includes(searchQuery.toLowerCase());
        })
        : (conversations as any[]);

    return (
        <div className="h-screen flex bg-background">
            {/* Left Panel — Conversations */}
            <div className="w-[340px] border-r flex flex-col bg-card/50">
                {/* Header */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-[#0a66c2]" />
                            Messaging
                        </h2>
                        <button className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors" title="New message">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 rounded-xl bg-muted/50 border-border/50 text-sm"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        conversations={filteredConvos}
                        currentUserId={currentUserId}
                        selectedId={conversationId}
                        onSelect={(item) => setSelectedConv(item)}
                    />
                </div>
            </div>

            {/* Right Panel — Chat */}
            <div className="flex-1 flex flex-col">
                {selectedConv ? (
                    <ChatInterface
                        messages={messages as any[]}
                        currentUserId={currentUserId}
                        receiverId={selectedConv.otherUser.id}
                        otherUser={selectedConv.otherUser}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0a66c2]/10 to-violet-500/10 flex items-center justify-center">
                                <MessageCircle className="h-10 w-10 text-[#0a66c2]/40" />
                            </div>
                            <p className="font-semibold text-lg">Your messages</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                                Connect with your gig partners. Select a conversation or start a new one from a gig.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

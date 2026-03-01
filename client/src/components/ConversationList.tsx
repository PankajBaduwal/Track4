import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ConversationItem {
    conversation: {
        id: string;
        participant1Id: string;
        participant2Id: string;
        lastMessageContent: string | null;
        lastMessageSenderId: string | null;
        lastMessageAt: string | null;
        unreadCountP1: number;
        unreadCountP2: number;
    };
    otherUser: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
    };
}

interface ConversationListProps {
    conversations: ConversationItem[];
    currentUserId: string;
    selectedId: string | undefined;
    onSelect: (conv: ConversationItem) => void;
}

export function ConversationList({
    conversations,
    currentUserId,
    selectedId,
    onSelect,
}: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="p-6 text-center">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-muted/60 flex items-center justify-center">
                    <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">No conversations</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Messages will appear here</p>
            </div>
        );
    }

    return (
        <div className="py-1">
            {conversations.map((item) => {
                const isP1 = item.conversation.participant1Id === currentUserId;
                const unread = isP1
                    ? item.conversation.unreadCountP1
                    : item.conversation.unreadCountP2;
                const isSelected = selectedId === item.conversation.id;
                const initials = `${item.otherUser.firstName?.[0] ?? ""}${item.otherUser.lastName?.[0] ?? ""}`;
                const name = `${item.otherUser.firstName ?? ""} ${item.otherUser.lastName ?? ""}`.trim();

                return (
                    <button
                        key={item.conversation.id}
                        onClick={() => onSelect(item)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                            "hover:bg-accent/50",
                            isSelected && "bg-accent border-l-2 border-[#0a66c2]",
                            !isSelected && "border-l-2 border-transparent",
                        )}
                    >
                        {/* Avatar with online dot */}
                        <div className="relative shrink-0">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={item.otherUser.profileImageUrl ?? undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold text-sm">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between">
                                <p className={cn(
                                    "text-sm truncate",
                                    unread > 0 ? "font-bold" : "font-medium"
                                )}>
                                    {name}
                                </p>
                                {item.conversation.lastMessageAt && (
                                    <span className={cn(
                                        "text-[11px] shrink-0 ml-2",
                                        unread > 0 ? "text-[#0a66c2] font-semibold" : "text-muted-foreground"
                                    )}>
                                        {formatTime(item.conversation.lastMessageAt)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <p className={cn(
                                    "text-xs truncate",
                                    unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                    {item.conversation.lastMessageSenderId === currentUserId && (
                                        <span className="text-muted-foreground">You: </span>
                                    )}
                                    {item.conversation.lastMessageContent ?? "No messages yet"}
                                </p>
                                {unread > 0 && (
                                    <span className="ml-auto shrink-0 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-[#0a66c2] text-white text-[10px] font-bold px-1.5">
                                        {unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHours < 24 * 7) {
        return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@/hooks/use-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Send, Reply, X, MoreHorizontal, Image as ImageIcon, Paperclip,
    Smile, CheckCheck, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageItem {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    read: boolean;
    createdAt: string;
}

interface ChatInterfaceProps {
    messages: MessageItem[];
    currentUserId: string;
    receiverId: string;
    otherUser: {
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
        email?: string | null;
    };
}

export function ChatInterface({
    messages,
    currentUserId,
    receiverId,
    otherUser,
}: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
    const sendMessage = useSendMessage();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = replyTo
            ? `> ${replyTo.content.slice(0, 80)}${replyTo.content.length > 80 ? "..." : ""}\n\n${input.trim()}`
            : input.trim();
        try {
            await sendMessage.mutateAsync({ receiverId, content });
            setInput("");
            setReplyTo(null);
        } catch (err) {
            console.error("Failed to send:", err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const otherName = `${otherUser.firstName ?? ""} ${otherUser.lastName ?? ""}`.trim() || "User";
    const otherInitials = `${otherUser.firstName?.[0] ?? ""}${otherUser.lastName?.[0] ?? ""}`;

    // Group consecutive messages by same sender
    const groupedMessages = messages.reduce<Array<{ senderId: string; messages: MessageItem[] }>>(
        (acc, msg) => {
            const last = acc[acc.length - 1];
            if (last && last.senderId === msg.senderId) {
                last.messages.push(msg);
            } else {
                acc.push({ senderId: msg.senderId, messages: [msg] });
            }
            return acc;
        },
        []
    );

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header — LinkedIn style */}
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-card/80 backdrop-blur">
                <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-background">
                        <AvatarImage src={otherUser.profileImageUrl ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold text-sm">
                            {otherInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{otherName}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Active now</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-background shadow-lg">
                            <AvatarImage src={otherUser.profileImageUrl ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-lg">
                                {otherInitials}
                            </AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{otherName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Start the conversation — say hello! 👋
                        </p>
                    </div>
                )}

                {groupedMessages.map((group, gi) => {
                    const isMine = group.senderId === currentUserId;
                    return (
                        <div key={gi} className={cn("flex gap-2.5 mb-4", isMine ? "flex-row-reverse" : "flex-row")}>
                            {/* Avatar (only for other user) */}
                            {!isMine && (
                                <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                                    <AvatarImage src={otherUser.profileImageUrl ?? undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs">
                                        {otherInitials}
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <div className={cn("flex flex-col gap-0.5", isMine ? "items-end" : "items-start", "max-w-[70%]")}>
                                {/* Sender name (for first msg in group, other user only) */}
                                {!isMine && (
                                    <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">{otherName}</span>
                                )}

                                {group.messages.map((msg, mi) => {
                                    // Parse reply quote
                                    const hasQuote = msg.content.startsWith("> ");
                                    let quote = "";
                                    let body = msg.content;
                                    if (hasQuote) {
                                        const parts = msg.content.split("\n\n");
                                        quote = parts[0].replace(/^> /, "");
                                        body = parts.slice(1).join("\n\n") || "";
                                    }

                                    const isFirst = mi === 0;
                                    const isLast = mi === group.messages.length - 1;

                                    return (
                                        <div
                                            key={msg.id}
                                            className="group relative"
                                        >
                                            <div
                                                className={cn(
                                                    "px-3.5 py-2 text-sm leading-relaxed",
                                                    isMine
                                                        ? "bg-[#0a66c2] text-white"
                                                        : "bg-muted/80 border border-border/50 text-foreground",
                                                    // Rounded corners like LinkedIn
                                                    isFirst && isLast
                                                        ? isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
                                                        : isFirst
                                                            ? isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
                                                            : isLast
                                                                ? isMine ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md"
                                                                : "rounded-2xl",
                                                )}
                                            >
                                                {/* Reply quote */}
                                                {hasQuote && quote && (
                                                    <div className={cn(
                                                        "text-xs px-2 py-1 rounded-lg mb-1.5 border-l-2",
                                                        isMine
                                                            ? "bg-white/10 border-white/40 text-white/80"
                                                            : "bg-muted border-violet-400 text-muted-foreground"
                                                    )}>
                                                        {quote}
                                                    </div>
                                                )}

                                                <p className="whitespace-pre-wrap break-words">{body}</p>
                                            </div>

                                            {/* Time + read receipt (only on last message of group) */}
                                            {isLast && (
                                                <div className={cn(
                                                    "flex items-center gap-1 mt-0.5 px-1",
                                                    isMine ? "justify-end" : "justify-start"
                                                )}>
                                                    <span className={cn(
                                                        "text-[10px]",
                                                        isMine ? "text-muted-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                    {isMine && (
                                                        msg.read
                                                            ? <CheckCheck className="h-3 w-3 text-blue-500" />
                                                            : <Check className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Reply button (hover) */}
                                            <button
                                                onClick={() => {
                                                    setReplyTo(msg);
                                                    textareaRef.current?.focus();
                                                }}
                                                className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100",
                                                    "h-7 w-7 rounded-full bg-card shadow-md border border-border/70",
                                                    "flex items-center justify-center transition-all hover:bg-muted",
                                                    isMine ? "-left-9" : "-right-9"
                                                )}
                                                title="Reply"
                                            >
                                                <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply preview bar */}
            {replyTo && (
                <div className="px-5 py-2 bg-muted/50 border-t border-border/50 flex items-center gap-2">
                    <Reply className="h-4 w-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* Input area — LinkedIn style */}
            <div className="border-t bg-card/80 backdrop-blur px-4 py-3">
                <div className="flex items-end gap-2 bg-muted/40 rounded-2xl border border-border/60 px-3 py-1.5">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Write a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 border-0 bg-transparent resize-none shadow-none focus-visible:ring-0 text-sm min-h-[36px] max-h-[120px] py-2 px-0"
                    />
                    <div className="flex items-center gap-1 pb-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            title="Emoji"
                        >
                            <Smile className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || sendMessage.isPending}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all",
                                input.trim()
                                    ? "bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

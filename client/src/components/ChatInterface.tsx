import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { readJson, parseErrorMessage } from "@/hooks/use-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
    Send, Reply, X, MoreHorizontal, Paperclip,
    Smile, CheckCheck, Check, FileText, Download,
    Image as ImageIcon, File, Film, Music,
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

interface FileAttachment {
    name: string;
    size: number;
    mimeType: string;
    dataUrl: string; // base64 data URL
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("video/")) return Film;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("pdf")) return FileText;
    return File;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Parse message content — returns either plain text or a FileAttachment */
function parseMessageContent(content: string, type: string): { kind: "text"; text: string } | { kind: "file"; attachment: FileAttachment } {
    if (type === "file") {
        try {
            const parsed = JSON.parse(content) as FileAttachment;
            if (parsed.name && parsed.dataUrl) return { kind: "file", attachment: parsed };
        } catch { /* fall through */ }
    }
    return { kind: "text", text: content };
}

// Custom send-message hook that supports both text and file
function useSendAnyMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: { receiverId: string; content: string; type?: string }) => {
            const res = await fetch(api.messages.send.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ receiverId: input.receiverId, content: input.content }),
            });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        onSuccess: async (data: any) => {
            await qc.invalidateQueries({ queryKey: ["messages", data?.conversationId] });
            await qc.invalidateQueries({ queryKey: [api.conversations.list.path] });
        },
    });
}

export function ChatInterface({
    messages,
    currentUserId,
    receiverId,
    otherUser,
}: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
    const sendMessage = useSendAnyMessage();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (pendingFile) {
            // Send as file message
            const content = JSON.stringify(pendingFile);
            try {
                await sendMessage.mutateAsync({ receiverId, content });
                setPendingFile(null);
                setInput("");
                setReplyTo(null);
            } catch (err: any) {
                console.error("Failed to send file:", err);
                alert(`Failed to send file: ${err?.message ?? "Unknown error"}. Make sure the file is under 5MB.`);
            }
            return;
        }

        if (!input.trim()) return;
        const content = replyTo
            ? `> ${replyTo.content.slice(0, 80)}${replyTo.content.length > 80 ? "..." : ""}\n\n${input.trim()}`
            : input.trim();
        try {
            await sendMessage.mutateAsync({ receiverId, content });
            setInput("");
            setReplyTo(null);
        } catch (err: any) {
            console.error("Failed to send message:", err);
            alert(`Failed to send message: ${err?.message ?? "Unknown error"}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert(`File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
            return;
        }

        setUploadProgress(0);
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        reader.onload = () => {
            setUploadProgress(100);
            setPendingFile({
                name: file.name,
                size: file.size,
                mimeType: file.type,
                dataUrl: reader.result as string,
            });
            setTimeout(() => setUploadProgress(null), 500);
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be picked again
        e.target.value = "";
    };

    const handleDownload = (attachment: FileAttachment) => {
        const link = document.createElement("a");
        link.href = attachment.dataUrl;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            {/* Header */}
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
                                {!isMine && (
                                    <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">{otherName}</span>
                                )}

                                {group.messages.map((msg, mi) => {
                                    const parsed = parseMessageContent(msg.content, msg.type);
                                    const hasQuote = parsed.kind === "text" && msg.content.startsWith("> ");
                                    let quote = "";
                                    let body = parsed.kind === "text" ? msg.content : "";
                                    if (hasQuote && parsed.kind === "text") {
                                        const parts = msg.content.split("\n\n");
                                        quote = parts[0].replace(/^> /, "");
                                        body = parts.slice(1).join("\n\n") || "";
                                    }

                                    const isFirst = mi === 0;
                                    const isLast = mi === group.messages.length - 1;

                                    const roundedClass = isFirst && isLast
                                        ? isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
                                        : isFirst
                                            ? isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
                                            : isLast
                                                ? isMine ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md"
                                                : "rounded-2xl";

                                    return (
                                        <div key={msg.id} className="group relative">
                                            {/* FILE ATTACHMENT BUBBLE */}
                                            {parsed.kind === "file" ? (
                                                <div className={cn(
                                                    "overflow-hidden",
                                                    roundedClass,
                                                    isMine
                                                        ? "bg-[#0a66c2] text-white"
                                                        : "bg-muted/80 border border-border/50 text-foreground"
                                                )}>
                                                    {/* Image preview */}
                                                    {parsed.attachment.mimeType.startsWith("image/") ? (
                                                        <div className="relative">
                                                            <img
                                                                src={parsed.attachment.dataUrl}
                                                                alt={parsed.attachment.name}
                                                                className="max-w-[260px] max-h-[200px] object-cover w-full cursor-pointer"
                                                                onClick={() => handleDownload(parsed.attachment)}
                                                            />
                                                            {/* Overlay download button */}
                                                            <button
                                                                onClick={() => handleDownload(parsed.attachment)}
                                                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // Non-image file card
                                                        <button
                                                            onClick={() => handleDownload(parsed.attachment)}
                                                            className={cn(
                                                                "flex items-center gap-3 px-3.5 py-2.5 w-full text-left hover:opacity-80 transition-opacity",
                                                                "min-w-[200px] max-w-[260px]"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                                                isMine ? "bg-white/20" : "bg-violet-100 dark:bg-violet-900/40"
                                                            )}>
                                                                {(() => {
                                                                    const Icon = getFileIcon(parsed.attachment.mimeType);
                                                                    return <Icon className={cn("h-5 w-5", isMine ? "text-white" : "text-violet-600")} />;
                                                                })()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate leading-tight">{parsed.attachment.name}</p>
                                                                <p className={cn("text-xs mt-0.5", isMine ? "text-white/60" : "text-muted-foreground")}>
                                                                    {formatBytes(parsed.attachment.size)}
                                                                </p>
                                                            </div>
                                                            <Download className={cn("h-4 w-4 shrink-0", isMine ? "text-white/70" : "text-muted-foreground")} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                // TEXT BUBBLE
                                                <div className={cn(
                                                    "px-3.5 py-2 text-sm leading-relaxed",
                                                    isMine
                                                        ? "bg-[#0a66c2] text-white"
                                                        : "bg-muted/80 border border-border/50 text-foreground",
                                                    roundedClass,
                                                )}>
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
                                            )}

                                            {/* Time + read receipt */}
                                            {isLast && (
                                                <div className={cn(
                                                    "flex items-center gap-1 mt-0.5 px-1",
                                                    isMine ? "justify-end" : "justify-start"
                                                )}>
                                                    <span className="text-[10px] text-muted-foreground">
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
                                            {parsed.kind === "text" && (
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
                                            )}
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

            {/* Pending file preview */}
            {pendingFile && (
                <div className="px-5 py-2 bg-violet-50 dark:bg-violet-950/30 border-t border-violet-200 dark:border-violet-800/50 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                        {(() => {
                            const Icon = getFileIcon(pendingFile.mimeType);
                            return <Icon className="h-4.5 w-4.5 text-violet-600" />;
                        })()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-violet-900 dark:text-violet-100">{pendingFile.name}</p>
                        <p className="text-[11px] text-violet-600 dark:text-violet-400">{formatBytes(pendingFile.size)} — ready to send</p>
                    </div>
                    <button
                        onClick={() => setPendingFile(null)}
                        className="h-6 w-6 rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/50 flex items-center justify-center"
                    >
                        <X className="h-3.5 w-3.5 text-violet-500" />
                    </button>
                </div>
            )}

            {/* Upload progress */}
            {uploadProgress !== null && uploadProgress < 100 && (
                <div className="px-5 py-1.5 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Reading file...</span>
                        <Progress value={uploadProgress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="border-t bg-card/80 backdrop-blur px-4 py-3">
                <div className="flex items-end gap-2 bg-muted/40 rounded-2xl border border-border/60 px-3 py-1.5">
                    <Textarea
                        ref={textareaRef}
                        placeholder={pendingFile ? "Add a caption (optional)..." : "Write a message..."}
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
                            <Smile className="h-4 w-4" />
                        </Button>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv"
                            onChange={handleFileSelect}
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full transition-colors",
                                pendingFile
                                    ? "text-violet-600 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Attach file (max 5 MB)"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={(!input.trim() && !pendingFile) || sendMessage.isPending}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all",
                                (input.trim() || pendingFile)
                                    ? "bg-[#0a66c2] hover:bg-[#004182] text-white shadow-sm"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                    Attachments up to 5 MB · Images, PDFs, Docs, Spreadsheets, Zip
                </p>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const { data: notifications = [] } = useNotifications();
    const { data: unreadData } = useUnreadNotificationCount();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const unreadCount = (unreadData as any)?.count ?? 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => markAllRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {(notifications as any[]).length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications yet
                        </div>
                    ) : (
                        (notifications as any[]).map((notif: any) => (
                            <button
                                key={notif.id}
                                onClick={() => {
                                    if (!notif.read) {
                                        markRead.mutate(notif.id);
                                    }
                                }}
                                className={cn(
                                    "w-full text-left p-3 border-b last:border-0 hover:bg-accent transition-colors",
                                    !notif.read && "bg-primary/5",
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    )}
                                    <div className={cn("flex-1 min-w-0", notif.read && "ml-4")}>
                                        <p className="text-sm font-medium">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {notif.body}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

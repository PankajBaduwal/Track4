import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { readJson, parseErrorMessage } from "@/hooks/use-api";

export function useNotifications() {
    return useQuery({
        queryKey: [api.notifications.list.path],
        queryFn: async () => {
            const res = await fetch(api.notifications.list.path, { credentials: "include" });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        refetchInterval: 15000, // poll every 15s
    });
}

export function useUnreadNotificationCount() {
    return useQuery({
        queryKey: [api.notifications.unreadCount.path],
        queryFn: async () => {
            const res = await fetch(api.notifications.unreadCount.path, {
                credentials: "include",
            });
            if (!res.ok) return { count: 0 };
            return await readJson(res);
        },
        refetchInterval: 15000,
    });
}

export function useMarkNotificationRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: string) => {
            const url = buildUrl(api.notifications.markRead.path, { notificationId });
            const res = await fetch(url, {
                method: "PATCH",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: [api.notifications.list.path] });
            await qc.invalidateQueries({ queryKey: [api.notifications.unreadCount.path] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await fetch(api.notifications.markAllRead.path, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: [api.notifications.list.path] });
            await qc.invalidateQueries({ queryKey: [api.notifications.unreadCount.path] });
        },
    });
}

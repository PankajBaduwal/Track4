import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { readJson, parseErrorMessage } from "@/hooks/use-api";

export function useConversations() {
    return useQuery({
        queryKey: [api.conversations.list.path],
        queryFn: async () => {
            const res = await fetch(api.conversations.list.path, { credentials: "include" });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        refetchInterval: 10000, // poll every 10s for new conversations
    });
}

export function useMessages(conversationId: string | undefined) {
    return useQuery({
        queryKey: ["messages", conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const url = buildUrl(api.messages.list.path, { conversationId });
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        enabled: !!conversationId,
        refetchInterval: 3000, // poll every 3s for new messages
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: { receiverId: string; content: string }) => {
            const validated = api.messages.send.input.parse(input);
            const res = await fetch(api.messages.send.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(validated),
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

export function useMarkMessagesRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (conversationId: string) => {
            const url = buildUrl(api.messages.markRead.path, { conversationId });
            const res = await fetch(url, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: [api.conversations.list.path] });
        },
    });
}

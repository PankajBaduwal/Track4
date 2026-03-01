import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { parseWithLogging, readJson, parseErrorMessage } from "@/hooks/use-api";

export function useReviewsForUser(userId: string | undefined) {
    return useQuery({
        queryKey: ["reviews", userId],
        queryFn: async () => {
            if (!userId) return { reviews: [], averageRating: null, totalReviews: 0 };
            const url = buildUrl(api.reviews.getForUser.path, { userId });
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        enabled: !!userId,
    });
}

export function useCreateReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: {
            sessionId: string;
            rating: number;
            review?: string;
            tags?: string[];
        }) => {
            const validated = api.reviews.create.input.parse(input);
            const res = await fetch(api.reviews.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(validated),
            });

            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["reviews"] });
            await qc.invalidateQueries({ queryKey: [api.sessions.listMine.path] });
        },
    });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { readJson, parseErrorMessage } from "@/hooks/use-api";

export function useDashboardAnalytics() {
    return useQuery({
        queryKey: [api.analytics.dashboard.path],
        queryFn: async () => {
            const res = await fetch(api.analytics.dashboard.path, { credentials: "include" });
            if (!res.ok) throw new Error(await parseErrorMessage(res));
            return await readJson(res);
        },
    });
}

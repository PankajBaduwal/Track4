import { z } from "zod";

export function parseWithLogging<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("[JSON] Failed to parse response:", text);
    throw e;
  }
}

export async function parseErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await readJson(res);
    if (data && typeof data === "object" && "message" in data) {
      return String((data as any).message);
    }
    return JSON.stringify(data);
  }
  return (await res.text()) || res.statusText;
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg);
  }
  return res;
}


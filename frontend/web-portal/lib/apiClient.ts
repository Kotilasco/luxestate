const gatewayBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8082";

export function getGatewayBaseUrl() {
  return gatewayBaseUrl;
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("zai-cts-session");
    if (stored) {
      try {
        const session = JSON.parse(stored) as { access_token?: string };
        if (session.access_token) headers.set("authorization", `Bearer ${session.access_token}`);
      } catch {
        localStorage.removeItem("zai-cts-session");
      }
    }
  }
  return globalThis.fetch(input, { ...init, headers });
}

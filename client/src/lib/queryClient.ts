import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryCount: number = 0,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If we get a 401 and haven't retried yet, try once more
  // This gives the server a chance to refresh the token
  if (res.status === 401 && retryCount === 0) {
    // Wait a bit for potential token refresh on server side
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retry the request once
    return apiRequest(method, url, data, retryCount + 1);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Prefetch helper function for commonly accessed data
export const prefetchCommonData = async (userId?: string) => {
  // Prefetch user stats
  queryClient.prefetchQuery({
    queryKey: ["/api/user/stats"],
    staleTime: 5 * 60 * 1000,
  });
  
  // Prefetch collections
  queryClient.prefetchQuery({
    queryKey: ["/api/collections"],
    staleTime: 5 * 60 * 1000,
  });
  
  // Prefetch user prompts
  if (userId) {
    queryClient.prefetchQuery({
      queryKey: [`/api/prompts?userId=${userId}&statusNotEqual=archived`],
      staleTime: 2 * 60 * 1000,
    });
  }
};

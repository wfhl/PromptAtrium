import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (response.status === 401) {
        // 401 means not authenticated, which is a valid state
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
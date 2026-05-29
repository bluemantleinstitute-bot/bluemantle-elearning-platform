// Removed static import of next/headers as it breaks Client Components


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const isServer = typeof window === "undefined";
  let authHeaders: Record<string, string> = {};

  if (isServer) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        authHeaders["Cookie"] = `token=${token}`;
      }
    } catch (e) {
      console.warn("Could not import next/headers on server:", e);
    }
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include", 
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Don't redirect on auth endpoints — let the login form handle the error message
      const isAuthEndpoint = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/verify-otp");

      if (!isAuthEndpoint && (response.status === 401 || response.status === 403)) {
        if (!isServer) {
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        if (isServer) {
          const { redirect } = await import("next/navigation");
          redirect("/");
        } else {
          window.location.href = "/";
        }
      }
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    // Next.js redirect throws an error called NEXT_REDIRECT. We MUST NOT catch and swallow it.
    if (error.digest && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
}


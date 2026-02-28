const API_BASE = "http://localhost:8000";

/**
 * Generic API request helper that attaches JWT from localStorage.
 */
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signupApi(email: string, password: string) {
    const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    // Store JWT
    localStorage.setItem("token", data.access_token);
    return data.user;
}

export async function loginApi(email: string, password: string) {
    const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    // Store JWT
    localStorage.setItem("token", data.access_token);
    return data.user;
}

export function logoutApi() {
    localStorage.removeItem("token");
}

export async function getCurrentUser() {
    return apiRequest("/auth/me");
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function sendChat(message: string) {
    return apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
    });
}

export async function getChatHistory() {
    return apiRequest("/chat/history");
}

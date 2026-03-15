const API_BASE = "http://localhost:8000";

// ─── Token helpers ──────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

// ─── Generic fetch wrapper ──────────────────────────────────────────
async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

// ─── Auth API ───────────────────────────────────────────────────────
export interface SignupPayload {
  email: string;
  password: string;
  name?: string;
  ageRange?: string;
  country?: string;
  city?: string;
  language?: string;
  gender?: string;
  height?: string;
  weight?: string;
  conditions?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  ageRange?: string;
  country?: string;
  city?: string;
  language?: string;
  gender?: string;
  height?: string;
  weight?: string;
  conditions?: string;
  personalization?: string;
}

export async function signup(data: SignupPayload): Promise<AuthResponse> {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<UserData> {
  return apiFetch("/auth/me");
}

export async function updateProfile(
  data: Partial<UserData>
): Promise<UserData> {
  return apiFetch("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Chat API ───────────────────────────────────────────────────────
export interface ChatResponse {
  message: string;
  mode: string;
  response: any;
  timestamp: string;
}

export async function sendChat(
  message: string,
  mode: "fda" | "experimental"
): Promise<ChatResponse> {
  return apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message, mode }),
  });
}

export interface ChatHistoryItem {
  id: string;
  message: string;
  mode: string;
  response: any;
  timestamp: string;
}

export async function getChatHistory(): Promise<{
  history: ChatHistoryItem[];
}> {
  return apiFetch("/chat/history");
}

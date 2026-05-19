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

export function formatResponse(response: any): string {
  if (!response) return 'No response received.';
  if (typeof response === 'string') return response;

  if (response.identified_condition) {
    let html = `<div class="space-y-6">`;

    html += `<div>
               <h3 class="text-lg font-bold border-b border-slate-700 pb-1">Diagnosis Summary</h3>
               <p class="mt-2"><strong>Condition:</strong> <span class="text-indigo-400">${response.identified_condition.toUpperCase()}</span></p>
             </div>`;

    const meds = response.approved_medications || [];
    if (meds.length > 0) {
      html += `<div><h4 class="font-bold text-violet-500 mb-3 flex items-center gap-2">
                <span class="size-2 rounded-full bg-violet-500"></span> Clinical Treatments (FDA)
               </h4>`;
      meds.forEach((drug: any, i: number) => {
        html += `<div class="mb-3 p-3 bg-slate-900/40 rounded-lg border border-slate-800 shadow-sm">`;
        html += `<p class="font-bold text-indigo-300">${i + 1}. ${drug.drug_name}</p>`;
        if (drug.primary_use) html += `<p class="text-sm mt-1 opacity-90"><strong>Usage:</strong> ${drug.primary_use}</p>`;
        if (drug.start_dosage) html += `<p class="text-sm opacity-90"><strong>Dosage:</strong> ${drug.start_dosage}</p>`;
        if (drug.important_warning) {
          html += `<p class="text-xs mt-2 text-amber-500 italic bg-amber-500/10 p-2 rounded">Warning: ${drug.important_warning}</p>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    const trials = response.experimental_trials || [];
    if (trials.length > 0) {
      html += `<div><h4 class="font-bold text-amber-500 mb-3 flex items-center gap-2">
                <span class="size-2 rounded-full bg-amber-500"></span> Experimental Trials
               </h4>`;
      trials.forEach((trial: any, i: number) => {
        html += `<div class="mb-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 shadow-sm">`;
        html += `<p class="font-bold text-amber-200">${trial.drug_name || trial.title || 'Experimental Drug'}</p>`;
        if (trial.primary_use || trial.description) {
          html += `<p class="text-sm mt-1 opacity-90">${trial.primary_use || trial.description}</p>`;
        }
        if (trial.phase) html += `<p class="text-xs mt-1 uppercase tracking-wider font-semibold text-amber-400/80">${trial.phase}</p>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    if (meds.length === 0 && trials.length === 0) {
      html += `<p class="text-slate-400 italic">No specific treatments or trials were identified for this condition.</p>`;
    }

    html += `</div>`;
    return html;
  }

  return JSON.stringify(response, null, 2);
}

export async function sendChat(
  message: string,
  mode: "fda" | "experimental" | "both",
  sessionId?: string
): Promise<ChatResponse> {
  return apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message, mode, session_id: sessionId }),
  });
}

export interface ChatHistoryConversation {
  id: string;
  title: string;
  timestamp: string;
  messages: { role: 'user' | 'assistant'; content: any; mode?: string }[];
}

export async function getChatHistory(): Promise<{
  history: ChatHistoryConversation[];
}> {
  return apiFetch("/chat/history");
}

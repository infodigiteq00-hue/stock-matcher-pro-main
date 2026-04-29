import { toApiUrl } from "./apiBase";

interface ApiErrorResponse {
  message?: string;
}

interface UserPayload {
  id: string;
  fullName: string;
  email: string;
  createdAt: string | null;
  lastLogin: string | null;
  status: string;
  paymentStatus?: string;
}

interface AuthResponse {
  message: string;
  role: "admin" | "user";
  user: UserPayload;
}

const AUTH_API_BASE = toApiUrl("/api/auth");

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.message || `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
};

export async function signupRequest(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_BASE}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<AuthResponse>;
}

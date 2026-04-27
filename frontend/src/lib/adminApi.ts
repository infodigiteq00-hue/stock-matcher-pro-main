interface AdminApiErrorResponse {
  message?: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string | null;
  lastLogin: string | null;
  status: "active" | "paused";
  paymentStatus: "paid" | "unpaid";
}

export interface AdminSummary {
  totalUsers: number;
  activeUsers: number;
  pausedUsers: number;
  paidUsers: number;
}

export interface AdminControls {
  allowPausedUsersAccess: boolean;
  userStatusOptions: Array<"active" | "paused">;
  paymentStatusOptions: Array<"paid" | "unpaid">;
}

export interface AdminUsersResponse {
  summary: AdminSummary;
  users: AdminUser[];
  controls: AdminControls;
}

const ADMIN_API_BASE = "/api/admin";

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as AdminApiErrorResponse;
    return payload.message || `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
};

const ensureOk = async (response: Response) => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const response = await fetch(`${ADMIN_API_BASE}/users`);
  await ensureOk(response);
  return response.json() as Promise<AdminUsersResponse>;
}

export async function updateUserStatusByAdmin(input: { userId: string; status: "active" | "paused" }) {
  const response = await fetch(`${ADMIN_API_BASE}/users/${input.userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: input.status }),
  });

  await ensureOk(response);
  return response.json();
}

export async function updateUserPaymentStatusByAdmin(input: {
  userId: string;
  paymentStatus: "paid" | "unpaid";
}) {
  const response = await fetch(`${ADMIN_API_BASE}/users/${input.userId}/payment-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentStatus: input.paymentStatus }),
  });

  await ensureOk(response);
  return response.json();
}

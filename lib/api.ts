const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Token refresh interceptor ──────────────────────────────────────────────────
// The auth context registers these callbacks on mount so the API layer can
// refresh tokens and force-logout without creating a circular import.

let _getRefreshToken: (() => string | null) | null = null;
let _onTokenRefreshed: ((newAccess: string) => void) | null = null;
let _onForceLogout: (() => void) | null = null;

export function registerAuthCallbacks(opts: {
  getRefreshToken: () => string | null;
  onTokenRefreshed: (newAccess: string) => void;
  onForceLogout: () => void;
}) {
  _getRefreshToken = opts.getRefreshToken;
  _onTokenRefreshed = opts.onTokenRefreshed;
  _onForceLogout = opts.onForceLogout;
}

/** Try to refresh the access token. Returns new access token or null. */
async function tryRefresh(): Promise<string | null> {
  if (!_getRefreshToken) return null;
  const refresh = _getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/users/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess: string = data.access;
    if (_onTokenRefreshed) _onTokenRefreshed(newAccess);
    return newAccess;
  } catch {
    return null;
  }
}

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders as Record<string, string>,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });

  if (res.status === 401 && token) {
    // Try refreshing once
    const newAccess = await tryRefresh();
    if (newAccess) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newAccess}` };
      const retry = await fetch(`${API_URL}${endpoint}`, { ...rest, headers: retryHeaders });
      if (retry.ok) {
        if (retry.status === 204) return undefined as T;
        return retry.json();
      }
    }
    // Refresh failed or retry still 401 — force logout
    if (_onForceLogout) _onForceLogout();
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Upload FormData (multipart/form-data) to the API.
 * Do NOT set Content-Type — the browser sets it with the correct boundary.
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: { token?: string; method?: string } = {}
): Promise<T> {
  const { token, method = "POST" } = options;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { method, headers, body: formData });

  if (res.status === 401 && token) {
    const newAccess = await tryRefresh();
    if (newAccess) {
      const retryHeaders = { Authorization: `Bearer ${newAccess}` };
      const retry = await fetch(`${API_URL}${endpoint}`, { method, headers: retryHeaders, body: formData });
      if (retry.ok) {
        if (retry.status === 204) return undefined as T;
        return retry.json();
      }
    }
    if (_onForceLogout) _onForceLogout();
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Parent API ────────────────────────────────────────────────────────────────

import type {
  ParentDashboard,
  ParentChildLink,
  ChildSummary,
  ChildDetail,
  ChildCourseProgress,
  ParentTransaction,
  PaginatedResponse,
  CheckoutResponse,
  ChildInviteInfo,
  InviteAcceptResult,
} from "@/lib/types";

export const parentApi = {
  getDashboard: (token: string) =>
    apiFetch<ParentDashboard>("/parents/dashboard/", { token }),

  getChildren: (token: string) =>
    apiFetch<ChildSummary[]>("/parents/children/", { token }),

  getChild: (token: string, childId: number) =>
    apiFetch<ChildDetail>(`/parents/children/${childId}/`, { token }),

  getChildDashboard: (token: string, childId: number) =>
    apiFetch<ChildDetail>(`/parents/children/${childId}/dashboard/`, { token }),

  getChildCourses: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<ChildCourseProgress>>(
      `/parents/children/${childId}/courses/`,
      { token }
    ),

  getChildCourseDetail: (token: string, childId: number, enrollmentId: number) =>
    apiFetch<ChildCourseProgress>(
      `/parents/children/${childId}/courses/${enrollmentId}/`,
      { token }
    ),

  getChildLiveClasses: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<unknown>>(
      `/parents/children/${childId}/live-classes/`,
      { token }
    ),

  getChildStudyGuides: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<unknown>>(
      `/parents/children/${childId}/study-guides/`,
      { token }
    ),

  getChildCertificates: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<unknown>>(
      `/parents/children/${childId}/certificates/`,
      { token }
    ),

  getChildActivity: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<unknown>>(
      `/parents/children/${childId}/activity/`,
      { token }
    ),

  getLinks: (token: string) =>
    apiFetch<PaginatedResponse<ParentChildLink>>("/parents/links/", { token }),

  requestLink: (token: string, childEmail: string) =>
    apiFetch<{ type: "request" | "invite"; link?: ParentChildLink; message: string }>(
      "/parents/links/request/",
      {
        token,
        method: "POST",
        body: JSON.stringify({ child_email: childEmail }),
      }
    ),

  cancelLink: (token: string, linkId: number) =>
    apiFetch<void>(`/parents/links/${linkId}/cancel/`, {
      token,
      method: "POST",
    }),

  acceptLink: (token: string, linkId: number) =>
    apiFetch<ParentChildLink>(`/parents/links/${linkId}/accept/`, {
      token,
      method: "POST",
    }),

  declineLink: (token: string, linkId: number) =>
    apiFetch<ParentChildLink>(`/parents/links/${linkId}/decline/`, {
      token,
      method: "POST",
    }),

  removeLink: (token: string, linkId: number) =>
    apiFetch<void>(`/parents/links/${linkId}/`, {
      token,
      method: "DELETE",
    }),

  getTransactions: (token: string, childId?: number) => {
    const qs = childId ? `?child=${childId}` : "";
    return apiFetch<PaginatedResponse<ParentTransaction>>(
      `/parents/transactions/${qs}`,
      { token }
    );
  },

  checkout: (
    token: string,
    payload: {
      content_type: "course" | "study_guide" | "live_class";
      content_id: number;
      child_id: number;
    }
  ) =>
    apiFetch<CheckoutResponse>("/payments/checkout/", {
      token,
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ── Child invite API (public — no auth token required) ────────────────────────

export const inviteApi = {
  validate: (token: string) =>
    apiFetch<ChildInviteInfo>(`/parents/invite/${token}/`),

  accept: (
    token: string,
    data: {
      username: string;
      password: string;
      first_name: string;
      last_name: string;
    }
  ) =>
    apiFetch<InviteAcceptResult>(`/parents/invite/${token}/accept/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const childLinkApi = {
  getLinks: (token: string) =>
    apiFetch<PaginatedResponse<ParentChildLink>>("/parents/child/links/", { token }),

  requestLink: (token: string, parentEmail: string) =>
    apiFetch<ParentChildLink>("/parents/child/links/request/", {
      token,
      method: "POST",
      body: JSON.stringify({ parent_email: parentEmail }),
    }),

  acceptLink: (token: string, linkId: number) =>
    apiFetch<ParentChildLink>(`/parents/child/links/${linkId}/accept/`, {
      token,
      method: "POST",
    }),

  declineLink: (token: string, linkId: number) =>
    apiFetch<ParentChildLink>(`/parents/child/links/${linkId}/decline/`, {
      token,
      method: "POST",
    }),

  removeLink: (token: string, linkId: number) =>
    apiFetch<void>(`/parents/child/links/${linkId}/`, {
      token,
      method: "DELETE",
    }),
};

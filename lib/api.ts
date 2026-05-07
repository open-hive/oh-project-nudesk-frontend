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
  AdminTutorPaymentConfig,
  ParentDashboard,
  ParentChildLink,
  ChildSummary,
  ChildDetail,
  ChildCourseProgress,
  Certificate,
  LearningActivityRecord,
  LiveClassRegistration,
  ParentTransaction,
  PaginatedResponse,
  CheckoutResponse,
  ChildInviteInfo,
  InviteAcceptResult,
  StudyGuideAccess,
  SubscriptionPlan,
  TutorDiscovery,
  TutorSubscription,
  TutorPayoutSettings,
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

  enrollChildInCourse: (token: string, childId: number, courseSlug: string) =>
    apiFetch<ChildCourseProgress>(`/parents/children/${childId}/courses/enroll/`, {
      token,
      method: "POST",
      body: JSON.stringify({ course_slug: courseSlug }),
    }),

  getChildCourseDetail: (token: string, childId: number, enrollmentId: number) =>
    apiFetch<ChildCourseProgress>(
      `/parents/children/${childId}/courses/${enrollmentId}/`,
      { token }
    ),

  getChildLiveClasses: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<LiveClassRegistration>>(
      `/parents/children/${childId}/live-classes/`,
      { token }
    ),

  getChildStudyGuides: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<StudyGuideAccess>>(
      `/parents/children/${childId}/study-guides/`,
      { token }
    ),

  getChildCertificates: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<Certificate>>(
      `/parents/children/${childId}/certificates/`,
      { token }
    ),

  getChildActivity: (token: string, childId: number) =>
    apiFetch<PaginatedResponse<LearningActivityRecord>>(
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
      tutor_id: number;
      billing_cycle: "weekly" | "monthly" | "yearly";
      child_id: number;
    }
  ) =>
    apiFetch<CheckoutResponse>("/payments/checkout/", {
      token,
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const paymentApi = {
  getTutorPlan: (tutorId: number) =>
    apiFetch<SubscriptionPlan>(`/payments/tutors/${tutorId}/subscription-plan/`),

  checkout: (
    token: string,
    payload: {
      tutor_id: number;
      billing_cycle: "weekly" | "monthly" | "yearly";
      child_id?: number;
    }
  ) =>
    apiFetch<CheckoutResponse>("/payments/checkout/", {
      token,
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMySubscriptions: (token: string) =>
    apiFetch<PaginatedResponse<TutorSubscription> | TutorSubscription[]>(
      "/payments/subscriptions/",
      { token }
    ),

  cancelSubscription: (token: string, reference: string) =>
    apiFetch<{ detail: string; subscription: TutorSubscription }>(
      `/payments/subscriptions/${reference}/cancel/`,
      { token, method: "POST" }
    ),
};

export const tutorApi = {
  getDiscoveryList: (params?: {
    search?: string;
    subject_area?: string;
    has_pricing?: "true" | "false";
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.subject_area) query.set("subject_area", params.subject_area);
    if (params?.has_pricing) query.set("has_pricing", params.has_pricing);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<TutorDiscovery>>(
      `/tutors/discovery/${qs ? `?${qs}` : ""}`
    );
  },

  getDiscoveryDetail: (tutorId: number) =>
    apiFetch<TutorDiscovery>(`/tutors/discovery/${tutorId}/`),

  getSubscriptionPlan: (token: string) =>
    apiFetch<SubscriptionPlan>("/tutors/subscription-plan/", { token }),

  updateSubscriptionPlan: (
    token: string,
    payload: Partial<SubscriptionPlan>
  ) =>
    apiFetch<SubscriptionPlan>("/tutors/subscription-plan/", {
      token,
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getSubscribers: (token: string) =>
    apiFetch<PaginatedResponse<TutorSubscription> | TutorSubscription[]>(
      "/tutors/subscriptions/",
      { token }
    ),

  getPayoutSettings: (token: string) =>
    apiFetch<TutorPayoutSettings>("/tutors/payout-settings/", { token }),

  updatePayoutSettings: (token: string, payload: Partial<TutorPayoutSettings>) =>
    apiFetch<TutorPayoutSettings>("/tutors/payout-settings/", {
      token,
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  getTutorPaymentConfigs: (
    token: string,
    params?: {
      search?: string;
      configured?: "true" | "false";
      approved?: "true" | "false";
      payout_method?: "bank_transfer" | "mobile_money" | "paypal";
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.configured) query.set("configured", params.configured);
    if (params?.approved) query.set("approved", params.approved);
    if (params?.payout_method) query.set("payout_method", params.payout_method);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<AdminTutorPaymentConfig>>(
      `/admins/payments/configs/${qs ? `?${qs}` : ""}`,
      { token }
    );
  },
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

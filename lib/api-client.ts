import { INDONESIA_REGIONS } from '@/lib/indonesia-regions';
import {
  PracticeConfig,
  Doctor,
  NurseMaster,
  MedicationMaster,
  ProcedureMaster,
  Visit,
  User,
  UserRole,
} from '@/types/rme';

/**
 * API Client for Klinik Backend Integration
 * Configured for endpoint: http://43.129.38.25:30005/auth/login
 */

export const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://privata.nafada.id'
    : 'http://localhost:30005');

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // In browser, always use window.location.origin!
    // On localhost, Next.js rewrites (next.config.ts) proxy /v1, /auth, and /health with ZERO CORS issues!
    // On production (privata.nafada.id), Nginx/Docker handles /v1 and /auth with ZERO CORS issues!
    return window.location.origin;
  }
  let url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL ||
    DEFAULT_BACKEND_URL;
  url = url.replace(/\/+$/, '').replace(/\/api$/, '');
  return url || DEFAULT_BACKEND_URL;
}

export function getFrontendBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://privata.nafada.id'
      : 'http://localhost:3000')
  );
}

export const API_BASE_URL = getApiBaseUrl();

export const STORAGE_AUTH_KEYS = {
  ACCESS_TOKEN: 'rme_access_token',
  REFRESH_TOKEN: 'rme_refresh_token',
};

export const GOOGLE_AUTH_ENDPOINT =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL || `${getApiBaseUrl()}/auth/google`;
export const REGISTER_AUTH_ENDPOINT =
  process.env.NEXT_PUBLIC_REGISTER_AUTH_URL || `${getApiBaseUrl()}/auth/register`;

/**
 * Safely parse a JWT token payload on client-side
 */
export function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Open a centered popup window for Google OAuth login
 */
export function openGoogleOAuthPopup(url: string = GOOGLE_AUTH_ENDPOINT): Window | null {
  if (typeof window === 'undefined') return null;
  const width = 520;
  const height = 640;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2.5);
  const features = `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`;
  return window.open(url, 'GoogleOAuthLogin', features);
}

export interface BackendUser {
  id: string | number;
  name?: string;
  email: string;
  phone?: string | null;
  role?: string;
  nama_role?: string;
  roleId?: string;
  is_get_all_data?: boolean;
  modelHasRoles?: Array<{
    role_id: string;
    model_id: string;
    created_at?: string;
    updated_at?: string;
    Role?: {
      id: string;
      name: string;
      guard_name?: string;
    };
  }>;
  created_at?: string;
  createdAt?: string;
  avatarUrl?: string;
  picture?: string;
  [key: string]: any;
}

export function normalizeGoogleAuthResponse(response: any): {
  token: string;
  refreshToken: string;
  user: BackendUser;
  session?: any;
} | null {
  if (!response) return null;
  const data = response.data || response;
  const token = data.token || data.access_token || data.accessToken || response.token || response.access_token || '';
  const refreshToken = data.refreshToken || data.refresh_token || response.refreshToken || response.refresh_token || '';
  const user = data.user || response.user;
  const session = data.session || response.session;

  if (!token) return null;

  return {
    token,
    refreshToken,
    user: user || {
      id: 'google-user',
      name: 'Pengguna Google',
      email: 'user@google.com',
      role: 'ADMIN',
    },
    session,
  };
}

export interface BackendLoginResponse {
  token: string;
  access_token: string;
  accessToken: string;
  refreshToken: string;
  refresh_token: string;
  user: BackendUser;
}

export interface ApiResponse<T = unknown> {
  response_code?: number;
  response_message?: string;
  responseResult?: boolean;
  result?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  error?: string | string[];
  errors?: Array<{ field: string; messages: string[] }>;
  errors_validation?: Array<{ field: string; messages: string[] }>;
  timestamp?: string;
}

/**
 * Health check to verify backend connectivity
 */
export async function checkBackendHealth(): Promise<{
  online: boolean;
  message?: string;
  data?: unknown;
}> {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { online: true, message: 'Server Online' };
    }
    return { online: false, message: `Status server: HTTP ${res.status}` };
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'AbortError') {
      return { online: false, message: 'Koneksi ke backend timeout (3.5 detik)' };
    }
    return { online: false, message: 'Backend tidak terjangkau' };
  }
}

/**
 * Login using backend API endpoint POST /auth/login
 */
export async function loginWithBackend(
  email: string,
  password: string
): Promise<{
  success: boolean;
  data?: BackendLoginResponse;
  error?: string;
  isNetworkError?: boolean;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/auth/login`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json: ApiResponse<any> = await res.json();

    const isSuccess =
      res.ok &&
      (json.responseResult === true ||
        json.result === true ||
        json.response_code === 200 ||
        json.success === true) &&
      json.data;

    if (isSuccess) {
      const rawData = json.data;
      const token = rawData.token || rawData.access_token || rawData.accessToken || '';
      const refreshToken = rawData.refreshToken || rawData.refresh_token || '';

      const normalizedData: BackendLoginResponse = {
        token,
        access_token: token,
        accessToken: token,
        refreshToken,
        refresh_token: refreshToken,
        user: rawData.user || {
          id: 'admin',
          name: 'Admin',
          email: email.trim(),
          role: 'ADMIN',
        },
      };

      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN, token);
        localStorage.setItem(STORAGE_AUTH_KEYS.REFRESH_TOKEN, refreshToken);
      }

      return { success: true, data: normalizedData };
    }

    // Handle 401 Unauthorized / Invalid credentials
    if (res.status === 401 || json.response_code === 401) {
      let errText = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
      if (Array.isArray(json.error) && json.error.length > 0) {
        if (json.error[0].toLowerCase().includes('credential')) {
          errText = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
        } else {
          errText = json.error[0];
        }
      }
      return { success: false, error: errText };
    }

    // Handle 422 Unprocessable Entity
    if (res.status === 422 || json.response_code === 422) {
      const valErrors = json.errors_validation || json.errors;
      if (valErrors && valErrors.length > 0) {
        const fieldMsgs = valErrors
          .map((e) => `${e.messages?.join(', ') || e.field}`)
          .join('; ');
        return { success: false, error: fieldMsgs || 'Validasi data login gagal.' };
      }
    }

    const defaultMsg =
      (Array.isArray(json.error) ? json.error.join(', ') : json.error) ||
      json.response_message ||
      json.message ||
      `Login gagal dengan kode HTTP ${res.status}`;

    return {
      success: false,
      error: defaultMsg,
    };
  } catch (err: unknown) {
    const error = err as { name?: string };
    console.warn('[API Client] Backend login failed with error:', err);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      isNetworkError: true,
      error: isTimeout
        ? 'Waktu permintaan habis (timeout). Server backend lambat merespons.'
        : `Tidak dapat menghubungi server backend di ${DEFAULT_BACKEND_URL}.`,
    };
  }
}

/**
 * Register a new user using backend API endpoint POST /auth/register
 */
export async function registerWithBackend(
  name: string,
  email: string,
  password: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/auth/register`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    });

    const json = await res.json();

    const isSuccess =
      res.ok &&
      (json.responseResult === true ||
        json.result === true ||
        json.response_code === 201 ||
        json.response_code === 200 ||
        json.success === true);

    if (isSuccess) {
      return {
        success: true,
        data: json.data,
        message: json.response_message || 'Registrasi berhasil sebagai admin tenant',
      };
    }

    // 409 Conflict (Email already registered)
    if (res.status === 409 || json.response_code === 409) {
      const errMsg = Array.isArray(json.error) ? json.error[0] : (json.error || 'Email sudah terdaftar');
      return {
        success: false,
        error: errMsg || 'Email ini sudah terdaftar di sistem. Silakan gunakan email lain atau langsung masuk.',
      };
    }

    // 422 Validation Error
    if (res.status === 422 || json.response_code === 422) {
      const valErrors = json.errors_validation || json.errors;
      if (valErrors && valErrors.length > 0) {
        const fieldMsgs = valErrors
          .map((e: any) => `${e.messages?.join(', ') || e.field}`)
          .join('; ');
        return { success: false, error: fieldMsgs || 'Validasi data pendaftaran gagal.' };
      }
    }

    const defaultMsg =
      (Array.isArray(json.error) ? json.error.join(', ') : json.error) ||
      json.response_message ||
      json.message ||
      `Registrasi gagal dengan status HTTP ${res.status}`;

    return {
      success: false,
      error: defaultMsg,
    };
  } catch (err: any) {
    console.warn('[API Client] Backend register failed with error:', err);
    return {
      success: false,
      error: 'Tidak dapat terhubung ke server backend untuk pendaftaran.',
    };
  }
}

/**
 * Fetch authenticated user profile using GET /auth/profile
 */
export async function fetchUserProfile(token: string): Promise<BackendUser | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/auth/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json.data?.user || json.data || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper to get authorization headers for future backend endpoints
 */
export const REMOTE_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsIm5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoiYWRtaW5AZ21haWwuY29tIiwidXNlcl9uYW1lIjoiYWRtaW5AZ21haWwuY29tIiwiaWRfdXNlciI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmQiLCJuYW1hX3JvbGUiOiJhZG1pbiIsImlzX2dldF9hbGxfZGF0YSI6dHJ1ZSwiaWRfZ3VkYW5nIjpudWxsLCJpZF9qYWJhdGFuIjpudWxsLCJ0aW1lem9uZV9uYW1lIjpudWxsLCJzZXNzaW9uSWQiOiJiODFmMTIwMi1lMzk2LTQwZjctOTYzMy01ZThlNDEwMWZkZTEiLCJkZXZpY2VfZmluZ2VycHJpbnQiOiIxMDQ4OGI5N2QxMTE1YTgzMjUwOTlmOTVmYTRjZWRjZDE0YmYyNThmZTZlMDVkNDYwYjcxNDM4YjIwYTQ1YjgwIiwidGVuYW50X2lkIjpudWxsLCJpYXQiOjE3ODk2MDk3MzMsImV4cCI6MTc4OTY5NjEzM30.UCdLnh3qo-8RqUkAFOoHWnVce59oBtvXYCV_VQ1ReAM';

export const LOCAL_DEV_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsIm5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoiYWRtaW5AZ21haWwuY29tIiwidXNlcl9uYW1lIjoiYWRtaW5AZ21haWwuY29tIiwiaWRfdXNlciI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmQiLCJuYW1hX3JvbGUiOiJhZG1pbiIsImlzX2dldF9hbGxfZGF0YSI6dHJ1ZSwiaWRfZ3VkYW5nIjpudWxsLCJpZF9qYWJhdGFuIjpudWxsLCJ0aW1lem9uZV9uYW1lIjpudWxsLCJzZXNzaW9uSWQiOiJkMzBmMDA4NS1jYjcxLTQ0YTAtOWRhMy0xNjIyZWI0OGE4MGIiLCJkZXZpY2VfZmluZ2VycHJpbnQiOiJhYWUwMzdhZDM1MmE3YzkzNDZhMmNmYmExMTVmMTZhN2QwNDlmOGI2YTYxN2NmZjYwNmEzZWNlZDhkMmMxZmQwIiwidGVuYW50X2lkIjpudWxsLCJpYXQiOjE3ODk2MzA1MDgsImV4cCI6MTc5MjIyMjUwOH0.DUjUSa-g-WfCdBdo2SBBXpHf2h0jpTfu1w9oDIfuPCM';

export const PROD_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsIm5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoiYWRtaW5AZ21haWwuY29tIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJpZF91c2VyIjoiZjFlMmQzYzQtYjVhNi03OTg4LTk3MGQtMWUyZjNhNGI1YzZkIiwiaWRfcm9sZSI6ImExYjJjM2Q0LWU1ZjYtN2E4Yi05YzBkLTFlMmYzYTRiNWM2ZCIsIm5hbWFfcm9sZSI6ImFkbWluIiwiaXNfZ2V0X2FsbF9kYXRhIjp0cnVlLCJpYXQiOjE3ODk2NTI4NjYsImV4cCI6MTgyMTE4ODg2Nn0.AeoUm383N2-1NSAz275sI-ydS-Asf0KdzzxM3iTSb8o';

export const USER_SUBMITTED_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsIm5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoiYWRtaW5AZ21haWwuY29tIiwidXNlcl9uYW1lIjoiYWRtaW5AZ21haWwuY29tIiwiaWRfdXNlciI6ImYxZTJkM2M0LWI1YTYtNzk4OC05NzBkLTFlMmYzYTRiNWM2ZCIsImlkX3BpY19jdXN0b21lciI6bnVsbCwiaWRfa2FyeWF3YW4iOm51bGwsImlkX3JvbGUiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmQiLCJuYW1hX3JvbGUiOiJhZG1pbiIsImlzX2dldF9hbGxfZGF0YSI6dHJ1ZSwiaWRfZ3VkYW5nIjpudWxsLCJpZF9qYWJhdGFuIjpudWxsLCJ0aW1lem9uZV9uYW1lIjpudWxsLCJzZXNzaW9uSWQiOiJkMzBmMDA4NS1jYjcxLTQ0YTAtOWRhMy0xNjIyZWI0OGE4MGIiLCJkZXZpY2VfZmluZ2VycHJpbnQiOiJhYWUwMzdhZDM1MmE3YzkzNDZhMmNmYmExMTVmMTZhN2QwNDlmOGI2YTYxN2NmZjYwNmEzZWNlZDhkMmMxZmQwIiwidGVuYW50X2lkIjpudWxsLCJpYXQiOjE3ODk2MzA1MDgsImV4cCI6MTc5MjIyMjUwOH0.DUjUSa-g-WfCdBdo2SBBXpHf2h0jpTfu1w9oDIfuPCM';

export const DEFAULT_ADMIN_TOKEN = USER_SUBMITTED_ADMIN_TOKEN || PROD_ADMIN_TOKEN;

export const KNOWN_ADMIN_TOKENS = [
  USER_SUBMITTED_ADMIN_TOKEN,
  REMOTE_ADMIN_TOKEN,
  LOCAL_DEV_ADMIN_TOKEN,
  PROD_ADMIN_TOKEN,
];

export function getActiveAuthToken(): string {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_AUTH_KEYS.ACCESS_TOKEN);
    if (token && token.trim() && token !== 'undefined' && token !== 'null') {
      return token.trim();
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return LOCAL_DEV_ADMIN_TOKEN;
    }
    return PROD_ADMIN_TOKEN;
  }
  const isDev = process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_API_URL?.includes('privata.nafada.id');
  return isDev ? (USER_SUBMITTED_ADMIN_TOKEN || LOCAL_DEV_ADMIN_TOKEN) : PROD_ADMIN_TOKEN;
}

/**
 * Helper to get authorization headers for backend endpoints
 */
/**
 * Fetch currently logged in user's tenant profile (GET /v1/saas/my-tenant)
 */
export async function fetchBackendMyTenant(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/saas/my-tenant`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || json };
    }
    return { success: false, error: json?.response_message || 'Gagal memuat profil tenant' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal terhubung ke server backend' };
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getActiveAuthToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    accept: '*/*',
  };
  if (typeof window !== 'undefined') {
    const activeTenantId =
      localStorage.getItem('rme_active_tenant_id_v4') ||
      localStorage.getItem('rme_active_tenant_id');
    if (
      activeTenantId &&
      activeTenantId !== 'undefined' &&
      activeTenantId !== 'null' &&
      !activeTenantId.startsWith('tenant-')
    ) {
      headers['X-Tenant-Id'] = activeTenantId;
    }
  }
  return headers;
}

/**
 * Helper to automatically sync Google authenticated user with backend (if online)
 */
export async function loginOrRegisterGoogleBackend(
  name: string,
  email: string
): Promise<{
  success: boolean;
  token?: string;
  user?: BackendUser;
}> {
  try {
    const fallbackPassword = `GAuth_${email.split('@')[0]}_2026!`;

    // 1. First attempt to log in
    const loginRes = await loginWithBackend(email, fallbackPassword);
    if (loginRes.success && loginRes.data) {
      return {
        success: true,
        token: loginRes.data.token,
        user: loginRes.data.user,
      };
    }

    // 2. If not registered, attempt to register
    const regRes = await registerWithBackend(name, email, fallbackPassword);
    if (regRes.success) {
      const afterRegLogin = await loginWithBackend(email, fallbackPassword);
      if (afterRegLogin.success && afterRegLogin.data) {
        return {
          success: true,
          token: afterRegLogin.data.token,
          user: afterRegLogin.data.user,
        };
      }
    }
  } catch (err) {
    console.warn('[API Client] Google backend sync warning (offline fallback):', err);
  }

  return { success: false };
}



/**
 * Payload interface for POST /v1/patients endpoint
 */
export interface BackendPatientPayload {
  tenant_id?: string;
  no_rm?: string;
  nik: string;
  name: string;
  gender: 'L' | 'P';
  birth_date: string; // YYYY-MM-DD
  phone?: string;
  street_address?: string;
  rt_rw?: string;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  postal_code?: string;
  blood_type?: 'A' | 'B' | 'AB' | 'O' | '-' | string;
  allergies?: string[];
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
    relation?: string;
    [key: string]: any;
  } | Record<string, any>;
}

export interface BackendPatientResponse {
  success: boolean;
  data?: any;
  error?: string;
  response_code?: number;
}

/**
 * Register a new patient to backend API (POST /v1/patients)
 */
export async function createBackendPatient(
  payload: BackendPatientPayload
): Promise<BackendPatientResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/patients`;
    const headers: Record<string, string> = { ...(getAuthHeaders() as Record<string, string>) };

    // Strip tenant_id from body payload because NestJS ValidationPipe on server
    // has whitelist: true, forbidNonWhitelisted: true and extracts tenant_id securely
    // from the JWT token / X-Tenant-Id header. Sending tenant_id in body causes 422: "property tenant_id should not exist".
    const { tenant_id, ...cleanPayload } = payload as any;
    if (tenant_id && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = tenant_id;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanPayload),
    });

    const json = await res.json().catch(() => null);

    if (
      res.ok &&
      (json?.responseResult === true ||
        json?.response_code === 200 ||
        json?.response_code === 201 ||
        res.status === 200 ||
        res.status === 201)
    ) {
      return {
        success: true,
        data: json?.data || json,
        response_code: json?.response_code || res.status,
      };
    }

    let errorMsg = json?.response_message || json?.message;
    if (Array.isArray(json?.errors_validation) && json.errors_validation.length > 0) {
      const validationDetails = json.errors_validation
        .map((e: any) => (Array.isArray(e?.messages) ? e.messages.join('; ') : e?.message || e))
        .filter(Boolean)
        .join(', ');
      if (validationDetails) {
        errorMsg = `${errorMsg || 'Validasi Gagal'}: ${validationDetails}`;
      }
    }
    if (!errorMsg) {
      errorMsg = json?.error || `Gagal mendaftarkan pasien ke server (HTTP ${res.status})`;
    }

    return {
      success: false,
      error: errorMsg,
      data: json?.data || json,
      response_code: json?.response_code || res.status,
    };
  } catch (err: any) {
    console.error('[createBackendPatient] Request error:', err);
    return {
      success: false,
      error: err?.message || 'Gagal terhubung ke server backend.',
    };
  }
}

/**
 * Update patient in backend (PUT /v1/patients/:id)
 */
export async function updateBackendPatient(
  id: string,
  payload: Partial<BackendPatientPayload>
): Promise<BackendPatientResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/patients/${id}`;
    const headers: Record<string, string> = { ...(getAuthHeaders() as Record<string, string>) };

    // Strip tenant_id from body payload to satisfy ValidationPipe
    const { tenant_id, ...cleanPayload } = payload as any;
    if (tenant_id && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = tenant_id;
    }

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(cleanPayload),
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return {
        success: true,
        data: json?.data || json,
        response_code: json?.response_code || res.status,
      };
    }

    let errorMsg = json?.response_message || json?.message;
    if (Array.isArray(json?.errors_validation) && json.errors_validation.length > 0) {
      const validationDetails = json.errors_validation
        .map((e: any) => (Array.isArray(e?.messages) ? e.messages.join('; ') : e?.message || e))
        .filter(Boolean)
        .join(', ');
      if (validationDetails) {
        errorMsg = `${errorMsg || 'Validasi Gagal'}: ${validationDetails}`;
      }
    }

    return {
      success: false,
      error: errorMsg || json?.error || 'Gagal memperbarui data pasien',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal terhubung ke server backend.',
    };
  }
}

/**
 * Delete patient from backend (DELETE /v1/patients/:id)
 */
export async function deleteBackendPatient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/patients/${id}`;
    const headers = getAuthHeaders();

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true };
    }

    return {
      success: false,
      error: json?.response_message || 'Gagal menghapus data pasien',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal terhubung ke server backend.',
    };
  }
}


export interface BackendPatientItem {
  id: string;
  no_rm?: string;
  noRM?: string;
  nik: string;
  name: string;
  gender: 'L' | 'P';
  birth_date: string;
  birthDate?: string;
  phone?: string | null;
  street_address?: string | null;
  rt_rw?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postal_code?: string | null;
  blood_type?: string | null;
  allergies?: string[];
  emergency_contact?: any;
  tenant_id?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FetchPatientsParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface FetchPatientsResult {
  success: boolean;
  data: BackendPatientItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

/**
 * Fetch patient list from backend: GET /v1/patients
 */
export async function fetchBackendPatients(
  params?: FetchPatientsParams
): Promise<FetchPatientsResult> {
  try {
    const baseUrl = getApiBaseUrl();
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const endpoint = `${baseUrl}/v1/patients${queryString}`;
    const headers = getAuthHeaders();

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const resultData = json?.data || {};
      const patientsList: BackendPatientItem[] = Array.isArray(resultData.data)
        ? resultData.data
        : Array.isArray(resultData)
        ? resultData
        : [];

      return {
        success: true,
        data: patientsList,
        total: resultData.total ?? patientsList.length,
        page: resultData.page ?? 1,
        limit: resultData.limit ?? 10,
        totalPages: resultData.totalPages ?? 1,
      };
    }

    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      error: json?.response_message || 'Gagal mengambil data pasien dari server backend.',
    };
  } catch (err: any) {
    console.error('[fetchBackendPatients] Request error:', err);
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      error: err?.message || 'Gagal terhubung ke backend server.',
    };
  }
}

/**
 * Map backend patient item to frontend Patient model
 */
export function mapBackendPatientToPatient(bp: BackendPatientItem): any {
  // Calculate age from birth_date
  let age = 30;
  if (bp.birth_date) {
    const birth = new Date(bp.birth_date);
    const now = new Date();
    age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
  }

  // Assemble full address string
  const addressParts = [
    bp.street_address?.trim(),
    bp.rt_rw?.trim() ? `RT/RW ${bp.rt_rw.trim()}` : null,
    bp.subdistrict ? `Kel. ${bp.subdistrict}` : null,
    bp.district ? `Kec. ${bp.district}` : null,
    bp.city,
    bp.province,
    bp.postal_code ? `Kode Pos ${bp.postal_code.trim()}` : null,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '-';

  return {
    id: bp.id,
    noRM: bp.no_rm || bp.noRM || 'RM-000000',
    nik: bp.nik || '',
    name: bp.name,
    gender: (bp.gender === 'P' ? 'P' : 'L') as 'L' | 'P',
    birthDate: bp.birth_date || '',
    age: Math.max(0, age),
    phone: bp.phone || '',
    address: fullAddress,
    streetAddress: bp.street_address || '',
    rtRw: bp.rt_rw || '',
    province: bp.province || '',
    city: bp.city || '',
    district: bp.district || '',
    subdistrict: bp.subdistrict || '',
    postalCode: bp.postal_code || '',
    bloodType: (bp.blood_type || '-') as any,
    allergies: Array.isArray(bp.allergies) ? bp.allergies : [],
    emergencyContact: bp.emergency_contact
      ? {
          name: bp.emergency_contact.name || '',
          phone: bp.emergency_contact.phone || '',
          relationship: bp.emergency_contact.relationship || bp.emergency_contact.relation || 'Keluarga',
        }
      : undefined,
    createdAt: bp.created_at || new Date().toISOString(),
    updatedAt: bp.updated_at || new Date().toISOString(),
    isFromBackend: true,
  };
}

/**
 * Backend Province (Wilayah Provinsi) Models & API Integration
 * Endpoint: GET /v1/wilayah/provinsi
 */
export interface BackendProvinceItem {
  kode: string;
  nama: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FetchProvincesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchProvincesResult {
  success: boolean;
  data: BackendProvinceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  source?: 'backend' | 'cache' | 'local';
}

// ─────────────────────────────────────────────────────────────
// Local Regional Fallback Helpers (Guarantee UI Never Breaks)
// ─────────────────────────────────────────────────────────────

export function getLocalProvincesFallbackResult(params?: FetchProvincesParams): FetchProvincesResult {
  let list: BackendProvinceItem[] = INDONESIA_REGIONS.map((r) => ({
    kode: r.code || '',
    nama: r.province,
  }));
  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((p) => p.nama.toLowerCase().includes(q) || p.kode.includes(q));
  }
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);
  return {
    success: true,
    data: paginated,
    total,
    page,
    limit,
    totalPages,
    source: 'local',
  };
}

export function getLocalKabupatenKotaFallbackResult(params?: FetchKabupatenKotaParams): FetchKabupatenKotaResult {
  const provCode = params?.kode_provinsi?.trim();
  const prov = INDONESIA_REGIONS.find((r) => r.code === provCode || r.province.toLowerCase() === provCode?.toLowerCase());
  let list: BackendKabupatenKotaItem[] = (prov?.cities || []).map((c) => ({
    kode: c.code || '',
    kode_provinsi: prov?.code || provCode || '',
    nama: c.name,
    tipe: c.name.toLowerCase().startsWith('kota') ? 'kota' : 'kabupaten',
  }));
  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((c) => c.nama.toLowerCase().includes(q) || c.kode.includes(q));
  }
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);
  return {
    success: true,
    data: paginated,
    total,
    page,
    limit,
    totalPages,
    source: 'local',
  };
}

export function getLocalKecamatanFallbackResult(params?: FetchKecamatanParams): FetchKecamatanResult {
  const regCode = params?.kode_kabupaten_kota?.trim();
  let districts: { code?: string; name: string }[] = [];
  for (const prov of INDONESIA_REGIONS) {
    const city = prov.cities.find((c) => c.code === regCode || c.name.toLowerCase() === regCode?.toLowerCase());
    if (city) {
      districts = city.districts || [];
      break;
    }
  }
  let list: BackendKecamatanItem[] = districts.map((d) => ({
    kode: d.code || '',
    kode_kabupaten_kota: regCode || '',
    nama: d.name,
  }));
  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((k) => k.nama.toLowerCase().includes(q) || k.kode.includes(q));
  }
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);
  return {
    success: true,
    data: paginated,
    total,
    page,
    limit,
    totalPages,
    source: 'local',
  };
}

export function getLocalKelurahanFallbackResult(params?: FetchKelurahanParams): FetchKelurahanResult {
  const distCode = params?.kode_kecamatan?.trim();
  let subdistricts: string[] = [];
  for (const prov of INDONESIA_REGIONS) {
    for (const city of prov.cities) {
      const dist = city.districts.find((d) => d.code === distCode || d.name.toLowerCase() === distCode?.toLowerCase());
      if (dist) {
        subdistricts = dist.subdistricts || [];
        break;
      }
    }
    if (subdistricts.length > 0) break;
  }
  let list: BackendKelurahanItem[] = subdistricts.map((s, idx) => ({
    kode: `${distCode || ''}${String(idx + 1).padStart(3, '0')}`,
    kode_kecamatan: distCode || '',
    nama: s,
    tipe: 'kelurahan',
  }));
  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((k) => k.nama.toLowerCase().includes(q) || k.kode.includes(q));
  }
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);
  return {
    success: true,
    data: paginated,
    total,
    page,
    limit,
    totalPages,
    source: 'local',
  };
}

/**
 * Fetch province list from backend API: GET /v1/wilayah/provinsi
 */
export async function fetchBackendProvinces(
  params?: FetchProvincesParams
): Promise<FetchProvincesResult> {
  try {
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.page) query.set('page', String(params.page));
    const limit = params?.limit ?? 100;
    query.set('limit', String(limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/wilayah/provinsi${queryString}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getActiveAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const resultData = json?.data || {};
      const provincesList: BackendProvinceItem[] = Array.isArray(resultData.data)
        ? resultData.data
        : Array.isArray(resultData)
        ? resultData
        : [];

      if (provincesList.length > 0) {
        return {
          success: true,
          data: provincesList,
          total: resultData.total ?? provincesList.length,
          page: resultData.page ?? 1,
          limit: resultData.limit ?? provincesList.length,
          totalPages: resultData.totalPages ?? 1,
          source: 'backend',
        };
      }
    }

    return getLocalProvincesFallbackResult(params);
  } catch (err: any) {
    console.warn('[fetchBackendProvinces] Request error, using local fallback:', err?.message);
    return getLocalProvincesFallbackResult(params);
  }
}

/**
 * Backend Regency / City (Wilayah Kabupaten & Kota) Models & API Integration
 * Endpoint: GET /v1/wilayah/kabupaten-kota
 */
export interface BackendKabupatenKotaItem {
  kode: string;
  kode_provinsi: string;
  nama: string;
  tipe?: 'kabupaten' | 'kota' | string;
  created_at?: string;
  updated_at?: string;
  provinsi?: {
    kode: string;
    nama: string;
  };
  [key: string]: any;
}

export interface FetchKabupatenKotaParams {
  search?: string;
  kode_provinsi?: string;
  tipe?: string;
  page?: number;
  limit?: number;
}

export interface FetchKabupatenKotaResult {
  success: boolean;
  data: BackendKabupatenKotaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  source?: 'backend' | 'cache' | 'local';
}

/**
 * Fetch kabupaten / kota list from backend API: GET /v1/wilayah/kabupaten-kota
 */
export async function fetchBackendKabupatenKota(
  params?: FetchKabupatenKotaParams
): Promise<FetchKabupatenKotaResult> {
  try {
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.kode_provinsi && params.kode_provinsi.trim()) {
      query.set('kode_provinsi', params.kode_provinsi.trim());
    }
    if (params?.tipe && params.tipe.trim() && params.tipe !== 'ALL') {
      query.set('tipe', params.tipe.trim());
    }
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/wilayah/kabupaten-kota${queryString}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getActiveAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const resultData = json?.data || {};
      const regenciesList: BackendKabupatenKotaItem[] = Array.isArray(resultData.data)
        ? resultData.data
        : Array.isArray(resultData)
        ? resultData
        : [];

      if (regenciesList.length > 0) {
        return {
          success: true,
          data: regenciesList,
          total: resultData.total ?? regenciesList.length,
          page: resultData.page ?? 1,
          limit: resultData.limit ?? regenciesList.length,
          totalPages: resultData.totalPages ?? 1,
          source: 'backend',
        };
      }
    }

    return getLocalKabupatenKotaFallbackResult(params);
  } catch (err: any) {
    console.warn('[fetchBackendKabupatenKota] Request error, using local fallback:', err?.message);
    return getLocalKabupatenKotaFallbackResult(params);
  }
}

/**
 * Backend District (Wilayah Kecamatan) Models & API Integration
 * Endpoint: GET /v1/wilayah/kecamatan
 */
export interface BackendKecamatanItem {
  kode: string;
  kode_kabupaten_kota: string;
  nama: string;
  created_at?: string;
  updated_at?: string;
  kabupaten_kota?: {
    kode: string;
    nama: string;
  };
  [key: string]: any;
}

export interface FetchKecamatanParams {
  search?: string;
  kode_kabupaten_kota?: string;
  page?: number;
  limit?: number;
}

export interface FetchKecamatanResult {
  success: boolean;
  data: BackendKecamatanItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  source?: 'backend' | 'cache' | 'local';
}

/**
 * Fetch kecamatan list from backend API: GET /v1/wilayah/kecamatan
 */
export async function fetchBackendKecamatan(
  params?: FetchKecamatanParams
): Promise<FetchKecamatanResult> {
  try {
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.kode_kabupaten_kota && params.kode_kabupaten_kota.trim()) {
      query.set('kode_kabupaten_kota', params.kode_kabupaten_kota.trim());
    }
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/wilayah/kecamatan${queryString}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getActiveAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const resultData = json?.data || {};
      const kecamatanList: BackendKecamatanItem[] = Array.isArray(resultData.data)
        ? resultData.data
        : Array.isArray(resultData)
        ? resultData
        : [];

      if (kecamatanList.length > 0) {
        return {
          success: true,
          data: kecamatanList,
          total: resultData.total ?? kecamatanList.length,
          page: resultData.page ?? 1,
          limit: resultData.limit ?? kecamatanList.length,
          totalPages: resultData.totalPages ?? 1,
          source: 'backend',
        };
      }
    }

    return getLocalKecamatanFallbackResult(params);
  } catch (err: any) {
    console.warn('[fetchBackendKecamatan] Request error, using local fallback:', err?.message);
    return getLocalKecamatanFallbackResult(params);
  }
}

/**
 * Backend Village / Sub-district (Wilayah Kelurahan & Desa) Models & API Integration
 * Endpoint: GET /v1/wilayah/kelurahan
 */
export interface BackendKelurahanItem {
  kode: string;
  kode_kecamatan: string;
  nama: string;
  tipe?: 'kelurahan' | 'desa' | string;
  kode_pos?: string | null;
  created_at?: string;
  updated_at?: string;
  kecamatan?: {
    kode: string;
    nama: string;
  };
  [key: string]: any;
}

export interface FetchKelurahanParams {
  search?: string;
  kode_kecamatan?: string;
  tipe?: string;
  page?: number;
  limit?: number;
}

export interface FetchKelurahanResult {
  success: boolean;
  data: BackendKelurahanItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  source?: 'backend' | 'cache' | 'local';
}

/**
 * Fetch kelurahan list from backend API: GET /v1/wilayah/kelurahan
 */
export async function fetchBackendKelurahan(
  params?: FetchKelurahanParams
): Promise<FetchKelurahanResult> {
  try {
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.kode_kecamatan && params.kode_kecamatan.trim()) {
      query.set('kode_kecamatan', params.kode_kecamatan.trim());
    }
    if (params?.tipe && params.tipe.trim() && params.tipe !== 'ALL') {
      query.set('tipe', params.tipe.trim());
    }
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/wilayah/kelurahan${queryString}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getActiveAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const resultData = json?.data || {};
      const kelurahanList: BackendKelurahanItem[] = Array.isArray(resultData.data)
        ? resultData.data
        : Array.isArray(resultData)
        ? resultData
        : [];

      if (kelurahanList.length > 0) {
        return {
          success: true,
          data: kelurahanList,
          total: resultData.total ?? kelurahanList.length,
          page: resultData.page ?? 1,
          limit: resultData.limit ?? kelurahanList.length,
          totalPages: resultData.totalPages ?? 1,
          source: 'backend',
        };
      }
    }

    return getLocalKelurahanFallbackResult(params);
  } catch (err: any) {
    console.warn('[fetchBackendKelurahan] Request error, using local fallback:', err?.message);
    return getLocalKelurahanFallbackResult(params);
  }
}

// ==========================================
// PRACTICE CONFIG BACKEND API (v1/config/practice)
// ==========================================
export async function fetchBackendPracticeConfig(): Promise<{
  success: boolean;
  data?: Partial<PracticeConfig>;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/config/practice`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const d = json?.data || {};
      const mapped: Partial<PracticeConfig> = {};
      if (d.practice_name !== undefined) mapped.practiceName = d.practice_name;
      if (d.subtitle !== undefined) mapped.subtitle = d.subtitle;
      if (d.doctor_name !== undefined) mapped.doctorName = d.doctor_name;
      if (d.sip !== undefined) mapped.sip = d.sip;
      if (d.address !== undefined) mapped.address = d.address;
      if (d.phone !== undefined) mapped.phone = d.phone;
      if (d.email !== undefined) mapped.email = d.email;
      if (d.default_consultation_fee !== undefined) mapped.defaultConsultationFee = Number(d.default_consultation_fee);
      if (d.app_mode !== undefined) mapped.appMode = d.app_mode;
      if (d.active_doctor_id !== undefined) mapped.activeDoctorId = d.active_doctor_id;
      if (d.logo_url !== undefined) mapped.logoUrl = d.logo_url;
      if (d.letterhead_url !== undefined) mapped.letterheadUrl = d.letterhead_url;
      if (d.invoice_header_mode !== undefined) mapped.invoiceHeaderMode = d.invoice_header_mode;
      if (d.invoice_city !== undefined) mapped.invoiceCity = d.invoice_city;
      if (d.invoice_cashier_title !== undefined) mapped.invoiceCashierTitle = d.invoice_cashier_title;
      if (d.invoice_notes !== undefined) mapped.invoiceNotes = d.invoice_notes;
      if (d.invoice_bank_info !== undefined) mapped.invoiceBankInfo = d.invoice_bank_info;
      if (d.invoice_show_stamp !== undefined) mapped.invoiceShowStamp = d.invoice_show_stamp;
      if (d.invoice_stamp_url !== undefined) mapped.invoiceStampUrl = d.invoice_stamp_url;
      if (d.invoice_signature_url !== undefined) mapped.invoiceSignatureUrl = d.invoice_signature_url;

      return { success: true, data: mapped };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil konfigurasi faskes' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching practice config' };
  }
}

export async function updateBackendPracticeConfig(cfg: Partial<PracticeConfig>): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/config/practice`;
    const headers = getAuthHeaders();
    const body: Record<string, any> = {};
    if (cfg.practiceName !== undefined) body.practice_name = cfg.practiceName;
    if (cfg.subtitle !== undefined) body.subtitle = cfg.subtitle;
    if (cfg.doctorName !== undefined) body.doctor_name = cfg.doctorName;
    if (cfg.sip !== undefined) body.sip = cfg.sip;
    if (cfg.address !== undefined) body.address = cfg.address;
    if (cfg.phone !== undefined) body.phone = cfg.phone;
    if (cfg.email !== undefined) body.email = cfg.email;
    if (cfg.defaultConsultationFee !== undefined) body.default_consultation_fee = cfg.defaultConsultationFee;
    if (cfg.appMode !== undefined) body.app_mode = cfg.appMode;
    if (cfg.activeDoctorId !== undefined) body.active_doctor_id = cfg.activeDoctorId;
    if (cfg.logoUrl !== undefined) body.logo_url = cfg.logoUrl;
    if (cfg.letterheadUrl !== undefined) body.letterhead_url = cfg.letterheadUrl;
    if (cfg.invoiceHeaderMode !== undefined) body.invoice_header_mode = cfg.invoiceHeaderMode;
    if (cfg.invoiceCity !== undefined) body.invoice_city = cfg.invoiceCity;
    if (cfg.invoiceCashierTitle !== undefined) body.invoice_cashier_title = cfg.invoiceCashierTitle;
    if (cfg.invoiceNotes !== undefined) body.invoice_notes = cfg.invoiceNotes;
    if (cfg.invoiceBankInfo !== undefined) body.invoice_bank_info = cfg.invoiceBankInfo;
    if (cfg.invoiceShowStamp !== undefined) body.invoice_show_stamp = cfg.invoiceShowStamp;
    if (cfg.invoiceStampUrl !== undefined) body.invoice_stamp_url = cfg.invoiceStampUrl;
    if (cfg.invoiceSignatureUrl !== undefined) body.invoice_signature_url = cfg.invoiceSignatureUrl;

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal menyimpan konfigurasi faskes' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating practice config' };
  }
}

// ==========================================
// DOCTORS BACKEND API (v1/doctors)
// ==========================================
export function mapBackendDoctorToDoctor(d: any): Doctor {
  const scheduleStartTime = d.schedule_start_time || d.scheduleStartTime || '08:00';
  const scheduleEndTime = d.schedule_end_time || d.scheduleEndTime || '14:00';
  return {
    id: d.id,
    name: d.name,
    sip: d.sip,
    strNumber: d.str_number || d.strNumber,
    nik: d.nik,
    specialty: d.specialty || 'Dokter Umum',
    ihsPractitionerId: d.ihs_practitioner_id || d.ihsPractitionerId,
    phone: d.phone || '',
    email: d.email,
    avatarUrl: d.avatar_url || d.avatarUrl,
    poli: d.poli,
    scheduleDays: Array.isArray(d.schedule_days) ? d.schedule_days : Array.isArray(d.scheduleDays) ? d.scheduleDays : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    scheduleStartTime,
    scheduleEndTime,
    scheduleHours: `${scheduleStartTime} - ${scheduleEndTime}`,
    dailyQuota: d.daily_quota ?? d.dailyQuota ?? 20,
    defaultConsultationFee: Number(d.default_consultation_fee ?? d.defaultConsultationFee ?? 50000),
    status: d.status || 'ACTIVE',
  };
}

export function mapDoctorToBackendPayload(doc: Partial<Doctor>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (doc.name !== undefined) payload.name = doc.name;
  if (doc.sip !== undefined) payload.sip = doc.sip;
  if (doc.strNumber !== undefined) payload.str_number = doc.strNumber;
  if (doc.nik !== undefined) payload.nik = doc.nik;
  if (doc.specialty !== undefined) payload.specialty = doc.specialty;
  if (doc.ihsPractitionerId !== undefined) payload.ihs_practitioner_id = doc.ihsPractitionerId;
  if (doc.phone !== undefined) payload.phone = doc.phone;
  if (doc.email !== undefined) payload.email = doc.email;
  if (doc.avatarUrl !== undefined) payload.avatar_url = doc.avatarUrl;
  if (doc.poli !== undefined) payload.poli = doc.poli;
  if (doc.scheduleDays !== undefined) payload.schedule_days = doc.scheduleDays;
  if (doc.scheduleStartTime !== undefined) payload.schedule_start_time = doc.scheduleStartTime;
  if (doc.scheduleEndTime !== undefined) payload.schedule_end_time = doc.scheduleEndTime;
  if (doc.dailyQuota !== undefined) payload.daily_quota = doc.dailyQuota;
  if (doc.defaultConsultationFee !== undefined) payload.default_consultation_fee = doc.defaultConsultationFee;
  if (doc.status !== undefined) payload.status = doc.status;
  return payload;
}

export async function fetchBackendDoctors(): Promise<{
  success: boolean;
  data: Doctor[];
  total?: number;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/doctors`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw.map(mapBackendDoctorToDoctor) : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil data dokter' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Error fetching doctors' };
  }
}

export async function createBackendDoctor(doc: Omit<Doctor, 'id'>): Promise<{
  success: boolean;
  data?: Doctor;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/doctors`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mapDoctorToBackendPayload(doc)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: mapBackendDoctorToDoctor(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal menambah dokter' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating doctor' };
  }
}

export async function updateBackendDoctor(id: string, doc: Partial<Doctor>): Promise<{
  success: boolean;
  data?: Doctor;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/doctors/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(mapDoctorToBackendPayload(doc)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: mapBackendDoctorToDoctor(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal mengubah dokter' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating doctor' };
  }
}

export async function deleteBackendDoctor(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/doctors/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal menghapus dokter' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting doctor' };
  }
}

// ==========================================
// NURSES BACKEND API (v1/nurses)
// ==========================================
export function mapBackendNurseToNurse(n: any): NurseMaster {
  return {
    id: n.id,
    name: n.name,
    sikp: n.sikp,
    strNumber: n.str_number || n.strNumber,
    nik: n.nik,
    profession: n.profession || 'PERAWAT',
    room: n.room || 'Poli Umum',
    ihsPractitionerId: n.ihs_practitioner_id || n.ihsPractitionerId,
    phone: n.phone || '',
    email: n.email,
    status: n.status || 'ACTIVE',
  };
}

export function mapNurseToBackendPayload(nurse: Partial<NurseMaster>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (nurse.name !== undefined) payload.name = nurse.name;
  if (nurse.sikp !== undefined) payload.sikp = nurse.sikp;
  if (nurse.strNumber !== undefined) payload.str_number = nurse.strNumber;
  if (nurse.nik !== undefined) payload.nik = nurse.nik;
  if (nurse.profession !== undefined) payload.profession = nurse.profession;
  if (nurse.room !== undefined) payload.room = nurse.room;
  if (nurse.ihsPractitionerId !== undefined) payload.ihs_practitioner_id = nurse.ihsPractitionerId;
  if (nurse.phone !== undefined) payload.phone = nurse.phone;
  if (nurse.email !== undefined) payload.email = nurse.email;
  if (nurse.status !== undefined) payload.status = nurse.status;
  return payload;
}

export async function fetchBackendNurses(): Promise<{
  success: boolean;
  data: NurseMaster[];
  total?: number;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/nurses`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw.map(mapBackendNurseToNurse) : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil data perawat' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Error fetching nurses' };
  }
}

export async function createBackendNurse(nurse: Omit<NurseMaster, 'id'>): Promise<{
  success: boolean;
  data?: NurseMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/nurses`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mapNurseToBackendPayload(nurse)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: mapBackendNurseToNurse(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal menambah perawat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating nurse' };
  }
}

export async function updateBackendNurse(id: string, nurse: Partial<NurseMaster>): Promise<{
  success: boolean;
  data?: NurseMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/nurses/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(mapNurseToBackendPayload(nurse)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: mapBackendNurseToNurse(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal mengubah perawat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating nurse' };
  }
}

export async function deleteBackendNurse(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/nurses/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal menghapus perawat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting nurse' };
  }
}

// ==========================================
// MEDICATIONS BACKEND API (v1/medications)
// ==========================================
export function mapBackendMedicationToMedication(m: any): MedicationMaster {
  return {
    id: m.id,
    code: m.code || 'MED-000',
    name: m.name,
    genericName: m.generic_name || m.genericName,
    category: m.category || 'Obat Bebas',
    dosage: m.dosage || '-',
    unit: m.unit || 'Tablet',
    price: Number(m.price || 0),
    stock: Number(m.stock || 0),
    standardSigna: m.standard_signa || m.standardSigna || '3 x 1 sehari sesudah makan',
    notes: m.notes,
  };
}

export function mapMedicationToBackendPayload(med: Partial<MedicationMaster>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (med.code !== undefined) payload.code = med.code;
  if (med.name !== undefined) payload.name = med.name;
  if (med.genericName !== undefined) payload.generic_name = med.genericName;
  if (med.category !== undefined) payload.category = med.category;
  if (med.dosage !== undefined) payload.dosage = med.dosage;
  if (med.unit !== undefined) payload.unit = med.unit;
  if (med.price !== undefined) payload.price = med.price;
  if (med.stock !== undefined) payload.stock = med.stock;
  if (med.standardSigna !== undefined) payload.standard_signa = med.standardSigna;
  if (med.notes !== undefined) payload.notes = med.notes;
  return payload;
}

export async function fetchBackendMedications(): Promise<{
  success: boolean;
  data: MedicationMaster[];
  total?: number;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/medications`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw.map(mapBackendMedicationToMedication) : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil data obat' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Error fetching medications' };
  }
}

export async function createBackendMedication(med: Omit<MedicationMaster, 'id'>): Promise<{
  success: boolean;
  data?: MedicationMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/medications`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mapMedicationToBackendPayload(med)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: mapBackendMedicationToMedication(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal menambah obat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating medication' };
  }
}

export async function updateBackendMedication(id: string, med: Partial<MedicationMaster>): Promise<{
  success: boolean;
  data?: MedicationMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/medications/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(mapMedicationToBackendPayload(med)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: mapBackendMedicationToMedication(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal mengubah obat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating medication' };
  }
}

export async function deleteBackendMedication(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/medications/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal menghapus obat' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting medication' };
  }
}

// ==========================================
// PROCEDURES BACKEND API (v1/procedures)
// ==========================================
export function mapBackendProcedureToProcedure(p: any): ProcedureMaster {
  return {
    id: p.id,
    code: p.code || 'PROC-000',
    name: p.name,
    category: p.category || 'Tindakan Medis',
    price: Number(p.price || 0),
    notes: p.notes,
  };
}

export function mapProcedureToBackendPayload(proc: Partial<ProcedureMaster>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (proc.code !== undefined) payload.code = proc.code;
  if (proc.name !== undefined) payload.name = proc.name;
  if (proc.category !== undefined) payload.category = proc.category;
  if (proc.price !== undefined) payload.price = proc.price;
  if (proc.notes !== undefined) payload.notes = proc.notes;
  return payload;
}

export async function fetchBackendProcedures(): Promise<{
  success: boolean;
  data: ProcedureMaster[];
  total?: number;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/procedures`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw.map(mapBackendProcedureToProcedure) : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil data tindakan' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Error fetching procedures' };
  }
}

export async function createBackendProcedure(proc: Omit<ProcedureMaster, 'id'>): Promise<{
  success: boolean;
  data?: ProcedureMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/procedures`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(mapProcedureToBackendPayload(proc)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: mapBackendProcedureToProcedure(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal menambah tindakan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating procedure' };
  }
}

export async function updateBackendProcedure(id: string, proc: Partial<ProcedureMaster>): Promise<{
  success: boolean;
  data?: ProcedureMaster;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/procedures/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(mapProcedureToBackendPayload(proc)),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: mapBackendProcedureToProcedure(json?.data) };
    }
    return { success: false, error: json?.response_message || 'Gagal mengubah tindakan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating procedure' };
  }
}

export async function deleteBackendProcedure(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/procedures/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal menghapus tindakan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting procedure' };
  }
}

// ==========================================
// VISITS BACKEND API (v1/visits)
// ==========================================
export function mapBackendVisitToVisit(v: any, patients: any[] = []): Visit {
  // If patients list is empty or not matching, also lookup from localStorage patients
  let patientList = Array.isArray(patients) && patients.length > 0 ? [...patients] : [];
  if (patientList.length === 0 && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('rme_patients') || localStorage.getItem('rme_patients_backend');
      if (raw) {
        patientList = JSON.parse(raw);
      }
    } catch {}
  }

  const patientMatch = patientList?.find(
    (p) =>
      (p.id && (p.id === v.patient_id || p.id === v.patient?.id)) ||
      (p.noRM && (p.noRM === v.patient?.no_rm || p.noRM === v.patient?.noRM)) ||
      (p.nik && (p.nik === v.patient?.nik || p.nik === v.nik)) ||
      (p.name && v.patient?.name && p.name.trim().toLowerCase() === v.patient.name.trim().toLowerCase())
  );

  const phone =
    patientMatch?.phone ||
    v.patient?.phone ||
    v.patient?.phone_number ||
    v.patient?.no_hp ||
    v.patient?.telepon ||
    v.patient?.whatsapp ||
    v.patient?.mobile ||
    v.patient_phone ||
    v.phone ||
    v.phone_number ||
    '';

  const patient = {
    id: v.patient_id || v.patient?.id || patientMatch?.id,
    noRM: patientMatch?.noRM || v.patient?.no_rm || v.patient?.noRM || 'RM-0000',
    name: patientMatch?.name || v.patient?.name || 'Pasien',
    gender: (patientMatch?.gender || v.patient?.gender || 'L') as 'L' | 'P',
    birthDate: patientMatch?.birthDate || v.patient?.birth_date || '1990-01-01',
    phone,
    address: patientMatch?.address || v.patient?.street_address || v.patient?.address || '',
    age: patientMatch?.age ?? v.patient?.age,
    nik: patientMatch?.nik || v.patient?.nik || '',
    bloodType: patientMatch?.bloodType || v.patient?.blood_type || '-',
    allergies: patientMatch?.allergies || v.patient?.allergies || [],
    createdAt: patientMatch?.createdAt || v.patient?.created_at || v.created_at || new Date().toISOString(),
    updatedAt: patientMatch?.updatedAt || v.patient?.updated_at || v.updated_at || new Date().toISOString(),
  };

  return {
    id: v.id,
    queueNumber: v.queue_number || 'A-001',
    patientId: v.patient_id,
    patient,
    doctorId: v.doctor_id || '',
    doctorName: v.doctor_name || (v.doctor_id ? 'Dokter' : ''),
    doctorSpecialty: v.doctor_specialty || 'Dokter Umum',
    date: v.date,
    time: v.time || '08:00',
    serviceHours: v.service_hours,
    patientQuota: v.patient_quota,
    status: v.status || 'WAITING',
    paymentType: v.payment_type || 'UMUM',
    chiefComplaintSummary: v.chief_complaint_summary,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  };
}

export async function fetchBackendVisits(params?: { date?: string; status?: string }): Promise<{
  success: boolean;
  data: any[];
  total?: number;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const endpoint = `${baseUrl}/v1/visits${queryString}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'GET', headers });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.success === true)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil data kunjungan' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Error fetching visits' };
  }
}

export async function createBackendVisit(dto: {
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  date: string;
  time?: string;
  queue_number?: string;
  payment_type?: string;
  chief_complaint_summary?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/visits`;
    const headers: Record<string, string> = { ...(getAuthHeaders() as Record<string, string>) };
    const { tenant_id, ...cleanDto } = dto as any;
    if (tenant_id && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = tenant_id;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanDto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }

    let errorMsg = json?.response_message || json?.message;
    if (Array.isArray(json?.errors_validation) && json.errors_validation.length > 0) {
      const validationDetails = json.errors_validation
        .map((e: any) => (Array.isArray(e?.messages) ? e.messages.join('; ') : e?.message || e))
        .filter(Boolean)
        .join(', ');
      if (validationDetails) {
        errorMsg = `${errorMsg || 'Validasi Gagal'}: ${validationDetails}`;
      }
    }
    return { success: false, error: errorMsg || json?.error || 'Gagal mendaftarkan kunjungan antrean' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating visit' };
  }
}

export async function updateBackendVisitStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/visits/${id}/status`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal memperbarui status kunjungan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating visit status' };
  }
}

export async function deleteBackendVisit(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/v1/visits/${id}`;
    const headers = getAuthHeaders();
    const res = await fetch(endpoint, { method: 'DELETE', headers });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message || 'Gagal membatalkan kunjungan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting visit' };
  }
}

// ============================================================
// Medical Records API — /v1/medical-records
// ============================================================

export async function fetchBackendMedicalRecordByVisit(visitId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/medical-records/by-visit/${visitId}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Rekam medis tidak ditemukan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching medical record' };
  }
}

export async function createBackendMedicalRecord(dto: {
  visit_id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  date: string;
  vital_signs?: any;
  chief_complaint?: string;
  anamnesis?: string;
  physical_examination?: string;
  diagnoses?: any[];
  procedures?: any[];
  prescriptions?: any[];
  clinical_notes?: string;
  follow_up_plan?: string;
  sick_leave_certificate?: any;
  health_certificate?: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/medical-records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal menyimpan rekam medis' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating medical record' };
  }
}

export async function updateBackendMedicalRecord(id: string, dto: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/medical-records/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message || 'Gagal memperbarui rekam medis' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating medical record' };
  }
}

// ============================================================
// Billing API — /v1/billing
// ============================================================

export async function fetchBackendBillingByVisit(visitId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/billing/by-visit/${visitId}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Tagihan tidak ditemukan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching billing' };
  }
}

export async function createOrUpdateBackendBilling(dto: {
  visit_id: string;
  patient_id: string;
  patient_name?: string;
  no_rm?: string;
  invoice_number?: string;
  date: string;
  items?: any[];
  consultation_fee?: number;
  procedures_fee?: number;
  medications_fee?: number;
  diagnostic_fee?: number;
  subtotal?: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  tax_amount?: number;
  grand_total?: number;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/billing`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal menyimpan tagihan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating billing' };
  }
}

export async function processBackendPayment(
  billingId: string,
  dto: {
    method: string;
    amount_paid: number;
    change_amount?: number;
    reference_number?: string;
    cashier_name?: string;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/billing/${billingId}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message || 'Gagal memproses pembayaran' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error processing payment' };
  }
}

// ============================================================
// Reports API — /v1/reports
// ============================================================

export async function fetchBackendDashboardSummary(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/reports/dashboard-summary`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil data dashboard' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching dashboard summary' };
  }
}

export async function fetchBackendDailyVisits(params?: { date?: string; start_date?: string; end_date?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/reports/daily-visits${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil laporan kunjungan harian' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching daily visits' };
  }
}

export async function fetchBackendMonthlyRevenue(params?: { year?: number; month?: number; start_date?: string; end_date?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.year) query.set('year', String(params.year));
    if (params?.month) query.set('month', String(params.month));
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/reports/monthly-revenue${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil laporan pendapatan' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching monthly revenue' };
  }
}

export async function fetchBackendPatientStats(params?: { start_date?: string; end_date?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/reports/patient-stats${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil statistik pasien' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching patient stats' };
  }
}

export async function fetchBackendDiagnosisStats(params?: { start_date?: string; end_date?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/reports/diagnosis-stats${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil statistik diagnosis' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching diagnosis stats' };
  }
}

// ============================================================
// SATUSEHAT Config API — /v1/config/satusehat
// ============================================================

export async function fetchBackendSatuSehatConfig(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/satusehat`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateBackendSatuSehatConfig(dto: {
  organization_id?: string;
  client_id?: string;
  client_secret?: string;
  environment?: string;
  location_id?: string;
  location_name?: string;
  auto_sync_on_complete?: boolean;
  sync_diagnoses?: boolean;
  sync_vital_signs?: boolean;
  sync_prescriptions?: boolean;
  sync_procedures?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/satusehat`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function testBackendSatuSehatConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/satusehat/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.response_code === 200 || json?.responseResult === true)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Koneksi SATUSEHAT gagal' };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================
// BPJS Config API — /v1/config/bpjs
// ============================================================

export async function fetchBackendBpjsConfig(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/bpjs`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateBackendBpjsConfig(dto: {
  cons_id?: string;
  secret_key?: string;
  user_key?: string;
  kode_ppk?: string;
  ppk_name?: string;
  username_pcare?: string;
  password_pcare?: string;
  environment?: string;
  auto_bridging_registration?: boolean;
  auto_bridging_kunjungan?: boolean;
  enable_pcare?: boolean;
  enable_antrean_online?: boolean;
  enable_rujukan_online?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/bpjs`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dto),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function testBackendBpjsConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/config/bpjs/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.response_code === 200 || json?.responseResult === true)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Koneksi BPJS gagal' };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================
// Medical Records — GET /v1/medical-records/by-patient/:patientId
// ============================================================

export async function fetchBackendMedicalRecordsByPatient(patientId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/medical-records/by-patient/${patientId}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const raw = json?.data?.data || json?.data || [];
      return { success: true, data: Array.isArray(raw) ? raw : [] };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil riwayat rekam medis' };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================
// Reports — GET /v1/reports/medication-usage
// ============================================================

export async function fetchBackendMedicationUsage(params?: { start_date?: string; end_date?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/reports/medication-usage${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message || 'Gagal mengambil laporan penggunaan obat' };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================
// Visits — GET /v1/visits/by-date/:date
// ============================================================

export async function fetchBackendVisitsByDate(date: string): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/visits/by-date/${date}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mengambil antrian hari ini' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

// ============================================================
// ICD-10 — GET /v1/icd10
// ============================================================

export async function fetchBackendIcd10(params?: { search?: string; page?: number; limit?: number }): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/icd10${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mencari ICD-10' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

// ============================================================
// ICD-9 — GET /v1/icd9
// ============================================================

export async function fetchBackendIcd9(params?: { search?: string; page?: number; limit?: number }): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/icd9${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal mencari ICD-9' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

// ============================================================
// SaaS — /v1/saas
// ============================================================

export async function fetchBackendSaasPlans(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/plans`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || [] };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchBackendSaasTenants(params?: { page?: number; limit?: number; search?: string }): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${baseUrl}/v1/saas/tenants${qs}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const raw = json?.data?.data || json?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return { success: true, data: list, total: json?.data?.total ?? list.length };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export async function fetchBackendSaasTenant(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/tenants/${id}`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function createBackendSaasTenant(dto: { name: string; email?: string; phone?: string; plan_id?: string; [key: string]: any }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/tenants`, { method: 'POST', headers, body: JSON.stringify(dto) });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 201 || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateBackendSaasTenant(id: string, dto: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/tenants/${id}`, { method: 'PUT', headers, body: JSON.stringify(dto) });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function changeBackendSaasPlan(tenantId: string, dto: { plan_id: string; [key: string]: any }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/tenants/${tenantId}/change-plan`, { method: 'POST', headers, body: JSON.stringify(dto) });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true, data: json?.data };
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchBackendTenantInvoices(tenantId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/saas/tenants/${tenantId}/invoices`, { method: 'GET', headers });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || [] };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

// ============================================================
// Notification Web — PATCH /v1/notification-web/:id/read
// ============================================================

export async function markBackendNotificationRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/notification-web/${id}/read`, { method: 'PATCH', headers, body: JSON.stringify({}) });
    const json = await res.json().catch(() => null);
    if (res.ok) return { success: true };
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================
// Menus & Categories (Dynamic Database Menus)
// ============================================================

export interface BackendMenuCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  order: number;
  is_active: boolean;
}

export interface BackendMenuTreeItem {
  id: string;
  category_id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  icon?: string | null;
  path?: string | null;
  type: 'item' | 'group';
  order: number;
  is_active: boolean;
  category?: BackendMenuCategory;
  children?: BackendMenuTreeItem[];
  roleAccess?: any[];
}

export async function fetchBackendMyMenus(): Promise<{
  success: boolean;
  data?: BackendMenuTreeItem[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/menus/auth`, {
      method: 'GET',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || [] };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export async function fetchBackendRoleMenus(roleId: string): Promise<{
  success: boolean;
  data?: BackendMenuTreeItem[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/menus/role/${roleId}`, {
      method: 'GET',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || [] };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export interface BackendRoleItem {
  id: string;
  name: string;
  guard_name?: string;
}

export async function fetchBackendRoles(): Promise<{
  success: boolean;
  data?: BackendRoleItem[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/roles/paginated`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, per_page: 100 }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const rows = Array.isArray(json?.data)
        ? json.data
        : (json?.data?.rows || (Array.isArray(json?.data) ? json.data : []));
      return { success: true, data: rows };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export const ROLE_NAME_TO_BACKEND_MAP: Record<string, string> = {
  DOCTOR: 'dokter',
  NURSE: 'perawat',
  CASHIER: 'kasir',
  PHARMACIST: 'apoteker',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  SAAS_ADMIN: 'saas_admin',
};

// ============================================================
// Granular Action Permissions (RBAC)
// ============================================================

export interface BackendPermission {
  id: string;
  name: string;
  description?: string | null;
}

export async function fetchBackendMyPermissions(): Promise<{
  success: boolean;
  data?: BackendPermission[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/permissions/auth`, {
      method: 'GET',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data || [] };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export async function fetchBackendRolePermissions(roleId: string): Promise<{
  success: boolean;
  data?: { role_id: string; role_name: string; permissions: BackendPermission[] };
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/permissions/role/${roleId}`, {
      method: 'GET',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateBackendRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/permissions/role/${roleId}/update-permissions`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    return { success: false, error: json?.response_message };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchBackendAllPermissions(): Promise<{
  success: boolean;
  data?: BackendPermission[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/permissions/paginated`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page: 1, per_page: 200 }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const rows = json?.data?.rows || (Array.isArray(json?.data) ? json.data : []);
      return { success: true, data: rows };
    }
    return { success: false, data: [], error: json?.response_message };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

// ============================================================
// User Management & RBAC Backend Integration
// ============================================================

export interface BackendUserListItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  email_verified_at?: string | null;
  timezone_id?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  modelHasRoles?: Array<{
    role_id: string;
    model_id: string;
    created_at?: string;
    updated_at?: string;
    Role?: {
      id: string;
      name: string;
      guard_name?: string;
    };
  }>;
}

export function mapBackendRoleNameToAppRole(roleName: string): UserRole {
  const lower = (roleName || '').toLowerCase().trim();
  if (lower.includes('dokter') || lower === 'doctor') return 'DOCTOR';
  if (lower.includes('perawat') || lower === 'nurse') return 'NURSE';
  if (lower.includes('apotek') || lower === 'pharmacist') return 'PHARMACIST';
  if (lower === 'superadmin' || lower === 'saas_admin') return 'SUPERADMIN';
  return 'ADMIN'; // default for 'admin', 'admin tenant', 'kasir', etc.
}

export function mapBackendUserToUser(bu: BackendUserListItem): User {
  const firstRoleObj = bu.modelHasRoles?.[0]?.Role;
  const roleName = firstRoleObj?.name || 'admin tenant';
  const appRole = mapBackendRoleNameToAppRole(roleName);
  const roleId = bu.modelHasRoles?.[0]?.role_id || firstRoleObj?.id;

  let defaultTitle = 'Staf Faskes';
  if (appRole === 'DOCTOR') defaultTitle = 'Dokter Pemeriksa';
  else if (appRole === 'NURSE') defaultTitle = 'Perawat / Asisten Medis';
  else if (appRole === 'PHARMACIST') defaultTitle = 'Apoteker Farmasi';
  else if (appRole === 'ADMIN') defaultTitle = roleName === 'kasir' ? 'Kasir & Front Office' : 'Admin Kasir & Front Office';
  else if (appRole === 'SUPERADMIN') defaultTitle = 'Super Admin / Pemilik';

  return {
    id: bu.id,
    name: bu.name || bu.email.split('@')[0],
    email: bu.email,
    username: bu.email.split('@')[0],
    role: appRole,
    roleId: roleId,
    appMode: 'DOCTOR_AND_ADMIN',
    title: defaultTitle,
    phone: bu.phone || undefined,
    status: bu.deleted_at ? 'INACTIVE' : 'ACTIVE',
    createdAt: bu.created_at,
  };
}

export async function fetchBackendUsers(): Promise<{
  success: boolean;
  data?: User[];
  raw?: BackendUserListItem[];
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/users`, {
      method: 'GET',
      headers,
    });
    const json = await res.json().catch(() => null);
    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      const rawList: BackendUserListItem[] = Array.isArray(json?.data) ? json.data : [];
      const mapped = rawList.map(mapBackendUserToUser);
      return { success: true, data: mapped, raw: rawList };
    }
    return { success: false, data: [], error: json?.response_message || 'Gagal memuat pengguna' };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message };
  }
}

export async function createBackendUser(payload: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  roles?: (string | number)[];
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const body: Record<string, any> = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };
    if (payload.name?.trim()) body.name = payload.name.trim();
    if (payload.phone?.trim()) body.phone = payload.phone.trim();
    if (payload.roles && payload.roles.length > 0) body.roles = payload.roles;

    const res = await fetch(`${baseUrl}/v1/users/create`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200 || json?.response_code === 201)) {
      return { success: true, data: json?.data };
    }

    // Handle 422 or error validation
    const valErrors = json?.errors_validation || json?.errors;
    if (Array.isArray(valErrors) && valErrors.length > 0) {
      const msg = valErrors.map((e: any) => e.messages?.join(', ') || e.field).join('; ');
      return { success: false, error: msg };
    }
    const defaultMsg = Array.isArray(json?.error)
      ? json.error.join(', ')
      : json?.error || json?.response_message || 'Gagal membuat pengguna.';
    return { success: false, error: defaultMsg };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Koneksi ke backend gagal.' };
  }
}

export async function updateBackendUser(
  id: string,
  payload: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const body: Record<string, any> = {};
    if (payload.email) body.email = payload.email.trim().toLowerCase();
    if (payload.password) body.password = payload.password;
    if (payload.name) body.name = payload.name.trim();
    if (payload.phone !== undefined) body.phone = payload.phone.trim() || null;

    const res = await fetch(`${baseUrl}/v1/users/${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }

    const valErrors = json?.errors_validation || json?.errors;
    if (Array.isArray(valErrors) && valErrors.length > 0) {
      const msg = valErrors.map((e: any) => e.messages?.join(', ') || e.field).join('; ');
      return { success: false, error: msg };
    }
    const defaultMsg = Array.isArray(json?.error)
      ? json.error.join(', ')
      : json?.error || json?.response_message || 'Gagal memperbarui pengguna.';
    return { success: false, error: defaultMsg };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Koneksi ke backend gagal.' };
  }
}

export async function assignBackendUserRoles(
  userId: string,
  roles: string[]
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/users/${userId}/roles`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true, data: json?.data };
    }
    const msg = Array.isArray(json?.error)
      ? json.error.join(', ')
      : json?.error || json?.response_message || 'Gagal mengubah peran pengguna.';
    return { success: false, error: msg };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Koneksi ke backend gagal.' };
  }
}

export async function deleteBackendUser(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true };
    }
    const msg = Array.isArray(json?.error)
      ? json.error.join(', ')
      : json?.error || json?.response_message || 'Gagal menghapus pengguna.';
    return { success: false, error: msg };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Koneksi ke backend gagal.' };
  }
}

export async function changeBackendUserPassword(
  oldPassword: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getAuthHeaders();
    const res = await fetch(`${baseUrl}/v1/users/change-password`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && (json?.responseResult === true || json?.response_code === 200)) {
      return { success: true };
    }
    const msg = Array.isArray(json?.error)
      ? json.error.join(', ')
      : json?.error || json?.response_message || 'Gagal mengganti kata sandi.';
    return { success: false, error: msg };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Koneksi ke backend gagal.' };
  }
}

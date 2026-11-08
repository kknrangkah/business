'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRME } from '@/context/rme-context';
import { toast } from 'sonner';
import { ShieldCheck, AlertCircle } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleToken, loginWithGoogleResponse, checkAccountStatus } = useRME();
  const [status, setStatus] = useState('Menghubungkan sesi autentikasi Google...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Strict single-execution guard across re-renders and React StrictMode
  const isProcessingRef = useRef(false);
  const isSuccessRef = useRef(false);

  useEffect(() => {
    if (isProcessingRef.current) return;

    async function processOAuthCallback() {
      // 1. Check for error parameters in query string
      const errorParam =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        searchParams.get('message');

      if (errorParam) {
        isProcessingRef.current = true;
        const decodedError = decodeURIComponent(errorParam);
        setErrorMsg(decodedError);
        toast.error(`Autentikasi Google gagal: ${decodedError}`, { id: 'oauth-error' });
        setTimeout(() => router.replace('/login?error=oauth_failed'), 2500);
        return;
      }

      // 2. Extract token from searchParams (flexible parameter names)
      let token =
        searchParams.get('token') ||
        searchParams.get('access_token') ||
        searchParams.get('accessToken') ||
        searchParams.get('jwt');

      let refreshToken =
        searchParams.get('refreshToken') ||
        searchParams.get('refresh_token') ||
        searchParams.get('refresh') ||
        undefined;

      const responseParam =
        searchParams.get('response') ||
        searchParams.get('res') ||
        searchParams.get('data');

      // 3. Fallback: inspect URL hash fragment (#token=... or #access_token=...)
      if (!token && typeof window !== 'undefined' && window.location.hash) {
        const hashStr = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashStr);
        token =
          hashParams.get('token') ||
          hashParams.get('access_token') ||
          hashParams.get('accessToken') ||
          hashParams.get('jwt');
        if (!refreshToken) {
          refreshToken =
            hashParams.get('refreshToken') ||
            hashParams.get('refresh_token') ||
            undefined;
        }
      }

      // If neither token nor responseParam is present, wait or exit
      if (!token && !responseParam) {
        return;
      }

      // Mark as processed to prevent double execution
      isProcessingRef.current = true;

      // Case A: Full JSON response passed via query param
      if (responseParam) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(responseParam));
          setStatus('Memverifikasi data respon autentikasi...');
          const authRes = await loginWithGoogleResponse(parsedData);
          if (authRes.success && authRes.user) {
            handleLoginSuccess(authRes.user, token, refreshToken);
            return;
          } else {
            throw new Error(authRes.error || 'Gagal memproses data otentikasi.');
          }
        } catch (err: any) {
          console.warn('[Callback] Gagal parse responseParam:', err);
        }
      }

      // Case B: Direct Token provided
      if (token) {
        setStatus('Memverifikasi token & hak akses faskes...');
        try {
          const authRes = await loginWithGoogleToken(token, refreshToken);
          if (authRes.success && authRes.user) {
            handleLoginSuccess(authRes.user, token, refreshToken);
          } else {
            setErrorMsg(authRes.error || 'Gagal memverifikasi token sesi login.');
            toast.error(authRes.error || 'Gagal verifikasi token.', { id: 'oauth-error' });
            setTimeout(() => router.replace('/login?error=token_invalid'), 2500);
          }
        } catch (err: any) {
          setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat memproses login.');
          toast.error('Gagal memproses sesi.', { id: 'oauth-error' });
          setTimeout(() => router.replace('/login?error=system_error'), 2500);
        }
      }
    }

    function handleLoginSuccess(user: any, token?: string | null, refreshToken?: string | null) {
      if (isSuccessRef.current) return;
      isSuccessRef.current = true;

      const userEmail = user?.email || '';
      const accountStatus = userEmail ? checkAccountStatus(userEmail) : { exists: false, hasPassword: false };

      // If user needs password setup, target route is /register to create password
      const isSaasAdmin = user.role === 'SAAS_ADMIN';
      const targetRoute = !accountStatus.hasPassword
        ? `/auth/set-password?token=${encodeURIComponent(token || '')}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(user.name || '')}`
        : (isSaasAdmin ? '/saas' : '/dashboard');

      if (!accountStatus.hasPassword) {
        setStatus(`Akun terverifikasi. Mengarahkan untuk pembuatan kata sandi wajib...`);
        toast.info('Akun Google berhasil terhubung. Silakan buat kata sandi untuk akun Anda.');
      } else {
        setStatus(`Selamat datang, ${user.name}! Mengalihkan ke Dashboard...`);
        toast.success(`Selamat datang, ${user.name}!`, {
          id: 'oauth-success',
          description: `Login berhasil. Membuka Dashboard...`,
        });
      }

      // 1. If opened in a popup window, attempt to notify opener
      if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              token,
              refreshToken,
              user,
            },
            '*'
          );
          setTimeout(() => {
            try {
              window.close();
            } catch {}
          }, 300);
        } catch (e) {
          console.warn('[Callback] Gagal postMessage ke window.opener:', e);
        }
      }

      // 2. GUARANTEED REDIRECT: Redirect current window in ALL cases
      setTimeout(() => {
        window.location.href = targetRoute;
      }, 500);
    }

    processOAuthCallback();
  }, [searchParams, loginWithGoogleToken, loginWithGoogleResponse, checkAccountStatus, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-200/80 space-y-5">
        {errorMsg ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Autentikasi Gagal</h2>
              <p className="mt-1 text-xs text-red-600 font-medium">{errorMsg}</p>
            </div>
            <p className="text-xs text-slate-400">Mengarahkan kembali ke halaman login...</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Menyelesaikan Login Google</h2>
              <p className="text-xs text-slate-500">{status}</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Sistem RME Terenkripsi Standar Kemenkes RI</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

# PANDUAN INTEGRASI BACKEND: GOOGLE OAUTH CALLBACK REDIRECT

Dokumen ini berisi panduan teknis dan spesifikasi perubahan yang perlu dilakukan oleh Tim Backend (NestJS/Express) agar proses login Google OAuth terintegrasi sempurna dengan Frontend Next.js RME Klinik.

---

## 1. Latar Belakang & Akar Masalah 404

### Mengapa Muncul 404 pada `/auth/callback`?
1. Kontainer Docker frontend di server produksi (`https://privata.nafada.id`) saat ini belum menjalankan image hasil build rute baru `/auth/callback`.
2. Halaman **`/login`** sudah 100% aktif dan berjalan di server produksi (`HTTP 200 OK`). Halaman `/login` di frontend sudah dilengkapi handler otomatis untuk mendeteksi token (`?token=...&refreshToken=...`), menyimpan sesi ke `localStorage`, dan mengalihkan pengguna ke `/dashboard`.

---

## 2. Solusi Langsung & Terbaik (Redirect ke `/login?token=...`)

Pada backend NestJS (`auth.controller.ts`), arahkan redirect ke rute **`/login`** membawa parameter token:

```
${FRONTEND_URL}/login?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}
```

Dengan mengarahkan ke `/login?token=...`:
- **Tidak akan terjadi error 404**, karena route `/login` sudah aktif di produksi.
- Pengguna yang masuk melalui Google langsung terautentikasi otomatis dan dialihkan ke **`/dashboard`**.

---

## 3. Contoh Kode Controller Backend (NestJS)

Buka file controller OAuth (misal `src/auth/auth.controller.ts`):

```typescript
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google-callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      // 1. Eksekusi logic login & pembuatan token seperti biasa
      const loginResult = await this.authService.googleLogin(req);

      // 2. Ekstrak token dan refreshToken dari hasil login
      const token = 
        loginResult?.data?.token || 
        loginResult?.data?.access_token || 
        loginResult?.token || 
        loginResult?.access_token;

      const refreshToken = 
        loginResult?.data?.refreshToken || 
        loginResult?.data?.refresh_token || 
        loginResult?.refreshToken || 
        loginResult?.refresh_token || 
        '';

      // 3. Tentukan URL Frontend tujuan (dari file .env)
      const frontendUrl = process.env.FRONTEND_URL || 'https://privata.nafada.id';

      // 4. Redirect browser ke /login membawa token (Langsung Berhasil & Anti 404!)
      return res.redirect(
        `${frontendUrl}/login?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}`
      );
    } catch (error) {
      console.error('[Google OAuth Callback Error]:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://privata.nafada.id';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
```

---

## 4. Opsi Deployment Server Frontend (Untuk Mengaktifkan `/auth/callback`)

Jika ingin rute `/auth/callback` juga aktif di server produksi, jalankan perintah deployment di server VPS:

```bash
cd /path/to/pm-frontend
git pull origin main
bash deploy.sh
```
*Catatan: Seluruh commit terbaru sudah berhasil di-push ke branch `main` repositori GitHub.*

---

## 5. Checklist Verifikasi

- [ ] Backend me-redirect ke `${FRONTEND_URL}/login?token=...`
- [ ] Browser mengarahkan ke halaman login dengan query token.
- [ ] Halaman login otomatis membaca token, menampilkan pesan *"Selamat datang!"*, dan masuk ke `/dashboard`.

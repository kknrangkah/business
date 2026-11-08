#!/bin/bash
set -e

echo "========================================"
echo "🚀 Memulai Deployment Frontend RME..."
echo "========================================"

# 1. Pull update terbaru dari git (opsional jika dijalankan manual)
if [ -d .git ]; then
  echo "📥 Menarik kode terbaru dari Git..."
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Gumay")
  echo "📍 Branch aktif: $CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH" || git pull origin main
fi

# 1.1 Pastikan server memiliki Swap Memory untuk mencegah freeze saat build
SWAP_TOTAL=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -eq 0 ] 2>/dev/null; then
  echo "⚠️  Tidak ada Swap memory terdeteksi. Mengaktifkan 2GB swapfile agar build lancar..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
  chmod 600 /swapfile 2>/dev/null || true
  mkswap /swapfile 2>/dev/null || true
  swapon /swapfile 2>/dev/null || true
fi

export DOCKER_BUILDKIT=1

# 2. Build Docker Image
echo "📦 Membangun Docker image pm-frontend..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://privata.nafada.id" \
  --build-arg NEXT_PUBLIC_FRONTEND_URL="https://privata.nafada.id" \
  -t pm-frontend .

# 3. Hentikan dan hapus container lama jika ada
echo "🛑 Menghentikan container lama (jika ada)..."
docker stop pm_frontend 2>/dev/null || true
docker rm pm_frontend 2>/dev/null || true

# 4. Jalankan container baru di port 3005
echo "▶️ Menjalankan container baru di port 3005..."
docker run -d \
  --name pm_frontend \
  -p 3005:3000 \
  -e BACKEND_API_URL="http://43.129.38.25:30005" \
  -e NEXT_PUBLIC_API_URL="https://privata.nafada.id" \
  -e NEXT_PUBLIC_FRONTEND_URL="https://privata.nafada.id" \
  --restart unless-stopped \
  pm-frontend

# 5. Bersihkan image lama yang tidak terpakai
echo "🧹 Membersihkan image lama..."
docker image prune -f

echo "========================================"
echo "✅ Frontend RME Berhasil Dideploy!"
echo "🌐 Akses di: https://privata.nafada.id (Direct IP: http://43.129.38.25:3005)"
echo "🔌 Backend API: http://43.129.38.25:30005"
echo "========================================"
docker ps | grep pm_frontend

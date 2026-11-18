#!/usr/bin/env bash
set -euo pipefail

DOMAIN="stream18plus.my.id"
CONF_SRC="/root/business/deploy/nginx/${DOMAIN}.conf"
CONF_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
CONF_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

echo "=== [1/4] Install Nginx & Certbot SSL ==="
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== [2/4] Pasang konfigurasi virtual host ${DOMAIN} ==="
cp "${CONF_SRC}" "${CONF_AVAIL}"
ln -sf "${CONF_AVAIL}" "${CONF_ENABLED}"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "=== [3/4] Buka Firewall HTTP (80) & HTTPS (443) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo "=== [4/4] Aktifkan HTTPS (SSL Let's Encrypt) untuk ${DOMAIN} ==="
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect

systemctl reload nginx
echo "Selesai! Website aktif di https://${DOMAIN}"


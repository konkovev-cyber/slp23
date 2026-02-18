#!/bin/bash
# Скрипт для восстановления настроек Xray на сервере (VPS)
# Запускать на сервере через SSH

echo "🔧 Восстановление настроек Xray..."

# Резервная копия текущего конфига
cp /usr/local/x-ui/bin/config.json /usr/local/x-ui/bin/config.json.backup.$(date +%Y%m%d_%H%M%S)

# Минимальный рабочий конфиг для сервера
cat > /usr/local/x-ui/bin/config.json << 'EOF'
{
  "log": {
    "access": "/dev/null",
    "error": "/opt/var/log/xray/error.log",
    "loglevel": "error",
    "dnsLog": false
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "АВТОМАТИЧЕСКИ_ИЗ_3X-UI",
            "flow": "xtls-rprx-vision"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "23fito.ru:443",
          "serverNames": ["23fito.ru"],
          "privateKey": "АВТОМАТИЧЕСКИ_ИЗ_3X-UI",
          "shortIds": ["", "ВАШ_SHORT_ID"]
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "block"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "block"
      }
    ]
  },
  "transport": {
    "sockopt": {
      "tcpMptcp": true,
      "tcpFastOpen": true,
      "tcpNoDelay": true,
      "tcpKeepAliveInterval": 30
    }
  },
  "policy": {
    "levels": {
      "0": {
        "handshake": 4,
        "connIdle": 300
      }
    }
  }
}
EOF

echo "⚠️ ВНИМАНИЕ: Этот конфиг требует настройки через 3X-UI!"
echo "✅ Перезапуск Xray..."
systemctl restart xray

echo "✅ Готово! Проверьте статус:"
systemctl status xray

echo ""
echo "📋 Для полной настройки используйте веб-интерфейс 3X-UI"
echo "   Порт: (ваш порт 3X-UI)"

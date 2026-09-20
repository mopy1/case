#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Desplegando Collaborative CASE Tool en AWS EC2 (Producción)"
echo "=========================================================="

# 1. Verificar e instalar Docker si no está presente
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker y Docker Compose..."
    sudo apt-get update -y
    sudo apt-get install -y docker.io docker-compose-v2
    sudo usermod -aG docker "$USER"
    echo "✓ Docker instalado."
fi

# 2. Configurar memoria swap de 2GB si el servidor tiene 1GB o 2GB de RAM
if [ ! -f /swapfile ]; then
    echo "⚙️ Configurando archivo Swap de 2GB para optimizar memoria..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✓ Swap configurado."
fi

# 3. Compilar y levantar contenedores
echo "🐳 Compilando y levantando contenedores con Docker Compose..."
docker compose -f docker-compose.prod.yml up -d --build

echo "=========================================================="
PUBLIC_IP=$(curl -s ifconfig.me || echo "tu-ip-publica")
echo "✅ ¡Sistema desplegado exitosamente en AWS!"
echo "🌐 URL Pública: http://${PUBLIC_IP}"
echo "=========================================================="

#!/bin/bash

# Script to simulate order creation by publishing a message to RabbitMQ
# This script requires the RabbitMQ service to be running

set -e

echo "🛍️ Simulando criação de nova ordem..."

# Check if RabbitMQ is running
if ! docker compose ps | grep -q "rabbitmq.*Up"; then
    echo "❌ RabbitMQ não está rodando. Por favor, inicie os serviços primeiro com ./scripts/start.sh"
    exit 1
fi

# Create exchange if it doesn't exist
echo "🔧 Configurando exchange no RabbitMQ..."
docker compose exec rabbitmq rabbitmqadmin declare exchange name=orders type=direct durable=true

# Create queue if it doesn't exist
echo "🔧 Configurando fila no RabbitMQ..."
docker compose exec rabbitmq rabbitmqadmin declare queue name=order_processing durable=true

# Bind queue to exchange
echo "🔧 Vinculando fila ao exchange..."
docker compose exec rabbitmq rabbitmqadmin declare binding source=orders destination=order_processing routing_key=order.created

# Generate a random order ID
ORDER_ID=$(uuidgen)

# Create order payload
ORDER_PAYLOAD=$(cat <<EOF
{
    "orderId": "${ORDER_ID}",
    "customerId": "CUST-$(date +%s)",
    "items": [
        {
            "productId": "PROD-001",
            "name": "Smartphone XYZ",
            "quantity": 1,
            "price": 1999.99
        },
        {
            "productId": "PROD-002",
            "name": "Capa Protetora",
            "quantity": 2,
            "price": 49.99
        }
    ],
    "totalAmount": 2099.97,
    "shippingAddress": {
        "street": "Rua Exemplo, 123",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "country": "Brasil"
    },
    "paymentMethod": "CREDIT_CARD",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

# Publish message to RabbitMQ
echo "📤 Publicando mensagem no RabbitMQ..."
docker compose exec rabbitmq rabbitmqadmin publish exchange=orders routing_key=order.created payload="$ORDER_PAYLOAD"

echo "✅ Ordem criada com sucesso!"
echo "📋 Detalhes da ordem:"
echo "$ORDER_PAYLOAD"
echo ""
echo "🔍 Você pode verificar o processamento da ordem no RabbitMQ Management UI:"
echo "   http://localhost:15672 (guest/guest)" 
#!/bin/bash

# Script para testar o sistema de Retry e Dead Letter Queue
# Este script cria eventos que irão falhar propositalmente para demonstrar o retry e DLQ

set -e

echo "🧪 Testando sistema de Retry e Dead Letter Queue..."

# Check if RabbitMQ is running
if ! docker compose ps | grep -q "rabbitmq.*Up"; then
    echo "❌ RabbitMQ não está rodando. Por favor, inicie os serviços primeiro com docker-compose up -d"
    exit 1
fi

# Create DLQ exchange and queue if they don't exist
echo "🔧 Configurando Dead Letter Queue no RabbitMQ..."

# Delete existing queue if it has different configuration
echo "🗑️ Removendo fila DLQ existente (se houver)..."
docker compose exec rabbitmq rabbitmqadmin delete queue name=dead_letter_queue || true

# Create DLQ exchange
docker compose exec rabbitmq rabbitmqadmin declare exchange name=dlx_exchange type=direct durable=true

# Create DLQ queue with proper configuration
docker compose exec rabbitmq rabbitmqadmin declare queue name=dead_letter_queue durable=true arguments='{"x-message-ttl":604800000,"x-max-length":10000}'

# Bind DLQ queue to exchange
docker compose exec rabbitmq rabbitmqadmin declare binding source=dlx_exchange destination=dead_letter_queue routing_key=failed

echo "🚨 Criando evento que irá falhar para testar retry e DLQ..."

# Create a malformed event that will cause processing to fail
FAILING_ORDER_ID=$(uuidgen)

# Event with invalid data that will cause processing errors
FAILING_PAYLOAD=$(cat <<EOF
{
    "eventId": "$(uuidgen)",
    "eventType": "OrderCreated",
    "aggregateId": "${FAILING_ORDER_ID}",
    "version": 1,
    "occurredAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "data": {
        "orderId": "${FAILING_ORDER_ID}",
        "customerId": null,
        "items": "INVALID_ITEMS_FORMAT",
        "total": "NOT_A_NUMBER",
        "shippingAddress": null,
        "status": "invalid_status"
    }
}
EOF
)

# Publish the failing message
echo "📤 Publicando evento que irá falhar..."
docker compose exec rabbitmq rabbitmqadmin publish exchange=orders_exchange routing_key=order.created payload="$FAILING_PAYLOAD"

echo "✅ Evento com falha criado!"
echo ""
echo "🔍 Acompanhe o processamento nos logs para ver:"
echo "   1. ⚠️  Tentativas de retry (3 tentativas)"
echo "   2. 📮 Envio para Dead Letter Queue após falhas"
echo "   3. ❌ Logs de erro detalhados"
echo ""
echo "📊 Para ver os logs em tempo real:"
echo "   docker compose logs app -f"
echo ""
echo "🔍 Para verificar a Dead Letter Queue:"
echo "   docker compose exec rabbitmq rabbitmqadmin get queue=dead_letter_queue"
echo ""
echo "🌐 Ou acesse o RabbitMQ Management UI:"
echo "   http://localhost:15672 (guest/guest)"
echo "   Vá para Queues > dead_letter_queue para ver as mensagens falhadas"

# Create a few more failing events to demonstrate batch retry
echo ""
echo "🔄 Criando mais alguns eventos com falha para demonstrar retry em lote..."

for i in {1..3}; do
    FAILING_ORDER_ID=$(uuidgen)
    
    FAILING_PAYLOAD=$(cat <<EOF
{
    "eventId": "$(uuidgen)",
    "eventType": "OrderCreated",
    "aggregateId": "${FAILING_ORDER_ID}",
    "version": 1,
    "occurredAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "data": {
        "orderId": "${FAILING_ORDER_ID}",
        "customerId": null,
        "items": [],
        "total": -999,
        "shippingAddress": "INVALID_ADDRESS",
        "status": "will_fail"
    }
}
EOF
    )
    
    docker compose exec rabbitmq rabbitmqadmin publish exchange=orders_exchange routing_key=order.created payload="$FAILING_PAYLOAD"
    echo "📦 Evento de falha $i criado"
    sleep 1
done

echo ""
echo "✅ Teste de Retry e DLQ configurado!"
echo "🔍 Monitore os logs para ver o sistema de retry em ação:"
echo "   docker compose logs app -f | grep -E '(🔄|⚠️|❌|📮)'" 
#!/bin/bash

# Simple test script to send a single failing event

set -e

echo "🧪 Enviando um único evento que deve falhar..."

# Create a single failing event
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
        "shippingAddress": null,
        "status": "invalid_status"
    }
}
EOF
)

echo "📤 Publicando evento com dados inválidos..."
echo "Dados do evento:"
echo "$FAILING_PAYLOAD"

docker compose exec rabbitmq rabbitmqadmin publish exchange=orders_exchange routing_key=order.created payload="$FAILING_PAYLOAD"

echo "✅ Evento publicado!"
echo ""
echo "🔍 Aguardando processamento... (15 segundos)"
sleep 15

echo ""
echo "📊 Verificando logs de erro:"
docker compose logs app --tail=20 | grep -E "(ERROR|❌|🔄|⚠️|📮)" || echo "Nenhum erro encontrado nos logs"

echo ""
echo "📮 Verificando Dead Letter Queue:"
docker compose exec rabbitmq rabbitmqadmin get queue=dead_letter_queue || echo "DLQ vazia" 
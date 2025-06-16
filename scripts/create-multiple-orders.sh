#!/bin/bash

# Script to simulate multiple order creation by publishing several messages to RabbitMQ
# This script demonstrates batch processing and makes the flow more observable

set -e

# Default number of orders to create (optimal for demo)
NUM_ORDERS=${1:-7}

echo "🛍️ Simulando criação de ${NUM_ORDERS} ordens para demonstrar batch processing..."

# Check if RabbitMQ is running
if ! docker compose ps | grep -q "rabbitmq.*Up"; then
    echo "❌ RabbitMQ não está rodando. Por favor, inicie os serviços primeiro com ./scripts/start.sh"
    exit 1
fi

# Create exchange if it doesn't exist
echo "🔧 Configurando exchange no RabbitMQ..."
docker compose exec rabbitmq rabbitmqadmin declare exchange name=orders_exchange type=topic durable=true

# Create queue if it doesn't exist
echo "🔧 Configurando fila no RabbitMQ..."
docker compose exec rabbitmq rabbitmqadmin declare queue name=order_events durable=true

# Bind queue to exchange
echo "🔧 Vinculando fila ao exchange..."
docker compose exec rabbitmq rabbitmqadmin declare binding source=orders_exchange destination=order_events routing_key=order.created

echo ""
echo "📊 Configuração atual do batch processor:"
echo "   - Tamanho do batch: 3 eventos"
echo "   - Intervalo do batch: 10 segundos"
echo "   - Processamento com delays realistas"
echo ""

# Function to create a single order
create_order() {
    local order_num=$1
    local order_id=$(uuidgen)
    local customer_id="CUST-$(date +%s)-${order_num}"
    
    # Vary the products and prices for different orders
    local products=(
        '{"productId": "PROD-001", "name": "Smartphone XYZ", "quantity": 1, "unitPrice": 1999.99}'
        '{"productId": "PROD-002", "name": "Laptop ABC", "quantity": 1, "unitPrice": 2999.99}'
        '{"productId": "PROD-003", "name": "Tablet DEF", "quantity": 2, "unitPrice": 899.99}'
        '{"productId": "PROD-004", "name": "Headphones GHI", "quantity": 1, "unitPrice": 299.99}'
        '{"productId": "PROD-005", "name": "Smart Watch JKL", "quantity": 1, "unitPrice": 599.99}'
    )
    
    local product_index=$((order_num % ${#products[@]}))
    local selected_product=${products[$product_index]}
    
    # Calculate total based on selected product
    local total
    case $product_index in
        0) total=1999.99 ;;
        1) total=2999.99 ;;
        2) total=1799.98 ;;  # 2 * 899.99
        3) total=299.99 ;;
        4) total=599.99 ;;
    esac

    # Create order event payload
    local order_payload=$(cat <<EOF
{
    "eventId": "$(uuidgen)",
    "eventType": "OrderCreated",
    "aggregateId": "${order_id}",
    "aggregateType": "Order",
    "version": 1,
    "occurredAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "data": {
        "orderId": "${order_id}",
        "customerId": "${customer_id}",
        "items": [${selected_product}],
        "total": ${total},
        "shippingAddress": {
            "street": "Rua Exemplo, ${order_num}23",
            "city": "São Paulo",
            "state": "SP",
            "zipCode": "01234-567",
            "country": "Brasil"
        },
        "status": "pending"
    }
}
EOF
)

    # Publish message to RabbitMQ
    echo "📤 Publicando ordem #${order_num} (ID: ${order_id:0:8}...)"
    docker compose exec rabbitmq rabbitmqadmin publish exchange=orders_exchange routing_key=order.created payload="$order_payload" > /dev/null
}

echo "🚀 Iniciando criação de ${NUM_ORDERS} ordens..."
echo "⏱️  Aguarde para ver o batch processing em ação..."
echo ""

# Create orders with small delays between them
for i in $(seq 1 $NUM_ORDERS); do
    create_order $i
    
    # Small delay between orders to make it more realistic
    if [ $i -lt $NUM_ORDERS ]; then
        sleep 0.5
    fi
done

echo ""
echo "✅ ${NUM_ORDERS} ordens criadas com sucesso!"
echo ""
echo "🔍 Agora você pode observar:"
echo "   1. Batch processing quando 3 eventos são acumulados"
echo "   2. Processamento detalhado de cada ordem (4-5 segundos cada)"
echo "   3. Timer do batch (10 segundos) para processar eventos restantes"
echo ""
echo "📊 Para acompanhar o processamento em tempo real:"
echo "   docker compose logs app -f"
echo ""
echo "🌐 RabbitMQ Management UI:"
echo "   http://localhost:15672 (guest/guest)" 
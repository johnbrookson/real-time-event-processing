#!/bin/bash

# Script para configurar corretamente o RabbitMQ com exchanges e queues
# Este script limpa configurações existentes e recria tudo do zero

set -e

echo "🔧 Configurando RabbitMQ para o sistema de eventos..."

# Check if RabbitMQ is running
if ! docker compose ps | grep -q "rabbitmq.*Up"; then
    echo "❌ RabbitMQ não está rodando. Por favor, inicie os serviços primeiro com docker-compose up -d"
    exit 1
fi

echo "🗑️ Limpando configurações existentes..."

# Delete existing queues (ignore errors if they don't exist)
docker compose exec rabbitmq rabbitmqadmin delete queue name=order_events || true
docker compose exec rabbitmq rabbitmqadmin delete queue name=dead_letter_queue || true

# Delete existing exchanges (ignore errors if they don't exist)
docker compose exec rabbitmq rabbitmqadmin delete exchange name=orders_exchange || true
docker compose exec rabbitmq rabbitmqadmin delete exchange name=dlx_exchange || true

echo "✅ Configurações antigas removidas"

echo "🔧 Criando exchanges..."

# Create main exchange for orders
docker compose exec rabbitmq rabbitmqadmin declare exchange name=orders_exchange type=topic durable=true
echo "✅ Exchange 'orders_exchange' criado"

# Create Dead Letter Exchange
docker compose exec rabbitmq rabbitmqadmin declare exchange name=dlx_exchange type=direct durable=true
echo "✅ Exchange 'dlx_exchange' criado"

echo "🔧 Criando filas..."

# Create main order events queue
docker compose exec rabbitmq rabbitmqadmin declare queue name=order_events durable=true
echo "✅ Fila 'order_events' criada"

# Create Dead Letter Queue with proper configuration
docker compose exec rabbitmq rabbitmqadmin declare queue name=dead_letter_queue durable=true arguments='{"x-message-ttl":604800000,"x-max-length":10000}'
echo "✅ Fila 'dead_letter_queue' criada com TTL de 7 dias"

echo "🔧 Configurando bindings..."

# Bind main queue to exchange
docker compose exec rabbitmq rabbitmqadmin declare binding source=orders_exchange destination=order_events routing_key=order.created
docker compose exec rabbitmq rabbitmqadmin declare binding source=orders_exchange destination=order_events routing_key=order.completed
docker compose exec rabbitmq rabbitmqadmin declare binding source=orders_exchange destination=order_events routing_key=order.cancelled
echo "✅ Bindings para 'order_events' configurados"

# Bind DLQ to DLX
docker compose exec rabbitmq rabbitmqadmin declare binding source=dlx_exchange destination=dead_letter_queue routing_key=failed
echo "✅ Binding para 'dead_letter_queue' configurado"

echo ""
echo "✅ RabbitMQ configurado com sucesso!"
echo ""
echo "📊 Resumo da configuração:"
echo "   🔄 Exchange: orders_exchange (topic)"
echo "   📥 Queue: order_events"
echo "   ❌ Exchange: dlx_exchange (direct)"
echo "   📮 Queue: dead_letter_queue (TTL: 7 dias, Max: 10k msgs)"
echo ""
echo "🔍 Para verificar a configuração:"
echo "   docker compose exec rabbitmq rabbitmqadmin list exchanges"
echo "   docker compose exec rabbitmq rabbitmqadmin list queues"
echo ""
echo "🌐 Ou acesse o RabbitMQ Management UI:"
echo "   http://localhost:15672 (guest/guest)" 
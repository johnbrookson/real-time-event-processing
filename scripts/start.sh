#!/bin/bash

# E-commerce Event Processor Startup Script
# This script sets up and starts the entire system

set -e

echo "🚀 Starting E-commerce Event Processor..."

# Check if Docker is installed
if ! command docker -v &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if services are already running
if docker compose ps | grep -q "Up"; then
    echo "⚠️ Some services are already running. Stopping them first..."
    docker compose down
fi

echo "📦 Building application image..."
docker compose build app

echo "🔧 Starting infrastructure services..."
docker compose up -d rabbitmq postgres redis

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🏃 Starting application..."
docker compose up -d app

echo "✅ All services started successfully!"
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🌐 Access Points:"
echo "  - Application: http://localhost:3000"
echo "  - RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo "  - PostgreSQL: localhost:5432 (postgres/postgres123)"
echo ""
echo "📝 Useful Commands:"
echo "  - View logs: docker-compose logs -f app"
echo "  - Stop services: docker-compose down"
echo "  - Restart app: docker-compose restart app"
echo ""
echo "🎯 To test event processing, access RabbitMQ Management UI and publish messages to the exchanges." 
# E-commerce Event Processor

## Visão Geral

Sistema robusto de processamento de eventos em tempo real para e-commerce, implementado seguindo os princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **SOLID**, utilizando Node.js, TypeScript, RabbitMQ e processamento em lote.

## 🏗️ Arquitetura

### Contexto Funcional

O sistema processa eventos relacionados ao ciclo de vida de pedidos em uma plataforma de e-commerce:

- **Eventos de Pedidos**: Criação, confirmação, cancelamento, envio e entrega
- **Processamento de Pagamentos**: Validação e processamento de transações
- **Gestão de Inventário**: Controle de estoque em tempo real
- **Notificações**: Comunicação com clientes via email, SMS e push notifications
- **Relatórios**: Processamento em lote para analytics e reconciliação

### Design Patterns Implementados

#### 1. **Strategy Pattern** 
- **Justificativa**: Permite diferentes estratégias de processamento para diferentes tipos de eventos
- **Implementação**: `EventProcessingStrategy` com implementações específicas como `OrderProcessingStrategy`
- **Benefícios**: 
  - Facilita a adição de novos tipos de processamento
  - Separa a lógica de processamento da orquestração
  - Suporte completo a async/await para operações I/O

#### 2. **Observer Pattern**
- **Justificativa**: Desacopla a notificação de eventos do processamento principal
- **Implementação**: `EventObserver` e `EventSubject` para notificações
- **Benefícios**:
  - Baixo acoplamento entre componentes
  - Facilita a adição de novos observadores
  - Processamento assíncrono de notificações

### Clean Architecture + DDD

```
src/
├── shared/                     # Camada Compartilhada
│   ├── domain/                 # Domínio (Entidades, Value Objects, Events)
│   ├── application/            # Casos de Uso e Serviços de Aplicação
│   └── infrastructure/         # Infraestrutura (RabbitMQ, Banco, etc.)
├── order/                      # Bounded Context: Orders
│   ├── domain/                 # Entidades e Eventos de Domínio
│   └── application/            # Casos de Uso específicos de Orders
└── main.ts                     # Ponto de entrada da aplicação
```

## 🚀 Funcionalidades

### Processamento de Eventos
- ✅ Consumo de mensagens do RabbitMQ
- ✅ Processamento assíncrono com async/await
- ✅ Estratégias configuráveis por tipo de evento
- ✅ Suporte a múltiplas filas especializadas

### Processamento em Lote
- ✅ Agrupamento inteligente de eventos
- ✅ Processamento baseado em tamanho e tempo
- ✅ Otimização de performance para alto volume
- ✅ Estatísticas de processamento

### Sistema de Retry e DLQ
- ✅ Retry com backoff exponencial e jitter
- ✅ Dead Letter Queue para eventos falhados
- ✅ Configuração flexível de tentativas
- ✅ Logging detalhado para debugging

### Observabilidade
- ✅ Logging estruturado com diferentes níveis
- ✅ Métricas de processamento em tempo real
- ✅ Health checks para monitoramento
- ✅ Rastreamento de eventos fim-a-fim

## 🛠️ Tecnologias

- **Runtime**: Node.js 18+ com TypeScript
- **Message Broker**: RabbitMQ com padrões Exchange/Queue
- **Database**: PostgreSQL para persistência
- **Cache**: Redis (opcional)
- **Containerização**: Docker + Docker Compose
- **Testing**: Jest com cobertura de testes
- **Logging**: Winston para logs estruturados

## 📦 Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Git

### Execução com Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd ecommerce-event-processor

# 2. Inicie os serviços
docker-compose up -d

# 3. Verifique os logs
docker-compose logs -f app

# 4. Acesse as interfaces
# - Aplicação: http://localhost:3000
# - RabbitMQ Management: http://localhost:15672 (guest/guest)
# - PostgreSQL: localhost:5432
```

### Desenvolvimento Local

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp config.env .env

# 3. Inicie apenas RabbitMQ e PostgreSQL
docker-compose up -d rabbitmq postgres

# 4. Execute em modo desenvolvimento
npm run dev

# 5. Execute os testes
npm test
npm run test:coverage
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
BATCH_SIZE=100
BATCH_INTERVAL_SECONDS=30

# Retry
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000
RETRY_BACKOFF_MULTIPLIER=2

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_events
DB_USER=postgres
DB_PASSWORD=postgres

# Workers
WORKER_CONCURRENCY=5
WORKER_PREFETCH_COUNT=10
```

### Configuração do RabbitMQ

O sistema configura automaticamente:
- **Exchanges**: `orders_exchange` (topic), `dlx_exchange` (direct)
- **Queues**: `order_events`, `payment_events`, `inventory_events`, `notification_events`
- **Dead Letter Queue**: `dead_letter_queue`
- **Bindings**: Roteamento automático por tipo de evento

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch

# Executar linting
npm run lint
npm run lint:fix
```

### Cobertura de Testes

Os testes cobrem:
- ✅ Entidades de domínio (Order, Events)
- ✅ Value Objects (EventId)
- ✅ Design Patterns (Strategy, Observer)
- ✅ Casos de uso principais
- ✅ Cenários de erro e retry

## 📊 Monitoramento

### Health Checks
- **Aplicação**: `GET /health`
- **RabbitMQ**: Conexão ativa e filas funcionais
- **PostgreSQL**: Conectividade e queries básicas

### Métricas Disponíveis
- Events processados por tipo
- Taxa de sucesso/falha
- Latência de processamento
- Tamanho das filas
- Estatísticas de batch processing

### Logs Estruturados

```json
{
  "timestamp": "2024-01-01T10:00:00.000Z",
  "level": "info",
  "message": "Event processed successfully",
  "eventId": "123e4567-e89b-12d3-a456-426614174000",
  "eventType": "OrderCreated",
  "processingTimeMs": 150
}
```

## 🔄 Fluxo de Processamento

### 1. Recepção de Eventos
```
RabbitMQ Queue → MessageHandler → Event Parsing → Validation
```

### 2. Processamento
```
Strategy Selection → Batch Aggregation → Async Processing → Observer Notification
```

### 3. Tratamento de Erros
```
Retry Logic → Exponential Backoff → Dead Letter Queue → Manual Review
```

### 4. Observabilidade
```
Structured Logging → Metrics Collection → Health Monitoring → Alerting
```

## 🚦 Comandos Úteis

### Docker
```bash
# Rebuild da aplicação
docker-compose build app

# Logs de um serviço específico
docker-compose logs -f rabbitmq

# Restart de um serviço
docker-compose restart app

# Parar todos os serviços
docker-compose down

# Limpar volumes (cuidado!)
docker-compose down -v
```

### RabbitMQ Management
```bash
# Acessar container do RabbitMQ
docker exec -it ecommerce-rabbitmq bash

# Listar filas
rabbitmqctl list_queues

# Purgar uma fila
rabbitmqctl purge_queue order_events
```

### PostgreSQL
```bash
# Acessar banco de dados
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce_events

# Ver estatísticas de eventos
SELECT * FROM get_event_statistics();

# Limpar eventos antigos
SELECT cleanup_old_events(30);
```

## 🎯 Cenários de Teste

### Geração de Eventos de Teste
```bash
# Executar gerador de eventos (perfil testing)
docker-compose --profile testing up event-generator

# Gerar eventos manualmente via RabbitMQ Management UI
# Acesse: http://localhost:15672/#/exchanges
```

### Testes de Carga
```bash
# Simular alta carga
for i in {1..1000}; do
  # Publicar eventos via API ou RabbitMQ
done
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Conexão RabbitMQ falhando**
   ```bash
   # Verificar se o serviço está rodando
   docker-compose ps rabbitmq
   
   # Verificar logs
   docker-compose logs rabbitmq
   ```

2. **Eventos na Dead Letter Queue**
   ```bash
   # Verificar DLQ via Management UI
   # Analisar logs de erro na aplicação
   docker-compose logs app | grep ERROR
   ```

3. **Performance lenta**
   ```bash
   # Verificar métricas de batch processing
   # Ajustar BATCH_SIZE e WORKER_PREFETCH_COUNT
   # Monitorar uso de CPU/memória
   ```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Métricas com Prometheus/Grafana
- [ ] Tracing distribuído com Jaeger
- [ ] Cache Redis para performance
- [ ] API REST para consultas
- [ ] Dashboard de monitoramento
- [ ] Autoscaling baseado em carga

### Melhorias Arquiteturais
- [ ] Event Sourcing completo
- [ ] CQRS pattern
- [ ] Saga pattern para transações distribuídas
- [ ] Circuit breaker para resiliência

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🏆 Qualidade do Código

- ✅ Clean Architecture com separação clara de responsabilidades
- ✅ Domain-Driven Design com bounded contexts
- ✅ SOLID principles aplicados consistentemente
- ✅ Design Patterns implementados com async/await
- ✅ Testes unitários com alta cobertura
- ✅ Código TypeScript tipado e documentado
- ✅ Logging e observabilidade completos
- ✅ Dockerização otimizada para produção 
# E-commerce Event Processor

## Visão Geral

Sistema robusto de processamento de eventos em tempo real para e-commerce, implementado seguindo os princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **SOLID**, utilizando Node.js, TypeScript, RabbitMQ e processamento em lote.

## 🚀 **INÍCIO RÁPIDO**

**Para iniciar imediatamente (recomendado para avaliadores):**

```bash
git clone <repository-url>
cd ecommerce-event-processor
./scripts/start.sh  # ← ONE-CLICK STARTUP
```

**Se o comando acima não funcionar**, veja as [soluções de troubleshooting](#-script-scriptsstart-sh-não-executa) mais abaixo.

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
├── shared/                           # Camada Compartilhada
│   ├── domain/                       # Domain Layer
│   │   ├── events/                   # Domain Events (DomainEvent, etc.)
│   │   ├── value-objects/            # Value Objects (EventId, etc.)
│   │   └── Result.ts                 # Result pattern implementation
│   ├── application/                  # Application Layer
│   │   ├── logging/                  # Logging abstractions (Logger, etc.)
│   │   └── patterns/                 # Design Patterns
│   │       ├── observer/             # Observer Pattern (EventObserver)
│   │       └── strategy/             # Strategy Pattern (ProcessingStrategy)
│   └── infrastructure/               # Infrastructure Layer
│       ├── batch/                    # Batch Processing (BatchProcessor)
│       ├── config/                   # Configuration (AppConfig, ConfigFactory)
│       ├── event-processing/         # Event Processing Service
│       ├── messaging/                # RabbitMQ (RabbitMQClient, Handlers)
│       └── retry/                    # Retry Mechanism (RetryMechanism, DLQ)
├── order/                            # Orders Bounded Context
│   ├── domain/                       # Order Domain
│   │   ├── entities/                 # Order, OrderItem
│   │   ├── events/                   # OrderCreated, OrderCompleted, etc.
│   │   ├── repositories/             # Repository interfaces (IOrderRepository)
│   │   └── value-objects/            # Money, Address, OrderId
│   ├── application/                  # Order Application
│   │   └── use-cases/                # CreateOrder, CancelOrder, GetOrder, etc.
│   └── infrastructure/               # Order Infrastructure
│       ├── event-processing/         # OrderProcessingStrategy
│       ├── events/                   # RabbitMQOrderEventPublisher
│       ├── mappers/                  # OrderMapper (Domain ↔ Persistence)
│       ├── messaging/                # Order-specific message handlers
│       ├── persistence/              # OrderModel, database models
│       └── repositories/             # PostgresOrderRepository
├── bootstrap/                        # Application Bootstrap
│   └── DependencyContainer.ts        # Dependency Injection Container
├── __tests__/                        # Integration Tests
│   └── bootstrap/                    # DI Container tests
└── main.ts                           # Application Entry Point
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
- **Logging**: Console logging estruturado

## 📦 Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Git

### 🚀 **INÍCIO RÁPIDO - Método Recomendado**

**Para avaliadores e testes rápidos, use o script de inicialização:**

```bash
# 1. Clone o repositório
git clone <repository-url>
cd ecommerce-event-processor

# 2. Execute o script de inicialização (ONE-CLICK STARTUP)
./scripts/start.sh

# 3. Aguarde a mensagem: "✅ All services started successfully!"
# O script irá:
#   - Verificar pré-requisitos (Docker)
#   - Parar serviços anteriores se houver conflito
#   - Construir a aplicação
#   - Iniciar infraestrutura (RabbitMQ, PostgreSQL, Redis)
#   - Aguardar inicialização completa (~30s)
#   - Iniciar a aplicação
#   - Mostrar status e pontos de acesso
```

**Se o script `start.sh` não funcionar:**
1. **Verifique permissões**: `chmod +x scripts/start.sh`
2. **Verifique Docker**: `docker --version && docker compose version`
3. **Método manual alternativo** (abaixo)

### Execução Manual com Docker

```bash
# 1. Clone o repositório
git clone <repository-url>
cd ecommerce-event-processor

# 2. Inicie os serviços manualmente
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

## 🎯 Scripts de Demonstração

**Para facilitar a avaliação, o projeto inclui scripts prontos para demonstrar todas as funcionalidades:**

```bash
# 📚 Veja o guia completo dos scripts
cat scripts/README.md

# 🚀 Inicialização completa do sistema
./scripts/start.sh

# 🛍️ Demo principal: Batch Processing + Design Patterns  
./scripts/create-multiple-orders.sh

# 🧪 Teste de resilência: Retry + Dead Letter Queue
./scripts/test-retry-dlq.sh

# 📦 Demo rápida: Single order processing
./scripts/create-order.sh
```

**Fluxo recomendado para avaliação:**
1. Execute `./scripts/start.sh` e aguarde inicialização
2. Execute `./scripts/create-multiple-orders.sh` em uma aba
3. Execute `docker compose logs app -f` em outra aba para acompanhar
4. Observe batch processing, design patterns e logs estruturados
5. Execute `./scripts/test-retry-dlq.sh` para ver retry e DLQ

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

### **🚨 Script `./scripts/start.sh` não executa**

**Sintomas**: Erro "Permission denied" ou "Command not found"

**Soluções:**
```bash
# 1. Verificar e corrigir permissões
chmod +x scripts/start.sh
ls -la scripts/start.sh  # Deve mostrar -rwxr-xr-x

# 2. Verificar pré-requisitos
docker --version           # Deve retornar versão do Docker
docker compose version     # Deve retornar versão do Docker Compose

# 3. Execução alternativa
bash scripts/start.sh      # Forçar execução com bash

# 4. Método manual se script falhar completamente
docker-compose down        # Limpar estado anterior
docker-compose build app  # Build da aplicação  
docker-compose up -d       # Iniciar todos os serviços
```

### **🔧 Portas já em uso**

**Sintomas**: Erro "Port already in use" durante inicialização

**Soluções:**
```bash
# Verificar serviços nas portas
lsof -i :3000  # Aplicação
lsof -i :5672  # RabbitMQ  
lsof -i :5432  # PostgreSQL
lsof -i :15672 # RabbitMQ Management

# Parar serviços conflitantes
docker-compose down                    # Para containers
sudo systemctl stop postgresql        # Para PostgreSQL local
sudo systemctl stop rabbitmq-server   # Para RabbitMQ local

# Reiniciar com script
./scripts/start.sh
```

### **⚠️ Serviços não inicializam corretamente**

**Sintomas**: Script completa mas serviços não respondem

**Diagnóstico e soluções:**
```bash
# 1. Verificar status dos containers
docker-compose ps
# Todos devem estar "Up" e "healthy"

# 2. Verificar logs de cada serviço
docker-compose logs app      # Aplicação
docker-compose logs rabbitmq # RabbitMQ
docker-compose logs postgres # PostgreSQL

# 3. Reiniciar serviços específicos
docker-compose restart rabbitmq
sleep 30  # Aguardar inicialização
docker-compose restart app

# 4. Reset completo se necessário
docker-compose down -v  # Remove volumes também
./scripts/start.sh       # Reinicia do zero
```

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
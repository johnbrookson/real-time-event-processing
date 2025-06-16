# 🚀 Scripts de Demonstração - E-commerce Event Processor

Este diretório contém scripts para facilitar a avaliação do sistema pelos revisores técnicos.

## 📋 **Scripts Disponíveis**

### **1. 🚀 `start.sh` - Inicialização Completa**
```bash
./scripts/start.sh
```
**Função**: Inicia todo o sistema (Docker Compose + dependências)
**Uso**: Execute primeiro para configurar o ambiente
**Aguarde**: ~30 segundos para inicialização completa

---

### **2. 📦 `create-order.sh` - Demo Básica**
```bash
./scripts/create-order.sh
```
**Função**: Cria uma única ordem para demo rápida
**Demonstra**: 
- Publicação no RabbitMQ
- Processamento de evento individual
- Logs estruturados

---

### **3. 🛍️ `create-multiple-orders.sh` - Batch Processing**
```bash
./scripts/create-multiple-orders.sh      # 7 ordens (padrão)
./scripts/create-multiple-orders.sh 10   # 10 ordens (customizado)
```
**Função**: Cria múltiplas ordens para demonstrar batch processing
**Demonstra**:
- ✅ Agrupamento em lotes de 3 eventos
- ✅ Timer de 10 segundos para flush automático
- ✅ Processamento paralelo com async/await
- ✅ Métricas de performance detalhadas

**⭐ RECOMENDADO para avaliação principal**

---

### **4. 🧪 `test-retry-dlq.sh` - Teste de Resilência**
```bash
./scripts/test-retry-dlq.sh
```
**Função**: Testa sistema de retry e Dead Letter Queue
**Demonstra**:
- ✅ Eventos com dados inválidos (falhas propositais)
- ✅ Retry com backoff exponencial (3 tentativas)
- ✅ Dead Letter Queue para eventos falhados
- ✅ Logs de erro estruturados

---

## 🎯 **Fluxo Recomendado para Avaliação**

### **Passo 1: Inicialização**
```bash
./scripts/start.sh
```
*Aguarde a mensagem "✅ All services started successfully!"*

### **Passo 2: Teste de Batch Processing (Principal)**
```bash
./scripts/create-multiple-orders.sh
```
*Abra outra aba para acompanhar os logs:*
```bash
docker compose logs app -f
```

### **Passo 3: Teste de Resilência**
```bash
./scripts/test-retry-dlq.sh
```
*Observe retry e DLQ nos logs*

### **Passo 4: Demo Rápida (Opcional)**
```bash
./scripts/create-order.sh
```

---

## 📊 **O que Observar nos Logs**

### **Batch Processing**
```
[INFO] ✅ Batch #1 processing completed {
  totalEvents: 3,
  successCount: 3,
  processingTimeMs: 4500
}
```

### **Strategy Pattern em Ação**
```
[INFO] 🎯 Processing order event with strategy {
  eventType: 'OrderCreated',
  strategy: 'OrderProcessingStrategy'
}
```

### **Observer Pattern**
```
[INFO] 📧 Sending notification for event {
  eventType: 'OrderCreated',
  observer: 'NotificationObserver'
}
```

### **Retry e DLQ**
```
[WARN] 🔄 Retrying failed event (attempt 2/3)
[ERROR] 📮 Sending event to Dead Letter Queue
```

---

## 🌐 **Interfaces de Monitoramento**

- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Application Health**: http://localhost:3000/health
- **Logs em Tempo Real**: `docker compose logs app -f`

---

## 🏆 **Principais Demonstrações**

| Conceito | Script | O que Observar |
|----------|--------|----------------|
| **Design Patterns** | `create-multiple-orders.sh` | Strategy + Observer em logs |
| **Async/Await** | `create-multiple-orders.sh` | Processamento paralelo |
| **Batch Processing** | `create-multiple-orders.sh` | Agrupamento de 3 eventos |
| **Retry Mechanism** | `test-retry-dlq.sh` | 3 tentativas com backoff |
| **Dead Letter Queue** | `test-retry-dlq.sh` | Eventos falhados na DLQ |
| **Clean Architecture** | Todos | Separação de responsabilidades |

---

## 🚨 **Troubleshooting**

### **Se RabbitMQ não responder:**
```bash
docker compose restart rabbitmq
sleep 30
```

### **Se aplicação não iniciar:**
```bash
docker compose logs app
docker compose restart app
```

### **Para limpar e reiniciar:**
```bash
docker compose down
docker compose up -d
```

---

*Estes scripts foram criados para facilitar a avaliação técnica e demonstrar todos os conceitos implementados de forma prática e observável.* 
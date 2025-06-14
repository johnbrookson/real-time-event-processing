
# Desafio Técnico Node.JS: Processamento de Eventos em Tempo Real

## ⚠️ Disclaimer Importante:

A avaliação deste desafio técnico priorizará a qualidade do código, a arquitetura da solução e a aplicação de conceitos de engenharia de software, e não a quantidade de linhas de código produzidas. Soluções concisas, claras e eficientes serão mais valorizadas do que implementações extensas e complexas.

---

## 🎯 Objetivo:

Você está trabalhando em uma plataforma de e-commerce que lida com uma variedade de eventos e tarefas de processamento. A plataforma necessita de um sistema robusto e eficiente que combine o poder do processamento de mensagens assíncronas com o processamento em lote para otimizar suas operações.

Sua tarefa é usar a criatividade para imaginar um cenário funcional onde o uso tanto de RabbitMQ quanto de processamento em lote seja necessário. Pense em situações onde o volume de eventos exige o processamento assíncrono e em tempo real, mas que também se beneficiam do processamento em lotes para tarefas agendadas ou de grande volume.

---

## ✅ Requisitos:

### 1. RabbitMQ:

- O componente deve se conectar a um servidor RabbitMQ e consumir mensagens de uma fila específica.
- Cada mensagem recebida representará um evento a ser processado.

---

### 2. Design Patterns (com Foco em Assincronicidade):

- Ao implementar Design Patterns em um ambiente Node.js para tarefas como interações com RabbitMQ, banco de dados e processamento em lote, é crucial gerenciar operações assíncronas de forma eficaz.
- Promises são essenciais para representar e organizar o fluxo de operações assíncronas (ex.: consultas a banco, envio de mensagens), permitindo sua composição.
- `async/await` simplifica a sintaxe de trabalho com Promises, tornando o código assíncrono mais legível, parecido com código síncrono, e facilitando o rastreamento da lógica, especialmente em sequências de operações.

**Essa abordagem assíncrona dentro dos patterns é vital porque:**

1. Evita o bloqueio da event loop do Node.js, garantindo alta performance em sistemas de tempo real e eficiência no ThreadPool.
2. Facilita o tratamento de erros em cadeias assíncronas (ex.: `try...catch` com `await`).
3. Permite que os componentes dos patterns realizem operações de I/O (rede, banco de dados) eficientemente, sem prejudicar a responsividade da aplicação.

> A implementação deve, portanto, demonstrar como `async/await` e Promises são usados para criar um código claro, de fácil manutenção e robusto dentro da estrutura dos Design Patterns escolhidos.

---

### 3. Design Patterns:

- Você deve implementar pelo menos **dois design patterns** relevantes para o contexto do problema.
- A escolha dos patterns deve ser **justificada**, explicando como eles contribuem para a solução e melhoram a qualidade do código.

---

### 4. Processamento em Lote:

- Implementar um mecanismo de **processamento em lote** que agrupe eventos visando otimizar o desempenho.

---

### 5. Logs e Fluxo de Retry:

- Implementar um sistema de **logs completo**, registrando informações relevantes sobre o processamento de eventos, incluindo erros e avisos.
- Utilizar uma biblioteca de logging para facilitar o gerenciamento de logs.
- Implementar um fluxo de **retry** para mensagens que falham no processamento, permitindo que o sistema se recupere de erros transitórios.
- Definir uma estratégia de retry (ex.: número de tentativas, intervalo entre tentativas, backoff exponencial).
- Implementar um mecanismo de **Dead Letter Queue (DLQ)** para mensagens que falham após várias tentativas de retry.

---

### 6. Dockerização:

- Dockerizar a aplicação Node.js, criando uma **imagem Docker** que contenha todas as dependências necessárias para executar o sistema.
- Criar um arquivo `Dockerfile` bem estruturado, seguindo as melhores práticas para otimizar o tamanho da imagem e o desempenho da aplicação.
- Incluir no `Dockerfile` o processo de construção e empacotamento da aplicação.
- Criar um arquivo `docker-compose.yml` que defina os serviços necessários para executar o sistema completo, incluindo:
  - A aplicação Node dockerizada.
  - Um servidor RabbitMQ.
  - Um banco de dados (ex.: PostgreSQL, MySQL, dependendo da necessidade).
- Configurar as dependências entre os serviços, garantindo que a aplicação só inicie após o RabbitMQ e o banco de dados estarem em execução.
- Expor as portas necessárias para acessar a aplicação, o RabbitMQ e o banco de dados.

---

### 7. Configuração:

- Permitir a configuração de parâmetros importantes do sistema (ex.: número de threads, configurações de retry) por meio de arquivos de configuração ou variáveis de ambiente.

---

### 8. Testes Unitários:

- Você deve escrever **testes unitários** para garantir a corretude do código e a robustez do sistema.
- Os testes devem cobrir os principais cenários de processamento de eventos e as interações com o RabbitMQ.

---

### 9. Contexto Funcional:

- Definir um **contexto funcional específico** para o problema, explicando:
  - Qual tipo de evento será processado.
  - Qual o resultado esperado.
- O contexto funcional deve justificar o uso do RabbitMQ e dos Design Patterns escolhidos.

---

## 🚀 Entregáveis:

- Compartilhar o repositório com os e-mails:
  - [rodrigo.cavreti@trademaster.com.br](mailto:rodrigo.cavreti@trademaster.com.br)
  - [eric.ueda@trademaster.com.br](mailto:eric.ueda@trademaster.com.br)
  - [cleyton.camargo@trademaster.com.br](mailto:cleyton.camargo@trademaster.com.br)

- Documentação explicando:
  - O contexto funcional.
  - A arquitetura da solução.
  - Os Design Patterns utilizados.

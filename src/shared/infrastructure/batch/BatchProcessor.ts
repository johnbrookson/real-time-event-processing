// Conteúdo do arquivo batch-processor.ts 

import { Logger } from '@shared/application/logging/logger';

export interface BatchProcessorConfig {
  batchSize: number;
  batchIntervalMs: number;
  maxWaitTimeMs: number;
}

export class BatchProcessor {
  private readonly logger: Logger;
  private readonly config: BatchProcessorConfig;
  private strategies: Map<string, any> = new Map();

  constructor(logger: Logger, config: BatchProcessorConfig) {
    this.logger = logger;
    this.config = config;
  }

  registerStrategy(eventType: string, strategy: any): void {
    this.strategies.set(eventType, strategy);
    this.logger.info(`Registered strategy for event type: ${eventType}`);
  }

  async addEvent(event: any): Promise<void> {
    // Implementação mínima: apenas loga o evento
    this.logger.info(`Evento adicionado ao batch: ${event.eventType}`);
  }

  async shutdown(): Promise<void> {
    // Implementação mínima: apenas loga o shutdown
    this.logger.info('BatchProcessor shutdown chamado');
  }

  // Métodos básicos podem ser implementados conforme necessário
} 
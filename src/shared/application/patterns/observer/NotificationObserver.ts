import { DomainEvent } from '../../../domain/events/DomainEvent';
import { EventObserver } from './EventObserver';
import { Logger } from '../../logging/logger';

/**
 * Notification Observer implementing Observer Pattern
 * 
 * Handles domain events by sending notifications (email, SMS, push notifications, etc.)
 * This observer is interested in all events that require user notification.
 */
export class NotificationObserver implements EventObserver {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Handles domain events asynchronously
   */
  async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.info(`Processing notification for event: ${event.eventType}`, {
      eventId: event.eventId.value,
      aggregateId: event.aggregateId
    });

    try {
      // Process the event for notifications
      await this.processNotification(event);
      
      this.logger.info(`Notification processed successfully for event: ${event.eventType}`, {
        eventId: event.eventId.value
      });
    } catch (error) {
      this.logger.error(`Failed to process notification for event: ${event.eventType}`, {
        eventId: event.eventId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Determines if this observer is interested in the given event type
   */
  isInterestedIn(eventType: string): boolean {
    // This observer is interested in all order-related events
    const interestedEvents = [
      'OrderCreated',
      'OrderCancelled', 
      'OrderCompleted'
    ];
    
    return interestedEvents.includes(eventType);
  }

  /**
   * Returns the observer name for logging and debugging
   */
  getObserverName(): string {
    return 'NotificationObserver';
  }

  /**
   * Process notification based on event type
   */
  private async processNotification(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderCreated':
        await this.sendOrderCreatedNotification(event);
        break;
      case 'OrderCancelled':
        await this.sendOrderCancelledNotification(event);
        break;
      case 'OrderCompleted':
        await this.sendOrderCompletedNotification(event);
        break;
      default:
  
    }
  }

  private async sendOrderCreatedNotification(event: DomainEvent): Promise<void> {
    this.logger.info('Sending order created notification', {
      eventId: event.eventId.value,
      data: event.data
    });
    
    // TODO: Implement actual notification sending logic
    // For example: email service, SMS service, push notification service
  }

  private async sendOrderCancelledNotification(event: DomainEvent): Promise<void> {
    this.logger.info('Sending order cancelled notification', {
      eventId: event.eventId.value,
      data: event.data
    });
    
    // TODO: Implement actual notification sending logic
  }

  private async sendOrderCompletedNotification(event: DomainEvent): Promise<void> {
    this.logger.info('Sending order completed notification', {
      eventId: event.eventId.value,
      data: event.data
    });
    
    // TODO: Implement actual notification sending logic
  }
} 
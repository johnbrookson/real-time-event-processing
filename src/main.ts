import 'reflect-metadata';
import { Application } from './bootstrap/Application';

/**
 * Application Entry Point
 * 
 * Simple entry point that creates and starts the application
 * using dependency injection container for all component management.
 */
async function main(): Promise<void> {
  try {
    const app = new Application();
    await app.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main();
} 
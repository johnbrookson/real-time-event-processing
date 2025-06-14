-- E-commerce Events Database Initialization
-- This script sets up the database schema for event storage and processing

-- Create database if it doesn't exist (handled by docker-compose)

-- Create event store table for event sourcing
CREATE TABLE IF NOT EXISTS event_store (
    id SERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    occurred_on TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_event_store_event_id (event_id),
    INDEX idx_event_store_aggregate_id (aggregate_id),
    INDEX idx_event_store_event_type (event_type),
    INDEX idx_event_store_occurred_on (occurred_on),
    INDEX idx_event_store_aggregate_type_id (aggregate_type, aggregate_id)
);

-- Create dead letter queue table for failed events
CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id SERIAL PRIMARY KEY,
    original_event_id UUID NOT NULL,
    original_event_type VARCHAR(255) NOT NULL,
    original_aggregate_id VARCHAR(255) NOT NULL,
    original_event_data JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    failure_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_dlq_event_id (original_event_id),
    INDEX idx_dlq_event_type (original_event_type),
    INDEX idx_dlq_failure_timestamp (failure_timestamp),
    INDEX idx_dlq_resolved (resolved)
);

-- Create orders table for order aggregate storage
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_orders_customer_id (customer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at)
);

-- Create processing logs table for audit and debugging
CREATE TABLE IF NOT EXISTS processing_logs (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    processor_name VARCHAR(255) NOT NULL,
    processing_status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'RETRYING'
    processing_duration_ms INTEGER,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_processing_logs_event_id (event_id),
    INDEX idx_processing_logs_status (processing_status),
    INDEX idx_processing_logs_processed_at (processed_at)
);

-- Create batch processing statistics table
CREATE TABLE IF NOT EXISTS batch_statistics (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    batch_size INTEGER NOT NULL,
    processing_duration_ms INTEGER NOT NULL,
    success_count INTEGER NOT NULL,
    failure_count INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_batch_stats_batch_id (batch_id),
    INDEX idx_batch_stats_event_type (event_type),
    INDEX idx_batch_stats_completed_at (completed_at)
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'PUSH'
    notification_status VARCHAR(50) NOT NULL, -- 'SENT', 'FAILED', 'PENDING'
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_notification_logs_event_id (event_id),
    INDEX idx_notification_logs_customer_id (customer_id),
    INDEX idx_notification_logs_type (notification_type),
    INDEX idx_notification_logs_status (notification_status)
);

-- Insert sample data for testing
INSERT INTO orders (id, customer_id, status, total_amount, items) VALUES
('order-001', 'customer-001', 'PENDING', 250.00, '[{"productId": "product-1", "quantity": 2, "unitPrice": 100.00, "totalPrice": 200.00}, {"productId": "product-2", "quantity": 1, "unitPrice": 50.00, "totalPrice": 50.00}]'),
('order-002', 'customer-002', 'CONFIRMED', 150.00, '[{"productId": "product-3", "quantity": 3, "unitPrice": 50.00, "totalPrice": 150.00}]'),
('order-003', 'customer-001', 'SHIPPED', 75.00, '[{"productId": "product-4", "quantity": 1, "unitPrice": 75.00, "totalPrice": 75.00}]')
ON CONFLICT (id) DO NOTHING;

-- Create stored procedures for common operations

-- Function to clean up old processed events (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM event_store 
    WHERE occurred_on < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO processing_logs (event_id, event_type, processor_name, processing_status, processing_duration_ms)
    VALUES (
        gen_random_uuid(), 
        'CLEANUP_OPERATION', 
        'cleanup_old_events', 
        'SUCCESS', 
        0
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days')
RETURNS TABLE(
    event_type VARCHAR,
    event_count BIGINT,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.event_type,
        COUNT(es.id) as event_count,
        ROUND(
            (COUNT(CASE WHEN pl.processing_status = 'SUCCESS' THEN 1 END)::DECIMAL / COUNT(es.id) * 100), 
            2
        ) as success_rate
    FROM event_store es
    LEFT JOIN processing_logs pl ON es.event_id = pl.event_id
    WHERE es.occurred_on >= start_date
    GROUP BY es.event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_store_composite 
ON event_store (aggregate_type, aggregate_id, event_version);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_logs_composite 
ON processing_logs (event_type, processing_status, processed_at);

-- Grant permissions (if needed for specific user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce_user; 
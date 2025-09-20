-- Optimized database schema for high-performance image processing platform

-- 1. Main tables with proper indexing
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    api_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monthly_quota_used INTEGER DEFAULT 0,
    INDEX idx_api_key (api_key),
    INDEX idx_tier_active (tier, last_active)
);

-- Partitioned table for processing history (partition by month)
CREATE TABLE processing_history (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_id VARCHAR(255),
    input_format VARCHAR(10),
    output_format VARCHAR(10),
    input_size_bytes BIGINT,
    output_size_bytes BIGINT,
    compression_ratio DECIMAL(5,2),
    processing_time_ms INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE processing_history_2024_01 PARTITION OF processing_history
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Add more partitions as needed

-- Indexes for common queries
CREATE INDEX idx_processing_user_created ON processing_history (user_id, created_at DESC);
CREATE INDEX idx_processing_status ON processing_history (status) WHERE status != 'completed';
CREATE INDEX idx_processing_format ON processing_history (input_format, output_format);
CREATE INDEX idx_processing_metadata ON processing_history USING GIN (metadata);

-- API usage tracking with rate limiting support
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INTEGER,
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    INDEX idx_api_usage_user_time (user_id, timestamp),
    INDEX idx_api_usage_endpoint (endpoint, timestamp)
);

-- Cached conversion results for common operations
CREATE TABLE conversion_cache (
    cache_key VARCHAR(64) PRIMARY KEY, -- MD5 hash of input file + settings
    input_url TEXT,
    output_url TEXT,
    format_from VARCHAR(10),
    format_to VARCHAR(10),
    quality INTEGER,
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    INDEX idx_cache_accessed (last_accessed),
    INDEX idx_cache_format (format_from, format_to)
);

-- 2. Materialized views for analytics
CREATE MATERIALIZED VIEW daily_usage_stats AS
SELECT 
    DATE(created_at) as date,
    user_id,
    tier,
    COUNT(*) as total_conversions,
    SUM(input_size_bytes) as total_input_bytes,
    SUM(output_size_bytes) as total_output_bytes,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(DISTINCT input_format || '->' || output_format) as unique_conversions,
    JSONB_BUILD_OBJECT(
        'formats', JSONB_AGG(DISTINCT input_format),
        'avg_compression', AVG(compression_ratio)
    ) as metadata
FROM processing_history h
JOIN users u ON h.user_id = u.id
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), user_id, tier;

CREATE UNIQUE INDEX ON daily_usage_stats (date, user_id);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_stats;
END;
$$ LANGUAGE plpgsql;

-- 3. Connection pooling configuration (in your application)
-- PostgreSQL connection pool settings
-- pool_size: 20
-- max_overflow: 10
-- pool_timeout: 30
-- pool_recycle: 3600

-- 4. Query optimization functions
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID, p_period INTERVAL DEFAULT INTERVAL '30 days')
RETURNS TABLE (
    total_conversions BIGINT,
    total_bytes_processed BIGINT,
    favorite_format TEXT,
    tier_limit INTEGER,
    usage_percentage DECIMAL
) AS $$
DECLARE
    v_tier VARCHAR(20);
    v_limit INTEGER;
BEGIN
    -- Get user tier
    SELECT tier INTO v_tier FROM users WHERE id = p_user_id;
    
    -- Set limits based on tier
    v_limit := CASE v_tier
        WHEN 'enterprise' THEN 999999
        WHEN 'premium' THEN 10000
        WHEN 'free' THEN 100
        ELSE 100
    END;
    
    RETURN QUERY
    WITH usage_data AS (
        SELECT 
            COUNT(*) as conv_count,
            SUM(input_size_bytes) as bytes_total,
            MODE() WITHIN GROUP (ORDER BY output_format) as fav_format
        FROM processing_history
        WHERE user_id = p_user_id 
        AND created_at >= CURRENT_TIMESTAMP - p_period
    )
    SELECT 
        conv_count,
        bytes_total,
        fav_format,
        v_limit,
        ROUND((conv_count::DECIMAL / v_limit) * 100, 2)
    FROM usage_data;
END;
$$ LANGUAGE plpgsql;

-- 5. Automatic cleanup and maintenance
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
    -- Delete cache entries not accessed in 7 days
    DELETE FROM conversion_cache 
    WHERE last_accessed < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Delete old API logs
    DELETE FROM api_usage 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Vacuum and analyze tables
    VACUUM ANALYZE processing_history;
    VACUUM ANALYZE conversion_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job (use pg_cron or external scheduler)
-- SELECT cron.schedule('cleanup-job', '0 3 * * *', 'SELECT cleanup_old_cache();');

-- 6. Rate limiting helper
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_endpoint VARCHAR(100),
    p_window_minutes INTEGER DEFAULT 1,
    p_max_requests INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM api_usage
    WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND timestamp >= CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL;
    
    RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- 7. Performance monitoring queries
-- Get slow queries
CREATE OR REPLACE VIEW slow_operations AS
SELECT 
    user_id,
    job_id,
    input_format || '->' || output_format as conversion,
    processing_time_ms,
    input_size_bytes / 1024 / 1024 as size_mb,
    created_at
FROM processing_history
WHERE processing_time_ms > 5000
ORDER BY processing_time_ms DESC
LIMIT 100;

-- Monitor cache hit rate
CREATE OR REPLACE VIEW cache_performance AS
SELECT 
    format_from || '->' || format_to as conversion,
    COUNT(*) as cache_entries,
    SUM(access_count) as total_hits,
    AVG(size_bytes / 1024 / 1024) as avg_size_mb,
    MAX(last_accessed) as last_used
FROM conversion_cache
GROUP BY format_from, format_to
ORDER BY total_hits DESC;
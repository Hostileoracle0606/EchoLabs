export interface RedisConfig {
  url?: string;
}

export class RedisClient {
  private config: RedisConfig;

  constructor(config: RedisConfig = {}) {
    this.config = config;
  }

  async connect() {
    // TODO: Connect to Redis using ioredis/redis client.
  }

  async disconnect() {
    // TODO: Disconnect Redis client.
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    // TODO: Set key with optional TTL.
    void key;
    void value;
    void ttlSeconds;
  }

  async get(key: string): Promise<string | null> {
    // TODO: Get key from Redis.
    void key;
    return null;
  }
}

const globalForRedis = global as unknown as { redisClient?: RedisClient };

export function getRedisClient(): RedisClient {
  if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = new RedisClient({ url: process.env.REDIS_URL });
  }
  return globalForRedis.redisClient;
}

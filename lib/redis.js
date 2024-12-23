import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1', // Redis server host
  port: 6379,        // Redis server port
});

export default redis;
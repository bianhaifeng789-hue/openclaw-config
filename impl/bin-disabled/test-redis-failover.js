/**
 * 测试 Redis 故障自动切换
 */

const { RedisSessionStore } = require('./redis-session-store');

async function testFailover() {
  console.log('=== Testing Redis Failover ===\n');

  // 测试 1: Redis 正常
  console.log('Test 1: Redis available');
  const store1 = new RedisSessionStore();
  await store1.connect();
  console.log('  Backend:', store1.useJSON ? 'JSON' : 'Redis');
  console.log('  Connected:', store1.connected);
  await store1.disconnect();

  // 测试 2: 模拟 Redis 故障（错误端口）
  console.log('\nTest 2: Redis unavailable (wrong port)');
  process.env.REDIS_PORT = '9999';
  const store2 = new RedisSessionStore();
  await store2.connect();
  console.log('  Backend:', store2.useJSON ? 'JSON (fallback)' : 'Redis');
  console.log('  Connected:', store2.connected);
  
  // 测试数据写入（降级模式）
  await store2.set('failover-test', { test: 'failover', time: Date.now() });
  const data = await store2.get('failover-test');
  console.log('  Data written (JSON fallback):', !!data);
  
  delete process.env.REDIS_PORT;

  console.log('\n✓ Failover test completed');
}

testFailover().catch(console.error);

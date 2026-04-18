#!/usr/bin/env node
/**
 * LLM Client Test - 测试中转API连接
 *
 * 配置：
 * - baseUrl: https://lucen.cc/v1
 * - apiKey: 从 OPENAI_API_KEY 读取
 * - model: gpt-5.4
 *
 * 用法：
 *   node test-llm-client.js
 */

const https = require('https');

// 配置（来自用户提供）
const config = {
  baseUrl: process.env.OPENAI_BASE_URL || 'https://lucen.cc/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.HARNESS_MODEL || 'gpt-5.4'
};

/**
 * 测试 LLM API 连接
 */
async function testLLMConnection() {
  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  console.log('================================');
  console.log('🔍 测试中转API连接');
  console.log('================================');
  console.log('');
  console.log('Base URL:', config.baseUrl);
  console.log('Model:', config.model);
  console.log('API Key:', config.apiKey.slice(0, 20) + '...');
  console.log('');

  // 测试请求
  const testRequest = {
    model: config.model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello! Please respond with "API test successful".' }
    ],
    max_tokens: 100
  };

  console.log('发送测试请求...');
  console.log('Request:', JSON.stringify(testRequest, null, 2));
  console.log('');

  try {
    // 发送 HTTP 请求
    const response = await sendRequest('/chat/completions', testRequest);
    
    console.log('✅ API 连接成功！');
    console.log('');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // 检查响应
    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      console.log('');
      console.log('模型响应:', content);
      
      return {
        success: true,
        content,
        model: response.model,
        usage: response.usage
      };
    } else {
      console.log('⚠️ API 返回空响应');
      return { success: false, error: 'empty_response' };
    }
    
  } catch (err) {
    console.log('❌ API 连接失败！');
    console.log('Error:', err.message);
    
    return { success: false, error: err.message };
  }
}

/**
 * 发送 HTTP 请求
 */
async function sendRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.baseUrl + endpoint);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (res.statusCode >= 400) {
            reject(new Error(`API error ${res.statusCode}: ${response.error?.message || body}`));
          } else {
            resolve(response);
          }
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}\nBody: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 测试 tool calls 支持
 */
async function testToolCalls() {
  console.log('');
  console.log('================================');
  console.log('🔍 测试 tool_calls 支持');
  console.log('================================');
  console.log('');

  const testRequest = {
    model: config.model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant with access to tools.' },
      { role: 'user', content: 'What is the weather in Tokyo? Use the weather tool.' }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the current weather for a city',
          parameters: {
            type: 'object',
            required: ['city'],
            properties: {
              city: { type: 'string', description: 'City name' }
            }
          }
        }
      }
    ],
    tool_choice: 'auto',
    parallel_tool_calls: true
  };

  console.log('发送 tool_calls 测试请求...');
  
  try {
    const response = await sendRequest('/chat/completions', testRequest);
    
    console.log('✅ tool_calls 测试成功！');
    console.log('');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // 检查是否有 tool_calls
    const choice = response.choices[0];
    if (choice.message.tool_calls) {
      console.log('');
      console.log('模型返回 tool_calls:', choice.message.tool_calls.length);
      console.log('Tool calls:', JSON.stringify(choice.message.tool_calls, null, 2));
      
      return {
        success: true,
        hasToolCalls: true,
        toolCalls: choice.message.tool_calls
      };
    } else {
      console.log('');
      console.log('模型返回文本响应（无 tool_calls）');
      console.log('Content:', choice.message.content);
      
      return {
        success: true,
        hasToolCalls: false,
        content: choice.message.content
      };
    }
    
  } catch (err) {
    console.log('❌ tool_calls 测试失败！');
    console.log('Error:', err.message);
    
    return { success: false, error: err.message };
  }
}

/**
 * 创建真实 LLM Client
 */
function createRealLLMClient() {
  return async (kwargs) => {
    console.log('[LLM Client] Calling model:', kwargs.model || config.model);
    console.log('[LLM Client] Messages:', kwargs.messages.length);
    
    // 合并配置
    const request = {
      model: kwargs.model || config.model,
      messages: kwargs.messages,
      max_tokens: kwargs.max_tokens || 16384,
      ...kwargs
    };
    
    // 发送请求
    const response = await sendRequest('/chat/completions', request);
    
    return response;
  };
}

/**
 * CLI 入口
 */
async function main() {
  // 测试基本连接
  const result1 = await testLLMConnection();
  
  // 测试 tool_calls
  if (result1.success) {
    const result2 = await testToolCalls();
    
    // 总结
    console.log('');
    console.log('================================');
    console.log('📊 测试总结');
    console.log('================================');
    console.log('');
    console.log('基本连接:', result1.success ? '✅ 成功' : '❌ 失败');
    console.log('tool_calls:', result2.success ? (result2.hasToolCalls ? '✅ 支持' : '⚠️ 无返回') : '❌ 失败');
    console.log('');
    
    if (result1.success && result2.success) {
      console.log('✅ 中转API 可用于 Agent Core！');
      console.log('');
      console.log('使用方法:');
      console.log('1. 设置环境变量:');
      console.log('   export OPENAI_API_KEY=' + config.apiKey);
      console.log('   export OPENAI_BASE_URL=' + config.baseUrl);
      console.log('   export HARNESS_MODEL=' + config.model);
      console.log('');
      console.log('2. 或在代码中使用:');
      console.log('   const llmClient = createRealLLMClient();');
      console.log('   const agent = new Agent("builder", prompt, tools, middlewares, { llmClient });');
    }
  }
}

// Export
module.exports = { testLLMConnection, testToolCalls, createRealLLMClient, config };

// Run CLI
if (require.main === module) {
  main();
}
#!/usr/bin/env node
/**
 * LLM Client - 真实 LLM API 客户端
 *
 * 支持的中转API：
 * - Base URL: https://lucen.cc/v1
 * - Model: gpt-5.4
 * - parallel_tool_calls 支持
 *
 * 用法：
 *   const llmClient = require('./llm-client');
 *   const response = await llmClient(kwargs);
 */

const https = require('https');

// 配置（从环境变量读取，或使用默认值）
const config = {
  baseUrl: process.env.OPENAI_BASE_URL || 'https://lucen.cc/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.HARNESS_MODEL || 'gpt-5.4'
};

/**
 * LLM Client - 调用 OpenAI compatible API
 */
async function llmClient(kwargs) {
  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  console.log('[LLM Client] Calling model:', kwargs.model || config.model);
  console.log('[LLM Client] Messages:', kwargs.messages.length);
  console.log('[LLM Client] Tools:', kwargs.tools ? kwargs.tools.length : 0);
  console.log('[LLM Client] parallel_tool_calls:', kwargs.parallel_tool_calls || false);

  // 合并配置
  const request = {
    model: kwargs.model || config.model,
    messages: kwargs.messages,
    max_tokens: kwargs.max_tokens || 16384
  };

  // 添加 tools（如果启用）
  if (kwargs.tools && kwargs.tools.length > 0) {
    request.tools = kwargs.tools;
    request.tool_choice = kwargs.tool_choice || 'auto';
    
    // 关键：parallel_tool_calls
    if (kwargs.parallel_tool_calls) {
      request.parallel_tool_calls = true;
    }
  }

  // 其他参数
  if (kwargs.temperature) request.temperature = kwargs.temperature;
  if (kwargs.top_p) request.top_p = kwargs.top_p;
  if (kwargs.stop) request.stop = kwargs.stop;

  // 发送请求
  try {
    const response = await sendRequest('/chat/completions', request);
    
    console.log('[LLM Client] Response received');
    console.log('[LLM Client] Finish reason:', response.choices[0].finish_reason);
    console.log('[LLM Client] Tool calls:', response.choices[0].message.tool_calls ? response.choices[0].message.tool_calls.length : 0);
    
    return response;
    
  } catch (err) {
    console.log('[LLM Client] Error:', err.message);
    throw err;
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
      },
      timeout: 300000 // 5 分钟超时
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
            const errorMsg = response.error?.message || body;
            reject(new Error(`API error ${res.statusCode}: ${errorMsg}`));
          } else {
            resolve(response);
          }
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}\nBody: ${body.slice(0, 500)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (5 minutes)'));
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 简化 LLM 调用（用于 summarization）
 */
async function llmCallSimple(messages) {
  console.log('[LLM Client Simple] Calling for summarization...');
  
  const request = {
    model: config.model,
    messages,
    max_tokens: 10000
  };
  
  try {
    const response = await sendRequest('/chat/completions', request);
    return response.choices[0].message.content || '';
  } catch (err) {
    console.log('[LLM Client Simple] Error:', err.message);
    return '[context summarization failed — continuing with truncated context]';
  }
}

// Export
module.exports = {
  llmClient,
  llmCallSimple,
  config
};
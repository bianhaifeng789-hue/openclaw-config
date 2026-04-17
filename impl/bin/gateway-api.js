#!/usr/bin/env node
/**
 * OpenClaw Gateway API - 统一REST接口
 * 
 * 借鉴 DeerFlow 2.0 的 Gateway API 设计
 * 提供统一的REST接口用于：
 * - 模型管理
 * - Skills管理
 * - MCP配置
 * - 线程管理
 * - 文件上传/下载
 * - 任务状态查询
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/app/main.py (Gateway API路由)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const WORKSPACE = path.join(__dirname, '..', '..');
const STATE_DIR = path.join(WORKSPACE, 'state');

/**
 * Gateway API Router
 */
class GatewayAPI {
  constructor(config = {}) {
    this.port = config.port || 8001;
    this.app = express();
    this.config = this.loadConfig();
    
    this.setupRoutes();
  }

  /**
   * Load gateway config
   */
  loadConfig() {
    try {
      const configFile = path.join(WORKSPACE, 'gateway-config.yaml');
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        return yaml.parse(content);
      }
    } catch (err) {
      console.error('[gateway-api] Load config failed:', err.message);
    }
    return {};
  }

  /**
   * Setup REST routes
   */
  setupRoutes() {
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // JSON parser
    this.app.use(express.json());

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Models API
    this.app.get('/api/models', this.listModels.bind(this));
    this.app.get('/api/models/:name', this.getModel.bind(this));

    // Skills API
    this.app.get('/api/skills', this.listSkills.bind(this));
    this.app.get('/api/skills/:name', this.getSkill.bind(this));
    this.app.put('/api/skills/:name', this.updateSkill.bind(this));

    // MCP API
    this.app.get('/api/mcp', this.listMCP.bind(this));
    this.app.get('/api/mcp/:name', this.getMCP.bind(this));
    this.app.put('/api/mcp/:name', this.updateMCP.bind(this));

    // Threads API
    this.app.get('/api/threads', this.listThreads.bind(this));
    this.app.get('/api/threads/:id', this.getThread.bind(this));
    this.app.delete('/api/threads/:id', this.deleteThread.bind(this));

    // Uploads API
    this.app.post('/api/threads/:id/uploads', this.uploadFiles.bind(this));
    this.app.get('/api/threads/:id/uploads', this.listUploads.bind(this));

    // Artifacts API
    this.app.get('/api/threads/:id/artifacts', this.listArtifacts.bind(this));
    this.app.get('/api/threads/:id/artifacts/:filename', this.downloadArtifact.bind(this));

    // Suggestions API
    this.app.get('/api/threads/:id/suggestions', this.getSuggestions.bind(this));

    // Status API
    this.app.get('/api/status', this.getStatus.bind(this));

    // Doctor API
    this.app.get('/api/doctor', this.runDoctor.bind(this));

    // Config API
    this.app.get('/api/config', this.getConfig.bind(this));
    this.app.put('/api/config', this.updateConfig.bind(this));
  }

  /**
   * List models
   */
  listModels(req, res) {
    try {
      const models = this.config.llm?.providers || [];
      const modelList = models.flatMap(provider => 
        provider.models.map(model => ({
          name: model.name,
          provider: provider.name,
          type: provider.type,
          supports_thinking: model.supports_thinking || false,
          supports_vision: model.supports_vision || false,
          max_tokens: model.max_tokens || 4096
        }))
      );
      
      res.json({ models: modelList, total: modelList.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get model by name
   */
  getModel(req, res) {
    try {
      const { name } = req.params;
      const providers = this.config.llm?.providers || [];
      
      for (const provider of providers) {
        const model = provider.models.find(m => m.name === name);
        if (model) {
          res.json({
            name: model.name,
            provider: provider.name,
            type: provider.type,
            ...model
          });
          return;
        }
      }
      
      res.status(404).json({ error: `Model ${name} not found` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List skills
   */
  listSkills(req, res) {
    try {
      const skillsDir = path.join(WORKSPACE, 'skills');
      const skills = fs.readdirSync(skillsDir)
        .filter(dir => fs.statSync(path.join(skillsDir, dir)).isDirectory())
        .map(dir => {
          const skillPath = path.join(skillsDir, dir, 'SKILL.md');
          if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, 'utf8');
            const frontmatter = this.parseFrontmatter(content);
            return {
              name: dir,
              description: frontmatter.description || '',
              enabled: true
            };
          }
          return { name: dir, description: '', enabled: true };
        });
      
      res.json({ skills, total: skills.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get skill by name
   */
  getSkill(req, res) {
    try {
      const { name } = req.params;
      const skillPath = path.join(WORKSPACE, 'skills', name, 'SKILL.md');
      
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf8');
        const frontmatter = this.parseFrontmatter(content);
        res.json({
          name,
          description: frontmatter.description || '',
          content,
          enabled: true
        });
      } else {
        res.status(404).json({ error: `Skill ${name} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update skill
   */
  updateSkill(req, res) {
    try {
      const { name } = req.params;
      const { enabled } = req.body;
      
      const extensionsConfig = this.loadExtensionsConfig();
      if (!extensionsConfig.skills) {
        extensionsConfig.skills = {};
      }
      
      extensionsConfig.skills[name] = { enabled };
      this.saveExtensionsConfig(extensionsConfig);
      
      res.json({ name, enabled, success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List MCP servers
   */
  listMCP(req, res) {
    try {
      const extensionsConfig = this.loadExtensionsConfig();
      const mcpServers = extensionsConfig.mcpServers || {};
      
      const mcpList = Object.entries(mcpServers).map(([name, config]) => ({
        name,
        type: config.type || 'stdio',
        enabled: config.enabled !== false,
        url: config.url || null,
        command: config.command || null
      }));
      
      res.json({ mcpServers: mcpList, total: mcpList.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get MCP server by name
   */
  getMCP(req, res) {
    try {
      const { name } = req.params;
      const extensionsConfig = this.loadExtensionsConfig();
      const mcpConfig = extensionsConfig.mcpServers?.[name];
      
      if (mcpConfig) {
        res.json({ name, ...mcpConfig });
      } else {
        res.status(404).json({ error: `MCP server ${name} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update MCP server
   */
  updateMCP(req, res) {
    try {
      const { name } = req.params;
      const updates = req.body;
      
      const extensionsConfig = this.loadExtensionsConfig();
      if (!extensionsConfig.mcpServers) {
        extensionsConfig.mcpServers = {};
      }
      
      extensionsConfig.mcpServers[name] = {
        ...extensionsConfig.mcpServers[name],
        ...updates
      };
      
      this.saveExtensionsConfig(extensionsConfig);
      
      res.json({ name, ...extensionsConfig.mcpServers[name], success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List threads
   */
  listThreads(req, res) {
    try {
      const threadsDir = path.join(WORKSPACE, '.openclaw-data', 'threads');
      if (!fs.existsSync(threadsDir)) {
        res.json({ threads: [], total: 0 });
        return;
      }
      
      const threads = fs.readdirSync(threadsDir)
        .filter(dir => fs.statSync(path.join(threadsDir, dir)).isDirectory())
        .map(dir => ({
          thread_id: dir,
          created_at: fs.statSync(path.join(threadsDir, dir)).birthtime
        }));
      
      res.json({ threads, total: threads.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get thread by ID
   */
  getThread(req, res) {
    try {
      const { id } = req.params;
      const threadDir = path.join(WORKSPACE, '.openclaw-data', 'threads', id);
      
      if (fs.existsSync(threadDir)) {
        const stats = fs.statSync(threadDir);
        res.json({
          thread_id: id,
          created_at: stats.birthtime,
          path: threadDir
        });
      } else {
        res.status(404).json({ error: `Thread ${id} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete thread
   */
  deleteThread(req, res) {
    try {
      const { id } = req.params;
      const threadDir = path.join(WORKSPACE, '.openclaw-data', 'threads', id);
      
      if (fs.existsSync(threadDir)) {
        fs.rmSync(threadDir, { recursive: true });
        res.json({ thread_id: id, deleted: true });
      } else {
        res.status(404).json({ error: `Thread ${id} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Upload files to thread
   */
  uploadFiles(req, res) {
    try {
      const { id } = req.params;
      const files = req.body.files || [];
      
      const uploadsDir = path.join(WORKSPACE, '.openclaw-data', 'threads', id, 'user-data', 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      
      const uploadedFiles = files.map(file => {
        const filePath = path.join(uploadsDir, file.name);
        fs.writeFileSync(filePath, file.content);
        return { name: file.name, path: filePath };
      });
      
      res.json({ success: true, files: uploadedFiles });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List uploads for thread
   */
  listUploads(req, res) {
    try {
      const { id } = req.params;
      const uploadsDir = path.join(WORKSPACE, '.openclaw-data', 'threads', id, 'user-data', 'uploads');
      
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir)
          .filter(file => fs.statSync(path.join(uploadsDir, file)).isFile());
        res.json({ files, total: files.length });
      } else {
        res.json({ files: [], total: 0 });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List artifacts for thread
   */
  listArtifacts(req, res) {
    try {
      const { id } = req.params;
      const outputsDir = path.join(WORKSPACE, '.openclaw-data', 'threads', id, 'user-data', 'outputs');
      
      if (fs.existsSync(outputsDir)) {
        const artifacts = fs.readdirSync(outputsDir)
          .filter(file => fs.statSync(path.join(outputsDir, file)).isFile());
        res.json({ artifacts, total: artifacts.length });
      } else {
        res.json({ artifacts: [], total: 0 });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Download artifact
   */
  downloadArtifact(req, res) {
    try {
      const { id, filename } = req.params;
      const filePath = path.join(WORKSPACE, '.openclaw-data', 'threads', id, 'user-data', 'outputs', filename);
      
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ error: `Artifact ${filename} not found` });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get suggestions for thread
   */
  getSuggestions(req, res) {
    try {
      const { id } = req.params;
      // Placeholder - would integrate with actual suggestion system
      res.json({ suggestions: [], thread_id: id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get system status
   */
  getStatus(req, res) {
    try {
      const skillsCount = fs.readdirSync(path.join(WORKSPACE, 'skills'))
        .filter(dir => fs.statSync(path.join(WORKSPACE, 'skills', dir)).isDirectory()).length;
      
      const scriptsCount = fs.readdirSync(path.join(WORKSPACE, 'impl', 'bin'))
        .filter(file => file.endsWith('.js')).length;
      
      res.json({
        status: 'running',
        skills_count: skillsCount,
        scripts_count: scriptsCount,
        timestamp: Date.now()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Run doctor check
   */
  runDoctor(req, res) {
    try {
      // Placeholder - would run actual doctor.js
      res.json({
        status: 'ok',
        checks: {
          gateway: 'ok',
          skills: 'ok',
          scripts: 'ok'
        },
        timestamp: Date.now()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get config
   */
  getConfig(req, res) {
    try {
      res.json(this.config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update config
   */
  updateConfig(req, res) {
    try {
      const updates = req.body;
      const newConfig = { ...this.config, ...updates };
      
      const configFile = path.join(WORKSPACE, 'gateway-config.yaml');
      fs.writeFileSync(configFile, yaml.stringify(newConfig));
      
      this.config = newConfig;
      res.json({ success: true, config: newConfig });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Parse YAML frontmatter
   */
  parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      return yaml.parse(match[1]);
    }
    return {};
  }

  /**
   * Load extensions config
   */
  loadExtensionsConfig() {
    try {
      const configFile = path.join(STATE_DIR, 'extensions-config.json');
      if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
      }
    } catch (err) {
      console.error('[gateway-api] Load extensions config failed:', err.message);
    }
    return {};
  }

  /**
   * Save extensions config
   */
  saveExtensionsConfig(config) {
    try {
      const configFile = path.join(STATE_DIR, 'extensions-config.json');
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('[gateway-api] Save extensions config failed:', err.message);
    }
  }

  /**
   * Start server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`[gateway-api] Server running on http://localhost:${this.port}`);
      console.log('[gateway-api] API endpoints:');
      console.log('  - GET  /api/health');
      console.log('  - GET  /api/models');
      console.log('  - GET  /api/skills');
      console.log('  - GET  /api/mcp');
      console.log('  - GET  /api/threads');
      console.log('  - POST /api/threads/:id/uploads');
      console.log('  - GET  /api/status');
      console.log('  - GET  /api/doctor');
    });
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'start';

if (command === 'start') {
  const api = new GatewayAPI({ port: parseInt(args[1]) || 8001 });
  api.start();
} else if (command === 'routes') {
  const api = new GatewayAPI();
  console.log('Gateway API Routes:');
  console.log('');
  console.log('Health:');
  console.log('  GET  /api/health');
  console.log('');
  console.log('Models:');
  console.log('  GET  /api/models');
  console.log('  GET  /api/models/:name');
  console.log('');
  console.log('Skills:');
  console.log('  GET  /api/skills');
  console.log('  GET  /api/skills/:name');
  console.log('  PUT  /api/skills/:name');
  console.log('');
  console.log('MCP:');
  console.log('  GET  /api/mcp');
  console.log('  GET  /api/mcp/:name');
  console.log('  PUT  /api/mcp/:name');
  console.log('');
  console.log('Threads:');
  console.log('  GET  /api/threads');
  console.log('  GET  /api/threads/:id');
  console.log('  DEL  /api/threads/:id');
  console.log('');
  console.log('Uploads:');
  console.log('  POST /api/threads/:id/uploads');
  console.log('  GET  /api/threads/:id/uploads');
  console.log('');
  console.log('Artifacts:');
  console.log('  GET  /api/threads/:id/artifacts');
  console.log('  GET  /api/threads/:id/artifacts/:filename');
  console.log('');
  console.log('Status:');
  console.log('  GET  /api/status');
  console.log('  GET  /api/doctor');
  console.log('  GET  /api/config');
  console.log('  PUT  /api/config');
} else if (command === 'help') {
  console.log('Usage: gateway-api.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  start [port] - Start Gateway API server');
  console.log('  routes       - Show all API routes');
  console.log('  help         - Show this help');
} else {
  console.log('Unknown command:', command);
  console.log('Run: node gateway-api.js help');
}

module.exports = { GatewayAPI };
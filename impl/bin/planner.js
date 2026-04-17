#!/usr/bin/env node
/**
 * Planner Agent - 产品规划代理
 * 
 * 来源：Harness Engineering - prompts.py PLANNER_SYSTEM
 * 
 * 功能：
 * - 将 1-4句话扩展为完整产品规格
 * - 输出 spec.md 文件
 * - 包含：Overview, Features, Technical Stack, Design Direction
 * 
 * 用法：
 *   node planner.js "Build a Pomodoro timer"
 *   node planner.js --workspace /path/to/project "Build a DAW"
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const DEFAULT_WORKSPACE = `${HOME}/.openclaw/workspace`;

const PLANNER_SYSTEM_PROMPT = `
You are a product planner. Given a short user prompt (1-4 sentences), expand it \
into a comprehensive product specification.

Rules:
- Be ambitious about scope — think of features the user didn't mention but would expect.
- Focus on PRODUCT CONTEXT and HIGH-LEVEL TECHNICAL DESIGN, not granular implementation details.
- If the product has a UI, describe a visual design direction (color palette, typography, layout philosophy).
- Look for opportunities to weave AI-powered features into the spec.
- Structure the spec with: Overview, Features (with user stories), Technical Stack, Design Direction.
- Output the spec as Markdown.
- Do NOT write any code. Only write the spec.
- Do NOT read feedback.md or contract.md — they do not exist yet. You are the first step.

Use the write_file tool to save the spec to spec.md when done.
`;

/**
 * Planner Agent 执行
 */
function runPlanner(userPrompt, workspace) {
  const specPath = path.join(workspace, 'spec.md');
  
  console.log('================================');
  console.log('📝 Planner Agent');
  console.log('================================');
  console.log('');
  console.log('Input:', userPrompt);
  console.log('Workspace:', workspace);
  console.log('');

  // 生成规格（简化版本 - 实际应调用 LLM）
  const spec = generateSpec(userPrompt);
  
  // 保存 spec.md
  fs.writeFileSync(specPath, spec);
  console.log(`✅ Spec saved to: ${specPath}`);
  
  return {
    specPath,
    spec,
    success: true
  };
}

/**
 * 规格生成模板
 */
function generateSpec(userPrompt) {
  // 提取关键词
  const keywords = userPrompt.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3);

  // 基于关键词生成规格
  return `# Product Specification

## Overview

${userPrompt}

This document outlines the comprehensive specification for this product, including features, technical architecture, and design direction.

---

## Features

### Core Features

${generateFeatures(keywords)}

### Extended Features (User Expectations)

- Responsive design (mobile-friendly)
- Keyboard shortcuts for efficiency
- Dark/light mode toggle
- Offline capability (if applicable)
- Export/import data functionality

---

## Technical Stack

### Frontend
- **Framework**: React + Vite (or single HTML file for simpler apps)
- **Language**: TypeScript
- **Styling**: Tailwind CSS or custom CSS
- **State Management**: React hooks or Zustand

### Backend (if needed)
- **Language**: Node.js / Python
- **API**: REST or GraphQL
- **Database**: SQLite / PostgreSQL / MongoDB

---

## Design Direction

### Color Palette
- Primary: User preference (suggest vibrant accent)
- Background: Clean white or dark gray
- Accent: One bold color for key actions

### Typography
- Headings: Bold sans-serif (Inter, Helvetica, Arial)
- Body: Readable sans-serif
- Code: Monospace (if applicable)

### Layout Philosophy
- Clean, minimal aesthetic
- Clear visual hierarchy
- Generous whitespace
- Intuitive navigation

---

## User Stories

1. User can access the main feature immediately upon opening
2. User can complete the core task in minimal steps
3. User receives visual feedback on all actions
4. User can customize settings/preferences
5. User can easily understand the interface without documentation

---

## AI-Powered Features (Opportunities)

${generateAIFeatures(keywords)}

---

## Out of Scope (Phase 1)

- User authentication (Phase 2)
- Social features (Phase 3)
- Payment integration (Phase 4)
- Multi-language support (Phase 5)

---

Generated: ${new Date().toISOString()}
`;
}

/**
 * 生成功能列表
 */
function generateFeatures(keywords) {
  const featureMap = {
    'timer': '- Start/Pause/Reset controls\n- Visual countdown display\n- Session tracking\n- Completion notifications',
    'game': '- Game loop mechanics\n- Player controls\n- Score tracking\n- Level progression',
    'editor': '- Text/code editing\n- Save/Load functionality\n- Undo/Redo support\n- Export options',
    'dashboard': '- Data visualization\n- Charts and graphs\n- Real-time updates\n- Filter/search capabilities',
    'chat': '- Message input/output\n- Conversation history\n- User presence\n- Typing indicators'
  };

  let features = '';
  for (const kw of keywords) {
    if (featureMap[kw]) {
      features += featureMap[kw] + '\n\n';
    }
  }

  if (!features) {
    features = '- Main functionality as described\n- User input handling\n- Result/output display\n- Error handling and validation';
  }

  return features;
}

/**
 * 生成 AI 功能建议
 */
function generateAIFeatures(keywords) {
  const aiMap = {
    'timer': '- Smart break suggestions based on productivity patterns\n- Voice reminders with natural language',
    'game': '- AI opponent or adaptive difficulty\n- Procedural content generation',
    'editor': '- Auto-completion and suggestions\n- Code review assistant',
    'dashboard': '- Anomaly detection in data\n- Predictive analytics',
    'chat': '- Smart replies and suggestions\n- Language translation'
  };

  let features = '';
  for (const kw of keywords) {
    if (aiMap[kw]) {
      features += aiMap[kw] + '\n\n';
    }
  }

  if (!features) {
    features = '- Natural language understanding\n- Intelligent suggestions\n- Context-aware responses';
  }

  return features;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  
  let workspace = DEFAULT_WORKSPACE;
  let userPrompt = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace') {
      workspace = args[++i];
    } else if (!args[i].startsWith('--')) {
      userPrompt += args[i] + ' ';
    }
  }

  userPrompt = userPrompt.trim();

  if (!userPrompt) {
    console.log('Usage: node planner.js "Build a Pomodoro timer"');
    console.log('       node planner.js --workspace /path/to/project "Build a DAW"');
    return;
  }

  // 确保目录存在
  fs.mkdirSync(workspace, { recursive: true });

  const result = runPlanner(userPrompt, workspace);
  
  if (result.success) {
    console.log('');
    console.log('================================');
    console.log('✅ Planning Complete');
    console.log('================================');
    console.log('');
    console.log('Spec saved. Next step: run Builder Agent');
  }
}

module.exports = {
  runPlanner,
  generateSpec,
  PLANNER_SYSTEM_PROMPT
};

main();
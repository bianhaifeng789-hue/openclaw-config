# 硬编码位置标注

本文档标注了所有硬编码路径和配置，方便其他 Mac 直接部署。

---

## ⚠️ 硬编码位置

### 1. impl/bin/agent-loop.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 19-26 行（配置默认值）
const config = {
  API_KEY: process.env.OPENAI_API_KEY || '',  // ⚠️ 从环境变量读取
  BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',  // ⚠️ 默认 API URL
  MODEL: process.env.HARNESS_MODEL || 'gpt-4o',  // ⚠️ 默认模型
  MAX_AGENT_ITERATIONS: parseInt(process.env.MAX_AGENT_ITERATIONS || '500'),  // ⚠️ 默认迭代次数
  MAX_TOOL_ERRORS: parseInt(process.env.MAX_TOOL_ERRORS || '5'),  // ⚠️ 默认错误次数
  COMPRESS_THRESHOLD: parseInt(process.env.COMPRESS_THRESHOLD || '80000'),  // ⚠️ 默认压缩阈值
  RESET_THRESHOLD: parseInt(process.env.RESET_THRESHOLD || '150000'),  // ⚠️ 默认重置阈值
  WORKSPACE: WORKSPACE  // ⚠️ 工作目录
};
```

**修改建议**: 通过 `.env` 文件覆盖，无需修改代码。

---

### 2. impl/bin/tools-executor.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 160 行（readSkillFile）
async function readSkillFile(args) {
  // ⚠️ Skills 目录路径
  const skillsDir = path.join(HOME, '.openclaw', 'skills');
  // ...
}

// 第 1234-1235 行（导出）
module.exports = {
  // ⚠️ 所有工具都使用 WORKSPACE 作为基准路径
};
```

**修改建议**: 通过环境变量 `WORKSPACE` 覆盖。

---

### 3. impl/bin/profile-config.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 552-553 行（getProfile）
const profilesDir = path.join(HOME, '.openclaw', 'workspace', 'profiles');  // ⚠️ Profiles 目录
```

**修改建议**: 通过环境变量覆盖。

---

### 4. impl/bin/skills-registry.js

```javascript
// 第 15-19 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');  // ⚠️ Skills 目录（相对）

// 第 25-26 行（SkillRegistry 构造）
constructor(skillsDir = null) {
  this.skillsDir = skillsDir || SKILLS_DIR;  // ⚠️ 默认 Skills 目录
}
```

**修改建议**: 
- Skills 目录有两个位置：
  1. `WORKSPACE/skills/` - 工作空间 Skills（相对路径）
  2. `HOME/.openclaw/skills/` - 全局 Skills（绝对路径）

---

### 5. impl/bin/context-lifecycle.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 298 行（restoreFromCheckpoint）
'git diff --stat HEAD~5 2>/dev/null || git log --oneline -5 2>/dev/null',
{ cwd: WORKSPACE, encoding: 'utf8', timeout: 10000 }  // ⚠️ Git 命令在 WORKSPACE 执行
```

---

### 6. impl/bin/harness.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 20-21 行（项目目录）
const PROJECTS_DIR = path.join(HOME, '.openclaw', 'workspace', 'harness-projects');  // ⚠️ 项目目录
```

---

### 7. impl/bin/test-tb2.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 225-227 行（tb2_tasks.json 路径）
const tb2Path = path.join(WORKSPACE, 'impl', 'bin', 'tb2_tasks.json');  // ⚠️ TB2 任务文件
const tb2AlternatePath = path.join(WORKSPACE, 'benchmarks', 'tb2_tasks.json');  // ⚠️ 备用路径
```

---

### 8. impl/bin/results-analyzer.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径
```

---

### 9. impl/bin/run-example.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径

// 第 17 行（.env 路径）
const envPath = path.join(WORKSPACE, '.env');  // ⚠️ 配置文件路径
```

---

### 10. impl/bin/test-api.js

```javascript
// 第 15-16 行
const HOME = process.env.HOME || '/Users/mac';  // ⚠️ 默认 fallback
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');  // ⚠️ 相对路径
```

---

## 🎯 一键部署方法

### 方法 1: 直接运行脚本

```bash
curl -fsSL https://raw.githubusercontent.com/bianhaifeng789-hue/openclaw-config/main/scripts/oneclick-deploy.sh | bash
```

### 方法 2: 手动部署

```bash
# 1. 克隆仓库
git clone https://github.com/bianhaifeng789-hue/openclaw-config.git ~/.openclaw/workspace-dispatcher

# 2. 创建 .env 配置
cd ~/.openclaw/workspace-dispatcher
cp .env.template .env
# 编辑 .env 文件，填写 API Key

# 3. 复制 TB2 Skills
cp -r skills/tb2/* ~/.openclaw/skills/

# 4. 验证部署
node impl/bin/test-tb2.js test
```

---

## 📝 .env 配置模板

```bash
# API 配置
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
HARNESS_MODEL=gpt-4o

# Harness 配置
MAX_HARNESS_ROUNDS=5
PASS_THRESHOLD=7.0
COMPRESS_THRESHOLD=80000
RESET_THRESHOLD=150000
MAX_AGENT_ITERATIONS=500
MAX_TOOL_ERRORS=5

# 工作空间（可选，默认 ~/.openclaw/workspace-dispatcher）
WORKSPACE=/Users/your_name/.openclaw/workspace-dispatcher
```

---

## ✅ 环境变量优先级

所有硬编码都支持环境变量覆盖，优先级：

```
环境变量 > .env 文件 > 代码默认值
```

**无需修改代码，只需配置 .env 文件即可** ✅
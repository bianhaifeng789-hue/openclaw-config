# Hooks 使用说明文档

更新时间: 2026-04-21 02:58 Asia/Shanghai
配置文件: `hooks-config.json`
当前版本: `1.3.0`
当前模式状态文件: `hooks-mode.json`
可切换配置:
- `hooks-config.quiet.json`
- `hooks-config.dev.json`
- `hooks-config.strict.json`
切换脚本: `scripts/set-hooks-mode.sh`

这份文档说明当前已启用的 hooks 做什么、什么时候触发、常见影响，以及后续怎么调整，避免误判成“系统坏了”或“不知道为什么被拦了”。

---

## 0. 快速切换模式

当前支持 3 种模式：
- `quiet`
- `dev`
- `strict`

切换命令：
```bash
/Users/mac/.openclaw/workspace/scripts/set-hooks-mode.sh quiet
/Users/mac/.openclaw/workspace/scripts/set-hooks-mode.sh dev
/Users/mac/.openclaw/workspace/scripts/set-hooks-mode.sh strict
```

当前模式会写入：`hooks-mode.json`

模式说明：
- `quiet`: 保留安全，减少打扰
- `dev`: 默认推荐，平衡开发效率与质量
- `strict`: 全保护开启，适合敏感操作

---

## 1. 当前 Hook 总览

当前启用了 10 个 hooks，分 4 类：

1. **安全保护**
2. **工具执行保护 / 错误处理**
3. **自动质量检查 / 标题生成**
4. **通知能力**

事件分布：
- `PreToolUse`: 工具执行前
- `PostToolUse`: 工具执行后
- `PostModelUse`: 模型回复后
- `Stop`: 当前回合结束时

---

## 2. Hook 清单

| Hook | 事件 | 作用 | 风险/注意点 |
|------|------|------|-------------|
| dangling-tool-patcher | PreToolUse | 检查悬空工具调用 | 偶发拦截异常 tool 链路 |
| subagent-limiter | PreToolUse | 限制子代理数量 | sessions_spawn 可能被限流 |
| block-secrets.py | PreToolUse | 阻止读写敏感文件 | 可能误拦 `.env.example` |
| block-dangerous-commands.sh | PreToolUse | 阻止危险 shell 命令 | 可能拦截合法清理命令 |
| tool-error-handler | PostToolUse | 工具后错误处理 | 对失败结果做补充处理 |
| after-edit.sh | PostToolUse | 编辑后自动格式化 | 可能改写刚编辑的文件 |
| session-startup-hook | PostModelUse | 首轮后生成标题 | 正常副作用较小 |
| end-of-turn.sh | Stop | 回合结束质量检查 | 可能增加一点结束延迟 |
| title-generator | Stop | 结束时生成标题 | 与 startup title 互补 |
| tts_notify.py | Stop | 任务完成 TTS 通知 | 可能造成“突然播报” |

---

## 3. 逐个说明

### 3.1 dangling-tool-patcher
- **事件**: `PreToolUse`
- **命令**: `node ~/.openclaw/workspace-dispatcher/impl/bin/dangling-tool-patcher.js status`
- **作用**: 工具执行前检查是否存在悬空 / 不完整 tool 调用状态，减少链路错乱。
- **你会看到的现象**:
  - 某些工具调用被提前拦住
  - 工具链执行更稳定
- **适合保留**: 是

---

### 3.2 subagent-limiter
- **事件**: `PreToolUse`
- **匹配**: `sessions_spawn`
- **作用**: 防止一次性起太多子代理，避免 session 爆炸或资源乱掉。
- **你会看到的现象**:
  - 子代理任务过多时会被限制
- **适合保留**: 是，尤其在多线程/多代理实验时

---

### 3.3 block-secrets.py
- **事件**: `PreToolUse`
- **匹配**: `read|edit|write`
- **作用**: 阻止访问 `.env`、credentials、密钥等敏感文件
- **主要价值**:
  - 防止误读真实 secrets
  - 防止误写/泄露敏感配置
- **常见误伤**:
  - `.env.example`
  - 样例配置文件
  - 本来只是想看变量名，不是看真实密钥

**建议改法**:
- 给 `block-secrets.py` 增加 allowlist
- 排除 `.env.example`, `.env.sample`, `config.example.*`

**什么时候该调**:
- 如果你发现经常连示例配置都读不了，就该调

---

### 3.4 block-dangerous-commands.sh
- **事件**: `PreToolUse`
- **匹配**: `exec`
- **作用**: 阻止危险命令，比如：
  - `rm -rf`
  - 强制覆盖/强推类命令
  - 高风险 destructive shell 操作

**主要价值**:
- 防误删
- 防失控 shell
- 防止 agent 在自动化过程中做过头

**可能影响**:
- 合法清理命令也可能被拦
- 某些 reset / cleanup / force 操作做不了

**建议**:
- 保留这个 hook
- 但可以把“危险命令名单”和“允许例外名单”拆开维护

---

### 3.5 tool-error-handler
- **事件**: `PostToolUse`
- **作用**: 工具执行完后统一处理错误，减少失败后直接掉地上。
- **主要价值**:
  - 提高 tool 出错后的恢复力
  - 让错误更可追踪
- **适合保留**: 是

---

### 3.6 after-edit.sh
- **事件**: `PostToolUse`
- **匹配**: `edit|write`
- **作用**: 写文件后自动跑 formatter / 清理动作
- **你会看到的现象**:
  - 文件写完后又被自动改了一次
  - 格式被统一

**优点**:
- 减少格式噪音
- 保持代码整洁

**风险**:
- 有时会改坏刚写的内容
- 对 markdown / json / 特殊格式可能过度处理

**建议**:
- 给它加文件类型白名单
- 只处理 `.js .ts .tsx .json .md` 等你真正想自动整理的类型

---

### 3.7 session-startup-hook
- **事件**: `PostModelUse`
- **匹配**: `firstExchange: true`
- **作用**: 首轮对话后自动生成 session 标题
- **价值**:
  - session 列表更清楚
  - 便于后续回看
- **适合保留**: 是

---

### 3.8 end-of-turn.sh
- **事件**: `Stop`
- **作用**: 每回合结束前做质量检查
- **常见检查方向**:
  - 输出是否完整
  - 是否有低级遗漏
  - 是否有明显收尾问题

**优点**:
- 对长任务尤其有价值
- 能减少“答了一半”的情况

**风险**:
- 回合结束可能慢一点
- 如果脚本写得过重，会拖慢整体体验

**建议**:
- 保持轻量
- 不要在这个 hook 里做重型扫描

---

### 3.9 title-generator
- **事件**: `Stop`
- **作用**: 结束时再补一轮标题生成
- **价值**:
  - 和 startup hook 形成互补
  - 后续回看更容易

**注意**:
- 如果你发现标题经常被改来改去，可以考虑只保留一个标题 hook

---

### 3.10 tts_notify.py
- **事件**: `Stop`
- **作用**: 任务完成时语音提醒
- **价值**:
  - 你不盯屏幕时很有用
  - 长任务完成提醒很舒服

**风险**:
- 深夜可能吵
- 高频短任务会过于打扰

**建议**:
- 增加静音时间段，例如 `23:00-08:00`
- 只在长任务/明确完成时播报

---

## 4. 推荐保留 / 推荐优化

### 建议保留不动
- dangling-tool-patcher
- subagent-limiter
- tool-error-handler
- session-startup-hook
- end-of-turn.sh

### 建议优化但保留
- block-secrets.py
- block-dangerous-commands.sh
- after-edit.sh
- title-generator
- tts_notify.py

---

## 5. 我建议的优化动作

### 优化 1: secrets 白名单
给这些文件放行：
- `.env.example`
- `.env.sample`
- `*.example.json`
- `*.template.json`

### 优化 2: dangerous commands 例外名单
允许受控的清理命令，例如：
- 工作区内安全删除
- 明确目标目录的清理

### 优化 3: after-edit 文件类型限制
建议只对这些类型自动格式化：
- `.js`
- `.ts`
- `.tsx`
- `.json`
- `.md`

### 优化 4: TTS 静音策略
建议：
- 夜间默认静音
- 仅对长任务/完成态通知
- 失败不播或用更轻提醒

### 优化 5: 标题生成去重
如果 startup + stop 都会生成标题，可以：
- 保留其中一个
- 或规定 startup 只生成初始标题，stop 只在标题为空时补生成

---

## 6. 常见问题排查

### Q1. 为什么某个命令突然跑不了？
先看：
- 是不是被 `block-dangerous-commands.sh` 拦了
- 是不是被 `subagent-limiter` 限了

### Q2. 为什么我刚写的文件又变了？
大概率是：
- `after-edit.sh` 在自动格式化

### Q3. 为什么某些配置文件读不到？
大概率是：
- `block-secrets.py` 把它当成敏感文件拦了

### Q4. 为什么结束后有额外动作？
可能是：
- `end-of-turn.sh`
- `title-generator`
- `tts_notify.py`

---

## 7. 推荐后续

如果你要继续增强，我建议下一步做这 2 件事之一：

1. **把 hooks 文档化到 runbook 体系**
   - 例如接到 `RUNBOOK.md` / `SCRIPTS.md`
2. **把 hooks 做成可切换模式**
   - 安静模式
   - 开发模式
   - 严格安全模式

这是最实用的下一步，因为会让这套系统从“能用”变成“可控”。

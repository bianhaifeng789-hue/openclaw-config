# APP开发团队 - 多Agent协作系统

简洁实用的多Agent协作框架，专为APP开发团队设计。

---

## 团队成员

| Agent | 角色 | 职责 |
|-------|------|------|
| **PM** | 产品经理 | 接收需求 → 写PRD → 派发任务 → 汇总结果 |
| **Designer** | 设计师 | 接收设计任务 → 输出UI设计稿 |
| **Engineer** | 工程师 | 接收开发任务 → 输出技术方案+代码 |
| **Tester** | 测试 | 接收测试任务 → 输出测试报告 |

---

## 协作流程

```
用户需求 → PM → Designer/Engineer → Tester → PM → 用户
```

### 示例流程

**1. PM接收需求**
```
用户: "开发一个用户登录功能"
PM: "收到需求，正在撰写PRD..."
```

**2. PM撰写PRD**
```
PM输出:
# PRD - 用户登录
目标: 用户可登录APP
功能: 手机号登录、第三方登录
验收: 登录成功后跳转主页
```

**3. PM派发给Designer + Engineer**
```
PM: sessions_spawn → Designer (设计登录页面)
PM: sessions_spawn → Engineer (开发登录API)
```

**4. Designer返回设计**
```
Designer: 设计稿完成（页面结构、色彩、交互）
```

**5. Engineer返回代码**
```
Engineer: API设计 + 登录组件代码
```

**6. PM派发给Tester验收**
```
PM: sessions_spawn → Tester (测试登录功能)
Tester: 测试报告（通过率、验收结论）
```

**7. PM汇总给用户**
```
PM: 登录功能开发完成，测试通过
```

---

## 使用方式

### 在OpenClaw中使用

PM作为主Agent，使用 `sessions_spawn` 派发任务：

```javascript
// PM派发给工程师
sessions_spawn({
  runtime: "subagent",
  mode: "run",
  task: `你是工程师，负责开发登录功能。
         PRD: [粘贴PRD内容]
         输出: API设计 + 核心代码`
})
```

---

## 文件结构

```
app-team-agents/
├── agents.json          # Agent配置
├── README.md            # 本文档
└── agents/
    ├── pm/SOUL.md       # PM角色定义
    ├── designer/SOUL.md # Designer角色定义
    ├── engineer/SOUL.md # Engineer角色定义
    └── tester/SOUL.md   # Tester角色定义
```

---

## 核心规则

1. **PM不开发** - 只派发，不做设计/代码
2. **Designer不写代码** - 只输出设计
3. **Engineer只开发** - 不做产品设计
4. **Tester只测试** - 不做开发
5. **简洁输出** - 每个Agent输出不超过300字

---

_创建时间: 2026-04-16_
_适用场景: APP开发团队_
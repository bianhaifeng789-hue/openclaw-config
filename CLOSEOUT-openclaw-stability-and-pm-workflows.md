# CLOSEOUT-openclaw-stability-and-pm-workflows.md

本轮已把 OpenClaw 稳定性治理与产品经理工作流入口整理成可接手、可运行、可分工的状态。

## 1. 当前有哪些主线

### A. 稳定性 / 自愈主线
用于处理：卡死、假掉线、session 过重、stale lock、Gateway 真故障。

核心入口：
- `scripts/openclaw-auto-recover.sh`
  - 核心分诊与最小修复入口
- `scripts/openclaw-stability-guard.sh`
  - 5 行内短摘要入口，适合人看、面板看、值班看
- `scripts/openclaw-self-heal.sh`
  - 后台保守自愈入口，适合 launchd 定时执行
- `config/ai.openclaw.self-heal.plist`
  - macOS launchd 调度模板，当前默认每 15 分钟运行一次

相关文档：
- `RUNBOOK-openclaw-health.md`
- `RUNBOOK-openclaw-gateway-false-failure.md`
- `RUNBOOK-openclaw-anti-stall.md`
- `RUNBOOK-openclaw-auto-recovery.md`
- `docs/openclaw-self-heal-setup.md`

### B. 产品经理工作流主线
用于处理：Google Play → APK / 逆向 → 竞品分析 / PRD / Gap 输入。

核心入口：
- `scripts/play-to-prd.sh`
  - PM 工作流统一入口
- `scripts/jadx`
- `scripts/jadx-gui`
  - 本地 Jadx + Java 环境 shim，避免 PATH / JAVA_HOME 掉链子
- `PRD-template-advanced.md`
  - 面向真实项目推进的高级 PRD 模板，补齐版本治理、商业化、推送、审核/买量模式、埋点、项目规划等正式文档层

相关技能：
- `skills/google-play-to-prd`
- `skills/apk-reverse-analysis`
- `skills/prd-generator`
- `skills/competitive-analysis`
- `skills/gap-analysis`

---

## 2. 现在各入口该怎么用

### 稳定性场景
#### 只想快速看状态
```bash
scripts/openclaw-stability-guard.sh
```

#### 想做完整分诊
```bash
scripts/openclaw-auto-recover.sh --capture-only
```

#### 真 down 时允许单次保守修复
```bash
scripts/openclaw-auto-recover.sh --restart-if-down --fix-stale-lock --notify
```

#### 后台无人值守保守自愈
```bash
scripts/openclaw-self-heal.sh
```

### PM 工作流场景
#### 快速 smoke check
```bash
scripts/play-to-prd.sh smoke <package> <artifact>
```

#### 看已有逆向产物是否齐
```bash
scripts/play-to-prd.sh reverse-status <artifact>
```

#### 看技能链和默认模板是否完整
```bash
scripts/play-to-prd.sh prd-skills
```

#### 开正式项目文档时默认取高级模板
```bash
scripts/play-to-prd.sh prd-template
```

#### 直接初始化一份新 PRD 骨架
```bash
scripts/play-to-prd.sh init-prd <project-name>
```

---

## 3. 当前约束与边界

### 稳定性边界
- heartbeat 只做 check / route / notify
- 不在 heartbeat 里做长排障
- auto-recover 默认不做多轮重启或多轮 config patch
- self-heal 只做一次最低风险恢复
- session 偏重时，默认建议先收口，再用 `/new` 开新线程

### PM 工作流边界
- `google-play-helper.js` 的 `check-app` 参数解析不稳定
- 已由 `scripts/play-to-prd.sh` 做保守 fallback
- Jadx 通过工作区 shim 调用更稳，不建议依赖系统 PATH 自己猜

---

## 4. 推荐使用顺序

### 遇到“OpenClaw 好像卡了”
1. `scripts/openclaw-stability-guard.sh`
2. 若需详细判断，再用 `scripts/openclaw-auto-recover.sh --capture-only`
3. 若明确需要保守修复，再开 `--restart-if-down --fix-stale-lock`
4. 若任务仍然很长，先收口，再 `/new`

### 要做“Google Play → 逆向 → PRD”
1. `scripts/play-to-prd.sh smoke <package> <artifact>`
2. 确认逆向产物齐全
3. 默认取 `scripts/play-to-prd.sh prd-template` 指向的高级模板
4. 如需直接起正式文档，运行 `scripts/play-to-prd.sh init-prd <project-name>`
5. 再进入 PRD / 竞品 / Gap 分析

---

## 5. 本轮整理后的结论

- 稳定性入口已分层清楚
- PM 工作流入口已统一
- 自愈和看板入口已可运行
- session 偏重时已有 `/new` 收口提醒
- 仓库已做过两轮低风险瘦身，当前更适合先稳定使用，再按真实使用反馈继续优化

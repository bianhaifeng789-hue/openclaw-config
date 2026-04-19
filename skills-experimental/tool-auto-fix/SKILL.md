# Tool Auto-Fix Skill

## 功能概述

工具调用预验证和自动修正，减少弱模型错误。

## 来源

- **仓库**: Harness Engineering (lazyFrogLOL/Harness_Engineering)
- **文件**: tools.py (_validate_and_fix函数)
- **移植日期**: 2026-04-17

## 功能

### 1. 空路径检测

```
write_file({path: ""})
→ 阻止执行
→ [auto-fix] Empty file path. You must specify a path.
```

### 2. 绝对路径转换

```
write_file({path: "/app/test.py"})
→ 自动修正为 "test.py"
→ [auto-fix] Converted absolute path '/app/test.py' to relative 'test.py'
```

### 3. 交互命令检测

```
run_bash({command: "vim test.txt"})
→ 阻止执行
→ [auto-fix] 'vim' is an interactive command that will hang.
→ Use non-interactive alternatives: for editing use write_file, for viewing use cat/head/tail.
```

### 4. 空命令检测

```
run_bash({command: ""})
→ 阻止执行
→ [auto-fix] Empty command. You must specify a command to run.
```

## 用法

### 验证工具参数

```bash
node impl/bin/tool-auto-fix.js validate write_file '{"path":"/app/test.py"}'
```

### 查看状态

```bash
node impl/bin/tool-auto-fix.js status
```

### 运行测试

```bash
node impl/bin/tool-auto-fix.js test
```

## 代码集成示例

```javascript
const { validateAndFix } = require('./impl/bin/tool-auto-fix.js');

// 在工具执行前调用
const result = validateAndFix('write_file', {path: '/app/test.py'});

if (result.blocked) {
  // 阻止执行，返回警告
  return result.warning;
}

if (result.warning) {
  // 自动修正，使用fixedArgs执行
  executeTool('write_file', result.fixedArgs);
}
```

## 测试结果

- ✅ 空路径检测成功
- ✅ 绝对路径转换成功
- ✅ 交互命令检测成功
- ✅ 空命令检测成功

## 重要性

⭐⭐ 中高优先级

减少弱模型工具调用错误

---

移植完成：2026-04-17
状态：就绪 ✅
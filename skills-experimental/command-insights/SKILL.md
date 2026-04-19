---
name: command-insights
description: "Insights命令模式。生成用户行为洞察报告，分析使用模式和偏好。Use when generating user behavior insights."
---

# Command Insights

## 功能

生成洞察报告。

### 核心命令

- /insights - 生成完整洞察报告
- /insights clear - 清除历史数据
- /insights export - 导出分析数据

### 使用示例

```
用户: /insights
显示:
📊 用户洞察报告

• 常用工具: read, exec, write
• 活跃时间: 晚间 22:00-23:00
• 常见任务: Skills补全、脚本测试
• 效率提升: 分批执行减少卡死

用户: /insights clear
结果: 洞察数据已清除
```

### 分析维度

- 工具使用频率
- 任务类型分布
- 活跃时间段
- 效率改进趋势

---

来源: Claude Code commands/insights.ts
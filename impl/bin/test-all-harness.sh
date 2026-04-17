#!/bin/bash
# Harness Engineering移植功能综合测试
# 测试时间：2026-04-17 12:34

echo "=== Harness Engineering移植功能综合测试 ==="
echo ""

cd ~/.openclaw/workspace

# 测试计数
passed=0
failed=0

# 测试函数
test_script() {
  local name=$1
  local cmd=$2
  
  echo "测试: $name"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  ✅ 通过"
    ((passed++))
  else
    echo "  ❌ 失败"
    ((failed++))
  fi
}

echo "--- P0脚本测试 ---"
test_script "焦虑检测" "node impl/bin/anxiety-detector.js test"
test_script "三级门控" "node impl/bin/pre-exit-gate.js test"
test_script "Smart Truncate" "node impl/bin/smart-truncate.js test"

echo ""
echo "--- P1脚本测试 ---"
test_script "LoopDetection增强" "node impl/bin/loop-detector-enhanced.js test"
test_script "TimeBudget" "node impl/bin/time-budget.js test"
test_script "TaskTracking" "node impl/bin/task-tracking.js test"

echo ""
echo "--- P2脚本测试 ---"
test_script "Skill渐进披露增强" "node impl/bin/skill-progressive-disclosure-enhanced.js test"
test_script "ErrorGuidance" "node impl/bin/error-guidance.js test"
test_script "Contract协商" "node impl/bin/contract-negotiation.js test"

echo ""
echo "--- Skills文档检查 ---"
skills_count=$(ls skills/ | grep -E "anxiety-detection|pre-exit-gate|smart-truncate-output|loop-detection-enhanced|time-budget|task-tracking|skill-progressive-disclosure|error-guidance|contract-negotiation" | wc -l)
echo "Skills文档: $skills_count/9"
if [ "$skills_count" -ge 9 ]; then
  echo "  ✅ 通过"
  ((passed++))
else
  echo "  ❌ 失败"
  ((failed++))
fi

echo ""
echo "--- 心跳任务检查 ---"
heartbeat_count=$(grep -c "name:" HEARTBEAT.md)
echo "心跳任务: $heartbeat_count"
if [ "$heartbeat_count" -ge 29 ]; then
  echo "  ✅ 通过"
  ((passed++))
else
  echo "  ❌ 失败"
  ((failed++))
fi

echo ""
echo "=== 测试结果 ==="
echo "通过: $passed"
echo "失败: $failed"
echo "通过率: $((passed * 100 / (passed + failed)))%"

if [ "$failed" -eq 0 ]; then
  echo ""
  echo "🎉 全部测试通过！移植功能就绪。"
else
  echo ""
  echo "⚠️ 部分测试失败，请检查脚本。"
fi
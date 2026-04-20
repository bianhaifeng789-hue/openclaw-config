#!/bin/bash
# Test hooks before activation

echo "=== Testing block-secrets.py ==="

# Test 1: Should block .env
echo "Test 1: .env (should block)"
echo '{"tool_name":"read","tool_input":{"file_path":".env"}}' | python3 ~/.openclaw/hooks/block-secrets.py 2>&1
TEST1_RESULT=$?
echo "Exit code: $TEST1_RESULT"

# Test 2: Should allow .env.example
echo ""
echo "Test 2: .env.example (should allow)"
echo '{"tool_name":"read","tool_input":{"file_path":".env.example"}}' | python3 ~/.openclaw/hooks/block-secrets.py 2>&1
TEST2_RESULT=$?
echo "Exit code: $TEST2_RESULT"

# Test 3: Should block credentials.json
echo ""
echo "Test 3: credentials.json (should block)"
echo '{"tool_name":"read","tool_input":{"file_path":"credentials.json"}}' | python3 ~/.openclaw/hooks/block-secrets.py 2>&1
TEST3_RESULT=$?
echo "Exit code: $TEST3_RESULT"

# Test 4: Should allow regular file
echo ""
echo "Test 4: README.md (should allow)"
echo '{"tool_name":"read","tool_input":{"file_path":"README.md"}}' | python3 ~/.openclaw/hooks/block-secrets.py 2>&1
TEST4_RESULT=$?
echo "Exit code: $TEST4_RESULT"

echo ""
echo "=== Testing block-dangerous-commands.sh ==="

# Test 5: Should block rm -rf /
echo "Test 5: rm -rf / (should block)"
echo '{"tool_name":"exec","tool_input":{"command":"rm -rf /"}}' | bash ~/.openclaw/hooks/block-dangerous-commands.sh 2>&1
TEST5_RESULT=$?
echo "Exit code: $TEST5_RESULT"

# Test 6: Should allow rm specific file
echo ""
echo "Test 6: rm file.txt (should allow)"
echo '{"tool_name":"exec","tool_input":{"command":"rm file.txt"}}' | bash ~/.openclaw/hooks/block-dangerous-commands.sh 2>&1
TEST6_RESULT=$?
echo "Exit code: $TEST6_RESULT"

echo ""
echo "=== Summary ==="
echo "Expected: Tests 1,3,5 should exit 2 (blocked)"
echo "Expected: Tests 2,4,6 should exit 0 (allowed)"
echo "Actual: Test1=$TEST1_RESULT Test2=$TEST2_RESULT Test3=$TEST3_RESULT Test4=$TEST4_RESULT Test5=$TEST5_RESULT Test6=$TEST6_RESULT"

# Check results
if [ $TEST1_RESULT -eq 2 ] && [ $TEST2_RESULT -eq 0 ] && [ $TEST3_RESULT -eq 2 ] && [ $TEST4_RESULT -eq 0 ] && [ $TEST5_RESULT -eq 2 ] && [ $TEST6_RESULT -eq 0 ]; then
    echo ""
    echo "✅ All tests passed! Hooks are working correctly."
    echo "Ready to activate."
    exit 0
else
    echo ""
    echo "❌ Some tests failed. Review hooks configuration before activation."
    exit 1
fi
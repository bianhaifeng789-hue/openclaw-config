# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## ⚠️ exec 工具执行规则 (重要)

OpenClaw 的 exec 工具**拒绝执行复杂命令**。必须使用直接格式：

### ❌ 被拒绝的命令格式
```
cd ~/workspace && python script.py | head -20
cd ~/workspace; node script.js
echo "=== test ===" && node script.js
```

### ✅ 正确的命令格式
```
python ~/workspace/script.py
node ~/workspace/script.js
bash ~/workspace/script.sh
```

### 规则总结
1. **不要用 `cd` + 命令组合** — 使用绝对路径
2. **不要用管道 `|`** — 单独执行命令
3. **不要用多行命令 `&&` 或 `;`** — 逐个执行
4. **直接调用解释器** — `python <file>` 或 `node <file>`

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

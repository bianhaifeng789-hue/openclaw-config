# 用户个人主页 - 技术文档

## 📋 项目结构

```
app-dev-demo/
├── backend/
│   ├── package.json          # Node.js依赖
│   └── server.js             # Express API服务 ✅
├── frontend/
│   ├── package.json          # React Native依赖
│   └── screens/
│   │   └── ProfileScreen.tsx # 个人主页组件 ✅
└── design/
│   └── UI_Specification.md   # UI设计规范 ✅
```

---

## 🚀 快速启动

### 1. 启动后端API

```bash
cd backend
npm install
npm start
```

服务地址: `http://localhost:3001`

### 2. 启动前端APP

```bash
cd frontend
npm install
expo start
```

---

## 📡 API接口文档

### GET /api/v1/users/:userId/profile

获取用户主页信息

**请求示例**:
```bash
curl http://localhost:3001/api/v1/users/user001/profile
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "user001",
    "avatar": "https://picsum.photos/200/200?random=1",
    "nickname": "小明同学",
    "bio": "热爱生活，喜欢旅行和摄影 📷",
    "followers": 1234,
    "following": 567,
    "postCount": 89
  }
}
```

### PUT /api/v1/users/:userId/profile

更新个人简介

**请求示例**:
```bash
curl -X PUT http://localhost:3001/api/v1/users/user001/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"bio": "新的简介内容"}'
```

### GET /api/v1/users/:userId/posts

获取用户动态列表

**请求示例**:
```bash
curl http://localhost:3001/api/v1/users/user001/posts?page=1&size=20
```

---

## 🗄 数据结构

### UserProfile
```typescript
interface UserProfile {
  userId: string;      // 用户ID
  avatar: string;      // 头像URL
  nickname: string;    // 昵称
  bio: string;         // 个人简介 (≤200字)
  followers: number;   // 粉丝数
  following: number;   // 关注数
  postCount: number;   // 动态数
  createdAt: Date;     // 注册时间
}
```

### Post
```typescript
interface Post {
  postId: string;      // 动态ID
  userId: string;      // 发布者ID
  content: string;     // 内容文字
  images: string[];    // 图片URL列表
  likes: number;       // 点赞数
  createdAt: Date;     // 发布时间
}
```

---

## 💾 存储方案

| 数据类型 | 存储方式 | 说明 |
|----------|---------|------|
| 用户信息 | MySQL | `users` 表 |
| 动态内容 | MySQL | `posts` 表 |
| 计数器 | Redis | 粉丝/关注/点赞数缓存 |
| 会话Token | Redis | 用户登录态 |

---

## 🔧 关键实现

### 下拉刷新
```typescript
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
}, [loadData]);
```

### 简介编辑
```typescript
const handleEditBio = async () => {
  const updated = await updateProfile(userId, { bio: bioInput });
  setProfile(updated);
};
```

---

## 📦 依赖说明

### 后端
- express: Web服务框架
- cors: 跨域支持
- mysql2: MySQL数据库驱动
- redis: Redis客户端

### 前端
- react-native: 移动端框架
- expo: 开发工具链
- @react-navigation: 导航组件

---

_技术方案时间: 2026-04-16_
_工程师: Engineer Agent_
_版本: v1.0_
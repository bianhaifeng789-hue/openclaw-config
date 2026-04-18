/**
 * 用户个人主页 API 服务
 * Node.js + Express 实现
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 模拟数据库数据
const mockUsers = {
  'user001': {
    userId: 'user001',
    avatar: 'https://picsum.photos/200/200?random=1',
    nickname: '小明同学',
    bio: '热爱生活，喜欢旅行和摄影 📷',
    followers: 1234,
    following: 567,
    postCount: 89,
    createdAt: '2026-01-15T08:30:00Z'
  },
  'user002': {
    userId: 'user002',
    avatar: 'https://picsum.photos/200/200?random=2',
    nickname: '设计师Lisa',
    bio: 'UI/UX设计师 | 喜欢分享设计灵感',
    followers: 5678,
    following: 234,
    postCount: 156,
    createdAt: '2026-02-20T10:00:00Z'
  }
};

const mockPosts = {
  'user001': [
    { postId: 'p001', userId: 'user001', content: '今天去了一趟西湖，风景太美了！', images: ['https://picsum.photos/400/300?random=3'], likes: 45, createdAt: '2026-04-15T14:30:00Z' },
    { postId: 'p002', userId: 'user001', content: '分享一张我拍的日落照片', images: ['https://picsum.photos/400/300?random=4'], likes: 89, createdAt: '2026-04-14T18:00:00Z' },
    { postId: 'p003', userId: 'user001', content: '周末计划去爬山，有人一起吗？', images: [], likes: 23, createdAt: '2026-04-13T09:15:00Z' }
  ],
  'user002': [
    { postId: 'p004', userId: 'user002', content: '新设计稿完成啦，来看看效果', images: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6'], likes: 156, createdAt: '2026-04-15T11:00:00Z' }
  ]
};

// ============ API 接口 ============

/**
 * GET /api/v1/users/:userId/profile
 * 获取用户主页信息
 */
app.get('/api/v1/users/:userId/profile', (req, res) => {
  const { userId } = req.params;
  const user = mockUsers[userId];
  
  if (!user) {
    return res.status(404).json({ 
      error: 'USER_NOT_FOUND',
      message: '用户不存在' 
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

/**
 * PUT /api/v1/users/:userId/profile
 * 更新个人简介（需鉴权）
 */
app.put('/api/v1/users/:userId/profile', (req, res) => {
  const { userId } = req.params;
  const { bio, nickname, avatar } = req.body;
  
  // 简化鉴权：检查请求头
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED',
      message: '请先登录' 
    });
  }
  
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ 
      error: 'USER_NOT_FOUND',
      message: '用户不存在' 
    });
  }
  
  // 更新数据
  if (bio) user.bio = bio;
  if (nickname) user.nickname = nickname;
  if (avatar) user.avatar = avatar;
  user.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: user,
    message: '更新成功'
  });
});

/**
 * GET /api/v1/users/:userId/posts
 * 获取用户动态列表（分页）
 */
app.get('/api/v1/users/:userId/posts', (req, res) => {
  const { userId } = req.params;
  const { page = 1, size = 20 } = req.query;
  
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ 
      error: 'USER_NOT_FOUND',
      message: '用户不存在' 
    });
  }
  
  const posts = mockPosts[userId] || [];
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + parseInt(size);
  const paginatedPosts = posts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      posts: paginatedPosts,
      total: posts.length,
      page: parseInt(page),
      size: parseInt(size),
      hasMore: endIndex < posts.length
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 用户主页API服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   接口: /api/v1/users/:userId/profile`);
});

module.exports = app;
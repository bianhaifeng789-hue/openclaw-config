/**
 * 用户个人主页组件
 * React Native 实现
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
  FlatList
} from 'react-native';

// ============ 数据类型定义 ============
interface UserProfile {
  userId: string;
  avatar: string;
  nickname: string;
  bio: string;
  followers: number;
  following: number;
  postCount: number;
  createdAt: string;
}

interface Post {
  postId: string;
  userId: string;
  content: string;
  images: string[];
  likes: number;
  createdAt: string;
}

// ============ API 服务 ============
const API_BASE = 'http://localhost:3001/api/v1';

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE}/users/${userId}/profile`);
  const data = await response.json();
  return data.data;
};

const fetchUserPosts = async (userId: string, page: number = 1, size: number = 20): Promise<{posts: Post[], total: number, hasMore: boolean}> => {
  const response = await fetch(`${API_BASE}/users/${userId}/posts?page=${page}&size=${size}`);
  const data = await response.json();
  return data.data;
};

const updateProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-token'
    },
    body: JSON.stringify(updates)
  });
  const data = await response.json();
  return data.data;
};

// ============ 组件实现 ============

/**
 * 统计数字组件
 */
const StatsRow = ({ followers, following, postCount }: { followers: number; following: number; postCount: number }) => (
  <View style={styles.statsRow}>
    <TouchableOpacity style={styles.statItem}>
      <Text style={styles.statNumber}>{followers}</Text>
      <Text style={styles.statLabel}>粉丝</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.statItem}>
      <Text style={styles.statNumber}>{following}</Text>
      <Text style={styles.statLabel}>关注</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.statItem}>
      <Text style={styles.statNumber}>{postCount}</Text>
      <Text style={styles.statLabel}>动态</Text>
    </TouchableOpacity>
  </View>
);

/**
 * 动态卡片组件
 */
const PostCard = ({ post }: { post: Post }) => (
  <View style={styles.postCard}>
    <Text style={styles.postContent}>{post.content}</Text>
    {post.images.length > 0 && (
      <View style={styles.postImages}>
        {post.images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.postImage} />
        ))}
      </View>
    )}
    <View style={styles.postFooter}>
      <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
      <Text style={styles.postLikes}>❤️ {post.likes}</Text>
    </View>
  </View>
);

/**
 * 时间格式化
 */
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

/**
 * 个人主页主组件
 */
const ProfileScreen = ({ userId = 'user001' }: { userId?: string }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');

  // 加载用户数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userProfile = await fetchUserProfile(userId);
      const userPosts = await fetchUserPosts(userId);
      setProfile(userProfile);
      setPosts(userPosts.posts);
    } catch (error) {
      Alert.alert('错误', '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 编辑简介
  const handleEditBio = async () => {
    if (!bioInput.trim()) {
      setEditingBio(false);
      return;
    }
    try {
      const updated = await updateProfile(userId, { bio: bioInput });
      setProfile(updated);
      setEditingBio(false);
      Alert.alert('成功', '简介已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败');
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.loading}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 用户信息区 */}
      <View style={styles.header}>
        {/* 头像 */}
        <TouchableOpacity onPress={() => Alert.alert('头像预览', '点击查看大图')}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        </TouchableOpacity>
        
        {/* 昵称 */}
        <Text style={styles.nickname}>{profile.nickname}</Text>
        
        {/* 个人简介 */}
        {editingBio ? (
          <View style={styles.bioEdit}>
            <TextInput
              style={styles.bioInput}
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="编辑简介..."
              maxLength={200}
              multiline
            />
            <TouchableOpacity style={styles.bioSaveBtn} onPress={handleEditBio}>
              <Text style={styles.bioSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => {
            setBioInput(profile.bio);
            setEditingBio(true);
          }}>
            <Text style={styles.bio}>{profile.bio || '点击添加简介'}</Text>
          </TouchableOpacity>
        )}
        
        {/* 统计数据 */}
        <StatsRow 
          followers={profile.followers} 
          following={profile.following} 
          postCount={profile.postCount} 
        />
        
        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>编辑资料</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 动态标签栏 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            动态
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
          onPress={() => setActiveTab('likes')}
        >
          <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>
            喜欢
          </Text>
        </TouchableOpacity>
      </View>

      {/* 动态列表 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        renderItem={({ item }) => <PostCard post={item} />}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

// ============ 样式定义 ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  bioEdit: {
    width: '100%',
    marginBottom: 16,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  bioSaveBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B9D',
    padding: 10,
    borderRadius: 8,
  },
  bioSaveText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareBtnText: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B9D',
  },
  tabText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#FF6B9D',
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  postImages: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  postLikes: {
    fontSize: 12,
    color: '#FF6B9D',
  },
});

export default ProfileScreen;
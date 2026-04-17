#!/usr/bin/env node
/**
 * Todo Write Tool - 基于 Claude Code TodoWriteTool
 * 
 * Todo 管理：
 *   - 创建/更新 todo 列表
 *   - 状态追踪
 *   - 优先级管理
 * 
 * Usage:
 *   node todo-write-tool.js add <content> [priority]
 *   node todo-write-tool.js update <id> <status>
 *   node todo-write-tool.js list
 *   node todo-write-tool.js clear
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'todos');
const TODOS_FILE = path.join(STATE_DIR, 'todos.json');

const TODO_STATUS = {
  pending: 'not started',
  in_progress: 'working on',
  completed: 'done',
  cancelled: 'abandoned'
};

const TODO_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1
};

function loadTodos() {
  if (!fs.existsSync(TODOS_FILE)) {
    return { todos: [], nextId: 1 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(TODOS_FILE, 'utf8'));
  } catch {
    return { todos: [], nextId: 1 };
  }
}

function saveTodos(todos) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
}

function addTodo(content, priority = 'medium', metadata = {}) {
  const todos = loadTodos();
  
  const todo = {
    id: `todo_${todos.nextId}`,
    content,
    status: 'pending',
    priority,
    priorityValue: TODO_PRIORITY[priority] || 2,
    metadata,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  todos.todos.push(todo);
  todos.nextId++;
  
  saveTodos(todos);
  
  return {
    added: true,
    todo,
    totalTodos: todos.todos.length,
    pendingCount: todos.todos.filter(t => t.status === 'pending').length
  };
}

function updateTodo(id, status, content = null) {
  const todos = loadTodos();
  const todo = todos.todos.find(t => t.id === id);
  
  if (!todo) {
    return {
      updated: false,
      error: 'todo not found',
      id
    };
  }
  
  if (!TODO_STATUS[status]) {
    return {
      updated: false,
      error: 'invalid status',
      id,
      validStatuses: Object.keys(TODO_STATUS)
    };
  }
  
  todo.status = status;
  if (content) {
    todo.content = content;
  }
  todo.updatedAt = Date.now();
  
  if (status === 'completed') {
    todo.completedAt = Date.now();
  } else if (status === 'cancelled') {
    todo.cancelledAt = Date.now();
  }
  
  saveTodos(todos);
  
  return {
    updated: true,
    todo,
    remainingPending: todos.todos.filter(t => t.status === 'pending').length
  };
}

function listTodos(filter = null) {
  const todos = loadTodos();
  
  let filtered = todos.todos;
  if (filter) {
    filtered = todos.todos.filter(t => t.status === filter || t.priority === filter);
  }
  
  // Sort by priority (high first) and then by status
  filtered.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return b.priorityValue - a.priorityValue;
  });
  
  return {
    todos: filtered,
    total: todos.todos.length,
    pending: todos.todos.filter(t => t.status === 'pending').length,
    inProgress: todos.todos.filter(t => t.status === 'in_progress').length,
    completed: todos.todos.filter(t => t.status === 'completed').length
  };
}

function getTodoStats() {
  const todos = loadTodos();
  
  const byStatus = {};
  const byPriority = {};
  
  for (const todo of todos.todos) {
    byStatus[todo.status] = (byStatus[todo.status] || 0) + 1;
    byPriority[todo.priority] = (byPriority[todo.priority] || 0) + 1;
  }
  
  return {
    total: todos.todos.length,
    byStatus,
    byPriority,
    completionRate: todos.todos.length > 0
      ? (todos.todos.filter(t => t.status === 'completed').length / todos.todos.length * 100).toFixed(1) + '%'
      : '0%'
  };
}

function clearCompletedTodos() {
  const todos = loadTodos();
  
  const remaining = todos.todos.filter(t => t.status !== 'completed');
  const clearedCount = todos.todos.filter(t => t.status === 'completed').length;
  
  todos.todos = remaining;
  saveTodos(todos);
  
  return {
    cleared: true,
    clearedCount,
    remainingCount: remaining.length
  };
}

function clearAllTodos() {
  saveTodos({ todos: [], nextId: 1 });
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function reorderTodos(order) {
  const todos = loadTodos();
  
  // Apply reorder based on priority or custom order
  if (order === 'priority') {
    todos.todos.sort((a, b) => b.priorityValue - a.priorityValue);
  } else if (order === 'status') {
    todos.todos.sort((a, b) => {
      const statusOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  } else if (order === 'created') {
    todos.todos.sort((a, b) => a.createdAt - b.createdAt);
  }
  
  saveTodos(todos);
  
  return {
    reordered: true,
    order,
    todos: todos.todos
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'add':
      const content = args[1];
      const priority = args[2] || 'medium';
      if (!content) {
        console.log('Usage: node todo-write-tool.js add <content> [priority]');
        process.exit(1);
      }
      console.log(JSON.stringify(addTodo(content, priority), null, 2));
      break;
    case 'update':
      const updateId = args[1];
      const updateStatus = args[2];
      const updateContent = args[3];
      if (!updateId || !updateStatus) {
        console.log('Usage: node todo-write-tool.js update <id> <status> [content]');
        process.exit(1);
      }
      console.log(JSON.stringify(updateTodo(updateId, updateStatus, updateContent), null, 2));
      break;
    case 'list':
      const filter = args[1];
      console.log(JSON.stringify(listTodos(filter), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getTodoStats(), null, 2));
      break;
    case 'clear':
      const clearType = args[1] || 'completed';
      if (clearType === 'all') {
        console.log(JSON.stringify(clearAllTodos(), null, 2));
      } else {
        console.log(JSON.stringify(clearCompletedTodos(), null, 2));
      }
      break;
    case 'reorder':
      const order = args[1] || 'priority';
      console.log(JSON.stringify(reorderTodos(order), null, 2));
      break;
    default:
      console.log('Usage: node todo-write-tool.js [add|update|list|stats|clear|reorder]');
      process.exit(1);
  }
}

main();

module.exports = {
  addTodo,
  updateTodo,
  listTodos,
  getTodoStats,
  clearCompletedTodos,
  clearAllTodos,
  reorderTodos,
  TODO_STATUS,
  TODO_PRIORITY
};
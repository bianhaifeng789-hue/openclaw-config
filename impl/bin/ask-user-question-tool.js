#!/usr/bin/env node
/**
 * Ask User Question Tool - 基于 Claude Code AskUserQuestionTool
 * 
 * 用户问答工具：
 *   - 多选问题
 *   - 收集偏好/需求
 *   - 澄清模糊指令
 *   - 决策选项
 * 
 * Usage:
 *   node ask-user-question-tool.js ask <questionJson>
 *   node ask-user-question-tool.js history
 *   node ask-user-question-tool.js pending
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'questions');
const QUESTIONS_FILE = path.join(STATE_DIR, 'questions-history.json');
const PENDING_FILE = path.join(STATE_DIR, 'pending-questions.json');

const ASK_USER_QUESTION_TOOL_NAME = 'AskUserQuestion';

function loadQuestionHistory() {
  if (!fs.existsSync(QUESTIONS_FILE)) {
    return { questions: [], totalAsked: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
  } catch {
    return { questions: [], totalAsked: 0 };
  }
}

function saveQuestionHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(history, null, 2));
}

function loadPendingQuestions() {
  if (!fs.existsSync(PENDING_FILE)) {
    return [];
  }
  
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePendingQuestions(pending) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

function askQuestion(questionJson) {
  // Parse question
  let question;
  try {
    question = JSON.parse(questionJson);
  } catch {
    return {
      asked: false,
      error: 'invalid question JSON'
    };
  }
  
  // Validate structure
  if (!question.question || !question.options || !Array.isArray(question.options)) {
    return {
      asked: false,
      error: 'question must have question and options fields'
    };
  }
  
  // Normalize question
  const normalizedQuestion = {
    id: `question_${Date.now()}`,
    question: question.question,
    options: question.options.map((opt, i) => {
      if (typeof opt === 'string') {
        return { label: opt, value: i.toString() };
      }
      return {
        label: opt.label || `Option ${i + 1}`,
        value: opt.value || i.toString(),
        description: opt.description || '',
        preview: opt.preview || null,
        recommended: opt.recommended || false
      };
    }),
    multiSelect: question.multiSelect || false,
    defaultOption: question.defaultOption || 0,
    previewMode: question.options.some(opt => opt.preview),
    metadata: question.metadata || {},
    askedAt: Date.now(),
    answered: false,
    answer: null
  };
  
  // Add to pending
  const pending = loadPendingQuestions();
  pending.push(normalizedQuestion);
  savePendingQuestions(pending);
  
  // Add to history
  const history = loadQuestionHistory();
  history.questions.push(normalizedQuestion);
  history.totalAsked++;
  saveQuestionHistory(history);
  
  return {
    asked: true,
    question: normalizedQuestion,
    pendingCount: pending.length,
    note: 'User can answer via "Other" option for custom input'
  };
}

function answerQuestion(questionId, answer) {
  const pending = loadPendingQuestions();
  const question = pending.find(q => q.id === questionId);
  
  if (!question) {
    return {
      answered: false,
      error: 'question not found',
      questionId
    };
  }
  
  // Record answer
  question.answered = true;
  question.answer = answer;
  question.answeredAt = Date.now();
  
  // Remove from pending
  const updatedPending = pending.filter(q => q.id !== questionId);
  savePendingQuestions(updatedPending);
  
  // Update history
  const history = loadQuestionHistory();
  const historyQuestion = history.questions.find(q => q.id === questionId);
  if (historyQuestion) {
    historyQuestion.answered = true;
    historyQuestion.answer = answer;
    historyQuestion.answeredAt = Date.now();
  }
  saveQuestionHistory(history);
  
  return {
    answered: true,
    question,
    remainingPending: updatedPending.length
  };
}

function getPendingQuestions() {
  const pending = loadPendingQuestions();
  
  return {
    count: pending.length,
    questions: pending,
    oldest: pending.length > 0 ? pending[0] : null
  };
}

function getQuestionHistory(limit = 50) {
  const history = loadQuestionHistory();
  
  return {
    questions: history.questions.slice(-limit),
    total: history.questions.length,
    answeredCount: history.questions.filter(q => q.answered).length,
    unansweredCount: history.questions.filter(q => !q.answered).length
  };
}

function getQuestionStats() {
  const history = loadQuestionHistory();
  const pending = loadPendingQuestions();
  
  const multiSelectCount = history.questions.filter(q => q.multiSelect).length;
  const previewCount = history.questions.filter(q => q.previewMode).length;
  
  return {
    totalAsked: history.totalAsked,
    pending: pending.length,
    answered: history.questions.filter(q => q.answered).length,
    multiSelectUsed: multiSelectCount,
    previewUsed: previewCount
  };
}

function createQuickQuestion(questionText, options, multiSelect = false) {
  const questionJson = JSON.stringify({
    question: questionText,
    options: options,
    multiSelect
  });
  
  return askQuestion(questionJson);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  switch (command) {
    case 'ask':
      const questionJson = args[1];
      if (!questionJson) {
        console.log('Usage: node ask-user-question-tool.js ask <questionJson>');
        console.log('Example: {"question":"Choose option","options":["A","B","C"]}');
        process.exit(1);
      }
      console.log(JSON.stringify(askQuestion(questionJson), null, 2));
      break;
    case 'answer':
      const questionId = args[1];
      const answer = args[2];
      if (!questionId || !answer) {
        console.log('Usage: node ask-user-question-tool.js answer <questionId> <answer>');
        process.exit(1);
      }
      console.log(JSON.stringify(answerQuestion(questionId, answer), null, 2));
      break;
    case 'pending':
      console.log(JSON.stringify(getPendingQuestions(), null, 2));
      break;
    case 'history':
      const limit = parseInt(args[1], 10) || 50;
      console.log(JSON.stringify(getQuestionHistory(limit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getQuestionStats(), null, 2));
      break;
    case 'quick':
      const qText = args[1] || 'Choose an option';
      const qOptions = args[2] ? args[2].split(',') : ['Option A', 'Option B'];
      console.log(JSON.stringify(createQuickQuestion(qText, qOptions), null, 2));
      break;
    default:
      console.log('Usage: node ask-user-question-tool.js [ask|answer|pending|history|stats|quick]');
      process.exit(1);
  }
}

main();

module.exports = {
  askQuestion,
  answerQuestion,
  getPendingQuestions,
  getQuestionHistory,
  getQuestionStats,
  createQuickQuestion,
  ASK_USER_QUESTION_TOOL_NAME
};
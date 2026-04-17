#!/usr/bin/env node
/**
 * Feishu Docs Helper - 飞书文档操作助手
 * 
 * 支持操作：
 *   - 创建文档
 *   - 写入内容
 *   - 追加内容
 *   - 上传图片
 *   - 创建表格
 *   - 格式化文本
 * 
 * Usage:
 *   node feishu-docs-helper.js create --title "广告分析报告"
 *   node feishu-docs-helper.js write --doc-token XXXX --content "报告内容"
 *   node feishu-docs-helper.js append --doc-token XXXX --content "追加内容"
 *   node feishu-docs-helper.js table --doc-token XXXX --rows 5 --cols 3
 *   node feishu-docs-helper.js format --text "标题" --style bold
 */

const fs = require('fs');
const path = require('path');

/**
 * 创建飞书文档配置
 */
function createDocConfig(title, folderToken = null) {
  const config = {
    title,
    folder_token: folderToken,
    grant_to_requester: true,
    content: `# ${title}

创建时间: ${new Date().toISOString()}

---

_这是自动生成的文档_`
  };
  
  const guide = `## 创建飞书文档

**标题：** ${title}

**API 调用示例：**

await feishu_doc({
  action: 'create',
  title: '${title}',
  folder_token: '${folderToken || 'optional'}',
  grant_to_requester: true
});

**步骤：**
1. 调用 feishu_doc tool
2. 设置 action: 'create'
3. 提供标题和可选的文件夹 token
4. 返回 doc_token 用于后续操作

---

**创建后操作：**
- write: 写入内容
- append: 追加内容
- upload_image: 上传图片
`;

  return {
    config,
    guide,
    title,
    folderToken
  };
}

/**
 * 写入文档内容配置
 */
function writeDocConfig(docToken, content, format = 'markdown') {
  const formattedContent = format === 'markdown' 
    ? formatMarkdown(content)
    : content;
  
  const config = {
    action: 'write',
    doc_token: docToken,
    content: formattedContent
  };
  
  const guide = `## 写入飞书文档

**Doc Token：** ${docToken}

**内容预览：**
${formattedContent.slice(0, 200)}${formattedContent.length > 200 ? '...' : ''}

**API 调用示例：**

await feishu_doc({
  action: 'write',
  doc_token: '${docToken}',
  content: '${formattedContent.slice(0, 50)}...'
});

---

**格式支持：**
- markdown（默认）
- plain text
`;

  return {
    config,
    guide,
    docToken,
    contentPreview: formattedContent.slice(0, 500),
    totalLength: formattedContent.length
  };
}

/**
 * 追加文档内容配置
 */
function appendDocConfig(docToken, content, afterBlockId = null) {
  const config = {
    action: 'append',
    doc_token: docToken,
    content,
    after_block_id: afterBlockId
  };
  
  const guide = `## 追加飞书文档内容

**Doc Token：** ${docToken}

**追加内容：**
${content}

**API 调用示例：**


await feishu_doc({
  action: 'append',
  doc_token: '${docToken}',
  content: '${content}'
});


---

**注意：**
- append 会添加到文档末尾
- 如需插入到特定位置，使用 after_block_id
- 可通过 list_blocks 获取 block_id
`;

  return {
    config,
    guide,
    docToken,
    content
  };
}

/**
 * 创建表格配置
 */
function createTableConfig(docToken, rows, cols, data = null) {
  const tableData = data || generateEmptyTable(rows, cols);
  
  const config = {
    action: 'create_table_with_values',
    doc_token: docToken,
    row_size: rows,
    column_size: cols,
    values: tableData
  };
  
  const preview = tableData.slice(0, 3).map(row => row.join(' | ')).join('\n');
  
  const guide = `## 创建飞书表格

**Doc Token：** ${docToken}

**表格大小：** ${rows} 行 × ${cols} 列

**数据预览：**
${preview}

**API 调用示例：**


await feishu_doc({
  action: 'create_table_with_values',
  doc_token: '${docToken}',
  row_size: ${rows},
  column_size: ${cols},
  values: [
    ['Header 1', 'Header 2', 'Header 3'],
    ['Data 1', 'Data 2', 'Data 3']
  ]
});


---

**表格操作：**
- write_table_cells: 写入单元格
- insert_table_row: 插入行
- delete_table_rows: 删除行
`;

  return {
    config,
    guide,
    docToken,
    rows,
    cols,
    tablePreview: preview,
    totalCells: rows * cols
  };
}

/**
 * 上传图片配置
 */
function uploadImageConfig(docToken, imagePath, url = null) {
  const config = {
    action: 'upload_image',
    doc_token: docToken,
    file_path: imagePath || null,
    url: url || null
  };
  
  const guide = `## 上传飞书图片

**Doc Token：** ${docToken}

**图片来源：**
${url ? `- URL: ${url}` : `- 本地文件: ${imagePath}`}

**API 调用示例：**


// 从 URL 上传
await feishu_doc({
  action: 'upload_image',
  doc_token: '${docToken}',
  url: 'https://example.com/image.png'
});

// 从本地文件上传
await feishu_doc({
  action: 'upload_image',
  doc_token: '${docToken}',
  file_path: '${imagePath}'
});


---

**支持格式：**
- PNG, JPG, JPEG, GIF
- 最大 20MB
`;

  return {
    config,
    guide,
    docToken,
    source: url || imagePath,
    uploadType: url ? 'url' : 'file'
  };
}

/**
 * 格式化文本
 */
function formatText(text, style) {
  const formattedMap = {
    bold: `**${text}**`,
    italic: `*${text}*`,
    underline: `<u>${text}</u>`,
    strikethrough: `~~${text}~~`,
    code: `\`${text}\``,
    heading1: `# ${text}`,
    heading2: `## ${text}`,
    heading3: `### ${text}`,
    quote: `> ${text}`,
    list: `- ${text}`,
    link: `[${text}](url)`
  };
  
  const formatted = formattedMap[style] || text;
  
  return {
    original: text,
    style,
    formatted,
    preview: formatted
  };
}

/**
 * 格式化 Markdown
 */
function formatMarkdown(content) {
  // 确保标题格式
  if (!content.startsWith('#')) {
    content = `# 文档\n\n${content}`;
  }
  
  // 确保有分隔符
  if (!content.includes('---')) {
    content += '\n\n---\n';
  }
  
  // 添加时间戳
  if (!content.includes('生成时间')) {
    content += `\n生成时间: ${new Date().toISOString()}`;
  }
  
  return content;
}

/**
 * 生成空表格
 */
function generateEmptyTable(rows, cols) {
  const table = [];
  
  // 标题行
  table.push(Array(cols).fill('').map((_, i) => `列 ${i + 1}`));
  
  // 数据行
  for (let i = 1; i < rows; i++) {
    table.push(Array(cols).fill(''));
  }
  
  return table;
}

/**
 * 生成文档模板
 */
function generateDocTemplate(templateType, customData = {}) {
  const templates = {
    report: `# ${customData.title || '分析报告'}

## 概述

${customData.summary || '报告概述'}

## 数据

| 项目 | 数值 |
|------|------|
| ${customData.dataLabel1 || '数据1'} | ${customData.dataValue1 || 'N/A'} |
| ${customData.dataLabel2 || '数据2'} | ${customData.dataValue2 || 'N/A'} |

## 分析

${customData.analysis || '分析内容'}

## 建议

${customData.recommendations || '建议内容'}

---

生成时间: ${new Date().toISOString()}
`,
    
    meeting: `# ${customData.title || '会议记录'}

**日期：** ${customData.date || new Date().toISOString().split('T')[0]}

**参会人员：** ${customData.attendees || '参会人员'}

## 会议内容

${customData.content || '会议内容'}

## 待办事项

- ${customData.todo1 || '待办1'}
- ${customData.todo2 || '待办2'}

---

记录时间: ${new Date().toISOString()}
`,
    
    checklist: `# ${customData.title || '检查清单'}

## 检查项

| 序号 | 项目 | 状态 | 备注 |
|------|------|------|------|
| 1 | ${customData.item1 || '项目1'} | ⚪ | |
| 2 | ${customData.item2 || '项目2'} | ⚪ | |

---

生成时间: ${new Date().toISOString()}
`
  };
  
  return templates[templateType] || templates.report;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(JSON.stringify({
      error: '请指定命令',
      usage: 'create | write | append | table | upload-image | format | template',
      examples: [
        'node feishu-docs-helper.js create --title "报告"',
        'node feishu-docs-helper.js write --doc-token XXXX --content "内容"'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'create':
        const title = args.find(a => a.startsWith('--title='))?.split('=')[1] || '新文档';
        const folderToken = args.find(a => a.startsWith('--folder='))?.split('=')[1] || null;
        result = createDocConfig(title, folderToken);
        break;
        
      case 'write':
        const docToken = args.find(a => a.startsWith('--doc-token='))?.split('=')[1] || '';
        const content = args.find(a => a.startsWith('--content='))?.split('=')[1] || '';
        const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'markdown';
        result = writeDocConfig(docToken, content, format);
        break;
        
      case 'append':
        const aDocToken = args.find(a => a.startsWith('--doc-token='))?.split('=')[1] || '';
        const aContent = args.find(a => a.startsWith('--content='))?.split('=')[1] || '';
        const afterBlock = args.find(a => a.startsWith('--after='))?.split('=')[1] || null;
        result = appendDocConfig(aDocToken, aContent, afterBlock);
        break;
        
      case 'table':
        const tDocToken = args.find(a => a.startsWith('--doc-token='))?.split('=')[1] || '';
        const rows = parseInt(args.find(a => a.startsWith('--rows='))?.split('=')[1] || 5);
        const cols = parseInt(args.find(a => a.startsWith('--cols='))?.split('=')[1] || 3);
        const data = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || 'null');
        result = createTableConfig(tDocToken, rows, cols, data);
        break;
        
      case 'upload-image':
        const uDocToken = args.find(a => a.startsWith('--doc-token='))?.split('=')[1] || '';
        const imagePath = args.find(a => a.startsWith('--path='))?.split('=')[1] || null;
        const url = args.find(a => a.startsWith('--url='))?.split('=')[1] || null;
        result = uploadImageConfig(uDocToken, imagePath, url);
        break;
        
      case 'format':
        const text = args.find(a => a.startsWith('--text='))?.split('=')[1] || '';
        const style = args.find(a => a.startsWith('--style='))?.split('=')[1] || 'bold';
        result = formatText(text, style);
        break;
        
      case 'template':
        const templateType = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'report';
        const customData = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        result = {
          template: generateDocTemplate(templateType, customData),
          type: templateType
        };
        break;
        
      default:
        result = { error: `未知命令: ${command}` };
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}

// 导出供其他模块使用
module.exports = {
  createDocConfig,
  writeDocConfig,
  appendDocConfig,
  createTableConfig,
  uploadImageConfig,
  formatText,
  generateDocTemplate
};

if (require.main === module) {
  main();
}
#!/usr/bin/env node
/**
 * Excel Operations CLI - Excel 数据处理工具
 * 
 * 支持操作：
 *   - CSV 转 JSON
 *   - JSON 转 CSV
 *   - 数据汇总
 *   - 数据过滤
 *   - 数据合并
 * 
 * Usage:
 *   node excel-operations-cli.js csv2json --input data.csv --output data.json
 *   node excel-operations-cli.js json2csv --input data.json --output data.csv
 *   node excel-operations-cli.js summarize --input data.csv --fields '["cost","revenue"]'
 *   node excel-operations-cli.js filter --input data.csv --condition 'roi>100'
 *   node excel-operations-cli.js merge --files '["a.csv","b.csv"]' --output merged.csv
 */

const fs = require('fs');
const path = require('path');

/**
 * CSV 转 JSON
 */
function csvToJSON(csvContent, options = {}) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return { error: 'CSV 文件至少需要标题行和数据行' };
  
  // 解析标题
  const delimiter = options.delimiter || ',';
  const headers = parseCSVLine(lines[0], delimiter);
  
  // 解析数据行
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row = {};
    
    headers.forEach((header, j) => {
      const value = values[j] || '';
      
      // 类型转换
      if (options.autoConvert) {
        row[header] = convertValue(value);
      } else {
        row[header] = value;
      }
    });
    
    data.push(row);
  }
  
  return {
    headers,
    data,
    rowCount: data.length,
    columnCount: headers.length,
    delimiter
  };
}

/**
 * JSON 转 CSV
 */
function jsonToCSV(jsonData, options = {}) {
  if (!jsonData || jsonData.length === 0) {
    return { error: 'JSON 数据为空' };
  }
  
  // 提取标题
  const headers = options.headers || Object.keys(jsonData[0]);
  
  // 构建 CSV 行
  const delimiter = options.delimiter || ',';
  const lines = [];
  
  // 标题行
  lines.push(formatCSVLine(headers, delimiter));
  
  // 数据行
  for (const row of jsonData) {
    const values = headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    lines.push(formatCSVLine(values, delimiter));
  }
  
  const csvContent = lines.join('\n');
  
  return {
    headers,
    csvContent,
    rowCount: jsonData.length,
    columnCount: headers.length,
    delimiter
  };
}

/**
 * 数据汇总
 */
function summarizeData(data, fields) {
  if (!data || data.length === 0) {
    return { error: '数据为空' };
  }
  
  const summary = {};
  
  for (const field of fields) {
    const values = data
      .map(row => parseFloat(row[field]))
      .filter(v => !isNaN(v));
    
    if (values.length === 0) {
      summary[field] = {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0
      };
      continue;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const sorted = values.sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    summary[field] = {
      count: values.length,
      sum: sum.toFixed(2),
      average: average.toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      median: median.toFixed(2)
    };
  }
  
  const report = `## 数据汇总报告

**总行数：** ${data.length}

${Object.entries(summary).map(([field, stats]) =>
  `### ${field}
- 数量: ${stats.count}
- 总和: ${stats.sum}
- 平均: ${stats.average}
- 最小: ${stats.min}
- 最大: ${stats.max}
- 中位数: ${stats.median}`
).join('\n\n')}

---
生成时间: ${new Date().toISOString()}
`;

  return {
    summary,
    report,
    totalRows: data.length,
    summarizedFields: fields.length
  };
}

/**
 * 数据过滤
 */
function filterData(data, condition) {
  if (!data || data.length === 0) {
    return { error: '数据为空' };
  }
  
  // 解析条件（简化版）
  // 支持: field>value, field<value, field=value
  const match = condition.match(/^(\w+)(>|<|=|>=|<=)(.+)$/);
  if (!match) {
    return { error: '条件格式错误，支持: field>value, field<value, field=value' };
  }
  
  const [, field, operator, valueStr] = match;
  const value = parseFloat(valueStr) || valueStr;
  
  const filtered = data.filter(row => {
    const fieldValue = parseFloat(row[field]) || row[field];
    
    switch (operator) {
      case '>': return fieldValue > value;
      case '<': return fieldValue < value;
      case '=': return fieldValue == value;
      case '>=': return fieldValue >= value;
      case '<=': return fieldValue <= value;
      default: return false;
    }
  });
  
  return {
    filtered,
    condition,
    field,
    operator,
    value,
    originalCount: data.length,
    filteredCount: filtered.length,
    filteredPercent: ((filtered.length / data.length) * 100).toFixed(1) + '%'
  };
}

/**
 * 数据合并
 */
function mergeData(filesData, options = {}) {
  if (!filesData || filesData.length === 0) {
    return { error: '需提供至少一个文件数据' };
  }
  
  // 获取所有标题
  const allHeaders = filesData.map(d => d.headers || Object.keys(d.data[0] || {}));
  const mergedHeaders = [...new Set(allHeaders.flat())];
  
  // 合并数据
  const mergedData = [];
  for (const fileData of filesData) {
    if (fileData.data) {
      mergedData.push(...fileData.data);
    }
  }
  
  // 按 joinKey 合并（如果提供）
  if (options.joinKey && options.joinType === 'inner') {
    // 内连接合并
    const mergedByKey = {};
    
    for (const row of mergedData) {
      const key = row[options.joinKey];
      if (!mergedByKey[key]) {
        mergedByKey[key] = row;
      } else {
        // 合并肩属性
        Object.assign(mergedByKey[key], row);
      }
    }
    
    mergedData.length = 0;
    mergedData.push(...Object.values(mergedByKey));
  }
  
  const csvResult = jsonToCSV(mergedData, { headers: mergedHeaders });
  
  return {
    headers: mergedHeaders,
    data: mergedData,
    csvContent: csvResult.csvContent,
    totalFiles: filesData.length,
    totalRows: mergedData.length,
    joinKey: options.joinKey || null
  };
}

/**
 * 解析 CSV 行
 */
function parseCSVLine(line, delimiter = ',') {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * 格式化 CSV 行
 */
function formatCSVLine(values, delimiter = ',') {
  return values.map(v => {
    // 包含分隔符或引号时，需要用引号包裹
    if (v.includes(delimiter) || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  }).join(delimiter);
}

/**
 * 类型转换
 */
function convertValue(value) {
  // 数字
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  
  //布尔
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // 空值
  if (value === '' || value === 'null') return null;
  
  // 字符串
  return value;
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
      usage: 'csv2json | json2csv | summarize | filter | merge',
      examples: [
        'node excel-operations-cli.js csv2json --input data.csv',
        'node excel-operations-cli.js summarize --input data.csv --fields \'["cost","revenue"]\''
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'csv2json':
        const csvPath = args.find(a => a.startsWith('--input='))?.split('=')[1];
        if (!csvPath) {
          result = { error: '需提供 CSV 文件路径' };
        } else {
          const csvContent = fs.readFileSync(csvPath, 'utf-8');
          const options = {
            delimiter: args.find(a => a.startsWith('--delimiter='))?.split('=')[1] || ',',
            autoConvert: args.includes('--auto-convert')
          };
          result = csvToJSON(csvContent, options);
          
          const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1];
          if (outputPath) {
            fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
            result.outputPath = outputPath;
          }
        }
        break;
        
      case 'json2csv':
        const jsonPath = args.find(a => a.startsWith('--input='))?.split('=')[1];
        if (!jsonPath) {
          result = { error: '需提供 JSON 文件路径' };
        } else {
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const options = {
            delimiter: args.find(a => a.startsWith('--delimiter='))?.split('=')[1] || ','
          };
          result = jsonToCSV(jsonData, options);
          
          const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1];
          if (outputPath) {
            fs.writeFileSync(outputPath, result.csvContent);
            result.outputPath = outputPath;
          }
        }
        break;
        
      case 'summarize':
        const sumPath = args.find(a => a.startsWith('--input='))?.split('=')[1];
        const fields = JSON.parse(args.find(a => a.startsWith('--fields='))?.split('=')[1] || '[]');
        
        if (!sumPath) {
          result = { error: '需提供数据文件路径' };
        } else {
          // 支持 CSV 或 JSON
          const content = fs.readFileSync(sumPath, 'utf-8');
          const data = sumPath.endsWith('.csv') 
            ? csvToJSON(content).data 
            : JSON.parse(content);
          result = summarizeData(data, fields);
        }
        break;
        
      case 'filter':
        const filterPath = args.find(a => a.startsWith('--input='))?.split('=')[1];
        const condition = args.find(a => a.startsWith('--condition='))?.split('=')[1] || '';
        
        if (!filterPath) {
          result = { error: '需提供数据文件路径' };
        } else {
          const content = fs.readFileSync(filterPath, 'utf-8');
          const data = filterPath.endsWith('.csv')
            ? csvToJSON(content).data
            : JSON.parse(content);
          result = filterData(data, condition);
          
          const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1];
          if (outputPath) {
            fs.writeFileSync(outputPath, JSON.stringify(result.filtered, null, 2));
            result.outputPath = outputPath;
          }
        }
        break;
        
      case 'merge':
        const filesParam = args.find(a => a.startsWith('--files='))?.split('=')[1];
        const files = JSON.parse(filesParam || '[]');
        
        if (files.length === 0) {
          result = { error: '需提供至少一个文件路径' };
        } else {
          const filesData = files.map(f => {
            const content = fs.readFileSync(f, 'utf-8');
            return f.endsWith('.csv') ? csvToJSON(content) : { data: JSON.parse(content) };
          });
          
          const options = {
            joinKey: args.find(a => a.startsWith('--join-key='))?.split('=')[1],
            joinType: args.find(a => a.startsWith('--join-type='))?.split('=')[1]
          };
          
          result = mergeData(filesData, options);
          
          const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1];
          if (outputPath) {
            fs.writeFileSync(outputPath, result.csvContent);
            result.outputPath = outputPath;
          }
        }
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
  csvToJSON,
  jsonToCSV,
  summarizeData,
  filterData,
  mergeData
};

if (require.main === module) {
  main();
}
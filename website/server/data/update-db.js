const fs = require('fs');

const file = 'db.json';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  // 如果当前行是"购买渠道"，且下一行是"当前实时价"，则在中间插入"是否清仓"
  if (lines[i].includes('"购买渠道":') && i + 1 < lines.length && lines[i + 1].includes('"当前实时价"')) {
    const indent = lines[i].match(/^\s*/)[0];
    newLines.push(indent + '"是否清仓": "否",');
  }
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('✅ 已更新 db.json，添加了 是否清仓 字段');

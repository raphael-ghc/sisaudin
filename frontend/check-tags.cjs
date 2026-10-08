const fs = require('fs');

const code = fs.readFileSync('c:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioPreliminar.jsx', 'utf8');

// Strip out everything except JSX tags
// We only care about the return statement of RelatorioPreliminar
let jsx = code.substring(code.indexOf('return (', 1300));

// Strip dangerouslySetInnerHTML contents so they don't confuse us
jsx = jsx.replace(/dangerouslySetInnerHTML=\{\{[^\}]*\}\}/g, '');
// Strip out inner HTML of template literals
jsx = jsx.replace(/`[^`]*`/g, '""');
// Strip out single quote strings
jsx = jsx.replace(/'[^']*'/g, '""');

let pos = 0;
let stack = [];
let output = [];
const tagRegex = /<\/?([a-zA-Z0-9]+|)[^>]*>/g;
let match;
let lineNum = 1312; // approximate starting line

while ((match = tagRegex.exec(jsx)) !== null) {
  const tagStr = match[0];
  const tagName = match[1]; // e.g. "div", "h2", "", "Status"
  
  // Calculate line number
  const pre = jsx.substring(pos, match.index);
  lineNum += (pre.match(/\n/g) || []).length;
  pos = match.index;

  if (tagStr.endsWith('/>')) {
    // self-closing, ignore
    continue;
  } else if (tagStr.startsWith('</')) {
    // closing tag
    if (stack.length > 0) {
      const last = stack.pop();
      if (last.tagName !== tagName) {
        output.push(`MISMATCH at line ${lineNum}: Expected </${last.tagName}> but got </${tagName}>. Stack opened at line ${last.line}`);
      }
    } else {
      output.push(`MISMATCH at line ${lineNum}: </${tagName}> without open tag.`);
    }
  } else if (tagStr.startsWith('<')) {
    // opening tag
    stack.push({ tagName, line: lineNum, tagStr: tagStr.substring(0, 30) });
  }
}

console.log(output.join('\n'));
if (stack.length > 0) {
  console.log('UNCLOSED TAGS:');
  stack.forEach(t => console.log(t.tagName, 'opened at', t.line, ':', t.tagStr));
} else {
  console.log('All tags matched perfectly!');
}

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

const files = fs.readdirSync(pagesDir);

for (const file of files) {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file defines isReadOnly
    if (content.includes('isReadOnly =')) {
      // replace <RichTextEditor with <RichTextEditor readOnly={isReadOnly}
      // but make sure we don't duplicate it if it's already there
      const newContent = content.replace(/<RichTextEditor(\s+)(?!.*readOnly)/g, '<RichTextEditor readOnly={isReadOnly}$1');
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

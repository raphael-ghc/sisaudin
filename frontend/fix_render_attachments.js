const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'usuario', 'amanda', 'ghc', '_Sisaudin2026', 'sisaudin', 'frontend', 'src', 'pages', 'RelatorioPreliminar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// First, remove ALL existing renderAttachments props from RichTextEditor
content = content.replace(/renderAttachments=\{[\s\S]*?<\/?FileAttachmentManager[\s\S]*?\s*\}\s*/g, '');

// Then, add the new renderAttachments to each RichTextEditor based on its title
content = content.replace(/(<RichTextEditor\s+title="([^"]+)"([\s\S]*?))(\s*\/>|\s*><\/RichTextEditor>)/g, (match, tagStart, title, rest, closing) => {
    if (tagStart.includes('renderAttachments=')) return match;
    const propsToAdd = `\n                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('${title}')} onUpload={(file) => handleUploadAnexo(file, '${title}')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}`;
    return tagStart + propsToAdd + closing;
});

// Dynamic titles with backticks
content = content.replace(/(<RichTextEditor\s+title={`([^`]+)`}([\s\S]*?))(\s*\/>|\s*><\/RichTextEditor>)/g, (match, tagStart, title, rest, closing) => {
    if (tagStart.includes('renderAttachments=')) return match;
    const propsToAdd = `\n                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(\`${title}\`)} onUpload={(file) => handleUploadAnexo(file, \`${title}\`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}`;
    return tagStart + propsToAdd + closing;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');

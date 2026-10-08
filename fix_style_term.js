const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'RichTextEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the blockquote rule
const targetStr = '.editor-content blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #475569 !important; font-style: italic; margin: 1rem 0; background: #f8fafc; padding: 0.5rem; text-align: justify !important; }';

const cssToAdd = `
        .editor-content .footnote-ref { color: #2563eb !important; cursor: pointer !important; font-weight: bold; padding: 0 2px; }
        .editor-content img { cursor: default !important; }
        .editor-content .editor-footnotes, .editor-content .editor-footnotes * { font-size: 10pt !important; color: #64748b !important; text-align: justify !important; }
        .editor-content .custom-image-figure { max-width: max-content; margin: 16px auto; display: block; text-align: center !important;}
        .editor-content .img-caption, .editor-content .img-caption * { font-size: 10pt !important; color: #64748b !important; text-align: center !important;}
        .editor-content .img-title, .editor-content .img-title * { font-size: 12pt !important; font-weight: bold !important; margin-bottom: 8px; text-align: center !important;}
        .editor-content table { border-collapse: collapse; margin-bottom: 1rem; width: 100%; table-layout: fixed; }
        .editor-content td, .editor-content th { border: 1px solid #d1d5db; padding: 8px; min-width: 40px; min-height: 25px; position: relative; overflow: auto !important; resize: both !important; }
      \`}</style>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:shadow-md">`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, targetStr + '\n' + cssToAdd);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed missing style block termination');
} else {
    console.log('Could not find targetStr');
}

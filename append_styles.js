const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'index.css');
let content = fs.readFileSync(filePath, 'utf8');

const newCss = `
/* Editor image styles for visualization */
.preview-container .custom-image-figure,
.texto-comum .custom-image-figure,
.pdf-page .custom-image-figure,
.pdf-cloned-content .custom-image-figure,
.ca-preview-page .custom-image-figure,
.sa-preview-page .custom-image-figure {
  max-width: max-content;
  margin: 16px auto;
  display: block;
  text-align: center !important;
}

.preview-container .img-caption, .preview-container .img-caption *,
.texto-comum .img-caption, .texto-comum .img-caption *,
.pdf-page .img-caption, .pdf-page .img-caption *,
.pdf-cloned-content .img-caption, .pdf-cloned-content .img-caption *,
.ca-preview-page .img-caption, .ca-preview-page .img-caption *,
.sa-preview-page .img-caption, .sa-preview-page .img-caption * { 
  font-size: 10pt !important; 
  color: #64748b !important; 
  text-align: center !important;
}

.preview-container .img-title, .preview-container .img-title *,
.texto-comum .img-title, .texto-comum .img-title *,
.pdf-page .img-title, .pdf-page .img-title *,
.pdf-cloned-content .img-title, .pdf-cloned-content .img-title *,
.ca-preview-page .img-title, .ca-preview-page .img-title *,
.sa-preview-page .img-title, .sa-preview-page .img-title * { 
  font-size: 14pt !important; 
  font-weight: bold !important; 
  margin-bottom: 8px; 
  text-align: center !important;
}

.preview-container .editor-footnotes, .preview-container .editor-footnotes *,
.texto-comum .editor-footnotes, .texto-comum .editor-footnotes *,
.pdf-page .editor-footnotes, .pdf-page .editor-footnotes *,
.pdf-cloned-content .editor-footnotes, .pdf-cloned-content .editor-footnotes *,
.ca-preview-page .editor-footnotes, .ca-preview-page .editor-footnotes *,
.sa-preview-page .editor-footnotes, .sa-preview-page .editor-footnotes * {
  font-size: 10pt !important;
  color: #64748b !important;
  text-align: justify !important;
}
`;

if (!content.includes('.preview-container .img-caption')) {
  content += newCss;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Appended missing editor styles to index.css');
} else {
  console.log('Styles already exist in index.css');
}

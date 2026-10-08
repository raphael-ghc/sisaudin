const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\usuario\\amanda\\ghc\\_Sisaudin2026\\sisaudin\\frontend\\src\\pages';
const files = [
  'Comunicacao.jsx',
  'NotaFinal.jsx',
  'NotaTecnica.jsx',
  'OrdemServico.jsx',
  'Parecer.jsx',
  'Planejamento.jsx',
  'RelatorioFinal.jsx',
  'RelatorioPreliminar.jsx',
  'Solicitacao.jsx'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find where the server PDF HTML content starts
    const searchStr = '<style>\\n             :root {';
    
    // If it has it, we inject blockquote styles right after <style>
    if (content.includes('             :root {') && !content.includes('blockquote { border-left: 4px solid', content.indexOf('             :root {') - 500)) {
       
       const regex = /<style>\s*:root \{/;
       const match = content.match(regex);
       if (match) {
           const replacement = `<style>
             blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; display: block !important; }
             blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }
             :root {`;
           content = content.replace(regex, replacement);
           fs.writeFileSync(filePath, content, 'utf8');
           console.log('Updated ' + file);
       } else {
           console.log('Regex no match ' + file);
       }
    } else {
      console.log('Skipped ' + file);
    }
  }
}

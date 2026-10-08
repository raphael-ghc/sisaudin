const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'RichTextEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const tableFunctions = `
  const addTableColumnLeft = () => {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const tr = node.parentNode;
      const table = tr?.closest('table');
      if (!table) return;
      const cellIndex = node.cellIndex;
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].insertCell(cellIndex);
        cell.style.border = '1px solid #d1d5db';
        cell.style.padding = '8px';
        cell.style.minWidth = '50px';
        cell.innerHTML = '<br/>';
      }
      handleInput();
    } else alert('Posicione o cursor dentro da célula onde deseja adicionar uma coluna.');
  };

  const addTableColumnRight = () => {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const tr = node.parentNode;
      const table = tr?.closest('table');
      if (!table) return;
      const cellIndex = node.cellIndex;
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].insertCell(cellIndex + 1);
        cell.style.border = '1px solid #d1d5db';
        cell.style.padding = '8px';
        cell.style.minWidth = '50px';
        cell.innerHTML = '<br/>';
      }
      handleInput();
    } else alert('Posicione o cursor dentro da célula onde deseja adicionar uma coluna.');
  };

  const removeTableColumn = () => {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const tr = node.parentNode;
      const table = tr?.closest('table');
      if (!table) return;
      const cellIndex = node.cellIndex;
      const rows = table.rows;
      if (rows[0].cells.length <= 1) {
        alert('Não é possível remover a última coluna da tabela.');
        return;
      }
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[cellIndex]) {
          rows[i].deleteCell(cellIndex);
        }
      }
      handleInput();
    } else alert('Posicione o cursor dentro da coluna que deseja remover.');
  };

  const removeTableRow = () => {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const tr = node.parentNode;
      const table = tr?.closest('table');
      if (!table) return;
      if (table.rows.length <= 1) {
        alert('Não é possível remover a última linha da tabela.');
        return;
      }
      table.deleteRow(tr.rowIndex);
      handleInput();
    } else alert('Posicione o cursor dentro da linha que deseja remover.');
  };

`;

content = content.replace('  const adjustTableCell = (action) => {', tableFunctions + '  const adjustTableCell = (action) => {');

const buttonsToInsert = `
                <button onClick={addTableColumnLeft} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar coluna à esquerda">
                  +Col Esq
                </button>
                <button onClick={addTableColumnRight} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar coluna à direita">
                  +Col Dir
                </button>
                <button onClick={removeTableColumn} className="px-1.5 py-0.5 hover:bg-red-50 border border-red-200 text-red-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Remover coluna">
                  -Col
                </button>
                <button onClick={removeTableRow} className="px-1.5 py-0.5 hover:bg-red-50 border border-red-200 text-red-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Remover linha">
                  -Lin
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
`;

content = content.replace(/<button onClick=\{\(\) => adjustTableCell\('col-plus'\)\}/, buttonsToInsert + '<button onClick={() => adjustTableCell(\'col-plus\')}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added table operations to RichTextEditor.jsx');

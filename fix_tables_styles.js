const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'RichTextEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We can just find the whole block from addTableColumnLeft to the end of removeTableRow
// and replace it.

const newFunctions = `
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
        const refCell = rows[i].cells[cellIndex > 0 ? cellIndex - 1 : cellIndex + 1];
        if (refCell) {
          cell.style.cssText = refCell.style.cssText;
        } else {
          cell.style.border = '1px solid #d1d5db';
          cell.style.padding = '8px';
          cell.style.minWidth = '50px';
        }
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
        const refCell = rows[i].cells[cellIndex];
        if (refCell) {
          cell.style.cssText = refCell.style.cssText;
        } else {
          cell.style.border = '1px solid #d1d5db';
          cell.style.padding = '8px';
          cell.style.minWidth = '50px';
        }
        cell.innerHTML = '<br/>';
      }
      handleInput();
    } else alert('Posicione o cursor dentro da célula onde deseja adicionar uma coluna.');
  };

  const addTableRowAbove = () => {
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
      const rowIndex = tr.rowIndex;
      const newRow = table.insertRow(rowIndex);
      for (let i = 0; i < tr.cells.length; i++) {
        const cell = newRow.insertCell(i);
        const refCell = tr.cells[i];
        if (refCell) {
          cell.style.cssText = refCell.style.cssText;
          // If inserting above header, we usually don't want the new row to also be header
          // But since they asked to keep header colors for columns, for rows it makes sense to copy current row's style
        } else {
          cell.style.border = '1px solid #d1d5db';
          cell.style.padding = '8px';
          cell.style.minWidth = '50px';
        }
        cell.innerHTML = '<br/>';
      }
      handleInput();
    } else alert('Posicione o cursor dentro da linha onde deseja adicionar uma nova linha.');
  };

  const addTableRowBelow = () => {
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
      const rowIndex = tr.rowIndex;
      const newRow = table.insertRow(rowIndex + 1);
      for (let i = 0; i < tr.cells.length; i++) {
        const cell = newRow.insertCell(i);
        // Usually below a header, we want standard cells, not bold ones
        // Let's copy style but reset background and font-weight if the current row was header?
        // Let's just use standard style to be safe, since below header should be plain text.
        cell.style.border = '1px solid #d1d5db';
        cell.style.padding = '8px';
        cell.style.minWidth = '50px';
        cell.innerHTML = '<br/>';
      }
      handleInput();
    } else alert('Posicione o cursor dentro da linha onde deseja adicionar uma nova linha.');
  };
`;

const startIndex = content.indexOf('  const addTableColumnLeft = () => {');
const endIndex = content.indexOf('  const adjustTableCell = (action) => {');

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  // We need to keep removeTableColumn and removeTableRow
  const removeFuncs = `
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

  content = before + newFunctions + removeFuncs + '\n' + after;
  
  const buttonsToInsert = `
                <button onClick={addTableColumnLeft} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar coluna à esquerda">
                  +Col Esq
                </button>
                <button onClick={addTableColumnRight} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar coluna à direita">
                  +Col Dir
                </button>
                <button onClick={addTableRowAbove} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar linha acima">
                  +Lin Cima
                </button>
                <button onClick={addTableRowBelow} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Adicionar linha abaixo">
                  +Lin Baixo
                </button>
                <button onClick={removeTableColumn} className="px-1.5 py-0.5 hover:bg-red-50 border border-red-200 text-red-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Remover coluna">
                  -Col
                </button>
                <button onClick={removeTableRow} className="px-1.5 py-0.5 hover:bg-red-50 border border-red-200 text-red-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Remover linha">
                  -Lin
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
`;

  const startBtnIndex = content.indexOf('<button onClick={addTableColumnLeft}');
  const endBtnIndex = content.indexOf('<button onClick={() => adjustTableCell(\'col-plus\')}');

  if (startBtnIndex !== -1 && endBtnIndex !== -1) {
    content = content.substring(0, startBtnIndex) + buttonsToInsert + content.substring(endBtnIndex);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added row operations and column style retention');
} else {
  console.log('Could not find functions block');
}

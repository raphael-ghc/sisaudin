// src/components/RichTextEditor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, Loader2, Edit3, Clock, Bold, Italic, Underline, 
  List, ListOrdered, Table, AlignLeft, 
  AlignCenter, AlignRight, Quote, BookOpen,
  ArrowRightFromLine, ArrowDownFromLine, X, Move, Type, Link as LinkIcon, Calendar, Heading, Trash2, ChevronDown, Paperclip, Download
} from 'lucide-react';
import { useEditorAutoSave } from '../hooks/useEditorAutoSave';

export default function RichTextEditor({ 
  title = "Editor de Documento",
  subtitle = "Salvo automaticamente após 3 segundos de inatividade.",  
  initialContent = '', 
  onSave, 
  onRemove,
  onChange,
  onFocus,
  onBlur,
  globalCollapseAction,
  renderAttachments,
  readOnly = false
}) {
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (globalCollapseAction) {
      setIsCollapsed(globalCollapseAction.action === 'collapse');
    }
  }, [globalCollapseAction]);
  
  // Utilização do Hook de Auto-Save
  const { saveStatus, lastSavedTime, triggerSave } = useEditorAutoSave(onSave, 3000);

  const [selectedImg, setSelectedImg] = useState(null);
  const [imgPos, setImgPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, startW: 0, startH: 0, img: null, handle: 'se', draggedFigure: null });

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
  const [tableSettings, setTableSettings] = useState({ rows: 3, cols: 3 });
  const [footnoteText, setFootnoteText] = useState('');
  const [imgMeta, setImgMeta] = useState({ title: '', source: '', date: '' });
  const savedRangeRef = useRef(null);

  const isInitialized = useRef(false);

  // Inicialização do conteúdo
  useEffect(() => {
    if (editorRef.current && initialContent !== undefined && !isInitialized.current) {
      const currentHtml = editorRef.current.innerHTML.trim();
      if (!currentHtml || currentHtml === '<br>' || currentHtml === '<p><br></p>' || currentHtml === '') {
        editorRef.current.innerHTML = initialContent || '';
        if (initialContent) {
          isInitialized.current = true;
        }
      }
    }
  }, [initialContent]);

  const updateImgPos = () => {
    if (!selectedImg || !editorContainerRef.current) return;
    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const imgRect = selectedImg.getBoundingClientRect();
    setImgPos({
      top: imgRect.top - containerRect.top,
      left: imgRect.left - containerRect.left,
      width: imgRect.width,
      height: imgRect.height
    });
  };

  useEffect(() => {
    const handleScrollOrResize = () => { if (selectedImg) updateImgPos(); };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [selectedImg]);

  // Gatilho de salvamento ao digitar
  {/*const handleInput = () => {
    setSelectedImg(null); 
    if (editorRef.current) {
      triggerSave(editorRef.current.innerHTML);
    }
  };*/}
 const handleInput = () => {
    setSelectedImg(null); 
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      triggerSave(content);
      if (onChange) onChange(content);
      if (onFocus) onFocus();
      window.dispatchEvent(new CustomEvent('editor-typing-scroll'));
    }
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const transformCase = (type) => {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const clonedSelection = range.cloneContents();
    const walk = document.createTreeWalker(clonedSelection, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walk.nextNode())) {
        node.nodeValue = type === 'upper' ? node.nodeValue.toUpperCase() : node.nodeValue.toLowerCase();
    }
    const div = document.createElement('div');
    div.appendChild(clonedSelection);
    document.execCommand('insertHTML', false, div.innerHTML);
    handleInput();
  };

  const insertLetterList = (letterType = 'a') => {
    const selection = window.getSelection();
    let currentOl = null;
    if (selection && selection.rangeCount > 0) {
      let node = selection.getRangeAt(0).commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode;
      currentOl = node.closest ? node.closest('ol') : null;
    }

    const targetStyle = letterType === 'a' ? 'lower-alpha' : 'upper-alpha';
    const targetClass = letterType === 'a' ? 'list-lower-alpha' : 'list-upper-alpha';

    if (currentOl) {
      if (currentOl.getAttribute('type') === letterType || currentOl.style.listStyleType === targetStyle) {
        execCmd('insertOrderedList');
      } else {
        currentOl.setAttribute('type', letterType);
        currentOl.style.listStyleType = targetStyle;
        currentOl.classList.remove('list-lower-alpha', 'list-upper-alpha');
        currentOl.classList.add(targetClass);
        handleInput();
      }
    } else {
      execCmd('insertOrderedList');
      const newSel = window.getSelection();
      if (newSel && newSel.rangeCount > 0) {
        let node = newSel.getRangeAt(0).commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentNode;
        const ol = node.closest ? node.closest('ol') : null;
        if (ol) {
          ol.setAttribute('type', letterType);
          ol.style.listStyleType = targetStyle;
          ol.classList.remove('list-lower-alpha', 'list-upper-alpha');
          ol.classList.add(targetClass);
        }
      }
      handleInput();
    }
  };

  const insertNumericList = () => {
    const selection = window.getSelection();
    let currentOl = null;
    if (selection && selection.rangeCount > 0) {
      let node = selection.getRangeAt(0).commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode;
      currentOl = node.closest ? node.closest('ol') : null;
    }

    if (currentOl && (currentOl.getAttribute('type') === 'a' || currentOl.getAttribute('type') === 'A' || currentOl.style.listStyleType === 'lower-alpha' || currentOl.style.listStyleType === 'upper-alpha')) {
      currentOl.setAttribute('type', '1');
      currentOl.style.listStyleType = 'decimal';
      currentOl.classList.remove('list-lower-alpha', 'list-upper-alpha');
      handleInput();
    } else {
      execCmd('insertOrderedList');
      const newSel = window.getSelection();
      if (newSel && newSel.rangeCount > 0) {
        let node = newSel.getRangeAt(0).commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentNode;
        const ol = node.closest ? node.closest('ol') : null;
        if (ol) {
          ol.setAttribute('type', '1');
          ol.style.listStyleType = 'decimal';
          ol.classList.remove('list-lower-alpha', 'list-upper-alpha');
        }
      }
      handleInput();
    }
  };

  // Nova função de Colar (suporta imagens da área de transferência)
  const handlePaste = (e) => {
    e.preventDefault();

    // 1. Tenta interceptar imagens coladas (Print Screen, Captura de Tela, Word)
    const items = (e.clipboardData || window.clipboardData).items;
    let pastedImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        pastedImage = true;
        const file = items[i].getAsFile();
        
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgHTML = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 8px; margin: 16px auto; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" alt="Imagem Colada"/>`;
            if (editorRef.current) editorRef.current.focus();
            document.execCommand('insertHTML', false, imgHTML);
            handleInput();
          };
          reader.readAsDataURL(file);
        }
      }
    }

    // Se o usuário colou uma imagem, para por aqui.
    if (pastedImage) return;

    // 2. Se não for imagem, processa textos normalmente
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const allowedTags = ['P', 'B', 'STRONG', 'I', 'EM', 'U', 'BR', 'A', 'UL', 'OL', 'LI'];
      const elements = Array.from(doc.body.querySelectorAll('*'));
      
      // Iterar de trás pra frente para fazer unwrap com segurança
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (!allowedTags.includes(el.tagName.toUpperCase())) {
           // Unwrap: substitui a tag pelos seus filhos
           const parent = el.parentNode;
           if (parent) {
             while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
             }
             parent.removeChild(el);
           }
        } else {
           // Se for permitida, remove todos os atributos exceto o href (para links)
           const attrs = Array.from(el.attributes);
           attrs.forEach(attr => {
              if (el.tagName.toUpperCase() === 'A' && attr.name === 'href') return;
              el.removeAttribute(attr.name);
           });
        }
      }
      
      document.execCommand('insertHTML', false, doc.body.innerHTML);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
    
    handleInput();
  };

  const formatAsTitle = () => {
    const isTitle = document.queryCommandValue('fontSize') == '4';
    if (isTitle) {
      document.execCommand('fontSize', false, '3');
      if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
    } else {
      document.execCommand('fontSize', false, '4');
      if (!document.queryCommandState('bold')) document.execCommand('bold', false, null);
    }
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const toggleBlockquote = () => {
    const blockValue = document.queryCommandValue('formatBlock');
    if (blockValue && (blockValue.toLowerCase() === 'blockquote' || blockValue.toLowerCase() === '"blockquote"')) {
      document.execCommand('formatBlock', false, 'div');
    } else {
      document.execCommand('formatBlock', false, 'BLOCKQUOTE');
    }
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const toggleSuperscript = () => {
    if (document.queryCommandState('superscript')) {
      document.execCommand('superscript', false, null);
    } else {
      if (document.queryCommandState('subscript')) document.execCommand('subscript', false, null);
      document.execCommand('superscript', false, null);
    }
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const toggleSubscript = () => {
    if (document.queryCommandState('subscript')) {
      document.execCommand('subscript', false, null);
    } else {
      if (document.queryCommandState('superscript')) document.execCommand('superscript', false, null);
      document.execCommand('subscript', false, null);
    }
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0);
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const openTableModal = () => {
    saveSelection();
    setTableSettings({ rows: 3, cols: 3 });
    setModalConfig({ isOpen: true, type: 'table' });
  };

  const confirmTable = () => {
    setModalConfig({ isOpen: false, type: null });
    restoreSelection();
    const rows = parseInt(tableSettings.rows, 10);
    const cols = parseInt(tableSettings.cols, 10);
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return;

    let tableHTML = `<br/><table style="width:100%; border-collapse: collapse; margin-bottom: 1rem; table-layout: fixed;"><tbody>`;
    for (let r = 0; r < rows; r++) {
      tableHTML += '<tr>';
      for (let c = 0; c < cols; c++) {
        const isHeader = r === 0;
        const bg = isHeader ? 'background-color: #f1f5f9;' : '';
        const weight = isHeader ? 'font-weight: bold;' : '';
        tableHTML += `<td style="border: 1px solid #d1d5db; padding: 8px; min-width: 50px; ${bg} ${weight}">${isHeader ? 'Cabeçalho' : '<br/>'}</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><br/>';
    execCmd('insertHTML', tableHTML);
  };

  const mergeCellsRight = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let node = selection.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const nextCell = node.nextElementSibling;
      if (nextCell) {
        node.colSpan = (node.colSpan || 1) + (nextCell.colSpan || 1);
        node.innerHTML += ' ' + nextCell.innerHTML;
        nextCell.parentNode.removeChild(nextCell);
        handleInput();
      } else alert('Não há nenhuma célula à direita para mesclar nesta linha.');
    } else alert('Posicione o cursor dentro da célula que deseja mesclar.');
  };

  const mergeCellsDown = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let node = selection.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
      const tr = node.parentNode;
      const table = tr?.closest('table');
      if (!table) return;
      const rowIndex = tr.rowIndex;
      const cellIndex = node.cellIndex;
      const nextRow = table.rows[rowIndex + (node.rowSpan || 1)];
      if (nextRow && nextRow.cells[cellIndex]) {
        const nextCell = nextRow.cells[cellIndex];
        node.rowSpan = (node.rowSpan || 1) + (nextCell.rowSpan || 1);
        const addHtml = nextCell.innerHTML.trim();
        if (addHtml && addHtml !== '<br>' && addHtml !== '<br/>') {
          node.innerHTML += '<br/>' + addHtml;
        }
        nextCell.parentNode.removeChild(nextCell);
        handleInput();
      } else {
        alert('Não há nenhuma célula abaixo para mesclar nesta coluna.');
      }
    } else {
      alert('Posicione o cursor dentro da célula que deseja mesclar.');
    }
  };



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

  const adjustTableCell = (action) => {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH') {
      node = node.parentNode;
      if (node === editorRef.current) break;
    }
    if (!node || (node.nodeName !== 'TD' && node.nodeName !== 'TH')) {
      const firstCell = editorRef.current?.querySelector('td, th');
      if (firstCell) node = firstCell;
      else {
        alert('Posicione o cursor dentro da célula da tabela que deseja ajustar.');
        return;
      }
    }

    const tr = node.parentNode;
    const table = tr?.closest('table');
    if (!table) return;

    table.style.tableLayout = 'fixed';

    const cellIndex = node.cellIndex;
    const currentWidth = node.offsetWidth || 100;
    const currentHeight = node.offsetHeight || 30;

    if (action === 'col-plus') {
      const newWidth = Math.max(40, currentWidth + 25);
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[cellIndex]) {
          rows[i].cells[cellIndex].style.width = `${newWidth}px`;
          rows[i].cells[cellIndex].style.minWidth = `${newWidth}px`;
        }
      }
    } else if (action === 'col-minus') {
      const newWidth = Math.max(40, currentWidth - 25);
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[cellIndex]) {
          rows[i].cells[cellIndex].style.width = `${newWidth}px`;
          rows[i].cells[cellIndex].style.minWidth = `${newWidth}px`;
        }
      }
    } else if (action === 'row-plus') {
      const newHeight = Math.max(25, currentHeight + 15);
      for (let j = 0; j < tr.cells.length; j++) {
        tr.cells[j].style.height = `${newHeight}px`;
        tr.cells[j].style.minHeight = `${newHeight}px`;
      }
      tr.style.height = `${newHeight}px`;
    } else if (action === 'row-minus') {
      const newHeight = Math.max(25, currentHeight - 15);
      for (let j = 0; j < tr.cells.length; j++) {
        tr.cells[j].style.height = `${newHeight}px`;
        tr.cells[j].style.minHeight = `${newHeight}px`;
      }
      tr.style.height = `${newHeight}px`;
    }

    handleInput();
  };

  const openFootnoteModal = () => {
    saveSelection();
    setFootnoteText('');
    setModalConfig({ isOpen: true, type: 'footnote' });
  };

  const confirmFootnote = () => {
    setModalConfig({ isOpen: false, type: null });
    restoreSelection();
    if (!footnoteText) return;
    const editor = editorRef.current;
    const noteNumber = editor.querySelectorAll('.footnote-ref').length + 1;
    execCmd('insertHTML', `<sup class="footnote-ref" title="${footnoteText}">[${noteNumber}]</sup>`);
    let footer = editor.querySelector('.editor-footnotes');
    if (!footer) {
       footer = document.createElement('div');
       footer.className = 'editor-footnotes';
       editor.appendChild(footer);
    }
    const noteDiv = document.createElement('div');
    noteDiv.style.marginBottom = '4px';
    noteDiv.innerHTML = `<strong>[${noteNumber}]</strong> ${footnoteText}`;
    footer.appendChild(noteDiv);
    handleInput();
  };

  const openImageModal = (type) => {
    if (!selectedImg) return;
    saveSelection();
    const figure = selectedImg.closest('figure');
    let currentTitle = '', currentSource = '', currentDate = '';
    if (figure) {
      const titleNode = figure.querySelector('.img-title');
      if (titleNode) currentTitle = titleNode.innerText;
      const sourceNode = figure.querySelector('.img-source');
      if (sourceNode) {
        const aNode = sourceNode.querySelector('a');
        currentSource = aNode ? aNode.href : sourceNode.innerText.replace('Fonte: ', '');
      }
      if (figure.dataset.accessDate) currentDate = figure.dataset.accessDate;
    }
    setImgMeta({ title: currentTitle, source: currentSource, date: currentDate });
    setModalConfig({ isOpen: true, type });
  };

  const applyImageMetadata = () => {
    if (!selectedImg) return;
    let figure = selectedImg.closest('figure');
    if (!figure) {
      figure = document.createElement('figure');
      figure.className = 'custom-image-figure';
      figure.style.display = selectedImg.style.display === 'inline' ? 'inline-block' : 'block';
      figure.style.float = selectedImg.style.float;
      figure.style.margin = selectedImg.style.margin;
      figure.style.textAlign = 'center';
      selectedImg.style.display = 'block';
      selectedImg.style.float = 'none';
      selectedImg.style.margin = '0 auto';
      selectedImg.parentNode.insertBefore(figure, selectedImg);
      figure.appendChild(selectedImg);
    }
    let titleNode = figure.querySelector('.img-title');
    if (imgMeta.title) {
      if (!titleNode) {
        titleNode = document.createElement('figcaption');
        titleNode.className = 'img-title';
        figure.insertBefore(titleNode, selectedImg);
      }
      titleNode.innerText = imgMeta.title;
    } else if (titleNode) titleNode.remove();
    let captionNode = figure.querySelector('.img-caption');
    if (imgMeta.source || imgMeta.date) {
      if (!captionNode) {
        captionNode = document.createElement('figcaption');
        captionNode.className = 'img-caption';
        figure.appendChild(captionNode);
      }
      captionNode.innerHTML = ''; 
      if (imgMeta.source) {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'img-source';
        const isUrl = /^https?:\/\//i.test(imgMeta.source.trim());
        if (isUrl) {
          sourceSpan.innerHTML = `Fonte: <a href="${imgMeta.source.trim()}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${imgMeta.source.trim()}</a>`;
        } else sourceSpan.innerText = `Fonte: ${imgMeta.source}`;
        captionNode.appendChild(sourceSpan);
      }
      if (imgMeta.date) {
        figure.dataset.accessDate = imgMeta.date;
        const dateSpan = document.createElement('span');
        dateSpan.className = 'img-date';
        const [y, m, d] = imgMeta.date.split('-');
        dateSpan.innerText = imgMeta.source ? ` | Acesso em: ${d}/${m}/${y}` : `Acesso em: ${d}/${m}/${y}`;
        captionNode.appendChild(dateSpan);
      } else delete figure.dataset.accessDate;
    } else if (captionNode) {
      captionNode.remove();
      delete figure.dataset.accessDate;
    }
    setModalConfig({ isOpen: false, type: null });
    updateImgPos();
    handleInput();
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setSelectedImg(e.target);
      setTimeout(() => {
        const containerRect = editorContainerRef.current.getBoundingClientRect();
        const imgRect = e.target.getBoundingClientRect();
        setImgPos({
          top: imgRect.top - containerRect.top,
          left: imgRect.left - containerRect.left,
          width: imgRect.width, height: imgRect.height
        });
      }, 0);
    } else setSelectedImg(null);
  };

  const handleImageAlign = (alignment) => {
    if (!selectedImg) return;
    const target = selectedImg.closest('figure') || selectedImg;
    if (alignment === 'left') {
      target.style.display = 'inline-block'; target.style.float = 'left'; target.style.margin = '0 16px 16px 0';
    } else if (alignment === 'center') {
      target.style.display = 'block'; target.style.float = 'none'; target.style.margin = '16px auto';
    } else if (alignment === 'right') {
      target.style.display = 'inline-block'; target.style.float = 'right'; target.style.margin = '0 0 16px 16px';
    }
    updateImgPos(); handleInput();
  };

  const handleFigureDragStart = (e) => {
    if (!selectedImg) return;
    const target = selectedImg.closest('figure') || selectedImg;
    dragState.current.draggedFigure = target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'figure-move');
  };

  const handleFigureDragEnd = () => {
    dragState.current.draggedFigure = null;
    setSelectedImg(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgHTML = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 8px; margin: 16px auto; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" alt="Imagem"/>`;
        execCmd('insertHTML', imgHTML);
      };
      reader.readAsDataURL(file);
    } 
    else if (dragState.current.draggedFigure) {
      const target = dragState.current.draggedFigure;
      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
        }
      }
      
      if (range) {
        range.insertNode(target);
      }
      dragState.current.draggedFigure = null;
      handleInput();
    }
    setSelectedImg(null); 
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragStart = (e) => { if (e.target.tagName === 'IMG') setSelectedImg(null); };

  const handleResizeStart = (e, handle) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedImg) return;
    dragState.current = {
      isDragging: true, startX: e.clientX, startY: e.clientY,
      startW: selectedImg.offsetWidth, startH: selectedImg.offsetHeight, img: selectedImg, handle: handle
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!dragState.current.isDragging || !dragState.current.img) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    let newWidth = dragState.current.startW;
    let newHeight = dragState.current.startH;

    if (dragState.current.handle.includes('e')) newWidth = dragState.current.startW + dx;
    if (dragState.current.handle.includes('w')) newWidth = dragState.current.startW - dx;
    if (dragState.current.handle.includes('s')) newHeight = dragState.current.startH + dy;
    if (dragState.current.handle.includes('n')) newHeight = dragState.current.startH - dy;
    
    newWidth = Math.max(20, newWidth); 
    newHeight = Math.max(20, newHeight); 
    
    dragState.current.img.style.width = `${newWidth}px`;
    dragState.current.img.style.height = `${newHeight}px`;
    updateImgPos();
  };

  const handleResizeEnd = () => {
    dragState.current.isDragging = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    handleInput();
  };

  const getModalTitle = () => {
    if (modalConfig.type === 'table') return 'Inserir Tabela';
    if (modalConfig.type === 'footnote') return 'Inserir Nota de Rodapé';
    if (modalConfig.type === 'imageTitle') return 'Título da Figura';
    if (modalConfig.type === 'imageSource') return 'Fonte da Figura';
    if (modalConfig.type === 'imageDate') return 'Data de Acesso da Figura';
    return '';
  };

  return (
    <div className="font-sans w-full relative mb-6">
      <style>{`
        .editor-content { 
          font-family: "Calibri", sans-serif !important; 
          font-size: 12pt !important; 
          color: black; 
          padding: 1.5rem !important; 
          min-height: 100px; 
          outline: none; 
          line-height: 1.5; 
          word-wrap: break-word; 
          background: white !important; 
          cursor: text !important;
        }
        .editor-content, .editor-content *, .editor-content p, .editor-content div, .editor-content td, .editor-content th, .editor-content span, .editor-content li, .editor-content blockquote, .editor-content h1, .editor-content h2, .editor-content h3, .editor-content h4, .editor-content h5, .editor-content h6, .editor-content b, .editor-content strong, .editor-content i, .editor-content em, .editor-content u { cursor: text !important; }
        .editor-content, .editor-content *, .editor-content p, .editor-content div, .editor-content td, .editor-content li, .editor-content ul, .editor-content ol, .editor-content blockquote, .editor-content span { font-family: "Calibri", sans-serif !important; font-size: 14pt !important; color: black !important; text-align: justify !important; }
        .editor-content ul { list-style-type: disc !important; padding-left: 2.5rem !important; margin: 0.5rem 0 !important; display: block !important; text-align: justify !important; }
        .editor-content ol { padding-left: 2.5rem !important; margin: 0.5rem 0 !important; display: block !important; text-align: justify !important; }
        .editor-content ol:not([type]), .editor-content ol[type="1"], .editor-content ol[type="decimal"] { list-style-type: decimal !important; }
        .editor-content ol[type="a" s], .editor-content ol.list-lower-alpha, .editor-content ol[style*="lower-alpha"] { list-style-type: lower-alpha !important; }
        .editor-content ol[type="A" s], .editor-content ol.list-upper-alpha, .editor-content ol[style*="upper-alpha"] { list-style-type: upper-alpha !important; }
        .editor-content li { display: list-item !important; text-align: justify !important; margin-bottom: 0.25rem; font-family: "Calibri", sans-serif !important; font-size: 14pt !important; color: black !important; }
        .editor-content a, .editor-content a * { text-decoration: underline !important; cursor: pointer !important; }
        .editor-content font[size="4"], .editor-content font[size="4"] * { font-size: 14pt !important; font-weight: bold !important; color: black !important; }
        .editor-content blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #475569 !important; font-style: italic; margin: 1rem 0; background: #f8fafc; padding: 0.5rem; text-align: justify !important; }

        .editor-content .footnote-ref { color: #2563eb !important; cursor: pointer !important; font-weight: bold; padding: 0 2px; }
        .editor-content img { cursor: default !important; }
        .editor-content .editor-footnotes, .editor-content .editor-footnotes * { font-size: 10pt !important; color: #64748b !important; text-align: justify !important; }
        .editor-content .custom-image-figure { max-width: max-content; margin: 16px auto; display: block; text-align: center !important;}
        .editor-content .img-caption, .editor-content .img-caption * { font-size: 10pt !important; color: #64748b !important; text-align: center !important;}
        .editor-content .img-title, .editor-content .img-title * { font-size: 12pt !important; font-weight: bold !important; margin-bottom: 8px; text-align: center !important;}
        .editor-content table { border-collapse: collapse; margin-bottom: 1rem; width: 100%; table-layout: fixed; }
        .editor-content td, .editor-content th { border: 1px solid #d1d5db; padding: 8px; min-width: 40px; min-height: 25px; position: relative; overflow: auto !important; resize: both !important; }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:shadow-md">
        
        {/* CABEÇALHO */}
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex justify-between items-center flex-nowrap overflow-x-auto gap-3 no-scrollbar">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="p-1 hover:bg-gray-200 rounded-md text-gray-600 transition-colors shrink-0"
              title={isCollapsed ? "Expandir" : "Recolher"}
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              {title && <h1 className="text-xs font-semibold text-gray-800 m-0 leading-tight">{title}</h1>}
              {subtitle && <p className="text-[10px] text-gray-500 m-0 leading-tight">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="flex items-center justify-end">
              {saveStatus === 'editing' && <div className="flex items-center text-amber-600 gap-1"><Edit3 size={12} /><span className="text-[10px] font-medium">Editando...</span></div>}
              {saveStatus === 'saving' && <div className="flex items-center text-blue-600 gap-1"><Loader2 size={12} className="animate-spin" /><span className="text-[10px] font-medium">Salvando...</span></div>}
              {saveStatus === 'saved' && <div className="flex items-center text-emerald-600 gap-1"><CheckCircle2 size={12} /><span className="text-[10px] font-medium">Salvo às {lastSavedTime}</span></div>}
              {saveStatus === 'idle' && <div className="flex items-center text-gray-400 gap-1"><Clock size={12} /><span className="text-[10px] font-medium">Pronto</span></div>}
            </div>

            {onRemove && (
              <>
                <div className="w-px h-4 bg-gray-300 shrink-0"></div>
                <button
                  onClick={() => {
                    if (window.confirm('Deseja realmente excluir este item?')) {
                      onRemove();
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded transition-colors shrink-0"
                  title="Excluir este item"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </>
            )}
          </div>
        </div>

        <div className={isCollapsed ? 'hidden' : 'block'}>
          {/* BARRA DE FERRAMENTAS */}
          {!readOnly && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-2 py-1 flex items-center gap-0.5 flex-nowrap overflow-x-auto no-scrollbar whitespace-nowrap">
              <button onClick={() => execCmd('bold')} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Negrito"><Bold size={14} /></button>
              <button onClick={() => execCmd('italic')} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Itálico"><Italic size={14} /></button>
              <button onClick={() => execCmd('underline')} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Sublinhado"><Underline size={14} /></button>
              
              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
              
              <button onClick={() => transformCase('upper')} className="px-1 py-0.5 hover:bg-gray-200 text-gray-700 rounded font-semibold text-[10px] shrink-0" title="Maiúsculas">AA</button>
              <button onClick={() => transformCase('lower')} className="px-1 py-0.5 hover:bg-gray-200 text-gray-700 rounded font-semibold text-[10px] shrink-0" title="Minúsculas">aa</button>
              
              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
              
              <button onClick={formatAsTitle} className="px-1.5 py-0.5 hover:bg-blue-50 bg-white border border-blue-200 text-blue-700 rounded flex items-center gap-0.5 shadow-sm transition-colors shrink-0" title="Transformar em Título">
                <Heading size={12} /> <span className="text-[10px] font-bold">Título</span>
              </button>
              
              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
              
              <button onClick={toggleSuperscript} className="p-1 hover:bg-gray-200 text-gray-700 rounded font-serif font-bold text-[10px] shrink-0" title="Sobrescrito">X²</button>
              <button onClick={toggleSubscript} className="p-1 hover:bg-gray-200 text-gray-700 rounded font-serif font-bold text-[10px] shrink-0" title="Subscrito">X₂</button>
              <button onClick={toggleBlockquote} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Citação"><Quote size={14} /></button>
              <button onClick={openFootnoteModal} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Nota de Rodapé"><BookOpen size={14} /></button>
              
              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
              
              <button onClick={() => execCmd('insertUnorderedList')} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Marcadores"><List size={14} /></button>
              <button onClick={insertNumericList} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Numeração (1, 2, 3...)"><ListOrdered size={14} /></button>
              <button onClick={() => insertLetterList('a')} className="px-1 py-0.5 hover:bg-gray-200 text-gray-700 rounded font-bold text-[11px] shrink-0" title="Marcadores de Letras Minúsculas (a, b, c...)">a)</button>
              <button onClick={() => insertLetterList('A')} className="px-1 py-0.5 hover:bg-gray-200 text-gray-700 rounded font-bold text-[11px] shrink-0" title="Marcadores de Letras Maiúsculas (A, B, C...)">A)</button>
              
              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>
              
              <button onClick={openTableModal} className="p-1 hover:bg-gray-200 text-gray-700 rounded shrink-0" title="Tabela"><Table size={14} /></button>
              <button onClick={mergeCellsRight} className="p-1 hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded flex items-center gap-1 shrink-0" title="Mesclar com a célula da direita">
                <ArrowRightFromLine size={14} />
              </button>
              <button onClick={mergeCellsDown} className="p-1 hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded flex items-center gap-1 shrink-0" title="Mesclar células na vertical (com a célula de baixo)">
                <ArrowDownFromLine size={14} />
              </button>

              <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>

              
                
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
<button onClick={() => adjustTableCell('col-plus')} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Aumentar largura da coluna (+25px)">
                ↔+
              </button>
              <button onClick={() => adjustTableCell('col-minus')} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Diminuir largura da coluna (-25px)">
                ↔-
              </button>
              <button onClick={() => adjustTableCell('row-plus')} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Aumentar altura da linha (+15px)">
                ↕+
              </button>
              <button onClick={() => adjustTableCell('row-minus')} className="px-1.5 py-0.5 hover:bg-gray-200 bg-gray-50 border border-gray-200 text-gray-700 rounded font-semibold text-[11px] shrink-0 flex items-center" title="Diminuir altura da linha (-15px)">
                ↕-
              </button>
            </div>
          </div>
          )}

        {/* ÁREA DE TEXTO AUTO-AJUSTÁVEL */}
        <div className="relative bg-white" ref={editorContainerRef}>
          
          <div className="relative z-10 w-full bg-transparent">
            <div
              ref={editorRef}
              className={`editor-content ${readOnly ? 'bg-gray-50' : ''}`}
              contentEditable={!readOnly}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onPaste={handlePaste}
              onClick={handleEditorClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* OVERLAY DE IMAGEM */}
          {selectedImg && (
            <div style={{ position: 'absolute', top: imgPos.top, left: imgPos.left, width: imgPos.width, height: imgPos.height, border: '2px solid #3b82f6', pointerEvents: 'none', zIndex: 50 }}>
              <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', gap: '4px', padding: '4px', pointerEvents: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div draggable onDragStart={handleFigureDragStart} onDragEnd={handleFigureDragEnd} className="flex items-center text-xs text-gray-600 px-2 border-r border-gray-200 mr-1 whitespace-nowrap select-none cursor-move hover:bg-gray-100 rounded transition-colors" title="Clique e segure para arrastar a figura pelo texto">
                  <Move size={12} className="mr-1"/> Arraste
                </div>
                <button onMouseDown={(e) => { e.preventDefault(); handleImageAlign('left'); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignLeft size={16} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); handleImageAlign('center'); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignCenter size={16} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); handleImageAlign('right'); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><AlignRight size={16} /></button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button onMouseDown={(e) => { e.preventDefault(); openImageModal('imageTitle'); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600"><Type size={16} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); openImageModal('imageSource'); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600"><LinkIcon size={16} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); openImageModal('imageDate'); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600"><Calendar size={16} /></button>
              </div>
              <div style={{ position: 'absolute', left: -6, top: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
              <div style={{ position: 'absolute', right: -6, top: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
              <div style={{ position: 'absolute', left: -6, bottom: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
              <div style={{ position: 'absolute', right: -6, bottom: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
              <div style={{ position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ns-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
              <div style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ns-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
              <div style={{ position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
              <div style={{ position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
            </div>
          )}
        </div>
        
        {/* ATTACHMENTS FOOTER */}
        {renderAttachments && (
          <div className="px-3 pb-2 pt-2 bg-gray-50/30 border-t border-gray-100">
            {renderAttachments()}
          </div>
        )}
        </div>

        {/* MODAIS */}
        {modalConfig.isOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-96 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">{getModalTitle()}</h3>
                <button onClick={() => setModalConfig({ isOpen: false, type: null })} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              {modalConfig.type === 'table' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Número de Linhas</label><input type="number" min="1" value={tableSettings.rows} onChange={(e) => setTableSettings({...tableSettings, rows: e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Número de Colunas</label><input type="number" min="1" value={tableSettings.cols} onChange={(e) => setTableSettings({...tableSettings, cols: e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
                </div>
              )}
              {modalConfig.type === 'footnote' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Texto da Nota de Rodapé</label><textarea rows="3" value={footnoteText} onChange={(e) => setFootnoteText(e.target.value)} className="w-full px-3 py-2 border rounded" /></div>
              )}
              {modalConfig.type === 'imageTitle' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Insira o título da figura</label><input autoFocus type="text" value={imgMeta.title} onChange={(e) => setImgMeta({...imgMeta, title: e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              )}
              {modalConfig.type === 'imageSource' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Qual a fonte da imagem?</label><input autoFocus type="text" value={imgMeta.source} onChange={(e) => setImgMeta({...imgMeta, source: e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              )}
              {modalConfig.type === 'imageDate' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Selecione a data de acesso</label><input type="date" value={imgMeta.date} onChange={(e) => setImgMeta({...imgMeta, date: e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setModalConfig({ isOpen: false, type: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">Cancelar</button>
                <button onClick={() => { if (modalConfig.type === 'table') confirmTable(); else if (modalConfig.type === 'footnote') confirmFootnote(); else applyImageMetadata(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
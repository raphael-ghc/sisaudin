import sys
with open('frontend/src/components/RichTextEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

broken_str = '''    if (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const allowedTags = ['P', 'B', 'STRONG', 'I', 'EM', 'U', 'BR', 'A', 'UL', 'OL', 'LI'];
      const elements = Array.from(doc.body.querySelectorAll('*'));
    restoreSelection();'''

correct_str = '''    if (html) {
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
    restoreSelection();'''

content = content.replace(broken_str, correct_str)

with open('frontend/src/components/RichTextEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored file successfully.")

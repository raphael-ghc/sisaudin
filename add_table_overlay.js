const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'RichTextEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. In handleEditorClick
const clickTargetStr = `    const handleEditorClick = (e) => {
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
    };`;

const clickReplacement = `    const handleEditorClick = (e) => {
      const targetTable = e.target.closest('table');
      if (e.target.tagName === 'IMG' || targetTable) {
        const targetElement = e.target.tagName === 'IMG' ? e.target : targetTable;
        setSelectedImg(targetElement);
        setTimeout(() => {
          if (!editorContainerRef.current) return;
          const containerRect = editorContainerRef.current.getBoundingClientRect();
          const imgRect = targetElement.getBoundingClientRect();
          setImgPos({
            top: imgRect.top - containerRect.top,
            left: imgRect.left - containerRect.left,
            width: imgRect.width, height: imgRect.height
          });
        }, 0);
      } else setSelectedImg(null);
    };`;

content = content.replace(clickTargetStr, clickReplacement);

// 2. Hide resize handles for tables in the render
const overlayTargetStr = `            {/* OVERLAY DE IMAGEM */}
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
            )}`;

const overlayReplacement = `            {/* OVERLAY DE IMAGEM OU TABELA */}
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
                {selectedImg.tagName !== 'TABLE' && (
                  <>
                    <div style={{ position: 'absolute', left: -6, top: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div style={{ position: 'absolute', right: -6, top: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div style={{ position: 'absolute', left: -6, bottom: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                    <div style={{ position: 'absolute', right: -6, bottom: -6, width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                    <div style={{ position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ns-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ns-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div style={{ position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div style={{ position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)', width: 14, height: 14, backgroundColor: '#3b82f6', border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
                  </>
                )}
              </div>
            )}`;

content = content.replace(overlayTargetStr, overlayReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added table support for image overlay');

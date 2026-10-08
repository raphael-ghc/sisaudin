const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'RichTextEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will just add back the missing pieces of the modal

const missingCode = `              </div>
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
`;

content = content.replace(`              </div>
                <button onClick={() => { if (modalConfig.type === 'table') confirmTable(); else if (modalConfig.type === 'footnote') confirmFootnote(); else applyImageMetadata(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>`, missingCode + `                <button onClick={() => { if (modalConfig.type === 'table') confirmTable(); else if (modalConfig.type === 'footnote') confirmFootnote(); else applyImageMetadata(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar</button>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored the missing modal code and added autoFocus');

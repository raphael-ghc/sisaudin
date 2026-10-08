import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, PlusCircle, Edit3, Trash2, User, Calendar, FileText } from 'lucide-react';

export default function Historico({ eventos = [] }) {
  const [isComponentExpanded, setIsComponentExpanded] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});

  const toggleComponent = () => setIsComponentExpanded(!isComponentExpanded);

  const toggleEvent = (id) => {
    setExpandedEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = (e) => {
    e.stopPropagation();
    const allExpanded = {};
    eventos.forEach(ev => { allExpanded[ev.id] = true; });
    setExpandedEvents(allExpanded);
  };

  const collapseAll = (e) => {
    e.stopPropagation();
    setExpandedEvents({});
  };

  const getEventIcon = (tipo) => {
    switch(tipo) {
      case 'criação': return <PlusCircle size={16} className="text-green-500 bg-white" />;
      case 'edição': return <Edit3 size={16} className="text-blue-500 bg-white" />;
      case 'exclusão': return <Trash2 size={16} className="text-red-400 bg-white" />;
      default: return <FileText size={16} className="text-gray-500 bg-white" />;
    }
  };

  const getEventStyle = (tipo) => {
    switch(tipo) {
      case 'criação': return 'border-green-200 bg-green-50/30';
      case 'edição': return 'border-blue-200 bg-blue-50/30';
      case 'exclusão': return 'border-red-100 bg-red-50/20 opacity-80'; // Sinalizada sutilmente
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8 font-sans">
      <div 
        className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleComponent}
      >
        <div className="flex items-center gap-3">
          <button className="text-gray-500 hover:text-gray-700">
            {isComponentExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <Clock className="text-gray-600" size={20} />
          <h2 className="text-lg font-bold text-gray-700">Histórico de Alterações</h2>
          <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{eventos.length}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isComponentExpanded && eventos.length > 0 && (
            <div className="flex gap-2 mr-4">
              <button onClick={expandAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">Abrir todos</button>
              <button onClick={collapseAll} className="text-xs text-gray-600 hover:text-gray-800 font-medium bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors">Recolher todos</button>
            </div>
          )}
        </div>
      </div>

      {isComponentExpanded && (
        <div className="p-6 bg-white">
          {eventos.length === 0 ? (
            <div className="text-center text-gray-500 italic py-6">Nenhum evento registrado no histórico.</div>
          ) : (
            <div className="relative border-l-2 border-gray-200 ml-3 md:ml-4 space-y-6 pb-2">
              {eventos.map((ev, index) => {
                const isExpanded = expandedEvents[ev.id];
                return (
                  <div key={ev.id} className="relative pl-6 md:pl-8">
                    {/* Marcador na Timeline */}
                    <div className="absolute -left-[11px] top-1 rounded-full p-0.5 bg-white border-2 border-gray-100 shadow-sm">
                      {getEventIcon(ev.tipo)}
                    </div>

                    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${getEventStyle(ev.tipo)}`}>
                      <div 
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-black/5"
                        onClick={() => toggleEvent(ev.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <span className="font-semibold text-gray-800 text-sm">{ev.acao}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(ev.dataHora)}
                          </span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-gray-100/50 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</span>
                              <div className="flex items-center gap-2 text-gray-700">
                                <User size={14} className="text-gray-400" />
                                {ev.responsavel}
                              </div>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Ação</span>
                              <div className="flex items-center gap-2 text-gray-700 capitalize">
                                {ev.tipo}
                              </div>
                            </div>
                            {ev.detalhes && (
                              <div className="md:col-span-2 mt-2">
                                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Detalhes</span>
                                <div className="text-gray-600 bg-white p-2 rounded border border-gray-100 text-xs">
                                  {ev.detalhes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

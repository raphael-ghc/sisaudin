import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  indexOfFirstItem, 
  indexOfLastItem, 
  totalItems 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <span className="text-sm text-gray-500 font-medium">
        Mostrando {totalItems === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} registros
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
        >
          Anterior
        </button>
        <div className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
          <span className="text-sm font-medium text-gray-700">
            Página <span className="font-bold text-[#00767d]">{currentPage}</span> de {totalPages}
          </span>
        </div>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default Pagination;

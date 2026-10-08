import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function RiskMatrix() {
  // Dados de exemplo focados em auditoria e conformidade
  const risks = [
    { id: 1, event: 'Falha no processo licitatório (Lei 14.133/21)', probability: 'Média', impact: 'Alto', level: 'Crítico', trend: 'up' },
    { id: 2, event: 'Alto índice de absenteísmo de servidores', probability: 'Alta', impact: 'Médio', level: 'Atenção', trend: 'stable' },
    { id: 3, event: 'Inconsistências no controle de estoque do almoxarifado', probability: 'Alta', impact: 'Alto', level: 'Crítico', trend: 'up' },
    { id: 4, event: 'Não conformidade com a LGPD nos dados de pacientes', probability: 'Baixa', impact: 'Alto', level: 'Atenção', trend: 'down' },
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'Crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'Atenção': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <AlertTriangle className="text-[#00767d]" size={32} />
            Matriz de Riscos
          </h2>
          <p className="text-slate-500 mt-2 text-xs">
            Mapeamento e avaliação de vulnerabilidades nos processos internos.
          </p>
        </div>
        <button className="bg-[#00767d] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#005e63] transition-colors">
          + Novo Risco
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="p-4">Evento de Risco</th>
              <th className="p-4">Probabilidade</th>
              <th className="p-4">Impacto</th>
              <th className="p-4">Nível de Risco</th>
              <th className="p-4 text-center">Tendência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{risk.event}</td>
                <td className="p-4 text-slate-600">{risk.probability}</td>
                <td className="p-4 text-slate-600">{risk.impact}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(risk.level)}`}>
                    {risk.level}
                  </span>
                </td>
                <td className="p-4 flex justify-center">
                  {risk.trend === 'up' && <TrendingUp className="text-red-500" size={20} />}
                  {risk.trend === 'down' && <TrendingDown className="text-emerald-500" size={20} />}
                  {risk.trend === 'stable' && <Minus className="text-slate-400" size={20} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
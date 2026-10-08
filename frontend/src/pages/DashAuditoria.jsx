import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, CheckCircle2, Clock, 
  FileText, Filter, Search, TrendingUp, AlertTriangle, 
  Calendar, Bell, UserCircle, ChevronRight, ShieldAlert,
  Target, Activity
} from 'lucide-react';

// Dados simulados baseados na estrutura do banco de dados (SISAUDIN)
const kpiData = {
  totalPaint: 42,
  concluidos: 18,
  emAndamento: 20,
  emAtraso: 4, // Backlog - data_final_prevista ultrapassada
  recsAtrasadas: 15,
  recsTotal: 114,
  beneficioFinanceiro: "R$ 1.2M", // Benefícios financeiros apurados
  taxaImplementacao: "68%" // Recomendações implementadas
};

const statusTrabalhos = [
  { name: 'Concluído', value: 18, color: '#10b981' }, // Emerald
  { name: 'Em Andamento', value: 20, color: '#3b82f6' }, // Blue
  { name: 'Em Atraso', value: 4, color: '#f43f5e' }, // Rose
];

const riscoRecomendacoes = [
  { name: 'Baixo', Pendentes: 12, Implementadas: 30 },
  { name: 'Médio', Pendentes: 18, Implementadas: 25 },
  { name: 'Alto', Pendentes: 10, Implementadas: 12 },
  { name: 'Extremo', Pendentes: 5, Implementadas: 2 },
];

const evolucaoTrabalhos = [
  { mes: 'Jan', Concluídos: 2, Planejados: 3 },
  { mes: 'Fev', Concluídos: 3, Planejados: 3 },
  { mes: 'Mar', Concluídos: 5, Planejados: 4 },
  { mes: 'Abr', Concluídos: 4, Planejados: 6 },
  { mes: 'Mai', Concluídos: 2, Planejados: 5 },
  { mes: 'Jun', Concluídos: 2, Planejados: 5 },
];

const trabalhosRecentes = [
  { id: 'IT-30', nome: 'Avaliação da gestão do patrimônio', origem: 'Obrigação Legal', prazo: '31/12/2024', status: 'Em Andamento', risco: 'Alto' },
  { id: 'IT-32', nome: 'Medidas preventivas de passivos', origem: 'Solicitação da Gestão', prazo: '30/11/2024', status: 'Concluído', risco: 'Médio' },
  { id: 'IT-35', nome: 'Indicadores Assistenciais', origem: 'Avaliação de Riscos', prazo: '31/10/2024', status: 'Em Atraso', risco: 'Extremo' },
  { id: 'IT-40', nome: 'Avaliação de causas de absenteísmo', origem: 'Avaliação de Riscos', prazo: '31/12/2025', status: 'Em Andamento', risco: 'Alto' },
  { id: 'IT-43', nome: 'Distribuição de Materiais Médicos', origem: 'Solicitação da Gestão', prazo: '31/12/2025', status: 'Em Andamento', risco: 'Extremo' },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Concluído': 
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</span>;
    case 'Em Andamento': 
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"><Activity className="w-3 h-3 mr-1" /> Em Andamento</span>;
    case 'Em Atraso': 
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"><Clock className="w-3 h-3 mr-1" /> Em Atraso</span>;
    default: 
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">{status}</span>;
  }
};

const getRiskBadge = (risco) => {
  switch (risco) {
    case 'Baixo': return <span className="flex items-center gap-1.5 text-slate-600 text-sm font-medium"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Baixo</span>;
    case 'Médio': return <span className="flex items-center gap-1.5 text-amber-600 text-sm font-medium"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Médio</span>;
    case 'Alto': return <span className="flex items-center gap-1.5 text-orange-600 text-sm font-medium"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Alto</span>;
    case 'Extremo': return <span className="flex items-center gap-1.5 text-rose-600 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div> Extremo</span>;
    default: return <span>{risco}</span>;
  }
};

export default function DashAuditoria() {
  const [anoFiltro, setAnoFiltro] = useState('2025');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar Superior 
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                <ShieldAlert className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">SISAUDIN <span className="font-medium text-slate-400">Executive</span></span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar auditoria, nota..." 
                  className="pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 rounded-full text-sm transition-all w-72 outline-none"
                />
              </div>
              <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-slate-700 leading-none">Auditor Chefe</p>
                  <p className="text-xs text-slate-500 mt-0.5">Gerência de Auditoria</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700">
                  <UserCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>*/}

      {/* Conteúdo Principal */}
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cabeçalho de Título e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Visão Geral do PAINT</h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400"/> Acompanhamento estratégico e governança corporativa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center shadow-sm hover:border-slate-300 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="pl-3 pr-2 text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Exercício:
              </span>
              <select 
                value={anoFiltro}
                onChange={(e) => setAnoFiltro(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer pr-8 py-1 outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all active:scale-95">
              <Filter className="w-4 h-4" /> Relatório Completo
            </button>
          </div>
        </div>

        {/* KPIs Estratégicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Total PAINT */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Trabalhos PAINT</p>
                <h3 className="text-4xl font-black text-slate-900 mt-2">{kpiData.totalPaint}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Exercício Atual</span>
              <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                <TrendingUp className="w-3 h-3 mr-1" /> +12%
              </span>
            </div>
          </div>

          {/* Card 2: Concluídos e Taxa */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Execução</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-4xl font-black text-slate-900">{kpiData.concluidos}</h3>
                  <span className="text-lg font-medium text-slate-400">/ {kpiData.totalPaint}</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-500">Progresso</span>
                <span className="text-emerald-700">{Math.round((kpiData.concluidos/kpiData.totalPaint)*100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(kpiData.concluidos/kpiData.totalPaint)*100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Atrasos/Backlog */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Backlog (Atrasos)</p>
                <h3 className="text-4xl font-black text-rose-600 mt-2">{kpiData.emAtraso}</h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Prazos vencidos</span>
              <button className="text-rose-600 hover:text-rose-800 font-semibold flex items-center text-xs">
                Analisar <ChevronRight className="w-3 h-3 ml-0.5"/>
              </button>
            </div>
          </div>

          {/* Card 4: Benefícios Financeiros (Novo Indicador) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Benefício Apurado</p>
                <h3 className="text-4xl font-black text-amber-500 mt-2">{kpiData.beneficioFinanceiro}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-center">
                <span className="text-amber-600 font-bold text-lg">R$</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Retorno p/ instituição</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Quantitativo</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Gráfico de Aderência e Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Status de Execução</h3>
              <p className="text-sm text-slate-500 mt-1">Situação atual dos itens do PAINT.</p>
            </div>
            <div className="flex-1 min-h-[280px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusTrabalhos}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {statusTrabalhos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}/>
                </PieChart>
              </ResponsiveContainer>
              {/* Texto no centro da rosca */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-black text-slate-800">{kpiData.totalPaint}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Total</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Recomendações (Matriz de Risco) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Monitoramento de Recomendações</h3>
                <p className="text-sm text-slate-500 mt-1">Efetividade (Implementadas vs Pendentes) por Nível de Risco.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Taxa Geral</p>
                  <p className="text-lg font-bold text-emerald-600">{kpiData.taxaImplementacao}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riscoRecomendacoes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px', fontWeight: 500 }} />
                  <Bar dataKey="Implementadas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={48} />
                  <Bar dataKey="Pendentes" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela Operacional */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Acompanhamento de Prazos</h3>
              <p className="text-sm text-slate-500 mt-1">Trabalhos em execução próximos ao vencimento ou atrasados.</p>
            </div>
            <button className="text-sm px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              Ver Todos os Trabalhos
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">ID / Item de Trabalho</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Origem (Motivação)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Prazo Previsto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Risco Residual</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Status Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trabalhosRecentes.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                          {item.id.split('-')[1]}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{item.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{item.origem}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${item.status === 'Em Atraso' ? 'text-rose-600' : 'text-slate-600'}`}>
                        <Calendar className="w-4 h-4" />
                        {item.prazo}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRiskBadge(item.risco)}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

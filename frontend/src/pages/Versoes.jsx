import React, { useEffect } from 'react';
import { Tag, Wrench, Plus, AlertTriangle, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { VERSOES, URL_NOVA_SOLICITACAO } from '../data/versoes';

// Âncora de cada versão: "v2026.11.1" vira "v2026-11-1".
const ancora = (versao) => `v${versao.replace(/\./g, '-')}`;

function irPara(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Deixa o endereço com a âncora, para poder copiar o link da seção.
  try { window.history.replaceState(null, '', `#${id}`); } catch { /* ignora */ }
}

export default function Versoes() {
  const atual = VERSOES[0];

  // Ao abrir por um link com âncora (#v2026-11-1), rola até a versão.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (id) setTimeout(() => irPara(id), 50);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Versões do Sisaudin</h1>
          <p className="text-sm text-gray-500 mt-1">
            O que mudou em cada atualização do sistema, da mais recente para a mais antiga.
          </p>
        </div>
        {atual && (
          <span className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-[#00767d]/10 text-[#00767d] text-sm font-semibold">
            <Tag size={16} /> Versão atual: {atual.versao}
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Índice das versões */}
        <nav
          aria-label="Versões"
          className="w-full lg:w-60 shrink-0 lg:sticky lg:top-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Versões</p>
          <ul className="flex flex-col gap-1">
            {VERSOES.map((v, i) => (
              <li key={v.versao}>
                <a
                  href={`#${ancora(v.versao)}`}
                  onClick={(e) => { e.preventDefault(); irPara(ancora(v.versao)); }}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#00767d]/10 hover:text-[#00767d] transition-colors"
                >
                  <span className={`font-medium ${v.tipo !== 'versao' ? 'pl-3' : ''}`}>{v.versao}</span>
                  <span className="text-xs text-gray-400">{i === 0 ? 'atual' : v.data}</span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href={URL_NOVA_SOLICITACAO}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#00767d] hover:bg-[#005f65] transition-colors"
          >
            <MessageSquarePlus size={16} />
            Solicitar mudança
          </a>
        </nav>

        {/* Seções das versões */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {VERSOES.map((v, i) => (
            <section
              key={v.versao}
              id={ancora(v.versao)}
              className="scroll-mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6"
            >
              <header className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-800">Versão {v.versao}</h2>
                  {i === 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      Atual
                    </span>
                  )}
                  {v.tipo === 'correcao' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Wrench size={12} /> Correção
                    </span>
                  )}
                  {v.tipo === 'ajuste' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      <Plus size={12} /> Complemento
                    </span>
                  )}
                  <span className="text-sm text-gray-400">· {v.data}</span>
                </div>
                <p className="text-base font-semibold text-[#00767d]">{v.titulo}</p>
                {v.resumo && <p className="text-sm text-gray-600 mt-1">{v.resumo}</p>}
              </header>

              {v.avisos?.length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                    <AlertTriangle size={16} /> Atenção
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900">
                    {v.avisos.map((a, k) => <li key={k}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-5">
                {v.grupos.map((g) => (
                  <div key={g.titulo}>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">{g.titulo}</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700 leading-relaxed">
                      {g.itens.map((item, k) => <li key={k}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="text-sm text-gray-500 pb-4">
            Encontrou um erro ou quer sugerir uma melhoria?{' '}
            <a
              href={URL_NOVA_SOLICITACAO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#00767d] hover:underline"
            >
              Registre no sistema de solicitação de mudanças <ExternalLink size={14} />
            </a>
            . Informe a hora, o documento e, se puder, um print da mensagem.
          </p>
        </div>
      </div>
    </div>
  );
}

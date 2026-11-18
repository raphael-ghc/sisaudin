// Histórico de versões mostrado em "Sisaudin > Versões do Sisaudin" (página Versoes.jsx).
// A cada implantação, acrescente a versão nova NO INÍCIO da lista. Escreva para quem usa o sistema.
// tipo: 'versao' (implantação completa), 'correcao' (correção sobre a versão anterior)
// ou 'ajuste' (complemento pequeno sobre a versão anterior). Correções e ajustes usam o sufixo .0.N.

// Sistema de solicitação de mudanças do Sisaudin (pedidos de melhoria e relatos de erro).
// Ordem de prioridade do endereço:
//   1. public/config-sisaudin.js (urlSolicitacoes): editável na pasta publicada, sem novo build;
//   2. VITE_URL_SOLICITACOES no .env do modo de build (exige novo build);
//   3. o endereço abaixo.
const urlDoArquivoDeConfig = (() => {
  try { return (window.SISAUDIN_CONFIG?.urlSolicitacoes || '').trim(); } catch { return ''; }
})();

export const URL_SOLICITACOES =
  urlDoArquivoDeConfig ||
  import.meta.env.VITE_URL_SOLICITACOES ||
  'https://script.google.com/macros/s/AKfycbxraP11XPuZ_t6EzXwRayNTxb0RRJxxs4PLgLwkZ7KRF4w8UxDE7Mmgf9BgetJVK4Vs/exec';

// O link "Solicitar Mudanças" abre o sistema direto na aba "Nova solicitação" (âncora #nova do sistema).
export const URL_NOVA_SOLICITACAO = `${URL_SOLICITACOES.split('#')[0]}#nova`;

export const VERSOES = [
  {
    versao: '2026.11.1.0.2',
    data: '18/11/2026',
    tipo: 'correcao',
    titulo: 'Ordem das questões do Planejamento',
    resumo: 'Correção da versão 2026.11.1: as questões do Planejamento mudam de ordem por botões, e a página não trava mais ao rolar com uma lista aberta.',
    grupos: [
      {
        titulo: 'Planejamento — Questões de Auditoria',
        itens: [
          'Para mudar a ordem de uma questão, use as setas ↑ e ↓ ao lado do título dela. As questões não são mais arrastadas com o mouse.',
          'Corrigido: com uma lista de seleção aberta (gerências, técnicas ou riscos), clicar na barra de rolagem prendia a questão com borda tracejada e travava a rolagem da página.',
          'Corrigido: ao mover uma questão recém-criada logo depois de digitar, o texto podia passar para outra questão.',
          'O número "Questão nº" acompanha a posição. Anexos e fatos da Matriz de Achados continuam com a mesma questão.',
          'O resumo ao lado do título da questão mostra só o texto, sem códigos de formatação.',
        ],
      },
    ],
    avisos: [
      'No primeiro acesso depois da atualização, aperte Ctrl+F5 para carregar a tela nova.',
      'Com uma lista de seleção aberta, a página ainda não rola. Feche a lista (clique fora dela) antes de rolar.',
    ],
  },
  {
    versao: '2026.11.1.0.1',
    data: '11/11/2026',
    tipo: 'ajuste',
    titulo: 'Versões do Sisaudin e Solicitar Mudanças',
    resumo: 'Complemento da versão 2026.11.1: um lugar no próprio sistema para acompanhar as atualizações e pedir mudanças.',
    grupos: [
      {
        titulo: 'Menu "Sisaudin"',
        itens: [
          'Novo menu "Sisaudin", no fim do menu lateral, disponível para todos os usuários.',
          'Versões do Sisaudin: esta página, com o que mudou em cada atualização, da mais recente para a mais antiga. O índice ao lado leva direto a cada versão.',
          'Solicitar Mudanças: abre, em outra aba, o sistema de solicitação de mudanças do Sisaudin já na tela "Nova solicitação", para registrar pedidos de melhoria e erros.',
        ],
      },
    ],
    avisos: [],
  },
  {
    versao: '2026.11.1',
    data: 'Novembro de 2026',
    tipo: 'versao',
    titulo: 'Planejamento, Matriz de Achados, Serviço e Tipo de Auditoria',
    resumo:
      'Primeira versão de novembro. O Planejamento e a Matriz de Achados passam a trabalhar juntos: a Matriz nasce do Planejamento e recebe só os fatos e as evidências.',
    grupos: [
      {
        titulo: 'Planejamento',
        itens: [
          'O formulário segue a mesma ordem do documento: Cronograma logo no início e Escopo dentro de "Objeto Auditado".',
          'O número do Planejamento é gerado ao criar e aparece no formulário. Os antigos sem número aparecem como "s/n" e podem ser numerados à mão.',
          'As gerências destinatárias vêm do item de trabalho (botão "Carregar gerências do item") e são escolhidas no cadastro de gerências.',
          'Cada questão pode ter mais de uma gerência. Técnicas e riscos são escolhidos nas listas do cadastro.',
          'A ordem das questões é gravada e se mantém ao reabrir.',
          'Serviço de Auditoria (Avaliação, Consultoria, Auditoria Contínua…) vem do item de trabalho e aparece só para consulta. Para trocar, edite o item.',
          'Novo campo Tipo de Auditoria: Desempenho, Financeira e/ou Conformidade. Dá para marcar mais de um.',
          'Uma questão que já tem fatos na Matriz de Achados não pode ser excluída do Planejamento. Um Planejamento com Matriz também não pode ser excluído.',
        ],
      },
      {
        titulo: 'Matriz de Achados',
        itens: [
          'Só pode ser criada depois do Planejamento. Ela já vem com as questões dele, sem precisar digitar de novo.',
          'Na Matriz são preenchidos só os fatos encontrados e as evidências. Cada questão pode ter vários fatos, cada um com seus anexos.',
          'Questões novas ou alteradas no Planejamento aparecem na Matriz ao salvar o Planejamento, ou pelo botão "Atualizar do Planejamento".',
          'No documento, cada fato fica numa linha.',
          'Formulário e documento rolam separadamente, lado a lado.',
        ],
      },
      {
        titulo: 'Demais telas',
        itens: [
          'O campo "Tipo de Serviço" passou a se chamar "Serviço de Auditoria" em todos os documentos e no item de trabalho.',
        ],
      },
    ],
    avisos: [
      'No primeiro acesso depois da atualização, aperte Ctrl+F5. Sem isso o Planejamento pode não salvar.',
      'Se algum Planejamento antigo aparecer sem gerência, técnica ou risco, é porque o nome antigo não existia no cadastro. É só escolher de novo.',
    ],
  },
  {
    versao: '2026.10.1.0.1',
    data: '29/10/2026',
    tipo: 'correcao',
    titulo: 'Correção do Planejamento',
    resumo: 'Correção pequena sobre a versão 2026.10.1.',
    grupos: [
      {
        titulo: 'Planejamento',
        itens: [
          'O Planejamento já criado mostrava "Não informado" na Equipe de Auditoria. Agora mostra a equipe cadastrada no item, na tela e no PDF.',
          'As Horas de Trabalho mostravam sempre 420. Agora mostram as Horas Previstas do item, que já são o total da equipe.',
          'A Ordem de Serviço deixou de mostrar 420 horas quando o item não tem horas previstas.',
        ],
      },
    ],
    avisos: [],
  },
  {
    versao: '2026.10.1',
    data: '28/10/2026',
    tipo: 'versao',
    titulo: 'REAI, Parecer e correções de salvamento',
    resumo:
      'Primeira versão de outubro: o Relatório Especial (REAI), o Parecer no formato do modelo oficial e várias correções de salvamento e de abertura dos documentos.',
    grupos: [
      {
        titulo: 'RAI e REAI',
        itens: [
          'Em item PAINT o sistema gera RAI (Relatório de Auditoria Interna); em item EXTRA gera REAI (Relatório Especial de Auditoria Interna). Item sem tipo não gera relatório.',
          'No menu "Criar Documento" só aparece disponível o relatório certo para o item; o outro fica bloqueado, com o motivo.',
          'O REAI tem capa e título próprios e numeração separada do RAI, por ano. O relatório final recebe o mesmo número do preliminar. Cada item tem um só relatório preliminar.',
          'Por decisão da área, os relatórios antigos de itens EXTRA passaram a REAI, renumerados na ordem de criação: IT-51 → REAI 01/2025, IT-52 → REAI 02/2025, IT-79 → REAI 01/2026, IT-91 → REAI 02/2026 e IT-89 → REAI 03/2026. Os relatórios de itens PAINT não mudaram.',
        ],
      },
      {
        titulo: 'Salvamento automático',
        itens: [
          'Os relatórios (preliminar e final), as notas (preliminar, final e técnica) e o Parecer voltaram a salvar sozinhos. Espere aparecer "Salvo às hh:mm" antes de fechar a tela.',
          'Os dois "Texto Inicial" das notas preliminar e final passaram a ser gravados.',
        ],
      },
      {
        titulo: 'Parecer',
        itens: [
          'Segue o modelo oficial: Introdução, Objetivo, Escopo de Avaliação, Análise dos Fatos (opcional), Conclusão e Anexos (a partir do Anexo A).',
          'Saíram Constatações e Recomendações, o Anexo A – Plano de Ação e o glossário. Nos pareceres existentes, Objetivo e Escopo aparecem preenchidos e os anexos continuam no lugar.',
        ],
      },
      {
        titulo: 'Planejamento',
        itens: [
          'As Gerências Destinatárias escolhidas ficam gravadas e voltam ao reabrir.',
          'O Planejamento deixou de perder o que era digitado rapidamente, de um campo para outro.',
          'Corrigido o erro que às vezes impedia criar ou salvar Planejamento, Matriz de Achados e Reunião de Busca Conjunta.',
        ],
      },
      {
        titulo: 'Outras correções',
        itens: [
          'O relatório final (RAI-F/REAI-F) abre direto no editor depois de criado, sem página de erro.',
          'As notas preliminar, final e técnica abrem na tela própria depois de criadas.',
          'A exclusão pela lista de itens de trabalho voltou a funcionar para todos os documentos.',
          'Anexos de até 50 MB são aceitos.',
        ],
      },
    ],
    avisos: [
      'Ao citar os relatórios de itens EXTRA renumerados, use o número novo. Documentos já enviados com o número antigo não são alterados pelo sistema.',
      'Não crie relatórios só para testar: cada relatório criado consome um número da sequência oficial.',
    ],
  },
];

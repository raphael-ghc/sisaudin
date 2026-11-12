// Configurações do Sisaudin que podem ser trocadas SEM gerar o front de novo.
// Este arquivo fica na pasta publicada do front (produção: pasta html do nginx; homologação: C:\sisaudin-homolog\frontend).
// Edite, salve e peça Ctrl+F5 no navegador. Não precisa reiniciar o nginx nem o backend.
window.SISAUDIN_CONFIG = {
  // Endereço do sistema de solicitação de mudanças (termina em /exec).
  // A cada nova implantação do Apps Script, cole aqui o endereço novo, entre as aspas.
  // O Sisaudin acrescenta #nova sozinho para abrir em "Nova solicitação".
  urlSolicitacoes: 'https://script.google.com/macros/s/AKfycbxraP11XPuZ_t6EzXwRayNTxb0RRJxxs4PLgLwkZ7KRF4w8UxDE7Mmgf9BgetJVK4Vs/exec',
};

// Endereços do backend. Em desenvolvimento vêm do .env.development;
// sem as variáveis definidas, valem os endereços de produção.
// Valor vazio é aceito: no JAR unificado o front chama o próprio servidor ("/api").
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://sisaudin.ghc.com.br:8080';
export const API_URL = import.meta.env.VITE_API_URL ?? 'https://sisaudin.ghc.com.br/api';

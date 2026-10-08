import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (ex: 'development', 'production')
  // O terceiro parâmetro '' carrega todas as variáveis do arquivo, não só as com prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(), 
      tailwindcss()
    ],
    // Caso queira usar as variáveis de ambiente aqui na configuração:
    // server: {
    //   port: parseInt(env.VITE_PORT) || 5173,
    // }
  }
})

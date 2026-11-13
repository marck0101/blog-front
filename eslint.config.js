import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Nome em maiúscula = componente usado em JSX (<Icon />), que esta regra não
      // enxerga; vale para variáveis e para parâmetros ({ icon: Icon })
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // Só diz se o React Compiler consegue otimizar o componente; o build não usa o compilador
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    // Vercel Serverless Functions
    files: ['api/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])

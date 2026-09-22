import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, host: true },
  // 相対パス出力にしておくと、社内サーバーのサブディレクトリにそのまま配置できる
  base: './',
});

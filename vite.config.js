import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/koe-japanese-pronunciation/',
  plugins: [react()],
});

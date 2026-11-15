import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
	server: {
		proxy: {
			'/api':{
				target: 'http://147.182.191.129:5000',
				changeOrigin:true,
				secure: false,
			},
		},
	},
});

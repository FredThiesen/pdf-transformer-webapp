import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		allowedHosts: [
			"3d52-2804-30c-1a65-f700-5c3a-3ccf-eece-81f8.ngrok-free.app",
		],
	},
})

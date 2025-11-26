import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173, // Use port 5173 for frontend
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Match backend port
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000', // Proxy Google OAuth routes to backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
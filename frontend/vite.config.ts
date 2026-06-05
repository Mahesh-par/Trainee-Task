import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL ?? "http://localhost:6060";

  return {
    plugins: [react()],
    server: {
      port: 3500,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true
        },
        "/uploads": {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  };
});

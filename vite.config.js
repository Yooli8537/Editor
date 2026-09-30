import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "process.env": {},
  },
  server: {
    proxy: {
      "/api": "http://localhost:8510",
    },
  },
});

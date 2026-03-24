import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Electron/Desktop builds need "./" for file:// protocol
  base: process.env.VITE_ELECTRON === "true" ? "./" : "/app/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Erzwinge eine einzige React-Instanz (verhindert Hook-Fehler)
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // React core - stabil, ändert sich selten
            if (id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            // PDF/Canvas - nur bei PDF-Generierung geladen
            if (id.includes("jspdf") || id.includes("html2canvas")) {
              return "vendor-pdf";
            }
            // 3D - nur bei 3D-Visualisierung geladen
            if (id.includes("/three/")) {
              return "vendor-3d";
            }
            // Animation - framer-motion
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            // Date utilities
            if (id.includes("date-fns")) {
              return "vendor-date";
            }
            // recharts + d3 bleiben zusammen (Circular Dependencies)
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

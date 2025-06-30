import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
<<<<<<< HEAD
=======
import { componentTagger } from "lovable-tagger";
>>>>>>> 53f3a4bbad491f9977fc35744d519860fe1c8114

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
<<<<<<< HEAD
    // Remove the incomplete conditional line
=======
    mode === 'development' &&
    componentTagger(),
>>>>>>> 53f3a4bbad491f9977fc35744d519860fe1c8114
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
<<<<<<< HEAD
}));
=======
}));
>>>>>>> 53f3a4bbad491f9977fc35744d519860fe1c8114

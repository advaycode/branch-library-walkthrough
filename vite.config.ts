import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from https://advaycode.github.io/branch-library-walkthrough/
export default defineConfig({
  base: "/branch-library-walkthrough/",
  plugins: [react()],
});

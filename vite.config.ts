/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), svgr(), tsconfigPaths(), wasm()],
  resolve: {
    alias: {
      src: path.resolve("./src/"),
    },
  },
  test: {},
});

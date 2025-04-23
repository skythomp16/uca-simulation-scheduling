import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        sourcemap: true,
        outDir: ".vite/build",
        emptyOutDir: true,
        lib: {
            entry: "./src/preload.js",
            formats: ["cjs"],
        },
        rollupOptions: {
            external: ["electron", ...builtinModules],
            output: {
                entryFileNames: "[name].js",
            }
        }
    }
});

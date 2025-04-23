import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        sourcemap: true,
        outDir: ".vite/build",
        lib: {
            entry: "src/main.js",
            formats: ["cjs"],
        },
        rollupOptions: {
            external: ["electron", ...builtinModules, "read-excel-file", "write-excel-file"],
            output: {
                entryFileNames: "[name].js",
            }
        }
    }
});

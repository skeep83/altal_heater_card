import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: false,
        minify: "esbuild",
        lib: {
            entry: path.resolve(__dirname, "src/altal-heatpump-card.ts"),
            name: "AltalHeatpumpCard",
            fileName: () => "altal_heater_card.js",
            formats: ["es"],
        },
        rollupOptions: {
            output: {
                dir: "dist",
                format: "es",
                entryFileNames: "altal_heater_card.js",
            },
        },
    },
});

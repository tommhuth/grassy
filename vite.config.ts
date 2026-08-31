import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import tailwindcss from "@tailwindcss/vite"
import glsl from "vite-plugin-glsl"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3000,
        allowedHosts: ["huth.ngrok.app"]
    },
    assetsInclude: ["**/*.glb"],
    resolve: {
        alias: {
            "@components": path.resolve(import.meta.dirname, "src/components"),
            "@data": path.resolve(import.meta.dirname, "src/data"),
            "@assets": path.resolve(import.meta.dirname, "assets"),
            "@src": path.resolve(import.meta.dirname, "src"),
        },
    },
    build: {
        target: "es2024"
    },
    plugins: [
        tailwindcss(),
        react(),
        glsl(),
        VitePWA({
            registerType: "prompt",
            workbox: {
                globPatterns: ["**/*.{html,js,css,png,svg,woff,woff2,glb}"]
            },
            manifest: {
                name: "R3F Boilerplate",
                short_name: "R3F Boilerplate",
                display: "fullscreen",
                description: "R3F Boilerplate",
                orientation: "portrait",
                theme_color: "#000000",
                icons: [
                    {
                        "src": "./assets/icons/pwa-icon.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any maskable"
                    },
                ]
            }
        })
    ],
})
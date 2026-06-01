import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon-32.png", "apple-touch-icon.png"],
      // Los splash de iOS no necesitan precache offline (la instalación ocurre
      // online); se sirven igual desde /splash/.
      workbox: { globIgnores: ["**/splash/**"] },
      manifest: {
        name: "Guitar Tuner",
        short_name: "Tuner",
        description: "Afinador de guitarra en tiempo real",
        lang: "es",
        theme_color: "#08080c",
        background_color: "#08080c",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});

import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  serverDir: "./server",
  compatibilityDate: "2024-09-19",
  preset: "cloudflare_module",
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
  },
});

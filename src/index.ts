import { serve } from "bun";
import indexHtml from "./index.html";

// Start Express Backend
import "./backend/server";

// Start Bun Frontend Server (Proxies /api -> Express at :5000)
const server = serve({
  port: 3030,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      const targetUrl = new URL(url.pathname + url.search, "http://localhost:5050");
      return fetch(targetUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
    }
    return indexHtml;
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Frontend Dev Server running at http://localhost:${server.port}`);

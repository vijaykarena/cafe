import { serve } from "bun";
import indexHtml from "./index.html";

// Start Express Backend
import "./backend/server";

// Start Bun Frontend Server (Proxies /api -> Express at :5000)
const server = serve({
  port: 3030,
  routes: { "/*": indexHtml },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(
  `🚀 Frontend Dev Server running at http://localhost:${server.port}`,
);

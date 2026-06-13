import { serve } from "bun";
import index from "./index.html";
import { query } from "./lib/db";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/db-test": async () => {
      try {
        const result = await query("SELECT * FROM users ORDER BY id ASC");
        return Response.json({
          success: true,
          message: "Successfully connected to PostgreSQL database!",
          users: result.rows,
        });
      } catch (error: any) {
        return Response.json(
          {
            success: false,
            message: "Failed to connect to the database or retrieve users.",
            error: error.message || String(error),
          },
          { status: 500 }
        );
      }
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

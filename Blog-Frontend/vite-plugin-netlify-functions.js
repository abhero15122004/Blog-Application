/**
 * Tiny Vite plugin that serves Netlify Functions in-process during
 * `npm run dev`, so you don't need `netlify dev` (and its Edge Functions
 * runtime download) just to test the AI proxy locally.
 *
 * - Watches netlify/functions/*.js
 * - Intercepts /.netlify/functions/<name> requests on the Vite dev server
 * - Converts the Node request into the AWS-Lambda-style event shape
 *   Netlify handlers expect, calls the handler, returns the response.
 * - Loads variables from .env / .env.local into process.env so handlers
 *   that read process.env.HF_TOKEN etc. just work.
 * - Hot-reloads handlers on edit (cache-busted import).
 */
import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

const PREFIX = "/.netlify/functions/";

export const netlifyFunctions = (options = {}) => {
  const functionsDir = options.dir || "netlify/functions";

  return {
    name: "netlify-functions-dev",
    apply: "serve",
    async configureServer(server) {
      const root = server.config.root;
      const fnRoot = resolve(root, functionsDir);

      // Load .env* into process.env so handlers can read HF_TOKEN, etc.
      try {
        const env = loadEnv(server.config.mode || "development", root, "");
        for (const [k, v] of Object.entries(env)) {
          if (process.env[k] === undefined) process.env[k] = v;
        }
      } catch {
        /* loadEnv is best-effort */
      }

      if (!existsSync(fnRoot)) {
        server.config.logger.warn(
          `[netlify-fn] functions directory not found: ${fnRoot}`
        );
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith(PREFIX)) return next();

        const [pathname, search = ""] = req.url
          .slice(PREFIX.length)
          .split("?");
        const fnName = pathname.split("/")[0];
        if (!fnName) return next();

        const fnPath = resolve(fnRoot, `${fnName}.js`);
        if (!existsSync(fnPath) || !statSync(fnPath).isFile()) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          return res.end(
            JSON.stringify({
              error: `Function "${fnName}" not found`,
              hint: `Expected ${functionsDir}/${fnName}.js`,
            })
          );
        }

        // Collect request body
        let body = "";
        try {
          for await (const chunk of req) body += chunk.toString();
        } catch (err) {
          res.statusCode = 400;
          return res.end(`Failed to read request body: ${err.message}`);
        }

        const queryStringParameters = Object.fromEntries(
          new URLSearchParams(search)
        );

        const headers = {};
        for (const [k, v] of Object.entries(req.headers)) {
          headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
        }

        const event = {
          httpMethod: (req.method || "GET").toUpperCase(),
          headers,
          multiValueHeaders: {},
          path: req.url.split("?")[0],
          rawUrl: `http://${req.headers.host || "localhost"}${req.url}`,
          queryStringParameters,
          multiValueQueryStringParameters: {},
          body,
          isBase64Encoded: false,
        };

        const context = {
          functionName: fnName,
          functionVersion: "$LATEST",
          invokedFunctionArn: `arn:aws:lambda:local:function:${fnName}`,
          memoryLimitInMB: "1024",
          awsRequestId: `local-${Date.now()}`,
          logGroupName: `local`,
          logStreamName: `local`,
          getRemainingTimeInMillis: () => 30_000,
          done: () => {},
          fail: () => {},
          succeed: () => {},
          callbackWaitsForEmptyEventLoop: false,
        };

        try {
          // Cache-bust to pick up edits on hot reload
          const moduleUrl =
            pathToFileURL(fnPath).href + `?t=${Date.now()}`;
          const mod = await import(moduleUrl);
          const handler = mod.handler || mod.default?.handler || mod.default;

          if (typeof handler !== "function") {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            return res.end(
              JSON.stringify({
                error: `${fnName} does not export a "handler" function`,
              })
            );
          }

          const result = (await handler(event, context)) || {};
          const statusCode = result.statusCode || 200;
          const respHeaders = result.headers || {};
          const respBody = result.body ?? "";

          res.statusCode = statusCode;
          for (const [k, v] of Object.entries(respHeaders)) {
            if (v !== undefined && v !== null) res.setHeader(k, v);
          }
          // Default content-type if handler didn't set one and body looks JSON
          if (!res.getHeader("content-type") && respBody) {
            try {
              JSON.parse(respBody);
              res.setHeader("Content-Type", "application/json");
            } catch {
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
            }
          }

          if (result.isBase64Encoded && typeof respBody === "string") {
            res.end(Buffer.from(respBody, "base64"));
          } else {
            res.end(respBody);
          }
        } catch (err) {
          server.config.logger.error(
            `[netlify-fn] ${fnName} threw: ${err.stack || err.message}`
          );
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "Function crashed",
              detail: String(err?.message || err),
            })
          );
        }
      });

      // Pretty log so it's obvious functions are wired up
      server.httpServer?.once("listening", () => {
        server.config.logger.info(
          `\n  \x1b[32m➜\x1b[0m  \x1b[1mNetlify Functions:\x1b[0m mounted at /.netlify/functions/* (in-process)\n`,
          { clear: false }
        );
      });

      // Watch functions dir so edits trigger reload (file-by-file via cache-bust above)
      server.watcher.add(`${fnRoot}/**/*.js`);
    },
  };
};

export default netlifyFunctions;

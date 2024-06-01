import { Context, Hono } from "hono";
import { todos } from "./lib/data.json";
import { Ratelimit } from "@upstash/ratelimit";
import { BlankEnv, BlankInput } from "hono/types";
import { env } from "hono/adapter";
import { Redis } from "@upstash/redis/cloudflare";

declare module "hono" {
  interface ContextVariableMap {
    ratelimit: Ratelimit;
  }
}

const app = new Hono();

const cache = new Map();

// singleton pattern
class RedisRateLimiter {
  static instance: Ratelimit;
  static getInstance(c: Context<BlankEnv, "/todos/:id", BlankInput>) {
    if (!this.instance) {
      const { REDIS_TOKEN, REDIS_URL } = env<{
        REDIS_URL: string;
        REDIS_TOKEN: string;
      }>(c);

      const redisClient = new Redis({
        token: REDIS_TOKEN,
        url: REDIS_URL,
      });

      this.instance = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
        ephemeralCache: cache,
        analytics: true,
      });

      return this.instance;
    }

    return this.instance;
  }
}

app.use(async (c, next) => {
  const ratelimit = RedisRateLimiter.getInstance(c);
  // now to make the rate limiter accessible to all of our api routes.
  // this function appends the rateLimit to our request to be sent to the api routes
  c.set("ratelimit", ratelimit);
  await next();
});

app.get("/todos/:id", async (c) => {
  const rateLimit = c.get("ratelimit");
  // we now get the user Ip Address from cloudflare headers
  const ip = c.req.raw.headers.get("CF-Connecting-IP");
  const { success } = await rateLimit.limit(ip ?? "anonymous");

  if (!success) {
    return c.json({ error: "Too many request" }, 429);
  }

  const todoId = c.req.param("id");
  const todoIndex = Number(todoId);
  const todo = todos[todoIndex] || {};

  return c.json(todo);
});

export default app;

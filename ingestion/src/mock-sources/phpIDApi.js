import express from "express";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const MAX_PAGE_SIZE = 1000;
const RATE_LIMIT_PER_SECOND = 10;
const RATE_WINDOW_MS = 1000;
const REQUEST_INTERVAL_MS = 100;
const pageSize = MAX_PAGE_SIZE;
const dirName = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(dirName, "..", "..", "data", "live-product-ids.json");
const allIDs = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

export function createPhpIDApiServer() {
  const app = express();
  let requestTimestamps = [];

  app.use((req, res, next) => {
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(
      (timestamp) => now - timestamp < RATE_WINDOW_MS
    );

    if (requestTimestamps.length >= RATE_LIMIT_PER_SECOND) {
      const retryAfterMs = RATE_WINDOW_MS - (now - requestTimestamps[0]);
      res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000));
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit of ${RATE_LIMIT_PER_SECOND} req/s exceeded`,
      });
    }

    requestTimestamps.push(now);
    next();
  });

  app.get("/api/product-ids", (req, res) => {
    const page = Number(req.query.page) || 0;
    const start = page * pageSize;
    const end = start + pageSize;
    const ids = allIDs.slice(start, end);

    if (ids.length === 0 && page > 0) {
      return res.status(400).json({
        error: "Invalid page",
        message: `Page ${page} is out of range`,
      });
    }

    res.json({ ids, page, hasMore: end < allIDs.length });
  });

  return app;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(baseUrl, page) {
  const res = await fetch(`${baseUrl}/api/product-ids?page=${page}`);

  if (res.status === 429) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 1;
    console.warn(
      `[phpIDApi] Rate limited on page ${page}, retrying after ${retryAfterSeconds}s`
    );
    await sleep(retryAfterSeconds * 1000);
    return fetchPage(baseUrl, page);
  }

  if (!res.ok) {
    throw new Error(
      `[phpIDApi] Unexpected error fetching page ${page}: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

export async function fetchAllProductIDs(baseUrl = "http://localhost:4000") {
  const allIDs = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const start = Date.now();
    const batch = await fetchPage(baseUrl, page);

    allIDs.push(...batch.ids);
    hasMore = batch.hasMore;
    page += 1;

    const elapsed = Date.now() - start;
    const remaining = REQUEST_INTERVAL_MS - elapsed;
    if (hasMore && remaining > 0) {
      await sleep(remaining);
    }
  }

  return allIDs;
}

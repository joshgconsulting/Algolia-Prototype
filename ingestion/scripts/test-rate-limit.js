import assert from "node:assert/strict";
import { createPhpIDApiServer } from "../src/mock-sources/phpIDApi.js";

const server = createPhpIDApiServer().listen(0, "127.0.0.1");

await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

try {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/product-ids?page=0`;

  const responses = await Promise.all(
    Array.from({ length: 15 }, () => fetch(url))
  );

  const accepted = responses.filter((response) => response.status === 200);
  const rejected = responses.filter((response) => response.status === 429);

  console.log("Accepted:", accepted.length);
  console.log("Rejected:", rejected.length);

  assert.equal(accepted.length, 10);
  assert.equal(rejected.length, 5);

  for (const response of rejected) {
    assert.ok(response.headers.get("Retry-After"));

    const body = await response.json();
    assert.equal(body.error, "Too Many Requests");
  }

  console.log("Rate-limit test passed.");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
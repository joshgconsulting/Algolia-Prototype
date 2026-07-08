import "dotenv/config";
import { fetchXmlCatalog } from "./mock-sources/xmlCatalog.js";
import { fetchKafkaUpdates } from "./mock-sources/kafkaTopic.js";
import {
  createPhpIDApiServer,
  fetchAllProductIDs,
} from "./mock-sources/phpIDApi.js";
import { reconcile } from "./merge/reconcile.js";
import { pushToAlgolia } from "./algolia/pushRecords.js";
import { logger } from "./merge/logger.js";
import { extractErrorMessage } from "./merge/extractErrorMessage.js";

async function main() {
  logger.log("INFO", "Starting ingestion pipeline...");

  const phpIDApiPort = 4500;
  const server = createPhpIDApiServer().listen(phpIDApiPort);
  await new Promise((resolve) =>
    server.once("listening", () => resolve())
  );
  logger.log("INFO", `Mock PHP ID API started on port ${phpIDApiPort}.`);

  logger.log("INFO", "Fetching XML catalog...");
  const catalog = fetchXmlCatalog();
  logger.log("INFO", `Catalog loaded: ${catalog.length} products.`);

  logger.log("INFO", "Fetching Kafka updates...");
  const kafkaUpdates = fetchKafkaUpdates();
  logger.log("INFO", `Kafka updates loaded: ${kafkaUpdates.length} messages.`);

  logger.log("INFO", "Fetching live product IDs from PHP ID API...");
  const liveIDs = await fetchAllProductIDs(`http://localhost:${phpIDApiPort}`);
  logger.log("INFO", `Live product IDs fetched: ${liveIDs.length}.`);

  server.close();

  const result = reconcile(catalog, kafkaUpdates, liveIDs);

  const pushResult = await pushToAlgolia(
    result.records,
    result.toRemoveFromIndex
  );

  logger.log(
    "INFO", `Pipeline complete. Dry run: ${pushResult.dryRun}. Saved: ${pushResult.saved}. Deleted: ${pushResult.deleted}.`
  );
}

main().catch((err) => {
  logger.error(`Pipeline failed: ${extractErrorMessage(err)}`);
  process.exit(1);
});

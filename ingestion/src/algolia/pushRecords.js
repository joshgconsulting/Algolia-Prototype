import { logger } from "../merge/logger.js";
import { extractErrorMessage } from "../merge/extractErrorMessage.js";
import { getAlgoliaIndex } from "./client.js";

const BATCH_SIZE = 1000;

export async function pushToAlgolia(records, toRemoveIds) {
  const index = getAlgoliaIndex();

  if (!index) {
    logger.log("INFO", "ALGOLIA_APP_ID / ALGOLIA_ADMIN_API_KEY not set - running in DRY RUN mode. No requests will be sent to Algolia.");
    logger.log("INFO", `[DRY RUN] Would save ${records.length} records and delete ${toRemoveIds.length} records.`);

    return { saved: 0, deleted: 0, dryRun: true };
  }

  try {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await index.saveObjects(batch);
      logger.log("INFO", `Saved batch of ${batch.length} records (${Math.min(i + BATCH_SIZE, records.length)}/${records.length}).`);
    }

    if (toRemoveIds.length > 0) {
      await index.deleteObjects(toRemoveIds);
      logger.log("INFO", `Deleted ${toRemoveIds.length} stale records from the index.`);
    }

    return { saved: records.length, deleted: toRemoveIds.length, dryRun: false };
  } catch (err) {
    logger.error(`Algolia push failed: ${extractErrorMessage(err)}`);
    throw err;
  }
}

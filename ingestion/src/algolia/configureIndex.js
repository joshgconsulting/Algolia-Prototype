import "dotenv/config";
import { getAlgoliaIndex } from "./client.js";
import { logger } from "../merge/logger.js";
import { extractErrorMessage } from "../merge/extractErrorMessage.js";

const settings = {
  // Product names are more precise than matches in descriptions.
  searchableAttributes: [
    "name",
    "brand,categories",
    "description,type",
  ],

  attributesForFaceting: [
    "searchable(brand)",
    "hierarchicalCategories.lvl0",
    "hierarchicalCategories.lvl1",
    "hierarchicalCategories.lvl2",
    "free_shipping",
    "rating",
  ],

  // Tie-breakers after Algolia's text relevance.
  customRanking: ["desc(popularity)", "desc(rating)"],

  attributesToSnippet: ["description:20"],
};

async function main() {
  const index = getAlgoliaIndex();

  if (!index) {
    logger.log(
      "INFO", "ALGOLIA_APP_ID / ALGOLIA_ADMIN_API_KEY not set - cannot configure a live index. Add real credentials to .env and re-run."
    );
    logger.log(
      "INFO", `[DRY RUN] Would apply settings:\n${JSON.stringify(settings, null, 2)}`
    );
    return;
  }

  try {
    await index.setSettings(settings);

    logger.log("INFO", "Index settings applied successfully.");
    logger.log(
      "INFO", "Verify in the Algolia dashboard under Search > Configuration for the index."
    );

  } catch (err) {
    logger.error(`Failed to apply index settings: ${extractErrorMessage(err)}`);
    throw err;
  }
}

main().catch(() => process.exit(1));

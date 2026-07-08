import { logger } from "./logger.js";

export function reconcile(catalog, kafkaUpdates, liveProductIDs) {
  const kafkaByID = new Map(kafkaUpdates.map((update) => [update.objectID, update]));
  const liveIDSet = new Set(liveProductIDs);
  const catalogIDSet = new Set(catalog.map((cat) => cat.objectID));

  const records = [];
  const incompleteAwaitingKafka = [];

  for (const entry of catalog) {
    // A product that is not live should only be removed, never saved.
    if (!liveIDSet.has(entry.objectID)) {
      continue;
    }

    const update = kafkaByID.get(entry.objectID);

    if (!update) {
      incompleteAwaitingKafka.push(entry.objectID);
      logger.log(
        "SYNC_GAP", `${entry.objectID} ("${entry.name}") is in the catalog but has no Kafka update - excluding from this run, awaiting enrichment.`
      );
      continue;
    }

    // Catalog price is the source of truth.
    if (update.price !== undefined && update.price !== entry.price) {
      logger.log(
        "SYNC_GAP", `${entry.objectID}: catalog price (${entry.price}) and Kafka price (${update.price}) disagree - using catalog value per source-of-truth rule.`
      );
    }

    const record = {
      objectID: entry.objectID,
      name: entry.name,
      description: entry.description,
      brand: entry.brand,
      categories: entry.categories,
      hierarchicalCategories: entry.hierarchicalCategories,
      price: entry.price,
      image: entry.image,
      type: update.type,
      price_range: update.price_range,
      url: update.url,
      free_shipping: update.free_shipping,
      popularity: update.popularity,
      rating: update.rating,
    };

    records.push(record);
  }

  // Live IDs without catalog rows are not indexable yet.
  const pendingCatalogSync = liveProductIDs.filter(
    (id) => !catalogIDSet.has(id)
  );

  for (const id of pendingCatalogSync) {
    logger.log(
      "PENDING_CATALOG_SYNC", `${id} exists on the live site but has not yet appeared in the catalog - will be picked up on a future ingestion run.`
    );
  }

  // Catalog rows missing from the live API should be removed from Algolia.
  const toRemoveFromIndex = catalog
    .map((cat) => cat.objectID)
    .filter((id) => !liveIDSet.has(id));

  for (const id of toRemoveFromIndex) {
    logger.log(
      "REMOVED_FROM_LIVE", `${id} is in the catalog but no longer exists on the live site - flagged for removal from the Algolia index.`
    );
  }

  // Protect against sending the same objectID in both save and delete lists.
  const recordIDs = new Set(records.map((record) => record.objectID));
  const overlap = toRemoveFromIndex.filter((id) => recordIDs.has(id));
  if (overlap.length > 0) {
    logger.error(
      `Invariant violated: ${overlap.length} objectIDs appear in both records-to-save and records-to-remove: ${overlap.join(", ")}. This would cause records to be saved then immediately deleted.`
    );
    throw new Error(
      "reconcile() produced overlapping save/delete sets - aborting to avoid silent data loss."
    );
  }

  logger.log(
    "INFO", `Reconciliation complete: ${records.length} records ready to index, ${incompleteAwaitingKafka.length} awaiting Kafka enrichment, ${pendingCatalogSync.length} pending catalog sync, ${toRemoveFromIndex.length} flagged for index removal.`
  );

  return {
    records,
    toRemoveFromIndex,
    incompleteAwaitingKafka,
    pendingCatalogSync,
  };
}

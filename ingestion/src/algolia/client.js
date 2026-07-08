import algoliasearch from "algoliasearch";

export function getAlgoliaIndex() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME || "products";

  if (!appId || !apiKey) {
    return null;
  }

  const client = algoliasearch(appId, apiKey);
  return client.initIndex(indexName);
}

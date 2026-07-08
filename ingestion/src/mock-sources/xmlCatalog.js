import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const dirName = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(dirName, "..", "..", "data", "catalog.xml");

const parser = new XMLParser({
  ignoreAttributes: true,
});

function normalizeCategories(raw) {
  // The XML parser returns a string when there is only one category.
  return Array.isArray(raw) ? raw : [raw];
}

function normalizeHierarchicalCategories(raw) {
  // lvl0 is required for Algolia's category hierarchy.
  if (!raw.lvl0) {
    throw new Error(
      "Catalog row is missing required hierarchicalCategories.lvl0"
    );
  }
  return { ...raw, lvl0: raw.lvl0 };
}

export function fetchXmlCatalog() {
  const xml = readFileSync(CATALOG_PATH, "utf-8");
  const parsed = parser.parse(xml);
  const rows = parsed.root.row;

  return rows.map(
    (row) => ({
      objectID: String(row.objectID),
      name: row.name,
      description: row.description,
      brand: row.brand,
      categories: normalizeCategories(row.categories),
      hierarchicalCategories: normalizeHierarchicalCategories(
        row.hierarchicalCategories
      ),
      price: row.price,
      image: row.image,
    })
  );
}

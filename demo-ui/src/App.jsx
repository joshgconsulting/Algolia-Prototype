import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  HierarchicalMenu,
  ToggleRefinement,
  Stats,
  Pagination,
  ClearRefinements,
  Configure,
  Highlight,
  Snippet,
} from "react-instantsearch";
import algoliasearch from "algoliasearch/lite";
import "./index.css";

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const searchApiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME || "products";

if (!appId || !searchApiKey) {
  throw new Error(
    "Missing VITE_ALGOLIA_APP_ID or VITE_ALGOLIA_SEARCH_API_KEY. " +
      "Copy .env.example to .env and add your search-only credentials."
  );
}

const searchClient = algoliasearch(appId, searchApiKey);

function ProductHit({ hit }) {
  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img
          src={hit.image}
          alt={hit.name}
          className="product-card__image"
          loading="lazy"
        />
        {hit.free_shipping && (
          <span className="product-card__badge">Free shipping</span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__category">
          {hit.hierarchicalCategories.lvl0}
        </p>
        <h3 className="product-card__name">
          <Highlight attribute="name" hit={hit} />
        </h3>
        <p className="product-card__brand">{hit.brand}</p>
        <p className="product-card__snippet">
          <Snippet attribute="description" hit={hit} />
        </p>
        <div className="product-card__meta">
          <span className="product-card__price">${hit.price.toFixed(2)}</span>
          <span className="product-card__rating">★ {hit.rating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <Configure hitsPerPage={12} />

      <header className="app-header">
        <span className="app-header__wordmark">Search Demo</span>
        <SearchBox
          placeholder="Search products…"
          classNames={{
            root: "search-box",
            form: "search-box__form",
            input: "search-box__input",
            submit: "search-box__submit",
            reset: "search-box__reset",
          }}
        />
      </header>

      <div className="app-layout">
        <aside className="facets">
          <div className="facets__header">
            <h2 className="facets__title">Filters</h2>
            <ClearRefinements
              classNames={{ button: "facets__clear" }}
              translations={{ resetButtonText: "Clear all" }}
            />
          </div>

          <section className="facet-group">
            <h3 className="facet-group__title">Category</h3>
            <HierarchicalMenu
              attributes={[
                "hierarchicalCategories.lvl0",
                "hierarchicalCategories.lvl1",
                "hierarchicalCategories.lvl2",
              ]}
              limit={8}
            />
          </section>

          <section className="facet-group">
            <h3 className="facet-group__title">Brand</h3>
            <RefinementList attribute="brand" searchable limit={8} showMore />
          </section>

          <section className="facet-group">
            <h3 className="facet-group__title">Rating</h3>
            <RefinementList
              attribute="rating"
              sortBy={["name:desc"]}
              transformItems={(items) =>
                items.map((item) => ({ ...item, label: `${item.label} ★` }))
              }
            />
          </section>

          <section className="facet-group">
            <ToggleRefinement
              attribute="free_shipping"
              label="Free shipping only"
            />
          </section>
        </aside>

        <main className="results">
          <Stats
            classNames={{ root: "results__stats" }}
            translations={{
              rootElementText({ nbHits }) {
                return `${nbHits.toLocaleString()} results`;
              },
            }}
          />
          <Hits hitComponent={ProductHit} classNames={{ list: "results__grid" }} />
          <Pagination classNames={{ root: "pagination" }} />
        </main>
      </div>
    </InstantSearch>
  );
}

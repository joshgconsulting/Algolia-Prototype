# Algolia Solutions Architect Assignment

A data integration pipeline that reconciles three disagreeing backend
systems into a single, accurate product catalog indexed in Algolia, plus a
React + InstantSearch demo UI showcasing the result.

---

## Running this project

### Prerequisites

- Node.js 18+
- An Algolia account
- Two Algolia API keys, from **Settings > API Keys** in your dashboard:
  - **Write API Key** - used by the ingestion pipeline only, never exposed client-side
  - **Search API Key** - used by the demo UI, safe to expose in browser code

### 1. Run the ingestion pipeline

```bash
cd ingestion
npm install
cp .env.example .env
```

Edit `.env` and add your **Write API Key**:

```
ALGOLIA_APP_ID=your_app_id
ALGOLIA_ADMIN_API_KEY=your_write_key
ALGOLIA_INDEX_NAME=products
```

Then run the pipeline:

```bash
npm start
```

This single command spins up the mock PHP ID API, fetches all three
sources, reconciles them, and pushes the result to your Algolia index. If
`.env` isn't configured, it automatically runs in **dry-run mode** -
completing the full pipeline and logging exactly what it would have sent,
without making any real API calls. This makes it always safe to run.

**Apply the index configuration** (searchable attributes, facets, custom ranking):

```bash
npm run configure
```

### 2. Run the demo UI

```bash
cd demo-ui
npm install
cp .env.example .env
```

Edit `.env` and add your **Search-Only API Key** (not the Write key):

```
VITE_ALGOLIA_APP_ID=your_app_id
VITE_ALGOLIA_SEARCH_API_KEY=your_search_key
VITE_ALGOLIA_INDEX_NAME=products
```

Then:

```bash
npm run dev
```

Open the local URL Vite prints. You should see live search against your
real Algolia index, with working brand/category/rating/free-shipping
facets.

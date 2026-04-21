# Deploying Reading Buddy to Azure App Service

This guide walks through exporting Reading Buddy from Replit, pushing it to
GitHub, and deploying it as a single **Azure App Service** (Linux + Node 20)
backed by **Azure Database for PostgreSQL — Flexible Server**.

The Express API and the React frontend are deployed together as one service.

---

## 1. Get the code into GitHub

You can do this two ways.

### Option A — Connect Replit to GitHub directly

1. In your Replit project, open the **Version control** pane (left sidebar).
2. Click **Create a Git repository** if it isn't already a repo.
3. Click **Connect to GitHub** and authorize Replit.
4. Choose the GitHub account/org and pick a name (e.g. `reading-buddy`).
5. Click **Create repository on GitHub** and **Push**.

### Option B — Download a zip and upload via GitHub Desktop

1. In the Replit file tree, click the three-dot menu → **Download as zip**.
2. On github.com, create a new empty repository called `reading-buddy`.
3. Open GitHub Desktop → **File → Clone repository** → pick the new repo.
4. Unzip the Replit download into the cloned folder (overwrite the empty
   repo's `.git`-less files).
5. In GitHub Desktop, commit "Initial import from Replit" and **Push origin**.

> Add a `.gitignore` if one doesn't exist. At minimum exclude `node_modules`,
> `dist`, `azure-dist`, and `.env`.

---

## 2. Provision the Azure resources

You need three things in Azure:

| Resource | Tier suggestion | Purpose |
|---|---|---|
| Resource Group | — | Container for the others |
| Azure Database for PostgreSQL — Flexible Server | Burstable B1ms (cheapest) | The database |
| App Service (Linux, Node 20 LTS) | F1 Free or B1 | Runs the Express server (and serves the React build) |

### 2a. Create the database

1. Azure Portal → **Create a resource** → **Azure Database for PostgreSQL** →
   **Flexible server**.
2. Server name: `reading-buddy-db` (must be globally unique).
3. PostgreSQL version: 16. Region: same one you'll use for App Service.
4. Authentication method: **PostgreSQL authentication only**. Set an admin
   user and password — save them.
5. Networking: **Public access**. Add your client IP, and check
   **Allow public access from any Azure service** (so App Service can connect).
6. Create the server. Once it's up, open the server → **Databases** → create a
   new database called `reading_buddy`.
7. Build your connection string:
   ```
   postgres://USER:PASSWORD@reading-buddy-db.postgres.database.azure.com:5432/reading_buddy?sslmode=require
   ```

### 2b. Create the App Service

1. Azure Portal → **Create a resource** → **Web App**.
2. Name: `reading-buddy` (becomes `reading-buddy.azurewebsites.net`).
3. Publish: **Code**. Runtime: **Node 20 LTS**. OS: **Linux**.
4. Region: same as the database.
5. Pricing: F1 (free) is fine to start; upgrade to B1 if you hit limits.
6. Create the Web App.

---

## 3. Wire the App Service to your GitHub repo

1. Open the App Service → **Deployment Center** (left menu).
2. Source: **GitHub**. Authorize and pick your repo + the `main` branch.
3. Build provider: **GitHub Actions** (default).
4. Azure generates a workflow file (`.github/workflows/main_reading-buddy.yml`)
   in your repo. Let it run once — it will likely fail the first build.
5. Replace the generated workflow's build step so it uses pnpm and our
   Azure build script. The "Build and deploy" job should look like this:

   ```yaml
   - uses: actions/checkout@v4
   - uses: actions/setup-node@v4
     with: { node-version: '20.x' }
   - uses: pnpm/action-setup@v4
     with: { version: 10 }
   - run: pnpm install --frozen-lockfile
   - run: pnpm run build:azure
   - uses: actions/upload-artifact@v4
     with:
       name: node-app
       path: azure-dist
   ```

   And the deploy job should download `node-app` and deploy that folder
   (instead of the repo root) to App Service.

6. Commit the edited workflow file. The next push triggers a deploy.

---

## 4. Configure App Service settings

In the App Service → **Settings → Environment variables**, add:

| Name | Value |
|---|---|
| `DATABASE_URL` | The Postgres connection string from step 2a |
| `STATIC_DIR` | `./public` |
| `NODE_ENV` | `production` |

> Don't set `PORT` — Azure provides it automatically.

In **Settings → Configuration → General settings**:

- **Startup Command**: `node --enable-source-maps index.mjs`

Click **Save** and let the app restart.

---

## 5. Initialize the database schema

The first time only, you need to push the Drizzle schema to Azure Postgres.
From your local machine (with Node 20 + pnpm installed and the repo cloned):

```bash
pnpm install
DATABASE_URL='postgres://...your azure connection string...' \
  pnpm --filter @workspace/db run db:push
```

This creates the `books` and `reading_sessions` tables on the Azure DB.

(Optional) Seed sample books:

```bash
DATABASE_URL='postgres://...' pnpm --filter @workspace/db run db:seed
```

---

## 6. Verify it's running

Visit `https://reading-buddy.azurewebsites.net`. You should see:

- The landing page at `/`
- The full app at `/app`
- API responses at `/api/books`, `/api/stats/summary`, etc.

If something's off, check **App Service → Log stream** for errors.

---

## What changed in the codebase to support this

- `artifacts/api-server/src/app.ts` now serves static files and falls back to
  `index.html` for non-API routes when the `STATIC_DIR` env var is set. In
  Replit dev this var is unset, so behavior there is unchanged.
- `scripts/build-azure.mjs` produces a self-contained `azure-dist/` folder
  containing the bundled API (`index.mjs`), the React build (`public/`), and
  a minimal `package.json` with a `start` script. This is what App Service
  deploys.
- `package.json` exposes `pnpm run build:azure` as the single command that
  produces the deployable.

You can build and test locally before deploying:

```bash
pnpm run build:azure
cd azure-dist
STATIC_DIR=./public PORT=3000 \
  DATABASE_URL='postgres://...' node index.mjs
# open http://localhost:3000
```

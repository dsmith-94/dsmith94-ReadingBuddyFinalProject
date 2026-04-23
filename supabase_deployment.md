Using a Supabase Database with Reading Buddy
Reading Buddy talks to Postgres through a single DATABASE_URL environment variable, so swapping in a Supabase database is just a matter of pointing that variable at Supabase. No code changes are needed.

1. Create the Supabase project
Go to supabase.com and sign in (free tier is fine).
Click New project.
Pick your organization, name the project (e.g. reading-buddy), and set a strong database password — write it down, you'll need it shortly.
Pick a region close to where the app will run (e.g. East US if you're deploying to Azure East US).
Click Create new project and wait ~2 minutes for it to provision.
2. Grab the connection string
In your Supabase project dashboard, click the Connect button at the top (or go to Project Settings → Database).
Find Connection string and choose the URI tab.
You'll see a few connection options:
Session pooler (port 5432) — use this for migrations and any long-lived server like an Azure App Service.
Transaction pooler (port 6543) — meant for serverless / very short-lived connections. We don't need this.
Copy the Session pooler URI. It looks like:
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

Replace [YOUR-PASSWORD] with the password you set in step 1.
Keep this string handy — it's your DATABASE_URL.

3. Push the schema to Supabase
From your local machine, with the project cloned and pnpm install already run:

DATABASE_URL='postgresql://postgres.xxx:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres' \
  pnpm --filter @workspace/db run db:push

This creates the books and reading_sessions tables in Supabase. You can confirm in Supabase → Table Editor.

(Optional) Seed sample books:

DATABASE_URL='postgresql://postgres.xxx:YOURPASSWORD@...:5432/postgres' \
  pnpm --filter @workspace/db run db:seed

4. (Optional) Use Supabase in Replit too
If you want your Replit dev environment to use Supabase as well (instead of Replit's built-in Postgres):

Open the Secrets pane in Replit (left sidebar, padlock icon).
Edit the existing DATABASE_URL secret and paste the Supabase connection string.
Restart the API Server workflow.
You can also skip this and keep Replit on its built-in Postgres for development — both are fine.

5. Tell Azure App Service to use Supabase
When configuring your App Service:

Open the App Service in the Azure Portal.
Go to Settings → Environment variables.
Set DATABASE_URL to the Supabase connection string (instead of an Azure Postgres one).
Save and let the app restart.
The App Service will now read and write to Supabase.

If you're following AZURE_DEPLOYMENT.md, this means you can skip section 2a ("Create the database") entirely. Use Supabase for steps 4 and 5 of that guide instead.

Notes on Supabase
SSL is required. Supabase enforces it. The connection URI works as-is; no extra flags are needed.
The free tier auto-pauses projects after about a week of inactivity. Just visit the dashboard to wake it up.
Don't enable Row Level Security (RLS) on the books and reading_sessions tables for this project. Reading Buddy connects with the database admin role and doesn't use Supabase Auth, so RLS would block your queries. (RLS becomes useful only if you later add per-user accounts through Supabase Auth.)
You won't use the Supabase JavaScript SDK. The app talks directly to Postgres through Drizzle, which keeps the code portable and means switching databases is just a matter of changing DATABASE_URL.
Troubleshooting
password authentication failed — the [YOUR-PASSWORD] placeholder in the connection string wasn't replaced, or the password is wrong. Reset it under Project Settings → Database → Reset database password.
could not translate host name — the connection string was copied incompletely. Re-copy the full URI from the Supabase Connect dialog.
relation "books" does not exist — you skipped step 3. Run pnpm --filter @workspace/db run db:push against your Supabase URL.
Queries hang or time out from Azure — make sure you used the Session pooler URI (port 5432), not the direct connection.

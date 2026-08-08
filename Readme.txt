ADD .env with following

# Server
PORT=3001
NODE_ENV=development

# PostgreSQL connection (either use DATABASE_URL or the individual fields below)
DATABASE_URL=postgresql://postgres:password@domain:port/pg_database

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=
PGDATABASE=

# Set to "true" if connecting to a provider that requires SSL (e.g. Heroku, RDS)
PGSSL=false

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ISSUER=
JWT_AUDIENCE=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

COOKIE_KEY=
FRONTEND_BASE_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_FROM=
SMTP_USER=
SMTP_PASS=
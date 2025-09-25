# Environment Configuration for Sagawa Group Project

This document explains how to set up and use the environment files for the Sagawa Group project.

## Backend (bun-api)

The backend environment files are located at:
- `/home/ilham/sagawagroup/bun-api/.env` (default/main configuration)
- `/home/ilham/sagawagroup/bun-api/.env.development` (development-specific variables)
- `/home/ilham/sagawagroup/bun-api/.env.production` (production-specific variables)

### Required Variables:
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Port number for the API server
- `BASE_URL` - Base URL of the application
- `ASTRA_DB_APPLICATION_TOKEN` - AstraDB application token
- `ASTRA_DB_API_ENDPOINT` - AstraDB API endpoint
- `GOOGLE_SHEETS_API_KEY` - Google Sheets API key
- `JWT_SECRET` - Secret key for JWT authentication
- `EMAIL_USER` - Email address for sending emails
- `EMAIL_PASS` - App password for email service
- Other configuration variables for file uploads, logging, rate limiting, etc.

## Frontend (vue-frontend)

The frontend environment files are located at:
- `/home/ilham/sagawagroup/vue-frontend/.env` (default/main configuration)
- `/home/ilham/sagawagroup/vue-frontend/.env.development` (development-specific variables)
- `/home/ilham/sagawagroup/vue-frontend/.env.production` (production-specific variables)

### Required Variables:
- `PUBLIC_API_URL` - URL of the backend API
- `PUBLIC_API_VERSION` - API version
- `PUBLIC_SITE_URL` - URL of the frontend site
- `PUBLIC_SITE_NAME` - Name of the site
- `INSTAGRAM_ACCESS_TOKEN` - Instagram access token
- `INSTAGRAM_USER_ID` - Instagram user ID
- `TWITTER_BEARER_TOKEN` - Twitter API Bearer token
- `TWITTER_USERNAME` - Twitter/X username
- `LINKEDIN_ACCESS_TOKEN` - LinkedIn API access token
- `LINKEDIN_COMPANY_ID` - LinkedIn company ID
- `YOUTUBE_API_KEY` - YouTube API key
- `YOUTUBE_CHANNEL_ID` - YouTube channel ID

## Setup Instructions

1. If you haven't already, run the setup commands:
   ```bash
   # For backend
   cd /home/ilham/sagawagroup/bun-api
   cp .env.example .env
   
   # For frontend
   cd /home/ilham/sagawagroup/vue-frontend
   cp .env.example .env
   ```

2. Edit the `.env` files in both directories and replace placeholder values with your actual configuration values.

3. For development, you can use the `.env.development` files to override specific values when NODE_ENV is set to 'development'.

4. For production, you can use the `.env.production` files to override specific values when NODE_ENV is set to 'production'.

5. Make sure to keep these files secure and do not commit them to version control.

## Database Connection Issue

If you encounter a database connection issue with AstraDB like:
```
DataAPIHttpError: HTTP error (503): {"message":"Resuming your database, please try again shortly."}
```

This typically means the AstraDB instance is resuming from hibernation or is temporarily unavailable. You can:

1. Wait a few minutes and try again
2. Ensure your AstraDB credentials are correct
3. Check the AstraDB dashboard to verify the database status
4. For local development, you can comment out the AstraDB configuration in the development environment file

## Notes
- The `.env` files are already included in `.gitignore`, so they won't be committed to the repository.
- The `PUBLIC_` prefixed variables in the frontend `.env` file are available in the client-side code.
- Non-prefixed variables are only available during build-time and server-side rendering.
- Environment files are loaded in this order: `.env`, `.env.development`/`.env.production` (based on NODE_ENV)
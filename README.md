# MemorabiliaDB

MemorabiliaDB is a full-stack inventory app for managing sports card and memorabilia collections. It tracks card details, estimated condition values, image uploads, grading recommendations, and listing status so a collector can decide what to grade, list, or keep.

## Features

- Browse a paginated card inventory
- Filter cards by manufacturer, player, year range, and status
- View collection value summaries
- Upload front and back card images through Cloudinary
- Track card status as new, listed, or graded
- Review grading and raw-sale recommendations
- Import card data from CSV

## Tech Stack

- React 19
- TypeScript
- Vite
- Node.js
- Express
- Prisma
- PostgreSQL
- Cloudinary

## Project Structure

```text
memorabiliaDB/
  memorabilia-api/
    server/              # Express API, Prisma schema, import scripts
  memorabilia-client/    # React/Vite client
```

## Getting Started

### API

```bash
cd memorabilia-api/server
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:5000`.

### Client

```bash
cd memorabilia-client
npm install
npm run dev
```

The client runs at `http://localhost:5173`.

## Environment Variables

The API expects these variables in `memorabilia-api/server/.env`:

```text
DATABASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Useful Commands

```bash
# API
cd memorabilia-api/server
npm run build
npm run import -- ./cards.csv

# Client
cd memorabilia-client
npm run lint
npm run build
```

## Roadmap

- Add API tests for core card workflows
- Centralize client API calls and error handling
- Improve recommendation and status workflows
- Add deployment documentation

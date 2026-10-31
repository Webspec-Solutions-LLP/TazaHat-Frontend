# TazaHat website (Next.js)

The customer website. It has no database of its own: every page reads from the TazaHat API. All API calls run on the Next.js
server (server components and server actions), so the browser never talks to the API directly and no CORS setup is needed.

## UI work without the backend code

The API is live at `https://api.taza.webspec.in`, with real data (cities, categories, products, pictures). You only need this repository.

```bash
git clone https://github.com/Webspec-Solutions-LLP/TazaHat-Frontend.git
cd TazaHat-Frontend
cp .env.example .env.local      # API_BASE_URL already points to the live API
npm ci
npm run dev                      # http://localhost:3000
```

- Product pictures (`/uploads/...`) are proxied to the API by `next.config.ts`; nothing to set up.
- The city picker uses Google Maps. Ask for a key of your own (or the shared development key) and put it in `.env.local`:
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (map in the browser) and `GOOGLE_MAPS_API_KEY` (address lookup on the server). The shared key is
  restricted to the live website and server, so on `localhost` the map or the address lookup can be refused; the city list below the
  map still works for choosing a city.
- The API is shared and live: only read from it while developing (browse, search, open products). Do not place real orders.

## Branches

`master` is deployed by Jenkins to https://taza.webspec.in (Docker image build, key and API address are passed as build arguments,
see `Jenkinsfile` and `Dockerfile`). Work on a branch and open a pull request; merging into `master` deploys.

## Useful commands

| | |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build and server |
| `npm run lint` | ESLint |

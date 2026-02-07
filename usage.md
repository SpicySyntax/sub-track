## Node Version

This project requires **Node.js 22 (LTS)** or higher (Vite 7 requires Node 20.19+ or 22.12+). We recommend using [nvm-windows](https://github.com/coreybutler/nvm-windows) or [nvm](https://github.com/nvm-sh/nvm).

To set the correct version in your terminal:

```bash
nvm install 22
nvm use 22
```

For convenience, you can create a `.nvmrc` file in the project's root directory:

```text
22
```

With this file in place, you can run `nvm use` to automatically switch to the correct version.

## Dependencies

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Notes about SQLite WASM

This project uses an in-browser SQLite engine (sql.js) which requires the `sql-wasm.wasm` file.
By default the app will look for `/sql-wasm.wasm` (place the file in the `public/` folder). If that file
is not present the app will fall back to the CDN hosted version at `https://sql.js.org/dist/sql-wasm.wasm`.

If you prefer to host the WASM file locally, download `sql-wasm.wasm` from the sql.js project and put it
into `public/sql-wasm.wasm` before running the app.

## Deployment / CI

This repository is configured to automatically build and deploy the site to GitHub Pages whenever commits are pushed to the `main` branch.

- The GitHub Actions workflow is at `.github/workflows/deploy-docs.yml`.
- It runs `npm ci` and `npm run build` (Vite) then publishes the `dist` output to GitHub Pages using the official Pages actions.

To use this, ensure GitHub Pages is enabled for the repository (the Pages deployment from the action will create the site artifact). If you want a custom domain, configure it in the repository settings after the first successful deployment.

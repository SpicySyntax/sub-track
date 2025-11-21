Sub-Track Usage GuideThis guide provides basic setup instructions for developers.Node.js VersionThis project is intended to run on a recent Long-Term Support (LTS) version of Node.js. We recommend using Node.js 20 (Iron).If you use nvm (Node Version Manager), you can set the correct version in your terminal by running:

## Node Version

```bash
nvm use 20
```

Or, to use the latest LTS version:

```bash
nvm use --lts
```

For convenience, you can create a `.nvmrc` file in the project's root directory with the following content:lts/iron
With this file in place, you can simply run nvm use in the project directory to automatically switch to the correct Node.js version.

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

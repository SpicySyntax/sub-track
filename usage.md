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

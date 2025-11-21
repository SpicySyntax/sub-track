# Sub-Track

Helps users track substance use over time, with the goal of harm reduction and mental benefits.
All data is stored in your browser and is never saved off anywhere else.

## TODO

- visualizations over time
- units for dosage

## Deployment / CI

This repository is configured to automatically build and deploy the site to GitHub Pages whenever commits are pushed to the `main` branch.

- The GitHub Actions workflow is at `.github/workflows/deploy-docs.yml`.
- It runs `npm ci` and `npm run build` (Vite) then publishes the `dist` output to GitHub Pages using the official Pages actions.

To use this, ensure GitHub Pages is enabled for the repository (the Pages deployment from the action will create the site artifact). If you want a custom domain, configure it in the repository settings after the first successful deployment.

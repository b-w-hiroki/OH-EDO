# GitHub Pages Recovery

The application build is healthy. Current failures happen only in the final `deploy-pages` job after:

- checkout
- npm ci
- npm run verify
- configure-pages
- upload-pages-artifact

all succeed.

## Repository settings to check

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Open **Settings → Environments → github-pages**
4. Confirm there is no unexpected required reviewer, wait timer, or custom deployment protection rule
5. For deployment branches, allow the default branch (`main`) or use no restriction
6. Save changes
7. Re-run the failed `deploy-pages` workflow

The workflow already provides:

- `pages: write`
- `id-token: write`
- `environment: github-pages`
- `needs: build`
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`

## Success check

After deploy succeeds:

- open the published URL
- reload directly on the published URL
- verify no asset 404s
- complete at least the opening flow
- confirm Local Decision fallback still works without Jev Proxy

Issue #62 remains the source of truth for the Pages blocker.

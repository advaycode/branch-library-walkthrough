#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages source).
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
bun run build
touch dist/.nojekyll
REMOTE="$(git remote get-url origin)"
SHA="$(git rev-parse --short HEAD)"
rm -rf dist/.git
git -C dist init -q -b gh-pages
git -C dist add -A
git -C dist -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" commit -q -m "Deploy $SHA"
git -C dist push -f "$REMOTE" gh-pages:gh-pages
rm -rf dist/.git
echo "Published: https://advaycode.github.io/branch-library-walkthrough/"

#!/bin/bash
# Push to GitHub - run AFTER creating repo at https://github.com/new?name=rinads-website
set -e
cd "$(dirname "$0")/.."
echo "Pushing to GitHub..."
git push -u origin main
echo "Done! Repo: https://github.com/$(git remote get-url origin | sed 's|.*github.com[:/]||' | sed 's|\.git$||')"

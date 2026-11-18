# Branch Library Walkthrough

Interactive floor-plan walkthrough of the Branch Public Library & Technology Center: the building, a cutaway of each floor, and every room.

**Live:** https://advaycode.github.io/branch-library-walkthrough/

Static React + Vite site. Deploy: `bash scripts/deploy.sh` builds `dist/` and force-pushes it to the `gh-pages` branch, which GitHub Pages serves.

```
bun install
bun run dev      # local
bun run build    # dist/
bash scripts/deploy.sh
```

Keys: **1 / 2** floors, **Left / Right** rooms, **Esc** back, **Home** building, **F** full screen.

# Vercel deploy budget (read before adding or committing any file)

Every push to `main` is a Vercel deployment that stores everything git tracks minus `.vercelignore`. The Hobby plan allows 10 GB of deployment storage in total. In Nov 2026, 68 deployments of about 223 MB each (mostly screenshots and renders the site never loads) used 15 GB, so treat these as hard rules:

- **Budget:** the deploy must stay under **60 MB**, and every deployed file under 8 MB. No file in git may exceed 10 MB. `node tools/deploy-budget.mjs` checks this. It runs automatically in three places: the pre-commit hook, GitHub Actions, and Vercel itself, which skips the build when the check fails. Never raise a budget, bypass a hook (`--no-verify`), or delete the check to get a commit through.
- **Only what the site loads gets deployed.** The site consists of `index.html`, `walkthrough.html`, `houseScene.js`, `lib/`, `assets/`, the `models/` the scene places, and `elevations/` viewer pages with their `assets/`. Anything else (screenshots, captures, renders, comparison images, PDFs, reference photos, scripts, unused models) is either kept out of git or listed in `.vercelignore`.
- **Keep heavy work output out of the repo:** Blender files, headless-Chrome profiles, capture runs and render batches. Use `archive/`, `Blender/` or `output/`, which are ignored or excluded from deploys.
- **Adding a 3D model or texture:** compress it first (Draco or meshopt geometry, JPG/WebP textures at 1K unless it is a hero asset). Only commit the files the scene actually references. Unplaced variants must not be committed.
- **Deploy only from `main`.** `vercel.json` has `git.deploymentEnabled` set to main only. Do not re-enable preview deploys for other branches.
- **After pushing**, if the user asks about Vercel usage, remember that the Usage page records each day's maximum. A deletion only shows up on the next day's point.

# Interiors: keep FULL and FULL 2 in sync

There are two full-house versions with interiors: **FULL** (`houseScene.js`, viewer default, `walkthrough.html`) and **FULL 2** (`houseScene2.js`, design key `full2`, `walkthrough.html?v=full2`). They share the same interiors but are separate files. Any interior change (rooms, furniture, finishes, lighting, fixtures, doors/windows seen from inside, `lib/interiorKit.js` callers) must be made in **both** files in the same change, unless the user says it is for one version only. Exterior changes stay per-version (FULL 2 keeps the V42 exterior).

- `houseScene.js` is CRLF and `houseScene2.js` is LF: normalise line endings before multi-line matching, and expect line numbers to differ.
- Bump the cache-busting `?v=` stamp for each file you touched (`index.html` loader and `walkthrough.html`).
- Verify in both: the viewer (`?v=full2` for FULL 2) and the walkthrough for each version.

# GitHub workflow

After verifying a requested repository change, commit only the files for that change and push to the current branch's configured GitHub upstream. If the branch has no upstream, set it to the same branch on `origin`. Follow any explicit instructions for that task about where or whether to push.

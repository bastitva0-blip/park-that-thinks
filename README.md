# A Park That Thinks

A first-person 3D walk through Devalok’s proposed AI park for Lucknow Development Authority. It has 87 stations in nine zones, a guided tour, fly mode, teleport, an illustrated site map and a Park Passport. It runs on PC and mobile.

## Run it locally

It is a static site with no build step. From this folder:

    python -m http.server 8000

Then open http://localhost:8000.

## Deploy

Cloudflare Pages deploys this repository on every push to `main`.

- Build command: none
- Build output directory: `/`

## Files

- `index.html`: page, HUD and overlays
- `data.js`: zones and the 87 stations (text from the proposal deck)
- `builders.js`, `art.js`, `art2.js`: 3D models for every station
- `live.js`: people, balls and running screens
- `audio.js`: procedural ambient sound
- `game.js`: engine, controls, map, tour and passport
- `lib/`: three.js r128 and its post-processing passes
- `img/`: station images

Made by Devalok Design and Strategy Studio, Lucknow.

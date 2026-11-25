# Our Slice — Bush Block Update 2

This is a **single-player, local-save** browser build of Our Slice, made for testing on a phone. It uses the Canvas API and does not require a build step or external libraries.

## Features
- Larger scrolling bush block with a creek, trails, granite and trees
- Silver-grey campervan with a darker lower section
- One-tap campervan pop-top/awning, swag or tent camping preset
- Collect materials and transfer them to campervan storage
- Six discovery landmarks
- Aggie follows the player and occasionally barks at a bird
- Browser-local progress saving (`localStorage`)

## Deploy
Replace the repository root `index.html` with the one in this package and commit. If GitHub Pages publishes from the `main` branch root, refresh the site after deployment. Do not upload the containing folder instead of its files.

## Limitations
This is a standalone gameplay iteration, not the final multiplayer architecture. Browser saves are **per device** and are not shared between players. The game remains accessible to anyone who knows its GitHub Pages URL. No real-world animal art assets or final character sprites are included yet.

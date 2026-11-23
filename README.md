# Bauble Atelier

Design your own 3D Christmas tree toy: pick a shape, material, colours, sprinkles, gold glitter and a hand-drawn message, then swing it on a snowy fir branch and save it as an image.

## What you can do

- **Shape**: 15 shapes, from a round bauble, heart, star and gingerbread man to a pine cone, reflector ball, icicle and hook stick.
- **Material**: shiny glass, clear glass, metal, wood, textile, ceramic or plastic.
- **Palette**: one colour for the toy and four for the sprinkles.
- **Sprinkles**: 10 simple sugar shapes, with a slider for how many.
- **Gold glitter**: flakes that catch the light as you move over the toy.
- **Message**: draw on the toy with a brush pad. The message fits itself to the front of the shape.
- **Surprise me**: builds a random toy.
- **Swing and zoom**: drag the toy and let go to swing it on its gold thread. Scroll or pinch to zoom.
- **Save image**: downloads the toy as a PNG.

## Run it

Open `index.html` through any static web server. It needs `branch.json` next to it, and the browser fetches that file, so opening the HTML straight from disk will not load the branch. For example:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

To publish with GitHub Pages, turn on Pages for the `main` branch in the repository settings.

## Project layout

- `index.html`: the complete page, ready for any static host.
- `bauble-atelier.html`: the same page without `<html>` and `<head>`, as published to claude.ai.
- `branch.json`: the fir branch 3D model (a binary glTF file stored as base64 inside JSON).
- `src/`: the source, split into parts. Run `./build.sh` after editing to rebuild both HTML files.

Built with [three.js](https://threejs.org) 0.147, loaded from jsDelivr. The controls follow the [Arc](https://uiarc.dev) components (dropdown menu, slider, colour picker, signature pad), rebuilt in plain JavaScript.

## Credits

- Fir branch: [Christmas Ornaments](https://sketchfab.com/3d-models/christmas-ornaments-4b0967d3828544eda4efdd39b13e65b6) by ed62, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The ornaments were removed, and only the branch is used.
- Glitter idea from [interactive-greeting-card](https://github.com/annnguyentt/interactive-greeting-card-skill) by annnguyentt.

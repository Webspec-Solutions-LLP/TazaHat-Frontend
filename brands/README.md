# Per-brand static files

`brands/<tenant>/public/` is copied over `public/` when the image is built for that tenant (docker build `--build-arg BRAND=<tenant>`),
so a brand can ship its own `images/logo.webp`, banners, `favicon.ico` ... with the same file names. Without a folder (or for TazaHat)
nothing is replaced. The shop's name, tagline, logo and colours themselves come from the CRM (Settings > General), not from here.

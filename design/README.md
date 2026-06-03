# Design & Assets

Drop the frontend design and any source assets here. Suggested layout:

```
design/
├── README.md            ← this file
├── mockups/             ← screenshots / exported Figma frames (PNG, JPG, PDF)
├── figma-link.md        ← paste the Figma share link + any notes here
└── brand/               ← logos, color palette, fonts, icons
```

Where things end up once the frontend is built:

| Kind of asset                          | Lives in                              |
|----------------------------------------|---------------------------------------|
| Design references (mockups, Figma)     | `design/` (this folder — not shipped) |
| Images/fonts used by the app at runtime| `apps/frontend/src/assets/`           |
| Static files served as-is (favicon…)   | `apps/frontend/public/`               |

> The React + Vite UI lives in `apps/frontend/` and uses assets copied from this folder.
> Service APIs: auth → 4001, extinguishers/inspections/maintenance → 4003, reports → 4005.

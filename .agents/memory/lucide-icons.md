---
name: lucide-react available icons (v0.545.0)
description: Known missing/available icons in the pinned lucide-react version used in this project.
---

Project uses lucide-react@0.545.0.

**Does NOT exist (causes compile error):**
- `Route` — use `MapPin` or `MapPinned` instead

**Confirmed available:**
- `GripVertical`, `GripHorizontal`, `Grip`
- `MapPin`, `MapPinned`, `MapPlus`
- `Printer`, `Trash2`, `ChevronLeft`, `ChevronRight`, `Plus`, `X`, `Clock`

**How to apply:** Before using any unfamiliar icon, check `.../lucide-react/dist/esm/icons/` for the kebab-case filename (e.g. `grip-vertical.js` → `GripVertical`).

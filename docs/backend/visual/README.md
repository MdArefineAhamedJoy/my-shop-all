# MyShop Visual Architecture Atlas

Open [index.html](index.html) in Chrome, Edge or another modern browser. The page works directly from disk, without a server, package installation or internet connection.

## What to explore

- **Database explorer** starts with the order domain for readability. Choose **Complete database** for all 64 tables and 97 proposed FK edges, or choose one of eight domains.
- Click a diagram table to inspect all its specified columns, PK/FK/unique keys, constraints, incoming/outgoing references and index candidates. **Focus connections** shows its immediate neighbors across domains.
- Drag the diagram to pan. Use the zoom buttons, mouse wheel, **Fit** and fullscreen. **All columns** expands the cards beyond their key fields.
- **Foreign keys** lists each referencing column, target key, cardinality, nullability and ON DELETE / ON UPDATE policy. Eight polymorphic/external logical references are explained separately.
- **Optimization** contains 20 workload/constraint index designs and 73 FK access-path candidates with SQL and reasons. They are a review catalog, not a directive to create all 93 indexes. Measure realistic query plans and write cost before selecting indexes.
- **Architecture diagrams** displays the ten existing system diagrams as zoomable SVGs.
- **API contracts** searches 128 endpoint entries. **Full documentation** renders all six original backend documents inside the page.
- Use **Export SVG**, **Schema JSON**, SQL download or **Print / PDF** to save the current view or source metadata.

The complete editable ER source is [complete-schema.mmd](complete-schema.mmd). The complete key-level overview is [complete-schema.svg](complete-schema.svg); all 483 explicitly specified dictionary columns remain available in the explorer and Mermaid source.

## Source and design status

The atlas expands [DATABASE-DESIGN.md](../DATABASE-DESIGN.md). Column types, FK targets and delete policies are proposed physical design metadata in `build.mjs`; they are not introspected from a live database. The 483 columns are those explicitly listed in the logical dictionary; common timestamp conventions still apply where the dictionary specifies them. Snapshot fields and external/polymorphic identities are not given invented foreign keys.

Index examples draw on the linked official PostgreSQL constraints, multicolumn index, partial index and EXPLAIN documentation. No database benchmark or production migration has run.

## Rebuild after changing the design

From the repository root:

```powershell
node docs/backend/visual/build.mjs
```

The builder validates FK targets/types and regenerates `data.js`, `schema.json`, `index-candidates.sql` and `complete-schema.mmd`. `index.html`, `styles.css` and `app.js` are the dependency-free viewer. Re-export the complete SVG from **Complete database → Export SVG** after a schema change.

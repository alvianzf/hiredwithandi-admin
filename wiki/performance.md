# ⚡ Performance

This page documents the performance work done as part of the Phase 3 audit fixes for `job-admin`, and the conventions to follow for new code.

---

## 1. Vendor chunk splitting (`vite.config.js`)

`build.rollupOptions.output.manualChunks` splits `node_modules` dependencies into named chunks, so that updating one library doesn't invalidate the browser cache for unrelated ones, and large/rarely-changing vendor code is cached independently of app code.

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (!id.includes("node_modules")) return;

        if (
          id.includes("/react/") ||
          id.includes("/react-dom/") ||
          id.includes("/react-router-dom/") ||
          id.includes("/react-router/") ||
          id.includes("/scheduler/")
        ) {
          return "vendor-react";
        }
        if (id.includes("/papaparse/")) return "vendor-papaparse";
        if (id.includes("/react-icons/")) return "vendor-icons";

        return "vendor";
      },
    },
  },
},
```

| Chunk | Contents |
| :--- | :--- |
| `vendor-react` | `react`, `react-dom`, `react-router-dom`, `react-router`, `scheduler` |
| `vendor-papaparse` | `papaparse` (only used in `MembersMgmt.jsx`'s CSV import) |
| `vendor-icons` | `react-icons` |
| `vendor` | Catch-all for everything else in `node_modules` (currently `axios`, `sonner`, `sweetalert2`, `@tailwindcss/vite` runtime helpers if any) |

Route-level code splitting via `React.lazy` (in `App.jsx`) is unaffected and continues to produce per-page chunks (`Dashboard-*.js`, `MembersMgmt-*.js`, etc.) on top of this vendor split.

**When adding a new dependency**: if it's large (>20KB) and only used on one page, prefer keeping it in the catch-all `vendor` chunk (default) unless it's frequently updated independently — in which case add a new branch to `manualChunks`. If it's only used inside an event handler (e.g. a confirmation dialog), consider a dynamic `import()` at the point of use instead of a top-level import (see `sweetalert2` usage in `MembersMgmt.jsx`/`OrganizationsMgmt.jsx` as a candidate for this pattern in future work — not yet converted).

---

## 2. Row memoization pattern (`MemberRow`)

**Problem**: `MembersMgmt.jsx`'s member table previously rendered `<tr>` rows inline inside `members.map(...)`. Any state change in the parent (typing in the search box, opening/closing a modal, changing `limit`, etc.) caused **every row** to re-render, even though the row's own data hadn't changed.

**Fix**: the row was extracted to `src/components/MemberRow.jsx` and wrapped in `React.memo`. See [component_reference.md](component_reference.md#memberrow) for its full prop contract.

```jsx
export default memo(MemberRow);
```

For `React.memo` to actually skip re-renders, **every prop passed to the memoized component must be referentially stable across renders unless its value truly changed**:

- `member` — already stable per-item (comes from the `members` array returned by the API; only changes when `loadMembers()` re-fetches).
- `onEdit`, `onResetPassword`, `onToggleStatus` — wrapped in `useCallback` in `MembersMgmt.jsx`. Without this, `members.map(member => <MemberRow onEdit={() => openEditModal(member)} ... />)` would create a brand-new arrow function per row on every render of `MembersMgmt`, which would make `React.memo` a no-op.

### When to apply this pattern elsewhere

Extract-and-memo a list row/item component when:

- The list can realistically grow beyond ~20-30 items (tables, kanban cards, etc.), **and**
- The parent component has frequently-changing state that doesn't affect the row's own data (search inputs, modal visibility, unrelated filters).

Don't bother for small, rarely-changing lists (e.g. the batch list in the "Manage Batches" modal, navigation links) — the memoization overhead isn't worth it there.

---

## 3. PDF export removal (`MemberView.jsx`)

**Decision**: the "Download PDF Report" feature on the Member Profile page (`src/pages/MemberView.jsx`) has been **removed entirely**. It was already disabled (the button was commented out) but still shipped:

- `jspdf` (~150KB)
- `dom-to-image-more` (~?, used instead of `html2canvas` to avoid `oklch()` color-parsing issues)
- `html2canvas` (listed as a dependency but not actually imported by the dead code — confirmed via repo-wide grep before removal)

Combined, this was an estimated 250-350KB of dead code shipped in the `MemberView` chunk for a feature no admin could trigger.

### What was removed

- Imports: `jsPDF` from `jspdf`, `domtoimage` from `dom-to-image-more`, `FiDownload` icon, `toast` from `sonner` (only used by the PDF flow)
- The `generatePDF` async function
- `reportRef` (`useRef`) and `isGenerating` state
- The commented-out "Download PDF Report" `<button>` JSX block
- The `data-report-canvas` wrapper `<div>` (the ref target) — its children are now rendered directly
- `jspdf`, `dom-to-image-more`, and `html2canvas` removed from `package.json` `dependencies` (confirmed unused anywhere else in `src/` before removal) and `package-lock.json` regenerated via `npm install`

### Re-adding PDF export in the future

If this feature is revived, **do not** restore it as a top-level import. Instead:

1. Re-add `jspdf` and `dom-to-image-more` (or an alternative) as dependencies.
2. Use a dynamic `import()` inside the click handler (event-driven library — see the chunk-splitting note above), so the libraries only load when an admin actually clicks "Download PDF Report":

```javascript
const handleDownloadPdf = async () => {
  const [{ jsPDF }, { default: domtoimage }] = await Promise.all([
    import("jspdf"),
    import("dom-to-image-more"),
  ]);
  // ...generatePDF logic
};
```

This keeps the cost out of the main `MemberView` chunk entirely and only pays it when the feature is used.

---

## 4. Deferred items (out of scope for Phase 3)

- **Shared cross-page data cache**: `MembersMgmt`, `PlatformUsers`, and `OrganizationsMgmt` each independently fetch members/batches/organizations. A shared cache (e.g. via React Query or a context-level store) would reduce redundant network calls when navigating between these pages. Deferred — high effort, not addressed in this pass.
- **CSV import 2-second delay**: `MembersMgmt.jsx`'s `handleCsvSubmit` has a `setTimeout(..., 2000)` before closing the modal after a successful import. This is an intentional UX delay (lets the success message be read), not a performance bug — left as-is.

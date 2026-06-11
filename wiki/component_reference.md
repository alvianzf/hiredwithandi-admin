# 🧩 Component Reference

Shared UI components live in `src/components/`. This page documents their props and usage.

---

## `CustomSelect`

**File**: `src/components/CustomSelect.jsx`

A fully-styled, theme-aware dropdown that replaces the native `<select>` element. Renders a button trigger + an absolutely-positioned `<ul role="listbox">` panel. Closes on outside click and on `Escape`.

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number` | — | Currently selected value (compared via `String(value)`) |
| `onChange` | `(value: string) => void` | — | Called with the new value (not an event) |
| `options` | `{ value: string, label: string }[]` | `[]` | Dropdown options |
| `placeholder` | `string` | `"Select…"` | Shown when nothing matches `value` |
| `disabled` | `boolean` | `false` | Disables the trigger |
| `className` | `string` | `""` | Extra classes on the outer container |
| `id` | `string` | — | Forwarded to the trigger button for label association |

### Usage

```jsx
<CustomSelect
  value={statusFilter}
  onChange={setStatusFilter}
  className="flex-1"
  options={[
    { value: "All", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "Disabled", label: "Disabled" },
  ]}
/>
```

Used throughout `MembersMgmt.jsx`, `PlatformUsers.jsx`, and pagination controls (page-size selector).

---

## `Tooltip`

**File**: `src/components/Tooltip.jsx`

A portal-based hover tooltip that renders into `document.body`, so it escapes `overflow:hidden` ancestors (e.g. rounded modal containers).

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text` | `string` | — | Tooltip content |
| `children` | `ReactNode` | — | The trigger element |
| `position` | `"top" \| "bottom"` | `"top"` | Tooltip placement relative to trigger |
| `className` | `string` | `""` | Extra classes on the wrapping `<span>` |

### Usage

```jsx
<Tooltip text="Rename batch" position="bottom">
  <button onClick={() => handleEditBatchName(batch)} className="...">
    <FiEdit size={16} />
  </button>
</Tooltip>
```

Used in `MembersMgmt.jsx`'s "Manage Batches" modal for icon-only action buttons.

---

## `AdminLayout`

**File**: `src/components/AdminLayout.jsx`

The authenticated app shell — sidebar, header, and the personal profile/password modal. Rendered by `App.jsx` for all protected routes via `<Outlet />`.

### Props

None — `AdminLayout` reads everything it needs from `useAuth()` (`admin`, `logout`, `updateProfile`) and `useLocation()`.

### Behavior

- Renders role-conditional sidebar nav links (see [architecture.md](architecture.md#routing-appjsx)).
- Persists dark/light mode by toggling the `dark` class on `document.documentElement`.
- Shows a red "Account Disabled (Read-Only)" banner above `<Outlet />` when `admin.isDisabled` is true.
- Profile modal: avatar upload (`FormData` via `updateProfile`), and an inline change-password form posting to `/auth/change-password`.

### Usage

Mounted once via routing — not used directly by pages:

```jsx
<Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<DashboardRouter />} />
  {/* ...other nested routes rendered into <Outlet /> */}
</Route>
```

---

## `MemberRow`

**File**: `src/components/MemberRow.jsx`

A single `<tr>` for the Members & Batches table in `MembersMgmt.jsx`, wrapped in `React.memo`. Extracted from an inline `.map()` to avoid re-rendering every row when unrelated parent state changes (search input, modal open/close, pagination of other state, etc.).

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `member` | `object` | Member record: `{ id, name, email, batch?: { name }, status, isChecklistComplete, lastLogin }` |
| `isAdminDisabled` | `boolean` | When true, hides the Edit/Reset/Toggle action buttons (read-only org) |
| `onEdit` | `(member) => void` | Opens the edit modal for this member |
| `onResetPassword` | `(member) => void` | Triggers the reset-password confirmation flow |
| `onToggleStatus` | `(member) => void` | Toggles the member between `ACTIVE`/`DISABLED` |

### Usage

```jsx
{members.map(member => (
  <MemberRow
    key={member.id}
    member={member}
    isAdminDisabled={admin?.isDisabled}
    onEdit={openEditModal}
    onResetPassword={handleResetPassword}
    onToggleStatus={toggleMemberStatus}
  />
))}
```

### ⚠️ Important: keep callbacks stable

`React.memo` only prevents re-renders if **all** props are referentially equal to the previous render. `onEdit`, `onResetPassword`, and `onToggleStatus` **must** be wrapped in `useCallback` in `MembersMgmt.jsx` (they already are). If you add a new callback prop to `MemberRow`, wrap it in `useCallback` with a correct dependency array — otherwise every parent re-render will produce a new function reference and defeat the memoization for every row.

See [performance.md](performance.md) for the full rationale and when to apply this pattern elsewhere.

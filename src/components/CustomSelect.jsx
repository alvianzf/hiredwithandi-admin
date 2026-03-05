import { useState, useEffect, useRef } from "react";

/**
 * CustomSelect — fully styled, theme-aware dropdown replacement for <select>.
 *
 * Props:
 *   value        — currently selected value
 *   onChange     — called with the new value string (not an event)
 *   options      — [{ value: string, label: string }]
 *   placeholder  — text shown when nothing is selected (optional)
 *   disabled     — disables the control
 *   className    — extra classes on the trigger button
 *   id           — forwarded to the trigger for label association
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
    >
      {/* Trigger */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent outline-none transition-all cursor-pointer appearance-none text-sm font-medium select-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${!selected ? "text-[var(--text-secondary)]" : ""}`}>
          {displayLabel}
        </span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 shrink-0 text-[var(--color-primary-yellow)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ minWidth: "100%" }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                  ${isSelected
                    ? "bg-[var(--color-primary-yellow)] text-black font-semibold"
                    : "text-[var(--text-primary)] hover:bg-[var(--color-primary-yellow)]/15 hover:text-[var(--text-primary)]"
                  }`}
              >
                {opt.label}
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
          {options.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--text-secondary)] italic">No options</li>
          )}
        </ul>
      )}
    </div>
  );
}

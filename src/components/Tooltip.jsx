import { useState, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Portal-based Tooltip — renders into document.body so it escapes
 * any overflow:hidden ancestor (e.g. modals with rounded corners).
 *
 * Props:
 *   text      — tooltip string
 *   position  — 'top' (default) | 'bottom'
 *   children  — the trigger element
 */
export default function Tooltip({ text, children, position = "top", className = "" }) {
  const [rect, setRect] = useState(null);
  const ref = useRef(null);

  const show = () => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  };
  const hide = () => setRect(null);

  const tooltipStyle = rect
    ? {
        position: "fixed",
        zIndex: 99999,
        left: rect.left + rect.width / 2,
        pointerEvents: "none",
        background: "rgba(15,15,15,0.95)",
        color: "#f9fafb",
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
        ...(position === "bottom"
          ? { top: rect.bottom + 8, transform: "translateX(-50%)" }
          : { top: rect.top - 8, transform: "translateX(-50%) translateY(-100%)" }),
      }
    : {};

  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={hide} className={`inline-flex ${className}`}>
      {children}
      {rect && createPortal(
        <div style={tooltipStyle}>{text}</div>,
        document.body
      )}
    </span>
  );
}

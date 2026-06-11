import { memo } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiExternalLink, FiKey } from "react-icons/fi";

/* eslint-disable react/prop-types */

/**
 * MemberRow — single row of the Members & Batches table.
 *
 * Wrapped in React.memo so that re-renders triggered by unrelated parent
 * state changes (search input, modals, pagination of *other* pages, etc.)
 * don't cascade into re-rendering every row in the table.
 *
 * For memoization to be effective, `onEdit`, `onResetPassword`, and
 * `onToggleStatus` must be stable references (wrap them in useCallback
 * in the parent).
 *
 * Props:
 *   member          — member record (id, name, email, batch, status, isChecklistComplete, lastLogin)
 *   isAdminDisabled — when true, hides Edit/Reset/Toggle actions (read-only org)
 *   onEdit          — (member) => void
 *   onResetPassword — (member) => void
 *   onToggleStatus  — (member) => void
 */
function MemberRow({ member, isAdminDisabled, onEdit, onResetPassword, onToggleStatus }) {
  return (
    <tr className={`border-b border-[var(--border-color)] ${member.status === 'DISABLED' ? 'opacity-50' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
      <td className="p-4 font-medium">{member.name}</td>
      <td className="p-4 text-[var(--text-secondary)]">{member.email}</td>
      <td className="p-4 text-[var(--text-secondary)]">{member.batch?.name || "-"}</td>
      <td className="p-4 text-center">
        {member.isChecklistComplete ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
            <FiCheck size={12} /> Done
          </span>
        ) : (
          <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md">
            Pending
          </span>
        )}
      </td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          member.status === 'ACTIVE'
            ? 'bg-green-500/20 text-green-500'
            : 'bg-orange-500/20 text-orange-400'
        }`}>
          {member.status}
        </span>
      </td>
      <td className="p-4 text-sm text-[var(--text-secondary)]">
        {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : 'Never'}
      </td>
      <td className="p-4 flex justify-center space-x-4 items-center">
        <Link
          to={`/members/${member.id}`}
          className="text-[var(--color-primary-yellow)] hover:underline font-medium flex items-center gap-1 transition-colors"
          data-tooltip="View member details"
        >
          <FiExternalLink size={14} /> View
        </Link>
        {!isAdminDisabled && (
          <>
            <button
              onClick={() => onEdit(member)}
              className="text-neutral-400 hover:text-white font-medium transition-colors"
              data-tooltip="Edit member"
            >
              Edit
            </button>
            <button
              onClick={() => onResetPassword(member)}
              className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              data-tooltip="Reset password"
            >
              <FiKey size={14} /> Reset
            </button>
            <button
              onClick={() => onToggleStatus(member)}
              className={`${member.status === 'ACTIVE' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'} font-medium transition-colors`}
              data-tooltip={member.status === 'ACTIVE' ? 'Disable member' : 'Enable member'}
            >
              {member.status === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

export default memo(MemberRow);

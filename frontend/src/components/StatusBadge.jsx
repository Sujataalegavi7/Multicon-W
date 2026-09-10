const StatusBadge = ({ status }) => {
  const map = {
    approved: { label: 'Approved', cls: 'badge-approved' },
    pending: { label: 'Pending', cls: 'badge-pending' },
    rejected: { label: 'Rejected', cls: 'badge-rejected' },
    changes_requested: { label: 'Changes Requested', cls: 'badge-changes' },
  };

  const entry = map[status] || { label: status, cls: '' };

  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
};

export default StatusBadge;

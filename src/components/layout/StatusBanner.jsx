export function StatusBanner({ statusType, statusMessage }) {
  if (statusType === 'idle' || !statusMessage) {
    return null;
  }

  return (
    <div
      className={`mb-6 p-4 rounded-xl text-sm font-medium ${
        statusType === 'success'
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'bg-rose-50 text-rose-800 border border-rose-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{statusType === 'success' ? '✓' : '⚠'}</span>
        <span>{statusMessage}</span>
      </div>
    </div>
  );
}


// Status Banner — matches original status-banner element from HTML/script.js

function getIcon(kind) {
  if (kind === 'error') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    );
  }
  if (kind === 'warn') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    );
  }
  // Default / loading
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  );
}

export default function StatusBanner({ kind, children }) {
  return (
    <div id="status" className={`status-banner mb-6 p-4 rounded-xl border border-[#2b2b2b] bg-[#181818] shadow-md flex items-center gap-3${kind ? ' ' + kind : ''}`}>
      <div className="status-icon shrink-0 w-8 h-8 rounded-lg bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
        {getIcon(kind)}
      </div>
      <div className="status-content text-sm text-[#CCCCCC]">
        {children}
      </div>
    </div>
  );
}

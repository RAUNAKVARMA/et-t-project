'use client';

import React from 'react';

interface FileTypeIconProps {
  type: string;
  className?: string;
}

/** Small inline icon by document type (cosmic palette). */
const FileTypeIcon: React.FC<FileTypeIconProps> = ({ type, className }) => {
  const t = type.toLowerCase();

  if (t === 'csv') {
    return (
      <svg
        className={className}
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#69f0ae" strokeWidth="1.5" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="#00e5ff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (t === 'pdf') {
    return (
      <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden>
        <rect x="4" y="2" width="14" height="20" rx="1" fill="#ff5252" opacity={0.85} />
        <text x="7" y="15" fill="#fff" fontSize="8" fontFamily="sans-serif">
          PDF
        </text>
      </svg>
    );
  }

  if (t === 'docx') {
    return (
      <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden>
        <rect x="4" y="2" width="14" height="20" rx="1" fill="#2196f3" opacity={0.9} />
        <text x="6" y="15" fill="#fff" fontSize="7" fontFamily="sans-serif">
          DOC
        </text>
      </svg>
    );
  }

  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="#e040fb" strokeWidth="1.2" fill="none" />
      <path d="M8 9h8M8 13h5" stroke="#00e5ff" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

export default FileTypeIcon;

'use client';

import React, { useState, useRef } from 'react';

interface DocumentUploadProps {
  onFileUpload: (files: FileList) => void;
}

export default function DocumentUpload({ onFileUpload }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{ border: dragActive ? '2px solid #1a237e' : '2px dashed #aaa', padding: 24, borderRadius: 8, background: '#222', color: '#fff', margin: '2rem auto', maxWidth: 600 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Choose documents to upload"
      />
      <div style={{ textAlign: 'center' }}>
        <p>
          Drag and drop PDF, DOCX, TXT, MD, or CSV here, or{' '}
          <span
            style={{ color: '#00e5ff', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            browse
          </span>{' '}
          to upload.
        </p>
      </div>
    </div>
  );
}

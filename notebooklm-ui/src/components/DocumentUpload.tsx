'use client';

import React, { useState, useRef } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  uploaded_at: string;
}

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
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ textAlign: 'center' }}>
        <p>Drag and drop documents here, or <span style={{ color: '#1a237e', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>browse</span> to upload.</p>
      </div>
    </div>
  );
}

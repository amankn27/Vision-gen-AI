import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validateImageFile } from '../../utils/rules';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  className = '',
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file format or size.');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Upload an image file for analysis"
        className={`w-full relative flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--vg-accent-primary)] ${
          isDragOver
            ? 'border-[var(--vg-accent-primary)] bg-[var(--vg-accent-primary)]/10 scale-[0.99]'
            : 'border-[var(--vg-border)] bg-[var(--vg-surface-main)] hover:border-[var(--vg-accent-primary)]/60 hover:bg-[var(--vg-surface-hover)]'
        } ${compact ? 'p-6' : 'p-10'} ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-3 select-none">
          <div
            className={`rounded-2xl flex items-center justify-center transition-colors ${
              compact ? 'w-10 h-10' : 'w-14 h-14'
            } ${
              isDragOver
                ? 'bg-[var(--vg-accent-primary)] text-white'
                : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-accent-primary)] border border-[var(--vg-border)]'
            }`}
          >
            {compact ? (
              <UploadCloud className="w-5 h-5" />
            ) : (
              <ImageIcon className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--vg-text-primary)]">
              {isDragOver ? 'Release to upload image' : 'Drop an image here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-[var(--vg-text-secondary)]">
              Supports JPEG, PNG, WEBP up to 20 MB
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-muted)]">
              JPG
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-muted)]">
              PNG
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-muted)]">
              WEBP
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--vg-status-error)] p-3 rounded-lg bg-[var(--vg-status-error)]/10 border border-[var(--vg-status-error)]/25"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

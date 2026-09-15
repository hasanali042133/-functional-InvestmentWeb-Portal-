import { useEffect, useRef, useState } from 'react';
import * as accountApi from '@/api/account.api.js';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { CropDialog } from './CropDialog.jsx';
import { validateFile, formatFileSize } from '@/lib/cropImage.js';
import { cn } from '@/lib/cn.js';

/**
 * One document slot.
 *
 * Choosing a file uploads it. An identity card goes through the crop dialog
 * first, because a photographed card almost always has the desk in frame, but
 * the upload still happens without a second button press — a file sitting in
 * the slot looking uploaded while the counter says otherwise is worse than no
 * preview step at all.
 */
export function DocumentUploader({ definition, document, onUploaded, onRemoved }) {
  const inputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const reset = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setCropOpen(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const upload = async (file, isCropped) => {
    setIsUploading(true);
    setCropOpen(false);
    setError(null);
    setProgress(0);

    try {
      const data = await accountApi.uploadDocument({
        type: definition.type,
        file,
        isCropped,
        onProgress: setProgress,
      });
      reset();
      onUploaded(data.document);
    } catch (caught) {
      setError(caught.message);
      reset();
    } finally {
      setIsUploading(false);
    }
  };

  const acceptFile = (file) => {
    if (!file) return;

    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);

    // A PDF cannot be cropped, and neither can a proof of address.
    if (!definition.croppable || file.type === 'application/pdf') {
      upload(file, false);
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCropOpen(true);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      await accountApi.deleteDocument(document.id);
      onRemoved(definition.type);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,application/pdf"
      className="sr-only"
      onChange={(event) => acceptFile(event.target.files?.[0])}
    />
  );

  const cropDialog = (
    <CropDialog
      open={cropOpen}
      imageSrc={previewUrl}
      fileName={pendingFile?.name}
      onCancel={reset}
      onSkip={() => upload(pendingFile, false)}
      onCropped={(croppedFile) => upload(croppedFile, true)}
    />
  );

  if (isUploading) {
    return (
      <div className="rounded-xl border border-slate-300 bg-white p-4">
        <div className="flex items-center gap-3">
          <Spinner size="sm" className="text-brand-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Uploading {definition.label.toLowerCase()}…
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-brand-600 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="tabular text-xs text-slate-500">{progress}%</span>
        </div>
      </div>
    );
  }

  if (document) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-emerald-200">
            {document.mimeType === 'application/pdf' ? (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
                PDF
              </div>
            ) : (
              <img
                src={document.url}
                alt={`${definition.label} preview`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{definition.label}</p>
              <Badge tone="success">Uploaded</Badge>
              {document.isCropped && <Badge tone="neutral">Cropped</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatFileSize(document.sizeBytes ?? 0)}
            </p>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRemove} loading={isRemoving}>
                Remove
              </Button>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {fileInput}
        {cropDialog}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors',
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
        )}
      >
        <svg
          className="h-8 w-8 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V4m0 0L8 8m4-4 4 4" />
          <path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5" />
        </svg>

        <p className="mt-3 text-sm font-semibold text-slate-900">{definition.label}</p>
        <p className="mt-1 text-sm text-slate-500">{definition.description}</p>
        <p className="mt-3 text-xs text-slate-400">
          Drop a file here or click to browse · JPG, PNG, WebP or PDF · up to 5 MB
        </p>
      </button>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {fileInput}
      {cropDialog}
    </div>
  );
}

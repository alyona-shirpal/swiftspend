import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useDocumentProcessing } from '../../hooks/useDocumentProcessing';
import { useDeviceCamera } from '../../hooks/useDeviceCamera';
import {
  getDocumentProcessingErrorMessage,
  ParsedDocumentExpense,
  processExpenseDocument,
} from '../../services/expenses';

interface Props {
  autoCreate?: boolean;
  disabled?: boolean;
  onExpenseCreated?: () => void | Promise<void>;
  onParsed?: (expense: ParsedDocumentExpense) => void;
}

const iconButtonClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50';

export const ExpenseDocumentUpload: React.FC<Props> = ({
  autoCreate = false,
  disabled,
  onExpenseCreated,
  onParsed,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [processingSource, setProcessingSource] = useState<'file' | 'camera' | null>(null);
  const { data: capability } = useDocumentProcessing();
  const hasCamera = useDeviceCamera();

  if (!capability?.enabled) return null;

  const isProcessing = processingSource !== null;

  const refreshAutoCreatedExpense = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] }),
    ]);
    await onExpenseCreated?.();
  };

  const handleFile = (source: 'file' | 'camera') =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      setProcessingSource(source);
      try {
        const result = await processExpenseDocument(file, autoCreate);
        if (result.status === 'created') {
          await refreshAutoCreatedExpense();
          toast.success(`Expense created with ${result.provider}`);
        } else {
          onParsed?.(result.expense);
          toast.success('Document parsed. Review the expense before saving.');
        }
      } catch (error) {
        toast.error(getDocumentProcessingErrorMessage(error));
      } finally {
        setProcessingSource(null);
      }
    };

  const spinner = (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/25 border-t-secondary" />
  );

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile('file')} />
      {hasCamera && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile('camera')}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled || isProcessing}
            aria-label={
              processingSource === 'camera' ? 'Processing photo' : 'Snap a receipt photo'
            }
            title={processingSource === 'camera' ? 'Processing photo' : 'Snap a receipt photo'}
            className={iconButtonClass}
          >
            {processingSource === 'camera' ? (
              spinner
            ) : (
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            )}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isProcessing}
        aria-label={
          processingSource === 'file' ? 'Parsing document' : 'Parse receipt or document'
        }
        title={processingSource === 'file' ? 'Parsing document' : 'Parse receipt or document'}
        className={iconButtonClass}
      >
        {processingSource === 'file' ? (
          spinner
        ) : (
          <span className="material-symbols-outlined text-xl">attach_file</span>
        )}
      </button>
    </div>
  );
};

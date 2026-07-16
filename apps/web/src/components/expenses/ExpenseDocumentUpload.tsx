import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useDocumentProcessing } from '../../hooks/useDocumentProcessing';
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

export const ExpenseDocumentUpload: React.FC<Props> = ({
  autoCreate = false,
  disabled,
  onExpenseCreated,
  onParsed,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: capability } = useDocumentProcessing();

  if (!capability?.enabled) return null;

  const refreshAutoCreatedExpense = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] }),
    ]);
    await onExpenseCreated?.();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isProcessing}
        aria-label={isProcessing ? 'Parsing document' : 'Parse receipt or document'}
        title={isProcessing ? 'Parsing document' : 'Parse receipt or document'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/25 border-t-secondary" />
        ) : (
          <span className="material-symbols-outlined text-xl">attach_file</span>
        )}
      </button>
    </div>
  );
};

import React, { useMemo, useState } from 'react';

export interface ShareErrorInfo {
  errorType: string;
  debugString?: string | null;
}

interface Props {
  errorType: string;
  debugString?: string | null;
  onDismiss: () => void;
}

interface ParsedDebugInfo {
  swVersion?: string;
  method?: string;
  contentType?: string;
  contentLength?: string;
  entriesCount?: string;
  items: Array<{
    type: 'file' | 'string' | 'error' | 'other';
    name?: string;
    details: string;
  }>;
  errors: string[];
  diagnosisHint: string;
}

function parseDebugString(debug: string | null | undefined): ParsedDebugInfo {
  const result: ParsedDebugInfo = {
    items: [],
    errors: [],
    diagnosisHint: '',
  };

  if (!debug) {
    result.diagnosisHint =
      'No debug diagnostics were provided. The service worker might be outdated or the request did not reach the share target handler.';
    return result;
  }

  const parts = debug.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('sw=')) {
      result.swVersion = trimmed.slice(3);
    } else if (trimmed.startsWith('method=')) {
      result.method = trimmed.slice(7);
    } else if (trimmed.startsWith('ct=')) {
      result.contentType = trimmed.slice(3);
    } else if (trimmed.startsWith('cl=')) {
      result.contentLength = trimmed.slice(3);
    } else if (trimmed.startsWith('entries=')) {
      result.entriesCount = trimmed.slice(8);
    } else if (trimmed.startsWith('formParseErr=')) {
      const err = trimmed.slice(13);
      result.errors.push(`Form parse error: ${err}`);
      result.items.push({ type: 'error', details: `Form parse error: ${err}` });
    } else if (trimmed.includes(':file(') || trimmed.startsWith('file(')) {
      result.items.push({ type: 'file', details: trimmed });
      if (trimmed.includes('size=0')) {
        result.errors.push('File received with 0 bytes (empty stream)');
      }
      if (trimmed.includes('readErr=')) {
        const match = trimmed.match(/readErr=([^,)]+)/);
        result.errors.push(`File read error: ${match ? match[1] : 'unknown'}`);
      }
    } else if (trimmed.includes(':string(')) {
      let decoded = trimmed;
      try {
        decoded = decodeURIComponent(trimmed);
      } catch {
        // use raw
      }
      result.items.push({ type: 'string', details: decoded });
    } else if (trimmed.startsWith('fetchErr=') || trimmed.startsWith('urlFetchErr=')) {
      result.errors.push(`URL fetch error: ${trimmed.split('=')[1]}`);
      result.items.push({ type: 'error', details: trimmed });
    } else if (trimmed.startsWith('err=')) {
      let errStr = trimmed.slice(4);
      try {
        errStr = decodeURIComponent(errStr);
      } catch {
        // use raw
      }
      result.errors.push(errStr);
      result.items.push({ type: 'error', details: errStr });
    } else {
      result.items.push({ type: 'other', details: trimmed });
    }
  }

  // Derive human-readable diagnosis hint
  if (result.method === 'GET') {
    result.diagnosisHint =
      'The share was submitted as an HTTP GET request instead of a multipart POST. GET requests cannot carry binary file attachments.';
  } else if (result.entriesCount === '0' || parts.includes('no-entries')) {
    result.diagnosisHint =
      'The sharing app triggered SwiftSpend, but did not attach any files or form data in the share request body.';
  } else if (result.errors.some((e) => e.includes('0 bytes') || e.includes('File read error'))) {
    result.diagnosisHint =
      'A file entry was detected, but it had 0 bytes or the browser could not read the streaming content URI from the source app.';
  } else if (
    result.items.some((i) => i.type === 'string') &&
    !result.items.some((i) => i.type === 'file')
  ) {
    result.diagnosisHint =
      'The sharing app provided text or a URL instead of a document or image file.';
  } else if (result.errors.length > 0) {
    result.diagnosisHint = `Error during sharing: ${result.errors[0]}`;
  } else {
    result.diagnosisHint =
      'No valid image (PNG, JPEG, WebP, HEIC) or document file was found in the share payload.';
  }

  return result;
}

export const ShareErrorBanner: React.FC<Props> = ({
  errorType,
  debugString,
  onDismiss,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseDebugString(debugString), [debugString]);

  const title = useMemo(() => {
    switch (errorType) {
      case 'missing-file':
        return 'No document received from share';
      case 'receive-failed':
        return 'Could not receive shared document';
      case 'processing-failed':
        return 'Failed to process shared document';
      default:
        return 'Document share issue';
    }
  }, [errorType]);

  const handleCopy = async () => {
    const reportLines = [
      '=== SwiftSpend PWA Document Share Diagnostics ===',
      `Timestamp: ${new Date().toISOString()}`,
      `Error Type: ${errorType}`,
      `Title: ${title}`,
      `Diagnosis: ${parsed.diagnosisHint}`,
      `Service Worker: ${parsed.swVersion || 'unknown'}`,
      `HTTP Method: ${parsed.method || 'unknown'}`,
      `Content-Type: ${parsed.contentType || 'unknown'}`,
      `Content-Length: ${parsed.contentLength || 'unknown'}`,
      `Entries Count: ${parsed.entriesCount || 'unknown'}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      '--- Diagnostic Items ---',
      ...parsed.items.map((it) => `• [${it.type}] ${it.details}`),
      '',
      '--- Raw Diagnostics String ---',
      debugString || '(empty)',
    ];

    const reportText = reportLines.join('\n');

    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
        success = true;
      }
    } catch {
      // fallback
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = reportText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="mb-4 overflow-hidden rounded-xl border border-error/30 bg-error-container/20 p-3.5 text-on-surface shadow-sm md:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined mt-0.5 text-xl text-error shrink-0">
            error_outline
          </span>
          <div>
            <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-error md:text-sm">
              {title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-secondary md:text-sm">
              {parsed.diagnosisHint}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          className="rounded-lg p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-sm">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copied debug info!' : 'Copy debug info'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
          <span className="material-symbols-outlined text-sm">
            {showDetails ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 border-t border-outline-variant/30 pt-3 text-xs">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-container-low p-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary">
                SW Version
              </span>
              <span className="font-mono text-primary font-semibold">
                {parsed.swVersion || 'N/A'}
              </span>
            </div>
            <div className="rounded-lg bg-surface-container-low p-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary">
                Method
              </span>
              <span className="font-mono text-primary font-semibold">
                {parsed.method || 'N/A'}
              </span>
            </div>
            <div className="rounded-lg bg-surface-container-low p-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary">
                Content-Type
              </span>
              <span
                className="block truncate font-mono text-primary font-semibold"
                title={parsed.contentType || 'N/A'}
              >
                {parsed.contentType || 'N/A'}
              </span>
            </div>
            <div className="rounded-lg bg-surface-container-low p-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary">
                Entries Count
              </span>
              <span className="font-mono text-primary font-semibold">
                {parsed.entriesCount ?? '0'}
              </span>
            </div>
          </div>

          {parsed.items.length > 0 && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                Payload Items
              </span>
              <ul className="space-y-1">
                {parsed.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded bg-surface-container-low px-2 py-1 font-mono text-[11px] text-secondary break-all"
                  >
                    <span className="font-bold text-primary mr-1">
                      [{item.type}]
                    </span>
                    {item.details}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
              Raw Diagnostics String
            </span>
            <pre className="overflow-x-auto rounded-lg bg-surface-container-lowest p-2 font-mono text-[11px] text-secondary select-all whitespace-pre-wrap break-all border border-outline-variant/20">
              {debugString || '(no diagnostics returned)'}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};

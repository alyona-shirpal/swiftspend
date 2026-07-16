import { DocumentExpenseResponse, processExpenseDocument } from './expenses';

const SHARED_DOCUMENT_CACHE = 'swiftspend-shared-documents-v1';
const SHARED_DOCUMENT_PATH = '/__shared-document/';

const pendingDocuments = new Map<
  string,
  Promise<{ fileName: string; result: DocumentExpenseResponse }>
>();

const readSharedDocument = async (documentId: string): Promise<File> => {
  if (!('caches' in window)) {
    throw new Error('Shared documents are not supported in this browser.');
  }

  const cache = await caches.open(SHARED_DOCUMENT_CACHE);
  const storageUrl = new URL(
    `${SHARED_DOCUMENT_PATH}${encodeURIComponent(documentId)}`,
    window.location.origin,
  ).href;
  const response = await cache.match(storageUrl);

  if (!response) {
    throw new Error(
      'The shared document is no longer available. Share it again.',
    );
  }

  await cache.delete(storageUrl);

  const encodedName = response.headers.get('X-SwiftSpend-File-Name');
  let fileName = 'shared-document';
  if (encodedName) {
    try {
      fileName = decodeURIComponent(encodedName);
    } catch {
      fileName = encodedName;
    }
  }

  const blob = await response.blob();
  return new File([blob], fileName, {
    type: response.headers.get('Content-Type') || blob.type,
    lastModified: Date.now(),
  });
};

export const processSharedExpenseDocument = (documentId: string) => {
  const pending = pendingDocuments.get(documentId);
  if (pending) return pending;

  const request = (async () => {
    const file = await readSharedDocument(documentId);
    const result = await processExpenseDocument(file, false);
    return { fileName: file.name, result };
  })();

  pendingDocuments.set(documentId, request);
  void request.then(
    () => pendingDocuments.delete(documentId),
    () => pendingDocuments.delete(documentId),
  );
  return request;
};

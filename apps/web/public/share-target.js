const SHARED_DOCUMENT_CACHE = 'swiftspend-shared-documents-v1';
const SHARE_TARGET_PATH = '/share-target';
const SHARED_DOCUMENT_PATH = '/__shared-document/';

const redirectToAddExpense = (params) => {
  const url = new URL('/expenses/new', self.location.origin);

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  return Response.redirect(url.href, 303);
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.method !== 'POST' ||
    url.origin !== self.location.origin ||
    url.pathname !== SHARE_TARGET_PATH
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();
        const file = formData
          .getAll('documents')
          .find((value) => typeof value !== 'string' && value.size > 0);

        if (!file) {
          return redirectToAddExpense({ shareError: 'missing-file' });
        }

        const documentId =
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const storageUrl = new URL(
          `${SHARED_DOCUMENT_PATH}${encodeURIComponent(documentId)}`,
          self.location.origin,
        ).href;

        // A share starts a single confirmation flow. Remove abandoned shares before
        // keeping the new document so private receipts do not accumulate in storage.
        await caches.delete(SHARED_DOCUMENT_CACHE);
        const cache = await caches.open(SHARED_DOCUMENT_CACHE);
        await cache.put(
          storageUrl,
          new Response(file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'X-SwiftSpend-File-Name': encodeURIComponent(
                file.name || 'shared-document',
              ),
            },
          }),
        );

        return redirectToAddExpense({ sharedDocument: documentId });
      } catch (error) {
        console.warn('[SwiftSpend] Could not receive shared document:', error);
        return redirectToAddExpense({ shareError: 'receive-failed' });
      }
    })(),
  );
});

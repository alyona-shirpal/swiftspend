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

const parseDataUrl = (dataUrl, defaultName = 'shared-screenshot.png') => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const match = parts[0].match(/data:(.*?);base64/);
    const mime = match ? match[1] : 'image/png';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new File([array], defaultName, { type: mime });
  } catch {
    return null;
  }
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';

  if (
    event.request.method !== 'POST' ||
    url.origin !== self.location.origin ||
    normalizedPath !== SHARE_TARGET_PATH
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();

        // Collect all file-like entries from all form fields
        const allFiles = [];
        for (const [, value] of formData.entries()) {
          if (value && typeof value === 'object' && typeof value.size === 'number' && value.size > 0) {
            allFiles.push(value);
          }
        }

        let file = null;

        if (allFiles.length > 0) {
          // When multiple files are shared (e.g., Live Photo sends both an image and a video),
          // prioritize the static image over the video stream.
          const imageFile = allFiles.find(
            (f) =>
              (f.type && f.type.startsWith('image/')) ||
              /\.(png|jpe?g|webp|heic|heif)$/i.test(f.name || ''),
          );
          file = imageFile || allFiles[0];
        }

        // Check if any text/url parameter contains a base64 data URL (e.g. from screenshot utilities)
        if (!file) {
          for (const [, value] of formData.entries()) {
            if (typeof value === 'string' && value.trim().startsWith('data:image/')) {
              file = parseDataUrl(value.trim());
              if (file) break;
            }
          }
        }

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

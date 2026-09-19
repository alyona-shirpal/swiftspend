const SHARED_DOCUMENT_CACHE = 'swiftspend-shared-documents-v1';
const SHARE_TARGET_PATH = '/share-target';
const SHARED_DOCUMENT_PATH = '/__shared-document/';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const redirectToAddExpense = (params) => {
  const url = new URL('/expenses/new', self.location.origin);

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(name, String(value));
    }
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
    return new File([array], defaultName, { type: mime, lastModified: Date.now() });
  } catch {
    return null;
  }
};

const parseRawBase64Image = (str, defaultName = 'shared-screenshot.png') => {
  try {
    const clean = str.replace(/\s+/g, '');
    let mime = null;
    if (clean.startsWith('iVBORw0KGgo')) {
      mime = 'image/png';
    } else if (clean.startsWith('/9j/')) {
      mime = 'image/jpeg';
    } else if (clean.startsWith('UklGR')) {
      mime = 'image/webp';
    }
    if (!mime) return null;

    const binary = atob(clean);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const ext = mime.split('/')[1] || 'png';
    return new File([array], defaultName.replace(/\.[^.]+$/, `.${ext}`), {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
};

const fetchUrlAsFile = async (urlStr, defaultName = 'shared-image.jpg') => {
  try {
    const res = await fetch(urlStr, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob && blob.size > 0) {
      return new File([blob], defaultName, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });
    }
    return null;
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
        let formData = null;
        try {
          const reqClone = event.request.clone();
          formData = await reqClone.formData();
        } catch {
          formData = await event.request.formData();
        }

        const candidateFiles = [];
        const candidateStrings = [];
        const diagnostics = [];

        // Check every entry in the formData
        for (const [key, value] of formData.entries()) {
          if (value && typeof value === 'object') {
            const name = value.name || '';
            const type = value.type || '';
            let size = typeof value.size === 'number' ? value.size : 0;
            let arrayBuffer = null;

            // In Chromium on Android, streamed content URI file parts can report size 0
            // before the underlying stream is read. Read arrayBuffer to check true size.
            if (size === 0 && typeof value.arrayBuffer === 'function') {
              try {
                arrayBuffer = await value.arrayBuffer();
                size = arrayBuffer ? arrayBuffer.byteLength : 0;
              } catch (err) {
                console.warn('[SwiftSpend] Failed to read arrayBuffer of 0-size entry:', err);
              }
            }

            diagnostics.push(`${key}:file(name=${name},type=${type},size=${size})`);

            if (size > 0) {
              const fileObj = arrayBuffer
                ? new File([arrayBuffer], name || 'shared-screenshot.png', {
                    type: type || 'image/png',
                    lastModified: value.lastModified || Date.now(),
                  })
                : value;
              candidateFiles.push(fileObj);
            }
          } else if (typeof value === 'string') {
            const trimmed = value.trim();
            diagnostics.push(`${key}:string(${trimmed.slice(0, 30)})`);
            if (trimmed) {
              candidateStrings.push(trimmed);
            }
          }
        }

        let file = null;

        // 1. Pick best candidate file
        if (candidateFiles.length > 0) {
          const imageFile = candidateFiles.find(
            (f) =>
              (f.type && f.type.startsWith('image/')) ||
              /\.(png|jpe?g|webp|heic|heif)$/i.test(f.name || ''),
          );
          file = imageFile || candidateFiles[0];
        }

        // 2. Check candidate strings for data URLs, raw base64 images, or image URLs
        if (!file) {
          for (const str of candidateStrings) {
            if (str.startsWith('data:image/')) {
              file = parseDataUrl(str);
              if (file) break;
            }
            const rawBase64 = parseRawBase64Image(str);
            if (rawBase64) {
              file = rawBase64;
              break;
            }
            if (/^https?:\/\/.+\.(png|jpe?g|webp|gif|heic|heif)(\?.*)?$/i.test(str)) {
              file = await fetchUrlAsFile(str);
              if (file) break;
            }
          }
        }

        if (!file) {
          const shareDebug = diagnostics.join(';');
          return redirectToAddExpense({ shareError: 'missing-file', shareDebug });
        }

        const documentId =
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const storageUrl = new URL(
          `${SHARED_DOCUMENT_PATH}${encodeURIComponent(documentId)}`,
          self.location.origin,
        ).href;

        // Clean previous abandoned share and store the new document
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
        return redirectToAddExpense({
          shareError: 'receive-failed',
          shareDebug: String(error && error.message ? error.message : error),
        });
      }
    })(),
  );
});

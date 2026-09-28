const SHARED_DOCUMENT_CACHE = 'swiftspend-shared-documents-v1';
const SHARE_TARGET_PATH = '/share-target';
const SHARED_DOCUMENT_PATH = '/__shared-document/';

// Dynamic version from script URL query param or fallback
const SW_VERSION = (() => {
  try {
    return new URL(self.location.href).searchParams.get('v') || '20260928-v2';
  } catch {
    return '20260928-v2';
  }
})();

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

const storeAndRedirect = async (file) => {
  const documentId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const storageUrl = new URL(
    `${SHARED_DOCUMENT_PATH}${encodeURIComponent(documentId)}`,
    self.location.origin,
  ).href;

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
    if (!res.ok) return { file: null, error: `http-${res.status}` };
    const blob = await res.blob();
    if (blob && blob.size > 0) {
      const type = blob.type || 'image/jpeg';
      const ext = type.split('/')[1] || 'jpg';
      return {
        file: new File([blob], defaultName.replace(/\.[^.]+$/, `.${ext}`), {
          type,
          lastModified: Date.now(),
        }),
        error: null,
      };
    }
    return { file: null, error: 'empty-blob' };
  } catch (err) {
    return {
      file: null,
      error: (err && (err.name || err.message)) || 'fetch-err',
    };
  }
};

/**
 * Custom binary multipart/form-data parser.
 * Used as a fallback when browser's Request/Response formData() fails or drops
 * streaming parts on Android Chromium.
 */
const parseMultipartBuffer = (arrayBuffer, contentType) => {
  if (!contentType || !contentType.includes('boundary=')) return [];
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!match) return [];
  const boundary = match[1] || match[2];
  const decoder = new TextDecoder('utf-8');
  const u8 = new Uint8Array(arrayBuffer);

  const delimiter = new TextEncoder().encode('--' + boundary);
  const delimiterLen = delimiter.length;

  const results = [];
  const indices = [];
  for (let i = 0; i <= u8.length - delimiterLen; i++) {
    let found = true;
    for (let j = 0; j < delimiterLen; j++) {
      if (u8[i + j] !== delimiter[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      indices.push(i);
      i += delimiterLen - 1;
    }
  }

  for (let k = 0; k < indices.length - 1; k++) {
    const start = indices[k] + delimiterLen;
    const end = indices[k + 1];
    let partSlice = u8.subarray(start, end);
    if (partSlice[0] === 13 && partSlice[1] === 10) partSlice = partSlice.subarray(2);
    else if (partSlice[0] === 10) partSlice = partSlice.subarray(1);

    if (
      partSlice.length >= 2 &&
      partSlice[partSlice.length - 2] === 13 &&
      partSlice[partSlice.length - 1] === 10
    ) {
      partSlice = partSlice.subarray(0, partSlice.length - 2);
    } else if (partSlice.length >= 1 && partSlice[partSlice.length - 1] === 10) {
      partSlice = partSlice.subarray(0, partSlice.length - 1);
    }

    let bodyIndex = -1;
    let headerLength = 0;
    for (let i = 0; i < partSlice.length - 3; i++) {
      if (
        partSlice[i] === 13 &&
        partSlice[i + 1] === 10 &&
        partSlice[i + 2] === 13 &&
        partSlice[i + 3] === 10
      ) {
        bodyIndex = i + 4;
        headerLength = i;
        break;
      }
    }
    if (bodyIndex === -1) {
      for (let i = 0; i < partSlice.length - 1; i++) {
        if (partSlice[i] === 10 && partSlice[i + 1] === 10) {
          bodyIndex = i + 2;
          headerLength = i;
          break;
        }
      }
    }
    if (bodyIndex === -1) continue;

    const headerText = decoder.decode(partSlice.subarray(0, headerLength));
    const bodyBytes = partSlice.subarray(bodyIndex);

    const nameMatch = headerText.match(/name=(?:"([^"]+)"|([^;\s]+))/i);
    const filenameMatch = headerText.match(/filename=(?:"([^"]+)"|([^;\s]+))/i);
    const typeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);

    const fieldName = nameMatch ? nameMatch[1] || nameMatch[2] : 'unknown';
    const filename = filenameMatch ? filenameMatch[1] || filenameMatch[2] : null;
    const mimeType = typeMatch
      ? typeMatch[1].trim()
      : filename
        ? 'application/octet-stream'
        : 'text/plain';

    if (filename || (typeMatch && !typeMatch[1].startsWith('text/plain'))) {
      if (bodyBytes.length > 0) {
        results.push({
          isFile: true,
          name: fieldName,
          file: new File([bodyBytes], filename || 'shared-document', {
            type: mimeType,
            lastModified: Date.now(),
          }),
        });
      }
    } else {
      results.push({
        isString: true,
        name: fieldName,
        value: decoder.decode(bodyBytes),
      });
    }
  }

  return results;
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';

  if (
    url.origin !== self.location.origin ||
    normalizedPath !== SHARE_TARGET_PATH
  ) {
    return;
  }

  // Handle GET share target (some browsers/PWA implementations or links send GET)
  if (event.request.method === 'GET') {
    event.respondWith(
      (async () => {
        const diagnostics = [
          `sw=${SW_VERSION}`,
          'method=GET',
          `params=${Array.from(url.searchParams.keys()).join(',') || 'none'}`,
        ];

        let file = null;
        for (const [key, value] of url.searchParams.entries()) {
          const str = (value || '').trim();
          if (str.startsWith('data:image/')) {
            file = parseDataUrl(str);
            if (file) break;
          }
          const rawBase64 = parseRawBase64Image(str);
          if (rawBase64) {
            file = rawBase64;
            break;
          }
          if (/^https?:\/\/.+/i.test(str)) {
            const { file: fetchedFile, error: fetchErr } = await fetchUrlAsFile(str);
            if (fetchedFile) {
              file = fetchedFile;
              break;
            } else if (fetchErr) {
              diagnostics.push(`urlFetchErr=${fetchErr}`);
            }
          }
          if (str) {
            diagnostics.push(`${key}:string(${encodeURIComponent(str.slice(0, 30))})`);
          }
        }

        if (file) {
          return storeAndRedirect(file);
        }

        return redirectToAddExpense({
          shareError: 'missing-file',
          shareDebug: diagnostics.join(';'),
        });
      })(),
    );
    return;
  }

  if (event.request.method !== 'POST') {
    return;
  }

  event.respondWith(
    (async () => {
      const diagnostics = [];
      const candidateFiles = [];
      const candidateStrings = [];
      let entryCount = 0;

      const reqMethod = event.request.method;
      const reqContentType = event.request.headers.get('content-type') || 'none';
      const reqContentLength = event.request.headers.get('content-length') || 'none';

      try {
        let formData = null;
        let rawBuffer = null;
        let rawBufferErr = null;

        // Step 1: Read raw body bytes directly from the request stream.
        // This avoids stream-teeing bugs on Android Chromium and allows manual parsing
        // if the browser's native formData() drops the stream.
        try {
          rawBuffer = await event.request.arrayBuffer();
        } catch (err) {
          rawBufferErr = (err && (err.name || err.message)) || String(err);
        }

        if (rawBuffer && rawBuffer.byteLength > 0) {
          diagnostics.push(`rawBytes=${rawBuffer.byteLength}`);

          // Try parsing using standard Response.formData()
          try {
            const tempResponse = new Response(rawBuffer, {
              headers: { 'Content-Type': reqContentType },
            });
            formData = await tempResponse.formData();
          } catch (err) {
            diagnostics.push(
              `resFormDataErr=${encodeURIComponent((err && err.message) || String(err))}`,
            );
          }

          // If Response.formData() returned 0 entries or failed, use our custom multipart parser
          const formEntries = formData ? Array.from(formData.entries()) : [];
          if (formEntries.length === 0 && reqContentType.includes('multipart/form-data')) {
            const customParts = parseMultipartBuffer(rawBuffer, reqContentType);
            diagnostics.push(`customParts=${customParts.length}`);
            for (const part of customParts) {
              if (part.isFile) {
                candidateFiles.push(part.file);
                diagnostics.push(
                  `${part.name}:file(name=${part.file.name},type=${part.file.type},size=${part.file.size})`,
                );
              } else if (part.isString) {
                candidateStrings.push(part.value.trim());
                diagnostics.push(
                  `${part.name}:string(${encodeURIComponent(part.value.trim().slice(0, 40))})`,
                );
              }
            }
          }
        } else if (rawBuffer && rawBuffer.byteLength === 0) {
          diagnostics.push('rawBytes=0');
        } else if (rawBufferErr) {
          diagnostics.push(`arrayBufferErr=${encodeURIComponent(rawBufferErr)}`);
          // Fallback: try reading formData directly from request if arrayBuffer failed
          try {
            formData = await event.request.formData();
          } catch (err) {
            diagnostics.push(
              `directFormDataErr=${encodeURIComponent((err && err.message) || String(err))}`,
            );
          }
        }

        // Process standard formData entries if present
        if (formData) {
          for (const [key, value] of formData.entries()) {
            entryCount++;
            if (value && typeof value === 'object') {
              const name = value.name || '';
              const type = value.type || '';
              let size = typeof value.size === 'number' ? value.size : 0;
              let arrayBuffer = null;
              let readErr = null;

              if (size === 0 && typeof value.arrayBuffer === 'function') {
                try {
                  arrayBuffer = await value.arrayBuffer();
                  size = arrayBuffer ? arrayBuffer.byteLength : 0;
                } catch (err) {
                  readErr = (err && (err.name || err.message)) || 'read-err';
                }
              }

              if (size === 0 && !arrayBuffer && typeof Response !== 'undefined') {
                try {
                  const resBlob = await new Response(value).blob();
                  if (resBlob && resBlob.size > 0) {
                    size = resBlob.size;
                    arrayBuffer = await resBlob.arrayBuffer();
                  }
                } catch {
                  // ignore
                }
              }

              const diagEntry = [`${key}:file(name=${name || 'unnamed'},type=${type || 'unknown'},size=${size}`];
              if (readErr) {
                diagEntry.push(`,readErr=${readErr}`);
              }
              diagEntry.push(')');
              diagnostics.push(diagEntry.join(''));

              if (size > 0) {
                const fileObj = arrayBuffer
                  ? new File([arrayBuffer], name || 'shared-document', {
                      type: type || 'application/octet-stream',
                      lastModified: value.lastModified || Date.now(),
                    })
                  : value;
                candidateFiles.push(fileObj);
              }
            } else if (typeof value === 'string') {
              const trimmed = value.trim();
              diagnostics.push(`${key}:string(${encodeURIComponent(trimmed.slice(0, 40))})`);
              if (trimmed) {
                candidateStrings.push(trimmed);
              }
            } else {
              diagnostics.push(`${key}:unknown(${typeof value})`);
            }
          }
        }

        // Also inspect URL query params if any were attached to the POST request
        if (url.search) {
          const searchParams = Array.from(url.searchParams.keys());
          if (searchParams.length > 0) {
            diagnostics.push(`urlParams=${searchParams.join(',')}`);
            for (const [, val] of url.searchParams.entries()) {
              if (val && val.trim()) {
                candidateStrings.push(val.trim());
              }
            }
          }
        }

        let file = null;

        // 1. Pick candidate file (prefer image or pdf)
        if (candidateFiles.length > 0) {
          const preferredFile = candidateFiles.find(
            (f) =>
              (f.type && (f.type.startsWith('image/') || f.type === 'application/pdf')) ||
              /\.(png|jpe?g|webp|heic|heif|pdf)$/i.test(f.name || ''),
          );
          file = preferredFile || candidateFiles[0];
        }

        // 2. Candidate strings (data URLs, raw base64, image URLs)
        if (!file) {
          for (const str of candidateStrings) {
            if (str.startsWith('data:image/')) {
              file = parseDataUrl(str);
              if (file) break;
              diagnostics.push('dataUrlFailed');
            }
            const rawBase64 = parseRawBase64Image(str);
            if (rawBase64) {
              file = rawBase64;
              break;
            }
            if (/^https?:\/\/.+/i.test(str)) {
              const { file: fetchedFile, error: fetchErr } = await fetchUrlAsFile(str);
              if (fetchedFile) {
                file = fetchedFile;
                break;
              } else if (fetchErr) {
                diagnostics.push(`fetchErr=${fetchErr}`);
              }
            }
          }
        }

        if (!file) {
          const debugParts = [
            `sw=${SW_VERSION}`,
            `method=${reqMethod}`,
            `ct=${encodeURIComponent(reqContentType)}`,
            `cl=${reqContentLength}`,
            `entries=${entryCount}`,
          ];
          if (diagnostics.length > 0) {
            debugParts.push(...diagnostics);
          } else {
            debugParts.push('no-entries');
          }
          const shareDebug = debugParts.join(';');
          return redirectToAddExpense({ shareError: 'missing-file', shareDebug });
        }

        return storeAndRedirect(file);
      } catch (error) {
        console.warn('[SwiftSpend] Could not receive shared document:', error);
        const errDetail = error && error.message ? error.message : String(error);
        return redirectToAddExpense({
          shareError: 'receive-failed',
          shareDebug: `sw=${SW_VERSION};method=${reqMethod};ct=${encodeURIComponent(reqContentType)};err=${encodeURIComponent(errDetail)}`,
        });
      }
    })(),
  );
});

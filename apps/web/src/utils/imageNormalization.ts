/**
 * Image and Live Photo normalization utility for SwiftSpend.
 * Ensures all images and Live Photo videos sent to document processing (Gemini/AI)
 * are standard, upright, high-quality, lightweight JPEGs.
 */

const MAX_IMAGE_DIMENSION = 2048;
const JPEG_QUALITY = 0.88;

const isVideoFile = (file: File): boolean => {
  return (
    file.type.startsWith('video/') ||
    /\.(mov|mp4|m4v|3gp)$/i.test(file.name)
  );
};

const isImageFile = (file: File): boolean => {
  return (
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|heic|heif|bmp|tiff|svg)$/i.test(file.name)
  );
};

const sanitizeJpgName = (name: string): string => {
  const base = name.replace(/\.[^/.]+$/, '') || 'document';
  return `${base}.jpg`;
};

/**
 * Extracts a representative still frame from a Live Photo video (e.g. QuickTime .mov or .mp4)
 * and renders it as an HTML5 Canvas.
 */
const extractFrameFromVideo = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadeddata = () => {
      // Seek slightly into the video to avoid empty initial frames if possible
      const seekTime = video.duration > 0.1 ? 0.1 : 0;
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Could not obtain canvas 2D context'));
        }
        ctx.drawImage(video, 0, 0, width, height);
        cleanup();
        resolve(canvas);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video frame for Live Photo'));
    };
  });
};

/**
 * Loads an image File onto a canvas, honoring EXIF orientation and scaling down
 * if the image exceeds MAX_IMAGE_DIMENSION.
 */
const renderImageToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
  // Prefer createImageBitmap if available
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        return canvas;
      }
    } catch {
      // Fall back to Image element
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Canvas context unavailable'));
        }
        ctx.drawImage(img, 0, 0);
        cleanup();
        resolve(canvas);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image for normalization'));
    };

    img.src = objectUrl;
  });
};

/**
 * Normalizes an image or video canvas: scales if dimensions exceed MAX_IMAGE_DIMENSION,
 * and exports as a JPEG Blob.
 */
const canvasToJpgBlob = (sourceCanvas: HTMLCanvasElement): Promise<Blob> => {
  const { width, height } = sourceCanvas;
  let targetWidth = width;
  let targetHeight = height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const scale = Math.min(
      MAX_IMAGE_DIMENSION / width,
      MAX_IMAGE_DIMENSION / height,
    );
    targetWidth = Math.round(width * scale);
    targetHeight = Math.round(height * scale);
  }

  let finalCanvas = sourceCanvas;
  if (targetWidth !== width || targetHeight !== height) {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const ctx = finalCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    }
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to JPEG'));
        }
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
};

/**
 * Normalizes any image or Live Photo file before processing.
 * - Converts Live Photo videos (.mov/.mp4) to stable JPEGs.
 * - Normalizes images (HEIC/PNG/WebP/JPEG) to upright, scaled, standard JPEGs.
 * - Preserves non-image documents (e.g. PDFs) as-is.
 */
export const normalizeExpenseDocument = async (file: File): Promise<File> => {
  if (isVideoFile(file)) {
    try {
      const canvas = await extractFrameFromVideo(file);
      const blob = await canvasToJpgBlob(canvas);
      return new File([blob], sanitizeJpgName(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (err) {
      console.warn('[SwiftSpend] Live Photo video conversion fallback:', err);
      // Fallback to original file
      return file;
    }
  }

  if (isImageFile(file)) {
    try {
      const canvas = await renderImageToCanvas(file);
      const blob = await canvasToJpgBlob(canvas);
      return new File([blob], sanitizeJpgName(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (err) {
      console.warn('[SwiftSpend] Image normalization fallback:', err);
      return file;
    }
  }

  // Non-image document (e.g., PDF)
  return file;
};

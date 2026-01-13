export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImageResult {
  url: string;
  file: File;
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputSize?: { width: number; height: number }
): Promise<CroppedImageResult> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to output size or crop size
  canvas.width = outputSize?.width || pixelCrop.width;
  canvas.height = outputSize?.height || pixelCrop.height;

  // Draw the cropped portion
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Convert to blob then file
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas to blob failed'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve({ url, file });
      },
      'image/jpeg',
      0.9
    );
  });
}

// Generate a quick preview at reduced resolution
export async function generatePreview(imageSrc: string, pixelCrop: Area): Promise<string> {
  const { url } = await getCroppedImage(imageSrc, pixelCrop, { width: 150, height: 150 });
  return url;
}

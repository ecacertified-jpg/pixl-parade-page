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

/**
 * Calculate the bounding box dimensions after rotation
 */
function getRotatedBoundingBox(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const rotRad = Math.abs((rotation * Math.PI) / 180);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputSize?: { width: number; height: number },
  rotation: number = 0
): Promise<CroppedImageResult> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate rotated bounding box
  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBoundingBox(
    image.width,
    image.height,
    rotation
  );

  // Create a canvas for the rotated image
  const rotatedCanvas = document.createElement('canvas');
  const rotatedCtx = rotatedCanvas.getContext('2d');

  if (!rotatedCtx) {
    throw new Error('Could not get rotated canvas context');
  }

  rotatedCanvas.width = bBoxWidth;
  rotatedCanvas.height = bBoxHeight;

  // Apply rotation transformation
  rotatedCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotatedCtx.rotate(rotRad);
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  // Set output canvas size
  canvas.width = outputSize?.width || pixelCrop.width;
  canvas.height = outputSize?.height || pixelCrop.height;

  // Draw the cropped portion from the rotated image
  ctx.drawImage(
    rotatedCanvas,
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
export async function generatePreview(
  imageSrc: string, 
  pixelCrop: Area, 
  rotation: number = 0
): Promise<string> {
  const { url } = await getCroppedImage(imageSrc, pixelCrop, { width: 150, height: 150 }, rotation);
  return url;
}

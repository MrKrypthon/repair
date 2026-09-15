import { BadRequestException } from '@nestjs/common';

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ATTACHMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];

export function assertAllowedMimeType(file: Express.Multer.File | undefined, allowedTypes: string[], message: string) {
  if (file && !allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException(message);
  }
}

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/** Rozpoznaje typ obrazu po zawartości (magic bytes), a nie po nazwie czy nagłówku od klienta. */
export function detectImageType(buf: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  const head = buf.subarray(0, 6).toString('ascii');
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif';
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

@Controller('upload')
export class UploadController {
  // 30 zdjęć / minutę na IP
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Brak pliku');

    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException('Dozwolone są tylko obrazy JPG, PNG, GIF i WEBP');
    }

    // Nazwa generowana po stronie serwera - rozszerzenie zależy od wykrytego typu, nie od klienta
    const filename = `${randomUUID()}.${type}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(join(UPLOAD_DIR, filename), file.buffer, { flag: 'wx' });

    return { success: true, url: `/uploads/${filename}` };
  }
}

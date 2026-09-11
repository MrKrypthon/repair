import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'electronica',
      secretAccessKey: process.env.S3_SECRET_KEY || 'electronica_dev_minio'
    }
  });

  private readonly bucket = process.env.S3_BUCKET || 'electronica-tech-attachments';
  private readonly publicUrl = process.env.S3_PUBLIC_URL || 'http://localhost:9000';

  async upload(prefix: string, originalName: string, mimeType: string, body: Buffer) {
    const key = `${prefix}/${randomBytes(12).toString('hex')}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType }));
    return key;
  }

  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getUrl(key: string) {
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}

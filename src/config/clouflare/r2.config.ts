import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';

export const R2Config = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_S3_CLIENT_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY as string,
  },
  forcePathStyle: true,
});

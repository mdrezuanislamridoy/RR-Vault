import * as AWS from 'aws-sdk';
import 'dotenv/config';

export const R2Config = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_S3_CLIENT_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
});

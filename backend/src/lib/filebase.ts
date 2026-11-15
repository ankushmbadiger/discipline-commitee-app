
import { S3Client } from "@aws-sdk/client-s3";

const accessKey = process.env.FILEBASE_ACCESS_KEY;
const secretKey = process.env.FILEBASE_SECRET_KEY;
const bucket = process.env.FILEBASE_BUCKET;

if (!accessKey || !secretKey || !bucket) {
  throw new Error("Filebase environment variables are missing");
}

export const filebaseBucket = bucket;

export const filebaseClient = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || "https://s3.filebase.io",
  region: process.env.FILEBASE_REGION || "auto",
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

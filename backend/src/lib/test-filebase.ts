import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { filebaseClient, filebaseBucket } from "./filebase.js";

async function testFilebase() {
  try {
    await filebaseClient.send(
      new HeadBucketCommand({ Bucket: filebaseBucket })
    );

    console.log("Filebase bucket access successful!");
    console.log("Bucket:", filebaseBucket);
  } catch (error: any) {
    console.error("Filebase bucket access failed:", {
      name: error.name,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode,
    });
  }
}

testFilebase();
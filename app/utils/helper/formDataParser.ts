import { NextRequest } from "next/server";

import formidable from 'formidable';
// import { join } from 'path';
import { Readable } from 'stream';

/**
 * Parses multipart form data from a NextRequest without saving files locally
 * @param request - The incoming NextRequest with multipart form data
 * @returns Promise containing parsed fields and files
 */
export const parseForm = async (request: NextRequest): Promise<{ 
  fields: formidable.Fields; 
  files: formidable.Files 
}> => {
  const options: formidable.Options = {
    maxFileSize: 15 * 1024 * 1024, // 15MB
    filter: (part) => part.mimetype?.startsWith('image/') || false,
    multiples: true,
  };

  return new Promise(async (resolve, reject) => {
    try {
    const form = formidable(options);

    const contentType = request.headers.get("content-type") || "";
    const contentLength = request.headers.get("content-length") || "";

    // Get the request body as ReadableStream
    const reader = request.body?.getReader();
    if (!reader) {
      throw new Error('No request body available');
    }

    const stream = new Readable({
      async read() {
        try {
            const { done, value } = await reader.read();
            if (done) {
              this.push(null);
            } else {
              this.push(value);
            }
          } catch (error) {
            this.destroy(error as Error);
          }
      },
    });
  
    (stream as any).headers = {
      "content-type": contentType,
      "content-length": contentLength,
    };

    // Parse the form using the readable stream
    form.parse(stream as any, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });

    } catch (error) {
      reject(error);
    }
  });
};
import { NextRequest } from "next/server";

import formidable from 'formidable';
import { join } from 'path';
import { Readable } from 'stream';

// Helper function to parse form data
export const parseForm = async (request: NextRequest): Promise<{ 
  fields: formidable.Fields; 
  files: formidable.Files 
}> => {
  const options: formidable.Options = {
    uploadDir: join(process.cwd(), 'tmp'),
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024, // 15MB
    filter: (part) => part.mimetype?.startsWith('image/') || false,
    multiples: true,
  };

  return new Promise(async (resolve, reject) => {
    const form = formidable(options);

    const contentType = request.headers.get("content-type") || "";
    const contentLength = request.headers.get("content-length") || "";

    // Get the request body as ReadableStream
    const reader = request.body?.getReader();
    if (!reader) {
      reject(new Error('No request body'));
      return;
    }

    const stream = new Readable({
      async read() {
        const { done, value } = await reader.read();
        if (done) return this.push(null);
        this.push(value);
      },
    });
  
    (stream as any).headers = {
      "content-type": contentType,
      "content-length": contentLength,
    };

    // Parse the form using the readable stream
    form.parse(stream as any, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};
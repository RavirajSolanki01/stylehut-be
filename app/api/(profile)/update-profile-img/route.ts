import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import { join } from "path";
import { Readable } from "stream";
import { existsSync, mkdirSync } from "fs";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import { errorResponse, successResponse } from "@/app/utils/apiResponse";
import { USER_CONSTANTS, COMMON_CONSTANTS } from "@/app/utils/constants";
import { HttpStatus } from "@/app/utils/enums/httpStatusCode";
import { verifyToken } from "@/app/utils/helper/auth";
import {
  removeProfileFromCloudinary,
  uploadProfileToCloudinary,
} from "@/app/utils/helper/couldinary";
import { profileImgValidation } from "@/app/utils/validationSchema/user";
import { IncomingMessage } from "http";

const prisma = new PrismaClient();

export const parseForm = async (
  request: NextRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const uploadDir = join(process.cwd(), "tmp");

  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const options: formidable.Options = {
    uploadDir,
    keepExtensions: true,
    maxFileSize: USER_CONSTANTS.FILE_SIZE,
    filter: part => part.mimetype?.startsWith("image/") || false,
    multiples: false,
  };

  const form = formidable(options);

  const contentType = request.headers.get("content-type") || "";
  const contentLength = request.headers.get("content-length") || "";

  const reader = request.body?.getReader();
  if (!reader) throw new Error("No request body found.");

  const stream = new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) return this.push(null);
      this.push(value);
    },
  }) as Readable & IncomingMessage;
  
  stream.headers = {
    "content-type": contentType,
    "content-length": contentLength,
  };
  stream.aborted = false; // Required to satisfy IncomingMessage
  
  return new Promise((resolve, reject) => {
    form.parse(stream, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = (await verifyToken(req)) as { userId: number };

    const { files } = await parseForm(req);

    const imageFile = Array.isArray(files.profileImg)
      ? files.profileImg[0]
      : files.profileImg;

    if (!imageFile) {
      return NextResponse.json(
        errorResponse(USER_CONSTANTS.FAIL_TO_UPLOAD_IMAGE, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const validation = await profileImgValidation(imageFile);
    if (!validation.valid && validation.message) {
      await fs.unlink(imageFile.filepath);
      return NextResponse.json(
        errorResponse(validation.message, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        is_deleted: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        errorResponse(USER_CONSTANTS.NOT_EXISTS_OR_DELETED, HttpStatus.NOT_FOUND),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    if (user.profile_url) {
      await removeProfileFromCloudinary(user.profile_url);
    }

    const uploadedUrl = await uploadProfileToCloudinary(imageFile.filepath);

    const updateProfile = await prisma.users.update({
      where: { id: userId },
      data: {
        profile_url: uploadedUrl,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      successResponse(COMMON_CONSTANTS.SUCCESS, updateProfile),
      { status: HttpStatus.OK }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("maxTotalFileSize")
    ) {
      return NextResponse.json(
        errorResponse(USER_CONSTANTS.FILE_SIZE_VALIDATION_MSG, HttpStatus.BAD_REQUEST),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      errorResponse(USER_CONSTANTS.FAIL_TO_UPLOAD_IMAGE, HttpStatus.BAD_REQUEST),
      { status: HttpStatus.BAD_REQUEST }
    );
  }
}

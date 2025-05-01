import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getPublicIdFromUrl = (url: string) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif)$/);
  return matches ? matches[1] : null;
};

export const uploadProfileToCloudinary = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "user_profile",
      use_filename: true,
    });

    // Clean up temporary file
    await fs.unlink(filePath);

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error for user profile:", error);
    // Clean up temporary file even if upload fails
    await fs.unlink(filePath).catch(console.error);
    throw new Error("Failed to upload image");
  }
};

export const removeProfileFromCloudinary = async (filePath: string) => {
  try {
    const publicId = getPublicIdFromUrl(filePath);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }
  } catch (error) {
    console.error("Cloudinary remove error for user profile:", error);
    throw new Error("Failed to remove image");
  }
};

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  filePath: string, 
  options: {
    folder?: string;
    filename?: string;
    resourceType?: "auto" | "image" | "video" | "raw" | undefined;
  } = {}
) => {
  try {

    // Set default options
    const uploadOptions = {
      folder: options.folder || 'products',
      use_filename: true,
      resource_type: options.resourceType || 'auto',
      ...(options.filename && { public_id: options.filename }),
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    // Clean up temporary file
    await fs.unlink(filePath);
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Clean up temporary file even if upload fails
    await fs.unlink(filePath).catch(console.error);
    throw new Error('Failed to upload image');
  }
};

export const deleteFromCloudinary = async (publicId: string, folder: string = 'products'): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

// Helper function to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string, folder: string = 'products'): string | null => {
  try {
    // Extract the file name without extension
    const matches = url.match(/\/products\/([^/]+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};
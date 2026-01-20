"use client";

import FileUpload from "./FileUpload";

interface ImageUploadProps {
  value?: any;
  onChange?: (value: any) => void;
  multiple?: boolean;
  maxCount?: number;
  disabled?: boolean;
  placeholder?: string;
  listType?: "picture" | "picture-card" | "picture-circle";
}

/**
 * Зураг upload хийх тусгай component
 * JPG, PNG, GIF, WebP форматууд зөвшөөрнө
 */
const ImageUpload = ({
  placeholder = undefined,
  listType = "picture-card",
  ...props
}: ImageUploadProps) => {
  return (
    <FileUpload
      accept="image/*"
      listType={listType}
      buttonText="Зураг сонгох"
      placeholder={placeholder}
      {...props}
    />
  );
};

export default ImageUpload;

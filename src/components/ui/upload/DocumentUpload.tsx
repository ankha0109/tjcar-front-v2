"use client";

import FileUpload from "./FileUpload";

interface DocumentUploadProps {
  value?: any;
  onChange?: (value: any) => void;
  multiple?: boolean;
  maxCount?: number;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Баримт бичиг upload хийх тусгай component
 * PDF файлууд зөвшөөрнө
 */
const DocumentUpload = ({
  placeholder = undefined,
  ...props
}: DocumentUploadProps) => {
  return (
    <FileUpload
      accept=".pdf"
      buttonText="Файл сонгон оруулах"
      placeholder={placeholder}
      {...props}
    />
  );
};

export default DocumentUpload;

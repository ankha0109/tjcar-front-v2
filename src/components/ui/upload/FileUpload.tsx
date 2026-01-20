"use client";

import {
  Add01Icon,
  Delete02Icon,
  Download01Icon,
  Download04Icon,
  FileDownloadIcon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Upload, UploadProps } from "antd";
import { UploadFile, UploadListType } from "antd/es/upload/interface";
import { useSession } from "next-auth/react";

interface FileUploadProps {
  value?: UploadFile[];
  onChange?: (value: UploadFile[]) => void;
  listType?: UploadListType;
  multiple?: boolean;
  accept?: string;
  maxCount?: number;
  disabled?: boolean;
  placeholder?: string;
  buttonText?: string;
  showUploadList?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FileUpload = ({
  value,
  onChange,
  listType = "text",
  multiple = false,
  accept,
  maxCount = 1,
  disabled = false,
  placeholder = undefined,
  buttonText = "Файл сонгон оруулах",
  showUploadList = true,
  className,
  style,
  ...props
}: FileUploadProps) => {
  const { data: session } = useSession();

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    // Handle file upload errors
    const processedFileList = newFileList.map((file) => {
      if (file.status === "error") {
        if (file.error) {
          file.error.message = "Файл хуулахад алдаа гарсан";
        } else {
          file.error = {
            message: "Файл хуулахад алдаа гарсан",
          };
        }
      }
      return file;
    });

    // Call the onChange prop if provided
    onChange?.(processedFileList);
  };

  const uploadProps: UploadProps = {
    name: "file",
    action: `${
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
    }/file-upload`,
    headers: session?.token
      ? {
          Authorization: `Bearer ${session.token}`,
        }
      : undefined,
    listType,
    multiple,
    accept,
    maxCount,
    disabled,
    onChange: handleChange,
    fileList: value ?? [],
    style: {
      width: "100%",
      ...style,
    },
    className,
    showUploadList: showUploadList
      ? {
          removeIcon: (
            <HugeiconsIcon
              icon={Delete02Icon}
              size={14}
              className="flex items-center"
              // alignmentBaseline="middle"
              strokeWidth={1.5}
            />
          ),
          downloadIcon: (
            <HugeiconsIcon
              icon={Download04Icon}
              size={14}
              className="flex items-center"
              // alignmentBaseline="middle"
              strokeWidth={1.5}
            />
          ),
          extra: <span>{placeholder}</span>,
          showPreviewIcon: true,
          showDownloadIcon: true,
        }
      : false,
    ...props,
  };

  return (
    <Upload {...uploadProps}>
      <Button
        icon={
          <HugeiconsIcon
            icon={Add01Icon}
            size={18}
            className="flex items-center text-green"
            alignmentBaseline="middle"
            strokeWidth={1.5}
          />
        }
        block
        disabled={disabled}
      >
        {buttonText}
      </Button>
    </Upload>
  );
};

export default FileUpload;

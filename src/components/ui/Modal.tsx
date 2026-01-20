"use client";

import {
  ArrowDown03Icon,
  MultiplicationSignIcon,
  Tick02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Modal as AntdModal, Button, ModalProps, App } from "antd";
import React from "react";

/**
 * Reusable Modal component based on Ant Design's Modal.
 * You can override styles via className or style props,
 * or update the AntdProvider theme for global style changes.
 */
const Modal: React.FC<ModalProps> = ({ className = "", ...props }) => {
  return (
    <AntdModal
      className={`custom-modal ${className}`}
      styles={{
        content: {
          borderRadius: 5,
          paddingTop: 35,
          paddingBottom: 30,
          paddingInline: 40,
        },
        body: {
          paddingBlock: 20,
        },
      }}
      centered
      cancelButtonProps={{
        block: true,
        hidden: true,
      }}
      closeIcon={
        <HugeiconsIcon
          icon={MultiplicationSignIcon}
          size={24}
          color="#6A6A6A"
          className="flex items-center"
        />
      }
      {...props}
      okButtonProps={{
        block: true,
        className: "m-0",
        icon: (
          <HugeiconsIcon
            icon={ArrowDown03Icon}
            size={20}
            className="flex items-center text-primary"
          />
        ),
        ...props.okButtonProps,
      }}
      cancelText="Хаах"
      okText="Хадгал"
      okType="default"
    />
  );
};

// Confirm dialog options
export interface ConfirmOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okButtonProps?: any;
  cancelButtonProps?: any;
}

// useModal hook for confirm dialogs and more
export function useModal() {
  const { modal } = App.useApp();

  let instance: any = null;
  const confirm = (options: ConfirmOptions) => {
    instance = modal.confirm({
      icon: null,
      title: null,
      content: (
        <div className="flex flex-col gap-2">
          <div className="text-center text-lg">{options.title}</div>
          <div
            className="text-center text-secondary px-5"
            dangerouslySetInnerHTML={{
              __html: options.description || "",
            }}
          />
        </div>
      ),
      okText: options.okText ?? "Тийм",
      cancelText: options.cancelText ?? "Үгүй",
      cancelButtonProps: {
        icon: (
          <HugeiconsIcon
            icon={MultiplicationSignIcon}
            size={20}
            className="flex items-center text-red"
          />
        ),
        className: "flex-1 hover:border-red hover:text-red",
        type: "default",
      },
      okButtonProps: {
        icon: (
          <HugeiconsIcon
            icon={Tick02Icon}
            size={20}
            className="flex items-center text-green"
          />
        ),
        className: "flex-1 hover:border-green hover:text-green m-0",
        type: "default",
      },
      onOk: options.onOk,
      onCancel: options.onCancel,
      // footer: (props) => {
      //   return (
      //     <div className="flex flex-row gap-1">
      //       <Button
      //         block
      //         icon={
      //           <HugeiconsIcon
      //             icon={Tick02Icon}
      //             size={20}
      //             className="flex items-center text-green"
      //           />
      //         }
      //         className="hover:border-green hover:text-green"
      //         onClick={async () => {
      //           // instance.destroy();
      //           options.onOk?.(); // Хэрэглэгчийн нэмэлт callback
      //         }}
      //       >
      //         {options.okText ?? "Тийм"}
      //       </Button>
      //       <Button
      //         key="back"
      //         onClick={async () => {
      //           instance.destroy();
      //           options.onCancel?.(); // Хэрэглэгчийн нэмэлт callback
      //         }}
      //         block
      //         icon={
      //           <HugeiconsIcon
      //             icon={MultiplicationSignIcon}
      //             size={20}
      //             className="flex items-center text-red"
      //           />
      //         }
      //         className="hover:border-red hover:text-red"
      //       >
      //         {options.cancelText ?? "Үгүй"}
      //       </Button>
      //     </div>
      //   );
      // },
      closeIcon: (
        <HugeiconsIcon
          icon={MultiplicationSignIcon}
          size={24}
          color="#6A6A6A"
          className="flex items-center"
        />
      ),
      maskClosable: true,
      centered: true,
      closable: true,
      className: "amar-confirm-modal",
      classNames: {
        content: "rounded-[5px] pt-[50px] pb-[30px] px-10",
        // body: "px-10",
        header: "text-center",
        footer: "flex flex-col",
      },
    });
  };

  return { confirm };
}

export { Modal };

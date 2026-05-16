"use client";

import React from "react";
import { App } from "antd";
import type { GuideOptions } from "./guideBus";
import { GUIDE_CHANNEL } from "./guideBus";

export default function GuideModalRoot() {
  const { modal } = App.useApp();

  React.useEffect(() => {
    const handler = (e: Event) => {
      const { options } = (e as CustomEvent<{ options: GuideOptions }>)
        .detail ?? { options: {} as GuideOptions };

      modal.confirm({
        icon: null,
        title: null,
        content: (
          <div className="flex flex-col gap-5">
            {options.title ? (
              <div className="text-lg font-normal text-[#6A6A6A] border-b border-warning pb-2.5 leading-5">
                {options.title}
              </div>
            ) : null}
            {options.description}
          </div>
        ),
        okText: options.okText,
        onOk: options.onOk,
        afterClose: options.afterClose,
        maskClosable: true,
        centered: true,
        closable: true,
        width: options.width ?? 520,
        styles: {
          // content: {
          //   borderRadius: 5,
          //   paddingTop: 35,
          //   paddingBottom: 30,
          //   paddingInline: 40,
          // },
          body: {
            paddingBlock: 0,
          },
        },
        footer: null,
      });
    };

    window.addEventListener(GUIDE_CHANNEL, handler as EventListener);
    return () =>
      window.removeEventListener(GUIDE_CHANNEL, handler as EventListener);
  }, [modal]);

  return null;
}

"use client";

import { useCompany } from "@/hooks/useCompany";
import { CompanyProps } from "@/types";
import Api from "@/services/Api";
import { phoneValidate } from "@/utils/validates";
import {
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { App, Button, Form, Input, Select } from "antd";
import AddressCascader from "@/components/ui/AddressCascader";
import { useEffect, useState } from "react";
import InfoButton from "@/components/ui/button/InfoButton";
import ContinueButton from "@/components/ui/button/ContinueButton";
import Link from "next/link";
import TrashButton from "@/components/ui/button/TrashButton";
import FileUpload, { DocumentUpload } from "@/components/ui/upload";

const CompanyForm = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { data: company } = useCompany();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      let company_data = {
        ...company,
      };
      if (company_data.phones?.length == 0) company_data.phones = [""];
      if (company_data.detail?.juram && company_data.detail.juram[0]?.path) {
        company_data.document = [
          {
            uid: "-1",
            name: "Хавсралт файл харах",
            status: "done",
            url: process.env.CDN_URL + company_data.detail.juram[0].path,
          },
        ];
      }
      console.log(company_data);
      form.setFieldsValue(company_data);
    }
  }, [company]);

  const onFinish = async (values: any) => {
    const payload = { ...values };

    if (values.document[0]?.response?.name) {
      payload.detail = {
        juram: [
          {
            path: values.document[0]?.response?.name || undefined,
          },
        ],
      };
    }

    setSaving(true);
    await Api.put("/company", payload)
      .then(() => {
        message.success("Байгууллагын мэдээлэл шинэчлэгдлээ.");
      })
      .catch((err) => {
        console.log(err);
        message.error("Алдаа гарлаа.");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-row items-center gap-1 justify-between">
        <h3 className="text-lg m-0 font-medium">Байгууллагын мэдээлэл</h3>

        <div className="flex flex-row gap-4">
          {/* <InfoButton>Тохиргооны заавар</InfoButton> */}
          <ContinueButton onClick={() => form.submit()} loading={saving}>
            Үргэлжлүүл
          </ContinueButton>
        </div>
      </div>

      <div className="w-[460px] px-8">
        <Form
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={(values) => {
            console.log(values.values);
            message.error(
              "Мэдээлэл дутуу оруулсан байна. Шалгаад заавал оруулна уу"
            );
          }}
          form={form}
          scrollToFirstError
        >
          <Form.Item
            label="Байгууллагын нэр"
            name="name"
            rules={[
              {
                required: true,
                message: "Заавал оруулна уу",
              },
            ]}
          >
            <Input placeholder="Байгууллагын нэр" />
          </Form.Item>
          <Form.Item
            label="Байгууллагын регистер"
            name={["registration", "register_number"]}
            rules={[
              {
                required: true,
                message: "Заавал оруулна уу",
              },
            ]}
          >
            <Input placeholder="Байгууллагын регистер" />
          </Form.Item>
          <Form.Item
            label="Улсын бүртгэлийн дугаар"
            name={["registration", "national_registration_number"]}
            rules={[
              {
                required: false,
                message: "Заавал оруулна уу",
              },
            ]}
          >
            <Input placeholder="Улсын бүртгэлийн дугаар" />
          </Form.Item>
          <Form.Item
            label="НД төлөгчийн дугаар"
            name={["registration", "nd_number"]}
            rules={[
              {
                required: false,
                message: "Заавал оруулна уу",
              },
            ]}
          >
            <Input placeholder="НД төлөгчийн дугаар" />
          </Form.Item>
          <Form.Item
            label="Үйл ажиллагааны чиглэл"
            name={["registration", "ua_chiglel"]}
            rules={[
              {
                required: true,
                message: "Заавал оруулна уу",
              },
            ]}
          >
            <Input placeholder="Үйл ажиллагааны чиглэл" />
          </Form.Item>
          <Form.List name="phones" initialValue={[""]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Form.Item
                    label={name === 0 ? "Байгууллагын утас" : ""}
                    required={true}
                    key={key}
                  >
                    <div className="flex gap-2">
                      <Form.Item
                        key={"phones_" + key}
                        name={[name]}
                        rules={phoneValidate}
                        validateFirst
                        noStyle
                        {...restField}
                      >
                        <Input placeholder="Утасны дугаар" />
                      </Form.Item>
                      {name == 0 ? (
                        <Button
                          onClick={() => {
                            add();
                          }}
                          className="px-2.5 text-green"
                          disabled={fields.length >= 3}
                        >
                          <HugeiconsIcon
                            icon={PlusSignIcon}
                            size={18}
                            strokeWidth={1.2}
                          />
                        </Button>
                      ) : (
                        <TrashButton
                          onClick={() => {
                            remove(name);
                          }}
                          className="px-2.5"
                        />
                      )}
                    </div>
                  </Form.Item>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item
            label="Байгууллагын и-мэйл"
            name="email"
            rules={[
              {
                required: true,
                message: "Заавал оруулна уу",
              },
              {
                type: "email",
                message: "И-мэйл хаяг зөв оруулна уу",
              },
            ]}
          >
            <Input placeholder="Байгууллагын и-мэйл" />
          </Form.Item>

          <Form.Item label="Байгууллагын хаяг">
            <div className="flex flex-col gap-3">
              <Form.Item
                name={["address", "path"]}
                getValueProps={(value) => ({
                  value: value
                    ? [value.aimag, value.soum, value.khoroo].filter(Boolean)
                    : undefined,
                })}
                normalize={(arr) => ({
                  aimag: arr?.[0],
                  soum: arr?.[1],
                  khoroo: arr?.[2],
                })}
                rules={[
                  {
                    required: true,
                    message: "Хаяг заавал сонгоно уу",
                  },
                  {
                    validator: (_, value) => {
                      if (!value || !value.aimag || !value.soum) {
                        return Promise.reject(
                          new Error("Хаяг бүрэн сонгоно уу")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                className="mb-0"
              >
                <AddressCascader
                  placeholder="Хаяг сонгох"
                  // changeOnSelect
                />
              </Form.Item>
              <Form.Item
                name={["address", "street"]}
                rules={[
                  {
                    required: true,
                    message: "Гудамж, барилгын мэдээлэл заавал оруулна уу",
                  },
                ]}
                className="mb-0"
              >
                <Input placeholder="Гудамж, Барилга, тоот" />
              </Form.Item>

              <div className="flex gap-3 items-center">
                <Form.Item
                  name={["address", "zipcode"]}
                  rules={[
                    {
                      required: true,
                      message: "Зип код заавал оруулна уу",
                    },
                  ]}
                  className="mb-0 flex-1"
                >
                  <Input placeholder="Зип код" />
                </Form.Item>
                <div className="flex-1">
                  <Link href="https://zipcode.mn" target="_blank">
                    www.zipcode.mn
                  </Link>
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item label="Байгууллагын дотоод дүрэм журам" name="document">
            <DocumentUpload />
          </Form.Item>
        </Form>
      </div>
    </section>
  );
};

export default CompanyForm;

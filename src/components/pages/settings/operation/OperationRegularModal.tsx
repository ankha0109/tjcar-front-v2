import { Modal, useModal } from "@/components/ui/Modal";
import Api from "@/services/Api";
import {
  Delete01Icon,
  Delete02Icon,
  InformationCircleIcon,
  PlusSignIcon,
  Wifi02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Checkbox, Form, Input, Select, TimePicker } from "antd";
import { Fragment, useEffect, useState } from "react";
import { App } from "antd";
import { AttendanceTypes } from "@/enums";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import BreakfastSelect from "@/components/form/BreakfastSelect";

const OperationRegularModal = ({
  open,
  setOpen,
  updateData,
  refetch,
  mode,
}: any) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { confirm } = useModal();

  // States
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (mode == "create") {
        form.setFieldsValue({
          name: updateData?.name,
          branch_id: updateData?.id,
        });
      } else if (mode == "update") {
        form.setFieldsValue({
          name: updateData?.branch?.name,
          ...updateData,
        });
      }
    }
  }, [open]);

  const handleCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.post("/roster/simple", values)
          .then(() => {
            message.success("Wi-Fi бүртгэл нэмэгдлээ");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error(err?.message || "Алдаа гарлаа.");
          })
          .finally(() => {
            setSaving(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleUpdate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.put("/roster/simple", {
          id: updateData?.id,
          ...values,
        })
          .then(() => {
            message.success("Ээлжийн мэдээлэл шинэчлэгдлээ");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error("Алдаа гарлаа.");
          })
          .finally(() => {
            setSaving(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleDelete = () => {
    confirm({
      title: "Баталгаажуулах",
      description: "Wi-Fi бүртгэлийг устгах уу?",
      onOk: () => {
        Api.delete(`/roster/simple/${updateData?.id}`)
          .then(() => {
            message.success("Wi-Fi бүртгэл устгагдлаа");
            setOpen(false);
            form.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            message.error("Алдаа гарлаа.");
          });
      },
    });
  };

  return (
    <Modal
      title="Энгийн цагийн хуваарь"
      open={open}
      centered
      onCancel={() => setOpen(false)}
      onOk={mode === "create" ? handleCreate : handleUpdate}
      okButtonProps={{
        loading: saving,
      }}
      width={1000}
    >
      <Form
        form={form}
        layout="vertical"
        className="flex flex-row gap-[50px]"
        initialValues={{
          detail: {
            cycle_length: 7,
            pattern: [
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: true,
              }, // Даваа
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: true,
              }, // Мягмар
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: true,
              }, // Лхагва
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: true,
              }, // Пүрэв
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: true,
              }, // Баасан
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: false,
              }, // Бямба
              {
                start: "09:00",
                end: "18:00",
                breakfast_duration: "01:00",
                is_work: false,
              }, // Ням
            ],
          },
        }}
      >
        <div>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Цагийн хуваарийн загвараа нэрлэнэ үү"
            rules={[{ required: true, message: "Заавал оруулна уу" }]}
          >
            <Input placeholder="Стандарт хуваарь" />
          </Form.Item>
          <Form.Item label="Хуваарийн цикл" required>
            <div className="flex items-center gap-2">
              <Form.Item
                name={["detail", "cycle_length"]}
                rules={[{ required: true, message: "Заавал оруулна уу" }]}
                noStyle
              >
                <Input placeholder="" className="w-10 text-center" readOnly />
              </Form.Item>
              <span>хоногоор</span>
            </div>
          </Form.Item>

          {mode == "update" && (
            <div>
              <Button
                icon={<HugeiconsIcon icon={Delete02Icon} size={14} />}
                danger
                onClick={handleDelete}
              >
                Цагийн хуваарийг устгах
              </Button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-auto bg-[#6A6A6A]/20" />

        <div className="flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-y-3 gap-4 items-center">
            <div></div>
            <div className="text-secondary">Ажил эхлэх цаг</div>
            <div className="text-secondary">Ажил тарах цаг</div>
            <div className="text-secondary">Цай/цаг хугацаа</div>

            <Form.List name={["detail", "pattern"]}>
              {(fields) => {
                const dayNames = [
                  "Даваа",
                  "Мягмар",
                  "Лхагва",
                  "Пүрэв",
                  "Баасан",
                  "Бямба",
                  "Ням",
                ];

                return fields.map((field, index) => {
                  const DayRow = () => {
                    const isWork = Form.useWatch(
                      ["detail", "pattern", field.name, "is_work"],
                      form
                    );

                    return (
                      <Fragment key={field.key}>
                        <div>
                          <Form.Item
                            name={[field.name, "is_work"]}
                            noStyle
                            valuePropName="checked"
                          >
                            <Checkbox
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  // Uncheck хийх үед утгуудыг цэвэрлэх
                                  form.setFieldsValue({
                                    detail: {
                                      pattern: {
                                        [field.name]: {
                                          start: "09:00",
                                          end: "18:00",
                                          breakfast_duration: "01:00",
                                        },
                                      },
                                    },
                                  });
                                }
                              }}
                            >
                              {dayNames[index]}
                            </Checkbox>
                          </Form.Item>
                        </div>

                        {isWork ? (
                          <Fragment>
                            <div>
                              <Form.Item
                                name={[field.name, "start"]}
                                getValueProps={(value) => ({
                                  value: value ? dayjs(value, "HH:mm") : null,
                                })}
                                normalize={(value) =>
                                  value ? dayjs(value).format("HH:mm") : null
                                }
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                  },
                                ]}
                              >
                                <TimePicker
                                  placeholder=""
                                  format="HH:mm"
                                  showNow={false}
                                  renderExtraFooter={() => null}
                                  needConfirm={true}
                                  className="w-full"
                                />
                              </Form.Item>
                            </div>
                            <div>
                              <Form.Item
                                name={[field.name, "end"]}
                                getValueProps={(value) => ({
                                  value: value ? dayjs(value, "HH:mm") : null,
                                })}
                                normalize={(value) =>
                                  value ? dayjs(value).format("HH:mm") : null
                                }
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                  },
                                ]}
                              >
                                <TimePicker
                                  placeholder=""
                                  format="HH:mm"
                                  showNow={false}
                                  renderExtraFooter={() => null}
                                  needConfirm={false}
                                  className="w-full"
                                />
                              </Form.Item>
                            </div>
                            <div>
                              <Form.Item
                                name={[field.name, "breakfast_duration"]}
                                noStyle
                                rules={[
                                  {
                                    required: true,
                                  },
                                ]}
                              >
                                <BreakfastSelect />
                              </Form.Item>
                            </div>
                          </Fragment>
                        ) : (
                          <div className="col-span-3">
                            <Input
                              value="Амарна"
                              readOnly
                              className="border-primary/20 text-primary"
                            />
                          </div>
                        )}
                      </Fragment>
                    );
                  };

                  return <DayRow key={field.key} />;
                });
              }}
            </Form.List>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default OperationRegularModal;

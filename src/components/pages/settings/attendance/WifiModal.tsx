import { Modal, useModal } from "@/components/ui/Modal";
import Api from "@/services/Api";
import {
  ArrowDown03Icon,
  Delete01Icon,
  Delete02Icon,
  InformationCircleIcon,
  Wifi02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { App } from "antd";
import { AttendanceTypes } from "@/enums";
import { DeleteOutlined } from "@ant-design/icons";

const WifiModal = ({
  open,
  setOpen,
  selectedBranch,
  selectedWifiAttendance,
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
      console.log("-->", selectedBranch, selectedWifiAttendance);
      form.resetFields();
      if (mode == "create") {
        form.setFieldsValue({
          name: selectedBranch?.name,
          branch_id: selectedBranch?.id,
        });
      } else if (mode == "update") {
        console.log("selectedWifiAttendance", selectedWifiAttendance);
        form.setFieldsValue({
          name: selectedWifiAttendance?.branch_name,
          branch_id: selectedWifiAttendance?.wifi?.branch_id,
          detail: selectedWifiAttendance?.wifi?.detail,
        });
      }
    }
  }, [open]);

  const handleCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.post("/company/location", {
          type: AttendanceTypes.WIFI,
          ...values,
        })
          .then(() => {
            message.success("Wi-Fi бүртгэл нэмэгдлээ");
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

  const handleUpdate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSaving(true);
        await Api.put(`/company/location/${selectedWifiAttendance?.wifi?.id}`, {
          branch_id: values.branch_id,
          type: AttendanceTypes.WIFI,
          detail: values.detail,
        })
          .then(() => {
            message.success("Wi-Fi бүртгэл шинэчлэгдлээ");
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

  const handleDeleteWifi = () => {
    confirm({
      title: "Баталгаажуулах",
      description: "Wi-Fi бүртгэлийг устгах уу?",
      onOk: () => {
        Api.delete(`/company/location/${selectedWifiAttendance?.wifi?.id}`)
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
      title="Wi-Fi холболтоор цаг бүртгэх"
      open={open}
      centered
      onCancel={() => setOpen(false)}
      onOk={mode === "create" ? handleCreate : handleUpdate}
      okButtonProps={{
        loading: saving,
      }}
      width={900}
      footer={
        <div className="flex gap-3">
          {mode == "update" && (
            <Button
              icon={
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={18}
                  className="flex items-center text-red"
                />
              }
              onClick={handleDeleteWifi}
              className="px-10"
            >
              Устгах
            </Button>
          )}
          <Button
            key="submit"
            loading={saving}
            onClick={mode === "create" ? handleCreate : handleUpdate}
            icon={
              <HugeiconsIcon
                icon={ArrowDown03Icon}
                size={20}
                className="flex items-center text-primary"
              />
            }
            block
          >
            Хадгал
          </Button>
        </div>
      }
    >
      <div className="flex flex-row gap-[50px]">
        <div>
          <Form form={form} layout="vertical" className="w-[340px]">
            <Form.Item name="branch_id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="name"
              label="Цаг бүртгэх байршил"
              rules={[{ required: true, message: "Заавал оруулна уу" }]}
            >
              <Input placeholder="Цаг бүртгэх байршил" readOnly />
            </Form.Item>
            <Form.Item
              name={["detail", "wifi_name"]}
              label="Байгууллагын Wi-Fi нэр"
              rules={[{ required: true, message: "Заавал оруулна уу" }]}
            >
              <Input placeholder="Wi-Fi нэр" />
            </Form.Item>
            <Form.Item
              name={["detail", "wifi_mac"]}
              label="MAC ID дугаар / сонголтоор"
              rules={[{ required: false, message: "Заавал оруулна уу" }]}
            >
              <Input placeholder="3a:21:58:93:56:52" />
            </Form.Item>
          </Form>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-[5px]">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={20}
                className="text-warning"
              />
              <h3>Wi-Fi нэр</h3>
            </div>
            <span className="text-secondary">
              Байгууллагын Wi Fi нэрний том жижиг үсэг, хоорондын зай, цэг,
              таслалыг ижил бичиж оруулахыг анхаараарай
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-[5px]">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={20}
                className="text-warning"
              />
              <h3>MAC ID</h3>
            </div>
            <span className="text-secondary">
              MAC ID-н интернэт цацаж буй Router-н давтагдашгүй дугаар бөгөөд
              ижил нэртэй Wi-Fi төхөөрөмжөөс цаг бүртгүүлэх боломжийг
              хязгаарлана
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-secondary">
              MAC ID-г сүлжээний Router мэдээллээс харах шаардлагатай тул
              мэдээлэл технологийн ажилтнаасаа тусламж авахыг зөвлөж байна
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WifiModal;

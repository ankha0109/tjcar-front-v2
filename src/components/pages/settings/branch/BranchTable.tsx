"use client";

import { openGuide } from "@/components/modal/guideBus";
import ContinueButton from "@/components/ui/button/ContinueButton";
import InfoButton from "@/components/ui/button/InfoButton";
import PlusButton from "@/components/ui/button/PlusButton";
import TrashButton from "@/components/ui/button/TrashButton";
import { Modal, useModal } from "@/components/ui/Modal";
import Api from "@/services/Api";
import { BranchItem, PaginatedResponse } from "@/types";
import { PencilEdit02Icon } from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { App, Button, Empty, Form, Input, Table, TableColumnsType } from "antd";
import { useState } from "react";

const BranchTable = () => {
  const { confirm } = useModal();
  const { message } = App.useApp();
  const [createBranchForm] = Form.useForm();

  const [saving, setSaving] = useState(false);

  // Create States
  const [createLoading, setCreateLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  // Update States
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateBranchForm] = Form.useForm();

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2);

  const {
    data: branches,
    refetch,
    isLoading,
  } = useQuery<PaginatedResponse<BranchItem[]>>({
    queryKey: ["branch", { page, pageSize }],
    queryFn: async () =>
      Api.get("/branch", { current_page: page, per_page: pageSize }),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    // keepPreviousData: true, // хуудсуудын хооронд flicker багасгана
    // staleTime: 30_000,      // 30s шинэ гэж тооц
  });

  const columns: TableColumnsType = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: 50,
      align: "center",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Салбарын нэр",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Засах",
      dataIndex: "edit",
      key: "edit",
      width: 60,
      align: "end",
      render: (text, record) => (
        <Button
          icon={
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={20}
              className="flex items-center text-green"
            />
          }
          onClick={() => {
            updateBranchForm.setFieldsValue({
              name: record.name,
              id: record.id,
            });
            setUpdateModal(true);
          }}
        />
      ),
    },
    {
      title: "Устгах",
      dataIndex: "delete",
      key: "delete",
      width: 60,
      align: "start",
      render: (text, record) => (
        <TrashButton onClick={() => showConfirm(record.id)} />
      ),
    },
  ];

  const handleCreate = async () => {
    await createBranchForm
      .validateFields()
      .then(async (values) => {
        setCreateLoading(true);

        await Api.post("/branch", values)
          .then((res) => {
            message.success("Салбар үүсгэлээ.");
            setCreateModal(false);
            createBranchForm.resetFields();
            // After create jump to first page to ensure the new item is visible (adjust if API returns sort order)
            setPage(1);
            refetch();
          })
          .catch((err) => {
            console.log(err);
            createBranchForm.setFields([
              {
                name: "name",
                errors: [err?.message],
              },
            ]);
          })
          .finally(() => {
            setCreateLoading(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleUpdate = async () => {
    await updateBranchForm
      .validateFields()
      .then(async (values) => {
        setUpdateLoading(true);

        await Api.put(`/branch/`, values)
          .then((res) => {
            message.success("Салбар шинэчлэгдлээ.");
            setUpdateModal(false);
            updateBranchForm.resetFields();
            refetch();
          })
          .catch((err) => {
            console.log(err);
            updateBranchForm.setFields([
              {
                name: "name",
                errors: [err?.message],
              },
            ]);
          })
          .finally(() => {
            setUpdateLoading(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const showConfirm = (id: string) => {
    confirm({
      title: "Баталгаажуулалт",
      description: "Та тухайн Салбарыг устгахдаа итгэлтэй байна уу ?",
      onOk: async () => {
        try {
          await handleDelete(id);
        } catch {
          console.log("Oops errors!");
        }
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const handleDelete = async (id: string) => {
    await Api.delete(`/branch/${id}`)
      .then((res) => {
        message.success("Салбар устгагдлаа.");
        if (branches && branches.data.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          refetch();
        }
      })
      .catch((err) => {
        console.log(err);
        message.error("Алдаа гарлаа.");
      });
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-row items-center gap-1 justify-between">
        <h3 className="text-lg m-0 font-medium">Салбар үүсгэх</h3>

        <div className="flex flex-row gap-[15px]">
          <PlusButton onClick={() => setCreateModal(true)}>
            Салбар үүсгэх
          </PlusButton>
          <InfoButton
            onClick={() => {
              openGuide({
                title: "Салбар үүсгэх шалтгаан",
                description: (
                  <div>
                    <p>
                      Хэдэн ч салбар үүсгэж болох ба салбар бүр нь ажилчдын цаг
                      бүртгэх байршлыг илэрхийлнэ
                    </p>
                    <ul className="list-inside list-disc">
                      <li>Оффис</li>
                      <li>Дэлгүүр - 1</li>
                      <li>Дэлгүүр - 2</li>
                      <li>Агуулах / Амгалан</li>
                      <li>Гүний өрмийн байршил</li>
                    </ul>
                  </div>
                ),
                width: 580,
                okText: "Ойлголоо",
              });
            }}
          >
            Салбар үүсгэх шалтгаан
          </InfoButton>
          <ContinueButton
            onClick={() => {
              setSaving(true);
              setTimeout(() => {
                setSaving(false);
              }, 20000);
            }}
            loading={saving}
          >
            Үргэлжлүүл
          </ContinueButton>
        </div>
      </div>

      <div className="">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={branches?.data}
          loading={isLoading}
          pagination={{
            current: branches?.current_page,
            pageSize: branches?.per_page,
            total: branches?.total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Салбар үүсээгүй байна"
              />
            ),
          }}
        />
      </div>

      <Modal
        title="Салбар үүсгэх"
        open={createModal}
        centered
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        okButtonProps={{
          loading: createLoading,
        }}
        width={480}
      >
        <Form form={createBranchForm} layout="vertical">
          <Form.Item
            name="name"
            label="Салбараа нэрлэнэ үү"
            rules={[{ required: true, message: "Салбараа нэрлэнэ үү" }]}
          >
            <Input placeholder="Оффис / Хан-Уул" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Салбар засах"
        open={updateModal}
        centered
        onCancel={() => {
          setUpdateModal(false);
          updateBranchForm.resetFields();
        }}
        onOk={handleUpdate}
        okButtonProps={{
          loading: updateLoading,
        }}
        width={480}
      >
        <Form form={updateBranchForm} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Салбараа нэрлэнэ үү"
            rules={[{ required: true, message: "Салбараа нэрлэнэ үү" }]}
          >
            <Input placeholder="Салбараа нэрлэнэ үү" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};

export default BranchTable;

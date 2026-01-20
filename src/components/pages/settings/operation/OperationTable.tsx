"use client";

import ContinueButton from "@/components/ui/button/ContinueButton";
import InfoButton from "@/components/ui/button/InfoButton";
import PlusButton from "@/components/ui/button/PlusButton";
import { useModal } from "@/components/ui/Modal";
import { OperationIdTypes, OperationTypeLabels, OperationTypes } from "@/enums";
import Api from "@/services/Api";
import {
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import {
  App,
  Button,
  Dropdown,
  Empty,
  Form,
  MenuProps,
  Table,
  TableColumnsType,
} from "antd";
import { useState } from "react";
import OperationRegularModal from "./OperationRegularModal";
import OperationFlexibleModal from "./OperationFlexibleModal";
import { OperationsProps, PaginatedResponse } from "@/types";
import TrashButton from "@/components/ui/button/TrashButton";

const OperationTable = () => {
  const { confirm } = useModal();
  const { message } = App.useApp();

  const [saving, setSaving] = useState(false);

  // Modal states
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [createModal, setCreateModal] = useState({
    [OperationTypes.SIMPLE]: false,
    [OperationTypes.FLEXIBLE]: false,
    [OperationTypes.SHIFT]: false,
    [OperationTypes.IRREGULAR]: false,
  });
  const [updateData, setUpdateData] = useState<any>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: rosters,
    refetch,
    isLoading,
  } = useQuery<PaginatedResponse<OperationsProps[]>>({
    queryKey: ["roster", { page, pageSize }],
    queryFn: async () =>
      await Api.get("/roster", {
        current_page: page,
        per_page: pageSize,
      }),
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
      title: "Цагийн хуваарийн нэр",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Цагийн хуваарийн төрөл",
      dataIndex: "type",
      key: "type",
      render: (text, record) =>
        OperationTypeLabels[text as keyof typeof OperationTypeLabels],
    },
    {
      title: "Хуваарийн цикл",
      dataIndex: "cycle_length",
      key: "cycle_length",
      render: (text, record) => `${text} хоногоор`,
    },
    {
      title: "Ажлын",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Амралтын",
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
            setModalMode("update");
            console.log(record);
            setUpdateData(record);
            if (record.type === OperationIdTypes.REGULAR) {
              setCreateModal({
                ...createModal,
                [OperationTypes.SIMPLE]: true,
              });
            }
            if (record.type === OperationIdTypes.FLEXIBLE) {
              setCreateModal({
                ...createModal,
                [OperationTypes.FLEXIBLE]: true,
              });
            }
            if (record.type === OperationIdTypes.SHIFT) {
              setCreateModal({
                ...createModal,
                [OperationTypes.SHIFT]: true,
              });
            }
            if (record.type === OperationIdTypes.IRREGULAR) {
              setCreateModal({
                ...createModal,
                [OperationTypes.IRREGULAR]: true,
              });
            }
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

  const showConfirm = (id: string) => {
    confirm({
      title: "Баталгаажуулалт",
      description: "Та тухайн <b>Ээлжийг</b> устгахдаа итгэлтэй байна уу ?",
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
    await Api.delete(`/roster/${id}`)
      .then((res) => {
        message.success("Цагийн хуваарь устлаа.");
        refetch();
      })
      .catch((err) => {
        console.log(err);
        message.error("Алдаа гарлаа.");
      });
  };

  const handleMenuClick = (e: any) => {
    console.log(e);
    switch (e.key) {
      case OperationTypes.SIMPLE:
        setModalMode("create");
        setCreateModal({
          ...createModal,
          [OperationTypes.SIMPLE]: true,
        });
        break;
      case OperationTypes.FLEXIBLE:
        setModalMode("create");
        setCreateModal({
          ...createModal,
          [OperationTypes.FLEXIBLE]: true,
        });
        break;
      case OperationTypes.SHIFT:
        setModalMode("create");
        setCreateModal({
          ...createModal,
          [OperationTypes.SHIFT]: true,
        });
        break;
      case OperationTypes.IRREGULAR:
        setModalMode("create");
        setCreateModal({
          ...createModal,
          [OperationTypes.IRREGULAR]: true,
        });
        break;

      default:
        break;
    }
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-row items-center gap-1 justify-between">
        <h3 className="text-lg m-0 font-medium">Цагийн хуваарийн тохиргоо</h3>

        <div className="flex flex-row gap-4">
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            trigger={["click"]}
          >
            <PlusButton>Цагийн хуваарийн загвар үүсгэх</PlusButton>
          </Dropdown>
          <InfoButton>
            Цагийн хуваарийн загвар үүсгэхэд анхаарах зүйлс
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
          loading={isLoading}
          dataSource={rosters?.data}
          pagination={{
            current: rosters?.current_page,
            pageSize: rosters?.per_page,
            total: rosters?.total,
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
                description="Цагийн хуваарийн загвар үүсээгүй байна"
              />
            ),
          }}
        />
      </div>

      <OperationRegularModal
        open={createModal[OperationTypes.SIMPLE]}
        setOpen={setCreateModal}
        refetch={refetch}
        mode={modalMode}
        updateData={updateData}
      />

      <OperationFlexibleModal
        open={createModal[OperationTypes.FLEXIBLE]}
        setOpen={setCreateModal}
        refetch={refetch}
        mode={modalMode}
        updateData={updateData}
      />
    </section>
  );
};

export default OperationTable;

const items: MenuProps["items"] = [
  {
    label: OperationTypeLabels[OperationTypes.SIMPLE],
    key: OperationTypes.SIMPLE,
  },
  {
    label: OperationTypeLabels[OperationTypes.FLEXIBLE],
    key: OperationTypes.FLEXIBLE,
  },
  {
    label: OperationTypeLabels[OperationTypes.SHIFT],
    key: OperationTypes.SHIFT,
  },
  {
    label: OperationTypeLabels[OperationTypes.IRREGULAR],
    key: OperationTypes.IRREGULAR,
  },
];

"use client";

import ContinueButton from "@/components/ui/button/ContinueButton";
import InfoButton from "@/components/ui/button/InfoButton";
import PlusButton from "@/components/ui/button/PlusButton";
import { Modal, useModal } from "@/components/ui/Modal";
import { Colors } from "@/constants/Colors";
import Api from "@/services/Api";
import { ExclamationCircleFilled, UserOutlined } from "@ant-design/icons";
import {
  ArrowDown03Icon,
  ArrowRight01Icon,
  CenterFocusIcon,
  Delete02Icon,
  DeleteIcon,
  EditIcon,
  FaceIdIcon,
  InformationCircleIcon,
  Location04Icon,
  LocationUser02Icon,
  PencilEdit02Icon,
  Wifi02Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import {
  App,
  Button,
  Dropdown,
  Empty,
  Form,
  Input,
  MenuProps,
  Table,
  TableColumnsType,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import WifiModal from "@/components/pages/settings/attendance/WifiModal";
import LocationModal from "@/components/pages/settings/attendance/LocationModal";
import { AttendanceTypes } from "@/enums";
import {
  AttendanceLocationItemProps,
  AttendanceLocationProps,
  AttendanceWifiProps,
  PaginatedResponse,
} from "@/types";

const AttendanceTable = () => {
  const { confirm } = useModal();
  const { message } = App.useApp();

  const [saving, setSaving] = useState(false);

  // Wifi Modal States
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [selectedBranch, setSelectedBranch] = useState<any>({
    location: null,
    branch_name: null,
  });
  const [selectedWifiAttendance, setSelectedWifiAttendance] = useState<{
    branch_name: string;
    wifi: AttendanceWifiProps;
  } | null>(null);
  const [selectedLocationAttendance, setSelectedLocationAttendance] = useState<{
    branch_name: string;
    location: AttendanceLocationItemProps;
  } | null>(null);

  // Location Modal States
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: locations,
    refetch,
    isLoading,
  } = useQuery<PaginatedResponse<AttendanceLocationProps[]>>({
    queryKey: ["branch", { page, pageSize }],
    queryFn: async () =>
      Api.get("/branch", {
        include: "locations,locationsCount,locationsExists",
        current_page: page,
        per_page: pageSize,
      }),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    // keepPreviousData: true, // хуудсуудын хооронд flicker багасгана
    // staleTime: 30_000,      // 30s шинэ гэж тооц
  });

  useEffect(() => {
    if (wifiModalOpen == false) {
      setSelectedBranch(null);
    }
  }, [wifiModalOpen]);

  const handleMenuClick = (e: any, record: any) => {
    setModalMode("create");
    setSelectedBranch(record);

    if (e.key === "wifi") {
      setWifiModalOpen(true);
    } else if (e.key === "location") {
      setLocationModalOpen(true);
    }
  };

  const RenderAttendanceButton = (location: any, branch_name: string) => {
    const config = attendanceTypeConfig[location.type];
    if (!config) return null;

    return (
      <Tooltip key={location.id} title={config.getTooltip(location)}>
        <Button
          icon={config.icon}
          onClick={() => {
            setModalMode("update");

            if (location.type === AttendanceTypes.LOCATION) {
              setSelectedLocationAttendance({
                branch_name: branch_name,
                location: location,
              });
              setLocationModalOpen(true);
            } else if (location.type === AttendanceTypes.WIFI) {
              setSelectedWifiAttendance({
                branch_name: branch_name,
                wifi: location,
              });
              setWifiModalOpen(true);
            }
          }}
        />
      </Tooltip>
    );
  };

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
      title: "Цаг бүртгэх байршил",
      dataIndex: "name",
      key: "name",
      width: 400,
    },
    {
      title: "Цаг бүртгэх төрөл",
      dataIndex: "locations",
      key: "locations",
      render: (val, record) => (
        <div className="flex gap-2">
          {val?.map((location: any) =>
            RenderAttendanceButton(location, record.name)
          )}
        </div>
      ),
    },
    {
      title: "",
      dataIndex: "",
      key: "",
      width: 220,
      align: "right",
      render: (text, record) => {
        const hasLocation = record.locations?.some(
          (loc: any) => loc.type === AttendanceTypes.LOCATION
        );

        const items: MenuProps["items"] = [
          {
            label: "Газрын зураг дээрх байршлаар",
            key: "location",
            icon: (
              <HugeiconsIcon
                icon={Location04Icon}
                size={16}
                color={Colors.text}
                strokeWidth={1.2}
                className={hasLocation ? "opacity-40" : ""}
              />
            ),
            disabled: hasLocation,
          },
          {
            label: "Байгууллагын Wi-Fi холболтоор",
            key: "wifi",
            icon: (
              <HugeiconsIcon
                icon={Wifi02Icon}
                size={16}
                color={Colors.text}
                strokeWidth={1.2}
              />
            ),
          },
          {
            label: "Царай таних төхөөрөмжөөр",
            key: "biometric",
            icon: (
              <HugeiconsIcon
                icon={CenterFocusIcon}
                size={16}
                color={Colors.text}
                strokeWidth={1.2}
                className="opacity-40"
              />
            ),
            disabled: true,
          },
        ];

        return (
          <Dropdown
            menu={{ items, onClick: (e) => handleMenuClick(e, record) }}
            trigger={["click"]}
          >
            <PlusButton>Цаг бүртгэх төрөл үүсгэх</PlusButton>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-row items-center gap-1 justify-between">
        <h3 className="text-lg m-0 font-medium">
          Цаг бүртгэх байршлын тохиргоо
        </h3>

        <div className="flex flex-row gap-4">
          <InfoButton>Тохиргооны заавар</InfoButton>
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
          dataSource={locations?.data}
          loading={isLoading}
          pagination={{
            current: locations?.current_page,
            pageSize: locations?.per_page,
            total: locations?.total,
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

      <WifiModal
        open={wifiModalOpen}
        setOpen={setWifiModalOpen}
        selectedBranch={selectedBranch}
        selectedWifiAttendance={selectedWifiAttendance}
        refetch={refetch}
        mode={modalMode}
      />
      <LocationModal
        open={locationModalOpen}
        setOpen={setLocationModalOpen}
        selectedBranch={selectedBranch}
        selectedLocationAttendance={selectedLocationAttendance}
        refetch={refetch}
        mode={modalMode}
      />
    </section>
  );
};

const attendanceTypeConfig: Record<
  string,
  { icon: React.ReactNode; getTooltip: (location: any) => string }
> = {
  [AttendanceTypes.LOCATION]: {
    icon: (
      <HugeiconsIcon
        icon={Location04Icon}
        strokeWidth={1.2}
        size={18}
        className="flex items-center text-primary"
      />
    ),
    getTooltip: (location) => location.name,
  },
  [AttendanceTypes.WIFI]: {
    icon: (
      <HugeiconsIcon
        icon={Wifi02Icon}
        strokeWidth={1.2}
        size={18}
        className="flex items-center text-primary"
      />
    ),
    getTooltip: (location) => location.detail?.wifi_name || "",
  },
  [AttendanceTypes.BIOMETRIC]: {
    icon: (
      <HugeiconsIcon
        icon={CenterFocusIcon}
        strokeWidth={1.2}
        size={18}
        className="flex items-center text-primary"
      />
    ),
    getTooltip: (location) => location.detail?.biometric_name || "",
  },
};

export default AttendanceTable;

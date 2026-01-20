"use client";

import HeaderComponent from "@/components/ui/HeaderComponent";
import HeaderTitle from "@/components/ui/HeaderTitle";
import {
  Appointment01Icon,
  DateTimeIcon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Table, TableColumnsType } from "antd";

interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
  description: string;
  // Сарын өдрүүдийн талбарууд (1-31)
  [key: `day_${number}`]: any;
}

const TimeSheetPlanningTable = () => {
  // Сарын өдрүүдийн багануудыг үүсгэх
  const generateDateColumns = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dateColumns = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dateColumns.push({
        title: day.toString(),
        dataIndex: `day_${day}`,
        key: `day_${day}`,
        width: 30,
        align: "center" as const,
      });
    }
    return dateColumns;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: 45,
      fixed: "left" as const,
      
    },
    {
      title: "Ажилтан",
      dataIndex: "name",
      key: "name",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "Хуваарь",
      dataIndex: "description",
      key: "description",
      width: 120,
      fixed: "left" as const,
    },
    {
      title: (
        <HugeiconsIcon
          icon={DateTimeIcon}
          size={20}
          className="flex items-center"
        />
      ),
      dataIndex: "actions",
      key: "actions",
      width: 80,
      fixed: "left" as const,
      defaultSortOrder: "descend",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: (
        <HugeiconsIcon
          icon={Appointment01Icon}
          size={20}
          className="flex items-center"
        />
      ),
      dataIndex: "actions2",
      key: "actions2",
      width: 80,
      fixed: "left" as const,
      defaultSortOrder: "descend",
      sorter: (a, b) => a.age - b.age,
    },
    ...generateDateColumns(),
  ];

  return (
    <Table
      columns={columns}
      dataSource={[]}
      scroll={{ x: 2000 }}
      size="small"
    />
  );
};

export default TimeSheetPlanningTable;

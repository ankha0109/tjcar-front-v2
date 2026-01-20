"use client";

// import { Notification02Icon } from "@hugeicons-pro/core-duotone-rounded";
import {
  Agreement03Icon,
  Appointment01Icon,
  Calculator01Icon,
  Clock01Icon,
  MailReceive01Icon,
  Notification02Icon,
  PresentationBarChart01Icon,
  SentIcon,
  UserMultipleIcon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { type MenuProps } from "antd";
import { TugrigIcon } from "../icons/TugrigIcon";
import NavMenuProvider from "./NavMenuProvider";

const ExtraBellIcon = () => (
  <HugeiconsIcon icon={Notification02Icon} size={20} color="#EE5700" />
);

const items: NonNullable<MenuProps["items"]> = [
  {
    key: "/",
    icon: (
      <HugeiconsIcon
        icon={PresentationBarChart01Icon}
        size={22}
        strokeWidth={1.5}
        // className={cn("text-comet", pathname === link && "text-[#222222]")}
      />
    ),
    label: "Мэдээллийн самбар",
    className: "menu-has-notification",
  },
  { type: "divider" },
  {
    key: "/decisions",
    icon: (
      <HugeiconsIcon
        icon={Agreement03Icon}
        size={22}
        strokeWidth={1.5}
        // className={cn("text-comet", pathname === link && "text-[#222222]")}
      />
    ),
    label: "Тушаал шийдвэр",
    className: "menu-has-notification",
  },
  {
    key: "/employees-root",
    label: "Ажилтны хүснэгт",
    icon: <HugeiconsIcon icon={UserMultipleIcon} size={22} strokeWidth={1.5} />,
    children: [
      { key: "/employees/positions-planning", label: "Орон тоо төлөвлөлт" },
      { key: "/employees/senior-planning", label: "Ахлах ажилтан төлөвлөлт" },
      { key: "/employees", label: "Ажилтны хүснэгт" },
      { key: "/employees/contracts", label: "Хөдөлмөрийн гэрээний нэгтгэл" },
    ],
    className: "amar-navmenu menu-has-notification",
  },

  {
    key: "/requests",
    icon: (
      <HugeiconsIcon
        icon={MailReceive01Icon}
        size={22}
        strokeWidth={1.5}
        // className={cn("text-comet", pathname === link && "text-[#222222]")}
      />
    ),
    label: "Өргөдөл хүсэлт",
    className: "menu-has-notification",
  },
  {
    key: "/announcements",
    icon: (
      <HugeiconsIcon
        icon={SentIcon}
        size={22}
        strokeWidth={1.5}
        // className={cn("text-comet", pathname === link && "text-[#222222]")}
      />
    ),
    label: "Зарлал мэдээлэл",
  },
  { type: "divider" },
  {
    key: "/roster",
    icon: (
      <HugeiconsIcon
        icon={Appointment01Icon}
        size={22}
        strokeWidth={1.5}
        // className={cn("text-comet", pathname === link && "text-[#222222]")}
      />
    ),
    label: "Цаг төлөвлөлт",
  },

  {
    key: "/timesheets-root",
    label: "Цаг бүртгэл",
    icon: <HugeiconsIcon icon={Clock01Icon} size={22} strokeWidth={1.5} />,
    children: [
      {
        key: "/timesheets",
        label: "Цаг бүртгэл",
        extra: <div className="submenu-has-notification" />,
      },
      {
        key: "/timesheets/attendance-report",
        label: "Цагийн тайлан",
        extra: <div className="submenu-has-notification" />,
      },
      // {
      //   key: "/timesheets/vacation-planning",
      //   label: "Ээлжийн амралт төлөвлөлт",
      // },
    ],
    className: "menu-has-notification",
  },
  { type: "divider" },
  {
    key: "/budget",
    icon: <TugrigIcon size={22} />,
    label: "Төсөв, төсвийн гүйцэтгэл",

    // children: [{ key: "/budget", label: "Төсөв, төсвийн гүйцэтгэл" }],
  },
  {
    key: "/salary-root",
    icon: <HugeiconsIcon icon={Calculator01Icon} size={22} strokeWidth={1.5} />,
    label: "Цалин",
    className: "menu-has-notification",
    children: [
      {
        key: "/salary/advance",
        label: "Урьдчилгаа цалин",
        extra: <div className="submenu-has-notification" />,
      },
      {
        key: "/salary/performance-bonus",
        label: "Гүйцэтгэлийн нэмэгдэл",
        extra: <div className="submenu-has-notification" />,
      },
      { key: "/salary/deduction", label: "Суутгал" },
      {
        key: "/salary",
        label: "Цалин тооцоолол",
        extra: <div className="submenu-has-notification" />,
      },
    ],
  },
];

const NavMenu = () => {
  return (
    <div className="flex-1 overflow-auto no-scrollbar">
      <NavMenuProvider items={items} />
    </div>
  );
};

export default NavMenu;

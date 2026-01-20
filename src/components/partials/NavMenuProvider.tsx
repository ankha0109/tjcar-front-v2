import { ConfigProvider, Menu, MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";

const NavMenuProvider = ({ items }: { items?: MenuProps["items"] }) => {
  const router = useRouter();
  const pathname = usePathname();

  const RenderDivider = () => (
    <div className="h-px bg-comet w-9 mx-auto my-[15px]" />
  );

  const onClick: MenuProps["onClick"] = (e) => {
    const { key } = e;
    if (key) {
      router.push(key);
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemHeight: 44,
            collapsedIconSize: 22,
            iconMarginInlineEnd: 0,
            itemMarginBlock: 0,
            itemMarginInline: 0,
            itemBg: "transparent",
            itemBorderRadius: 0,
            subMenuItemBorderRadius: 0,
            // itemHoverBg: "#fff",

            // Selected Colors
            itemColor: "#222222",
            colorPrimary: "#222222",
            colorText: "#222222", // Hover text color
            itemSelectedBg: "#fff",
            // itemSelectedBg: "transparent",
            // subMenuItemSelectedColor: "#222222",
            dropdownWidth: 260,
            boxShadow: "none",
          },
        },
      }}
    >
      <Menu
        selectedKeys={[pathname || "/"]}
        onClick={onClick}
        mode="inline"
        items={items}
        inlineCollapsed={true}
        style={{
          width: "100%",
        }}
        className="amar-navmenu border-none"
      />
    </ConfigProvider>
  );
};

export default NavMenuProvider;

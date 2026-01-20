import React, { useEffect, useState } from "react";
import { Cascader, CascaderProps } from "antd";
import { DefaultOptionType } from "antd/es/select";
import Api from "@/services/Api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CancelCircleIcon,
  Delete01Icon,
  Rotate01Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";

// type AddressObject = {
//   aimag?: string;
//   soum?: string;
//   khoroo?: string;
// };

type AddressCascaderProps = {
  value?: (string | number | null)[];
  onChange?: (value: (string | number | null)[]) => void;
  [key: string]: any;
  suffixIcon?: React.ReactNode;
};

const AddressCascader: React.FC<AddressCascaderProps> = ({
  value,
  onChange,
  ...rest
}) => {
  let suffixIcon;

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<DefaultOptionType[]>([]);

  const { data: aimaghot } = useQuery({
    queryKey: ["aimag-hot"],
    queryFn: async () => {
      const response = await Api.get("/aimag-hot");
      setOptions(response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const loadData = async (selectedOptions: DefaultOptionType[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;

    if (selectedOptions.length === 1) {
      await Api.get("/sum-duureg", { aimag_hot: targetOption.value }).then(
        (response) => {
          targetOption.loading = false;
          // response.data-г Cascader option-ууд шиг (value, label, isLeaf) structure-р авах ёстой
          targetOption.children = response.data;
          setOptions([...options]);
        }
      );
    } else if (selectedOptions.length === 2) {
      await Api.get("/bag-horoo", {
        aimag_hot: selectedOptions[0].value,
        sum_duureg: selectedOptions[1].value,
      }).then((response) => {
        targetOption.loading = false;
        // response.data-г Cascader option-ууд шиг (value, label, isLeaf) structure-р авах ёстой
        targetOption.children = response.data;
        setOptions([...options]);
      });
    }
  };

  if (open) {
    suffixIcon = (
      <HugeiconsIcon
        icon={ArrowUp01Icon}
        size={20}
        strokeWidth={1.2}
        color="#222222"
      />
    );
  } else {
    suffixIcon = (
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={20}
        strokeWidth={1.2}
        color="#222222"
      />
    );
  }

  return (
    <Cascader
      allowClear={{
        clearIcon: (
          <HugeiconsIcon
            icon={CancelCircleIcon}
            size={16}
            strokeWidth={1.2}
            color="#B4B4B4"
          />
        ),
      }}
      options={options}
      loadData={loadData}
      value={value}
      onChange={onChange}
      // changeOnSelect
      placeholder="Хаяг сонгох"
      suffixIcon={suffixIcon}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
      expandIcon={
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={20}
          strokeWidth={1.2}
          color="#222222"
        />
      }
      loadingIcon={
        <HugeiconsIcon
          icon={Rotate01Icon}
          size={20}
          strokeWidth={1.2}
          color="#222222"
          // className="animate-spin"
        />
      }
      // multiple-г бүү дамжуул!
      {...rest}
    />
  );
};

export default AddressCascader;

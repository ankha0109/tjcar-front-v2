import { Select } from "antd";

interface BreakfastSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const BreakfastSelect: React.FC<BreakfastSelectProps> = ({
  value,
  onChange,
  placeholder = "00:00",
  className = "w-full",
  disabled = false,
}) => {
  return (
    <Select
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <Select.Option value="00:00">Цаггүй</Select.Option>
      <Select.Option value="00:30">00:30</Select.Option>
      <Select.Option value="01:00">01:00</Select.Option>
      <Select.Option value="01:30">01:30</Select.Option>
      <Select.Option value="02:00">02:00</Select.Option>
    </Select>
  );
};

export default BreakfastSelect;

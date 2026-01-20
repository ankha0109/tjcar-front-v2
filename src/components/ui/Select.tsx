import { QuestionCircleOutlined, SmileOutlined } from "@ant-design/icons";
import { Select } from "antd";

const AmarSelect = ({ ...props }) => {
  let suffixIcon;
  if (props.open) {
    suffixIcon = <SmileOutlined />;
  } else {
    suffixIcon = <QuestionCircleOutlined />;
  }

  return <Select {...props} suffixIcon={suffixIcon} />;
};

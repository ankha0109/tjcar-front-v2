export const phoneValidate = [
  {
    required: true,
    message: "Утасны дугаар заавал оруулна уу",
  },
  {
    len: 8,
    message: "Утасны дугаар зөв оруулна уу",
  },
  {
    pattern: /^[0-9]+$/,
    message: "Утасны дугаар зөв оруулна уу",
  },
];

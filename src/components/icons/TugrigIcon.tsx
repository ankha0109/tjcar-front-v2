import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const TugrigIcon: React.FC<IconProps> = ({ size = 22, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.2526 10.9974L11.0026 9.81882M11.0026 9.81882L14.6693 8.2474M11.0026 9.81882V13.4855M11.0026 9.81882V3.66406M8.2526 14.6641L11.0026 13.4855M11.0026 13.4855L14.6693 11.9141M11.0026 13.4855V18.3307M11.0026 3.66406H4.58594M11.0026 3.66406H17.4193"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

import { cn } from "@/utils";

/**
 * Duotone quick-spec glyphs shared by the Japan detail page and the listing
 * cards, so both read the same vocabulary. Each is a 24-unit grid: a 14 %
 * `currentColor` fill behind a 1.5-weight stroke, which survives being scaled
 * down to the ~15px the cards use.
 */
export type SpecIconProps = {
  /** Rendered box in px. Detail-page tiles use 20, cards ~15. */
  size?: number;
  className?: string;
};

/** Duotone engine glyph for the engine quick-spec tile. */
export function EngineIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        d="M16 8H6V16H8L10 19H18V10L16 8Z"
        fill="currentColor"
      />
      <path
        d="M14 8V5M11 5H17M6 12H3M3 9V15M21 11V19M9 12H9.01M12 12H12.01M15 12H15.01M6 8V16H8L10 19H18V10L16 8H6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone car-front glyph for the production-year quick-spec tile. */
export function YearIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        d="M21 18.5V12.5623C21 11.8661 20.8183 11.1821 20.473 10.5777L19.6452 9.12903L18.2781 10.2682C18.0984 10.418 17.8719 10.5 17.6379 10.5H6.36205C6.12811 10.5 5.90158 10.418 5.72187 10.2682L4.35484 9.12903L3.52703 10.5777C3.18166 11.1821 3 11.8661 3 12.5623V18.5C3 19.0523 3.44772 19.5 4 19.5H5C5.55228 19.5 6 19.0523 6 18.5V17.5H18V18.5C18 19.0523 18.4477 19.5 19 19.5H20C20.5523 19.5 21 19.0523 21 18.5Z"
        fill="currentColor"
      />
      <path
        d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone speedometer glyph for the mileage quick-spec tile. */
export function MileageIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 17C13.1046 17 14 16.1046 14 15C14 13.8954 13.1046 13 12 13C10.8954 13 10 13.8954 10 15C10 16.1046 10.8954 17 12 17Z"
        fill="currentColor"
      />
      <path
        d="M13 13L16 8M8 8H8.01M12 6H12.01M18 12H18.01M6 12H6.01M14 15C14 16.1046 13.1046 17 12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone gear-shift (H-pattern) glyph for the transmission quick-spec tile. */
export function TransmissionIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle opacity="0.14" cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8L8 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 8L16 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone steering-wheel glyph for the drive-side quick-spec tile. */
export function DriveIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle opacity="0.14" cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13Z"
        fill="currentColor"
      />
      <path
        d="M4 14L12 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14L12 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3V10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone drivetrain glyph (two axles + central driveshaft) for the drivetrain tile. */
export function DrivetrainIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.5 4.5C5.67157 4.5 5 5.17157 5 6V8C5 8.82843 5.67157 9.5 6.5 9.5C7.32843 9.5 8 8.82843 8 8V6C8 5.17157 7.32843 4.5 6.5 4.5ZM17.5 4.5C16.6716 4.5 16 5.17157 16 6V8C16 8.82843 16.6716 9.5 17.5 9.5C18.3284 9.5 19 8.82843 19 8V6C19 5.17157 18.3284 4.5 17.5 4.5ZM6.5 14.5C5.67157 14.5 5 15.1716 5 16V18C5 18.8284 5.67157 19.5 6.5 19.5C7.32843 19.5 8 18.8284 8 18V16C8 15.1716 7.32843 14.5 6.5 14.5ZM17.5 14.5C16.6716 14.5 16 15.1716 16 16V18C16 18.8284 16.6716 19.5 17.5 19.5C18.3284 19.5 19 18.8284 19 18V16C19 15.1716 18.3284 14.5 17.5 14.5Z"
        fill="currentColor"
      />
      <path
        d="M6.5 7H17.5M6.5 17H17.5M12 7V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 4.5C5.67157 4.5 5 5.17157 5 6V8C5 8.82843 5.67157 9.5 6.5 9.5C7.32843 9.5 8 8.82843 8 8V6C8 5.17157 7.32843 4.5 6.5 4.5ZM17.5 4.5C16.6716 4.5 16 5.17157 16 6V8C16 8.82843 16.6716 9.5 17.5 9.5C18.3284 9.5 19 8.82843 19 8V6C19 5.17157 18.3284 4.5 17.5 4.5ZM6.5 14.5C5.67157 14.5 5 15.1716 5 16V18C5 18.8284 5.67157 19.5 6.5 19.5C7.32843 19.5 8 18.8284 8 18V16C8 15.1716 7.32843 14.5 6.5 14.5ZM17.5 14.5C16.6716 14.5 16 15.1716 16 16V18C16 18.8284 16.6716 19.5 17.5 19.5C18.3284 19.5 19 18.8284 19 18V16C19 15.1716 18.3284 14.5 17.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone car-body (side view) glyph for the chassis (арал) quick-spec tile. */
export function ChassisIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        d="M4 11L3.99677 11.0194C3.60626 11.0434 3.32887 11.0973 3.09202 11.218C2.71569 11.4097 2.40973 11.7157 2.21799 12.092C2 12.5198 2 13.0799 2 14.2V15.4C2 15.9601 2 16.2401 2.10899 16.454C2.20487 16.6422 2.35785 16.7951 2.54601 16.891C2.75992 17 3.03995 17 3.6 17C3.82091 17 3.99571 16.8193 4.0346 16.6018C4.20909 15.6263 5.02268 15 6 15C7.10457 15 8 15.8 8 17H16C16 15.8 16.8954 15 18 15C19.1046 15 20 15.8 20 17H20.8C20.9858 17 21.0787 17 21.1564 16.9877C21.5843 16.9199 21.9199 16.5843 21.9877 16.1564C22 16.0787 22 15.9858 22 15.8C22 15.0568 22 14.6852 21.9508 14.3743C21.7054 12.8254 20.5829 11.5789 19.1034 11.155L19 11H4Z"
        fill="currentColor"
      />
      <path
        d="M8 17H16M8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17M8 17C8 15.8954 7.10457 15 6 15C4.89543 15 4 15.8954 4 17M16 17C16 18.1046 16.8954 19 18 19C19.1046 19 20 18.1046 20 17M16 17C16 15.8954 16.8954 15 18 15C19.1046 15 20 15.8954 20 17M10 5V11M4 17H3.6C3.03995 17 2.75992 17 2.54601 16.891C2.35785 16.7951 2.20487 16.6422 2.10899 16.454C2 16.2401 2 15.9601 2 15.4V14.2C2 13.0799 2 12.5198 2.21799 12.092C2.40973 11.7157 2.71569 11.4097 3.09202 11.218C3.32887 11.0973 3.60626 11.0434 3.99677 11.0194M20 17H20.8C20.9858 17 21.0787 17 21.1564 16.9877C21.5843 16.9199 21.9199 16.5843 21.9877 16.1564C22 16.0787 22 15.9858 22 15.8C22 15.0568 22 14.6852 21.9508 14.3743C21.7054 12.8254 20.5829 11.5789 19.1034 11.155M19.1034 11.155C18.9479 11.1105 18.7885 11.075 18.6257 11.0492C18.3148 11 17.9432 11 17.2 11H5.2C4.70002 11 4.31162 11 3.99677 11.0194M19.1034 11.155L16.425 7.13744C15.904 6.35597 15.6435 5.96523 15.2993 5.68236C14.9946 5.43194 14.6436 5.24406 14.2662 5.12945C13.8399 5 13.3703 5 12.4311 5H9.06621C7.6216 5 6.8993 5 6.31346 5.26281C5.79705 5.49447 5.35671 5.8675 5.0433 6.3388C4.68776 6.87345 4.56901 7.58593 4.33152 9.01088L3.99677 11.0194"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone panel glyph for the equipment (тоноглол) quick-spec tile. */
export function EquipmentIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        d="M4 7.2C4 6.0799 4 5.51984 4.21799 5.09202C4.40973 4.71569 4.71569 4.40973 5.09202 4.21799C5.51984 4 6.0799 4 7.2 4H16.8C17.9201 4 18.4802 4 18.908 4.21799C19.2843 4.40973 19.5903 4.71569 19.782 5.09202C20 5.51984 20 6.0799 20 7.2V16.8C20 17.9201 20 18.4802 19.782 18.908C19.5903 19.2843 19.2843 19.5903 18.908 19.782C18.4802 20 17.9201 20 16.8 20H7.2C6.0799 20 5.51984 20 5.09202 19.782C4.71569 19.5903 4.40973 19.2843 4.21799 18.908C4 18.4802 4 17.9201 4 16.8V7.2Z"
        fill="currentColor"
      />
      <path
        d="M8 8V12M12 8V12M7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.71569 19.2843 4.40973 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40973 4.40973 4.71569 4.21799 5.09202C4 5.51984 4 6.07989 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.07989 20 7.2 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Duotone half-filled star, shared by the exterior/interior grade tiles. */
export function RateIcon({ size = 20, className }: SpecIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        opacity="0.14"
        d="M7.63582 19.7431L11.6095 17.5188L11.6095 17.5188C11.7521 17.439 11.8233 17.3991 11.8989 17.3835C11.9323 17.3766 11.9663 17.3731 12.0002 17.3731V3.19385C11.925 3.19385 11.8497 3.21084 11.7803 3.24482C11.6207 3.32301 11.505 3.57368 11.2738 4.07502L9.36643 8.21018C9.298 8.35854 9.26378 8.43272 9.21186 8.48978C9.1659 8.54027 9.11009 8.58082 9.04786 8.60893C8.97755 8.64068 8.89643 8.6503 8.73418 8.66954L4.21201 9.20571C3.66374 9.27072 3.38961 9.30322 3.26591 9.43089C3.15841 9.54184 3.10823 9.69627 3.12999 9.84922C3.15502 10.0252 3.35769 10.2126 3.76304 10.5875L7.1064 13.6793C7.22635 13.7903 7.28633 13.8457 7.32455 13.9127C7.35837 13.9721 7.37969 14.0377 7.38719 14.1055C7.39566 14.1822 7.37974 14.2623 7.3479 14.4226L7.3479 14.4226L6.4604 18.8891C6.3528 19.4306 6.299 19.7014 6.3822 19.8585C6.4545 19.995 6.58586 20.0905 6.73805 20.117C6.91317 20.1476 7.15405 20.0128 7.63582 19.7431Z"
        fill="currentColor"
      />
      <path
        d="M12.0002 3.19376V17.373M8.73418 8.66944L4.21201 9.20562C3.66374 9.27063 3.38961 9.30313 3.26591 9.43079C3.15841 9.54175 3.10823 9.69617 3.12999 9.84913C3.15502 10.0251 3.35769 10.2125 3.76304 10.5874L7.1064 13.6792C7.22635 13.7902 7.28633 13.8456 7.32455 13.9127C7.35837 13.972 7.37969 14.0376 7.38719 14.1054C7.39566 14.1821 7.37974 14.2622 7.3479 14.4225L6.4604 18.889C6.3528 19.4306 6.299 19.7013 6.3822 19.8584C6.4545 19.9949 6.58586 20.0904 6.73805 20.1169C6.91317 20.1475 7.15405 20.0127 7.63582 19.743L11.6095 17.5187C11.7521 17.4389 11.8233 17.399 11.8989 17.3834C11.9657 17.3695 12.0347 17.3695 12.1016 17.3834C12.1771 17.399 12.2484 17.4389 12.391 17.5187L16.3647 19.743C16.8464 20.0127 17.0873 20.1475 17.2624 20.1169C17.4146 20.0904 17.546 19.9949 17.6183 19.8584C17.7015 19.7013 17.6477 19.4306 17.5401 18.889L16.6526 14.4225C16.6207 14.2622 16.6048 14.1821 16.6133 14.1054C16.6208 14.0376 16.6421 13.972 16.6759 13.9127C16.7142 13.8456 16.7741 13.7902 16.8941 13.6792L20.2374 10.5874C20.6428 10.2125 20.8455 10.0251 20.8705 9.84913C20.8922 9.69617 20.8421 9.54175 20.7346 9.43079C20.6109 9.30313 20.3367 9.27063 19.7885 9.20562L15.2663 8.66944C15.1041 8.65021 15.0229 8.64059 14.9526 8.60883C14.8904 8.58073 14.8346 8.54018 14.7886 8.48969C14.7367 8.43263 14.7025 8.35845 14.634 8.21009L12.7267 4.07493C12.4954 3.57359 12.3798 3.32292 12.2202 3.24472C12.0814 3.17677 11.9191 3.17677 11.7803 3.24472C11.6207 3.32292 11.505 3.57359 11.2738 4.07493L9.36643 8.21009C9.298 8.35845 9.26378 8.43263 9.21186 8.48969C9.1659 8.54018 9.11009 8.58073 9.04786 8.60883C8.97755 8.64059 8.89643 8.65021 8.73418 8.66944Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

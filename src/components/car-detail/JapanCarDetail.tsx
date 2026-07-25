import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PremiumGallery from "./PremiumGallery";
import CarActionButtons from "./CarActionButtons";
import CarEvaluation from "./CarEvaluation";
import CarBidSection from "./CarBidSection";
import RateCard from "./RateCard";
import LandedPriceCard from "./LandedPriceCard";
// import ChassisYearVerify from "./ChassisYearVerify"; // temporarily hidden
import PriceHistoryChart from "./PriceHistoryChart";
import { parseImages, type CarFixture, carTitle } from "@/lib/carFixtures";
import { wishlistItemFromFixture } from "@/lib/wishlist";
import { toComparableSales, sameSpecLabel } from "@/lib/priceHistory";
import { getDevice } from "@/lib/device";
import { getAuctionHistory } from "@/services/auctions";
import { getConfig } from "@/services/config";
import { auctionSchedule } from "@/utils/auctionTime";
import { parseAuctionInfo } from "@/utils/auctionInfo";
import { getColorSwatch, type ColorSwatch } from "@/utils/carColor";
import {
  formatDrivetrain,
  formatEngineWithPower,
  formatMileage,
  formatTransmission,
} from "@/utils/carFormat";

type Props = {
  car: CarFixture;
};

/** Duotone engine glyph for the engine quick-spec tile. */
function EngineIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function YearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function MileageIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function TransmissionIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function DriveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function DrivetrainIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function ChassisIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function EquipmentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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
function RateIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
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

/** Filled circle showing the car's actual paint colour for the colour tile. */
function ColorIcon({ swatch }: { swatch: ColorSwatch }) {
  return (
    <span
      aria-hidden
      className={`h-4 w-4 shrink-0 rounded-full ${swatch.ring ? "ring-1 ring-neutral-300 dark:ring-neutral-600" : ""}`}
      style={{ background: swatch.bg }}
    />
  );
}

/** One breadcrumb step. Muted until hovered, so only the trail's tail reads as
 *  the current page. The colour is set on the anchor itself, not inherited from
 *  the list: antd's reset styles bare `a` with its link blue, which an
 *  inherited colour would lose to. */
function CrumbLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        {children}
      </Link>
    </li>
  );
}

/** Decorative breadcrumb separator — hidden from assistive tech, which reads
 *  the list structure instead. */
function CrumbSep() {
  return (
    <li aria-hidden className="text-neutral-300 dark:text-neutral-700">
      ›
    </li>
  );
}

/**
 * Japan auction lot detail page. A live-bidding experience distinct from the
 * plain {@link CarDetail} used for Korea/Cars listings: it groups the auction
 * countdown, venue, lot number and bid form into one action card, surfaces the
 * MNT landed price + inspection grade as headline tiles, and adds the
 * chassis-year verification and inspection-sheet legend. A separate
 * KoreaCarDetail will follow — similar shell, different specifics.
 */
export default async function JapanCarDetail({ car }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("carDetail");
  const tFmt = await getTranslations("car.card");
  // Breadcrumb reuses the site nav's own label for /japan rather than a second
  // translation of the same thing.
  const tNav = await getTranslations("header.nav");

  // Live JPY→MNT rate for the bid panel's approximate-value preview.
  const jpyRate = (await getConfig()).JPY;

  // The phone shell already renders the lot title as an <h1> in its sticky
  // header (`@mobileHeader/japan/[id]`), so the in-page title section is for the
  // desktop shell only. The gate is the same device cookie that picks the shell
  // (not a breakpoint) — a narrow desktop window has no sticky header and still
  // needs the title.
  const device = await getDevice();
  const showTitleHeader = device !== "mobile";

  const title = carTitle(car);
  // Used twice: the title section's buttons and the mobile sticky bar's.
  const wishlistItem = wishlistItemFromFixture(car, "japan");

  // Breadcrumb steps. `carTitle` is brand + model, so using it as the last step
  // under a brand step would read "TOYOTA › TOYOTA RAV4" — each step must add
  // only its own increment. Split only when both halves exist; a lot with no
  // model (or no brand) keeps the whole title as its single last step.
  const brandCrumb = car.MARKA_NAME.trim();
  const modelCrumb = car.MODEL_NAME.trim();
  const showBrandCrumb = Boolean(brandCrumb && modelCrumb);
  const allImages = parseImages(car.IMAGES);
  // The first gallery image is the auction evaluation (inspection) sheet — split
  // it out into its own section, as long as a car photo remains for the gallery.
  const hasEvaluation = allImages.length > 1;
  const evaluationImage = hasEvaluation ? allImages[0] : undefined;
  const images = hasEvaluation ? allImages.slice(1) : allImages;
  const startNum = Number(car.START);
  const colorSwatch = car.COLOR ? getColorSwatch(car.COLOR) : null;
  const mileage = formatMileage(Number(car.MILEAGE) || undefined, tFmt);
  // Compact single tile so it fits one grid cell, e.g. "2,500CC (128HP)".
  const engineValue = formatEngineWithPower(
    Number(car.ENG_V) || undefined,
    Number(car.PW) || undefined,
  );
  const transmission = formatTransmission(car.KPP, tFmt);
  const drivetrain = formatDrivetrain(car.PRIV, tFmt);
  const driveLabel =
    car.LHDRIVE === "1" ? t("specs.driveLHD") : t("specs.driveRHD");

  // Both auction clocks: Japan (GMT+9, the zone AJES sends AUCTION_DATE in) and
  // Ulaanbaatar (GMT+8). Numeric output, so it is identical on server and
  // client. The countdown itself still ticks in the browser.
  const schedule = auctionSchedule(car.AUCTION_DATE);

  // Exterior/interior grades, dug out of the free-text INFO blob. Whatever the
  // auction house left unpublished is simply left out of the grid rather than
  // shown as a dash.
  const info = parseAuctionInfo(car.INFO);

  // Comparable sold lots (AJES `stats`) feeding the trend chart. Chassis AND
  // rate are pinned: make/model/year alone mixes generations and grades, and the
  // gap between a rate 5 car and a rate R one is wide enough that one chart line
  // across both reads as "a rate 5 car goes for this". The upstream applies its
  // 10-row limit AFTER these filters, so narrowing costs no sample size. When a
  // grade genuinely has no sales the section hides — better than a wrong price.
  // Supplementary either way, so an upstream hiccup just hides it rather than
  // failing the whole lot page.
  const historyRows = await getAuctionHistory({
    mark_name: car.MARKA_NAME,
    model_name: car.MODEL_NAME,
    year: car.YEAR,
    chassis: car.KUZOV,
    rate: car.RATE,
  }).catch((err) => {
    console.error("[Japan] /japan/history fetch failed:", err);
    return [];
  });
  const comparableSales = toComparableSales(historyRows, jpyRate);
  const comparableSpec = sameSpecLabel(car);

  // Grade is deliberately absent: the desktop shell trails it after the title,
  // and the phone shell carries it as the sticky header's second line
  // (`@mobileHeader/japan/[id]`). Cells whose icon is still to come fall back to
  // an invisible spacer so the columns stay aligned.
  const quickSpecs: Array<{
    label: string;
    value: string | undefined;
    icon?: ReactNode;
  }> = [
    { label: t("specs.year"), value: car.YEAR, icon: <YearIcon /> },
    { label: t("specs.mileage"), value: mileage, icon: <MileageIcon /> },
    { label: t("specs.engine"), value: engineValue, icon: <EngineIcon /> },
    {
      label: t("specs.color"),
      value: car.COLOR || undefined,
      icon: colorSwatch ? <ColorIcon swatch={colorSwatch} /> : undefined,
    },
    {
      label: t("specs.transmission"),
      value: transmission,
      icon: <TransmissionIcon />,
    },
    { label: t("specs.drive"), value: driveLabel, icon: <DriveIcon /> },
    {
      label: t("specs.drivetrain"),
      value: drivetrain,
      icon: <DrivetrainIcon />,
    },
    {
      label: t("specs.chassis"),
      value: car.KUZOV || undefined,
      icon: <ChassisIcon />,
    },
    {
      label: t("specs.equipment"),
      value: car.EQUIP || undefined,
      icon: <EquipmentIcon />,
    },
    ...(info.rateExt
      ? [
          {
            label: t("specs.rateExt"),
            value: info.rateExt,
            icon: <RateIcon />,
          },
        ]
      : []),
    ...(info.rateInt
      ? [
          {
            label: t("specs.rateInt"),
            value: info.rateInt,
            icon: <RateIcon />,
          },
        ]
      : []),
  ];

  return (
    <article className="mx-auto w-full max-w-7xl px-0 lg:px-6 lg:py-8">
      {/* Title band — the breadcrumb row plus the title/actions row, both full
          page width above the gallery. Skipped on the phone shell, whose sticky
          header already carries the title and a back chevron. Below `lg` the
          actions move to the mobile sticky bid bar, so exactly one copy of them
          exists at any width. Separation from the gallery is spacing only, no
          divider. `pt-5 lg:pt-0` on the breadcrumb because <article>'s
          `lg:py-8` does not apply below `lg`, where the band would otherwise
          sit flush under the site header. */}
      {showTitleHeader && (
        <>
          <nav
            aria-label={t("breadcrumb.aria")}
            className="px-4 pt-5 pb-3 text-[13px] lg:px-0 lg:pt-0"
          >
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-neutral-500 dark:text-neutral-400">
              <CrumbLink href="/">{t("breadcrumb.home")}</CrumbLink>
              <CrumbSep />
              <CrumbLink href="/japan">{tNav("japan")}</CrumbLink>
              {/* `marka` is the brand-name filter the auction list already
                  reads (see queryToFilters), so this lands on the same make. */}
              {showBrandCrumb && (
                <>
                  <CrumbSep />
                  <CrumbLink
                    href={`/japan?marka=${encodeURIComponent(brandCrumb)}`}
                  >
                    {brandCrumb}
                  </CrumbLink>
                </>
              )}
              <CrumbSep />
              {/* The model step filters by `model_name`, scoped to the brand the
                  step above it sets — the same pair the filter panel produces.
                  It links rather than marking the current page, so no
                  `aria-current` here; hover underlines because the tail is
                  already at full contrast and a colour shift would not read. */}
              {showBrandCrumb ? (
                <li>
                  <Link
                    href={`/japan?marka=${encodeURIComponent(brandCrumb)}&model=${encodeURIComponent(modelCrumb)}`}
                    className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                  >
                    {modelCrumb}
                  </Link>
                </li>
              ) : (
                <li
                  aria-current="page"
                  className="font-medium text-neutral-900 dark:text-neutral-100"
                >
                  {title}
                </li>
              )}
            </ol>
          </nav>
          <header className="flex items-center justify-between gap-3 px-4 pb-6 lg:px-0">
            {/* Grade trails the title on the same baseline rather than taking
                its own line — the band is above the fold, so the row saved is
                worth more than the separation. Year + color are in the quick
                specs below, so grade is all that trails here. */}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <h1 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 lg:text-[28px]">
                {title}
              </h1>
              {car.GRADE && (
                <span className="text-2xl font-normal leading-tight text-neutral-600 lg:text-[28px] dark:text-neutral-400">
                  {car.GRADE}
                </span>
              )}
            </div>
            <div className="hidden shrink-0 lg:block">
              <CarActionButtons item={wishlistItem} enableCompare />
            </div>
          </header>
        </>
      )}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-x-10">
        {/* Left column — gallery only, full-bleed on mobile (no side padding).
            As a flex column its height is its own content, so it no longer
            stretches to match the tall info column. */}
        <div className="lg:min-w-0 lg:grow-[1.4] lg:basis-0">
          <PremiumGallery
            images={images}
            alt={title}
            isPremium={car.AUCTION_TYPE === "1"}
            lot={car.LOT}
          />
        </div>

        {/* Info column — right on desktop, independent height from the left */}
        <div className="flex flex-col gap-5 py-5 lg:min-w-0 lg:grow lg:basis-0 lg:py-0">
          {/* Headline tiles — inspection grade + MNT landed price */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <RateCard rate={car.RATE} label={t("specs.rate")} />
            </div>
            <div className="col-span-3">
              <LandedPriceCard priceMnt={car.PRICE_MNT} />
            </div>
          </div>

          {/* Auction action card — quick specs, then countdown + venue/lot + gated bid form, split by dividers */}
          <CarBidSection
            auctionId={car.ID}
            startPrice={startNum || 0}
            status={car.STATUS}
            auctionDate={car.AUCTION_DATE}
            schedule={schedule}
            auctionLocation={car.AUCTION}
            town={car.TOWN}
            lot={car.LOT}
            chassis={car.KUZOV}
            engineSize={car.ENG_V}
            year={car.YEAR}
            rate={car.RATE}
            jpyRate={jpyRate}
            actions={
              <CarActionButtons
                item={wishlistItem}
                enableCompare
                variant="bar"
              />
            }
            quickSpecs={
              <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                {quickSpecs.map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-1.25">
                    {icon ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-0 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {icon}
                      </span>
                    ) : (
                      // Invisible spacer — keeps the columns lined up until the
                      // remaining icons land.
                      <span className="h-6 w-6 shrink-0" aria-hidden />
                    )}
                    <div className="flex min-w-0 flex-col gap-0 leading-normal">
                      <span className="text-[11px] font-medium uppercase text-neutral-400 dark:text-neutral-500">
                        {label}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {value || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>

      {/* Evaluation (inspection) sheet + AI explainer. The most consulted part
          of the lot, so it leads the full-width sections below the fold, with
          the sheet and the assistant side by side and room to breathe.
          Chassis-year verify temporarily hidden:
          <ChassisYearVerify markaName={car.MARKA_NAME} chassis={car.KUZOV} serial={car.SERIAL} /> */}
      {evaluationImage && <CarEvaluation image={evaluationImage} car={car} />}

      {/* Comparable sold cars — the trend chart across the full page width, after
          the evaluation sheet. Every per-sale detail lives in its tooltip, so no
          companion table. */}
      {comparableSales.length > 0 && (
        <section className="mt-8 border-t border-neutral-200 px-4 pt-8 lg:mt-12 lg:px-0 lg:pt-10 dark:border-neutral-800">
          <PriceHistoryChart
            data={comparableSales}
            specLabel={comparableSpec}
            locale={locale}
          />
        </section>
      )}

      {/* Spacer so the mobile sticky bid bar never covers the last content. */}
      <div className="h-20 lg:hidden" aria-hidden />
    </article>
  );
}

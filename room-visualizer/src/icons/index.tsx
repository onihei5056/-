// ============================================================
// アイコン（外部ライブラリ不使用・線幅を揃えたSVGアイコン）
// ============================================================
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconLogo = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <path d="M8.5 21v-5.5h7V21" />
  </Svg>
);
export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  </Svg>
);
export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
    <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />
  </Svg>
);
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  </Svg>
);
export const IconHistory = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);
export const IconSettings = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 18.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Svg>
);
export const IconUpload = (p: P) => (
  <Svg {...p}>
    <path d="M21 15v3.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V15" />
    <path d="M7.5 8.5 12 4l4.5 4.5" />
    <path d="M12 4v11.5" />
  </Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m3.5 17 4.8-4.6a1.6 1.6 0 0 1 2.2 0l3 2.9" />
    <path d="m14.5 14.5 1.7-1.6a1.6 1.6 0 0 1 2.2 0l2.1 2" />
  </Svg>
);
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M21 15v3.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V15" />
    <path d="M7.5 11 12 15.5 16.5 11" />
    <path d="M12 4v11.5" />
  </Svg>
);
export const IconExpand = (p: P) => (
  <Svg {...p}>
    <path d="M9 3.5H3.5V9" />
    <path d="M15 3.5h5.5V9" />
    <path d="M9 20.5H3.5V15" />
    <path d="M15 20.5h5.5V15" />
  </Svg>
);
export const IconRefresh = (p: P) => (
  <Svg {...p}>
    <path d="M20 11.5A8 8 0 0 0 6.3 6.3L3.5 9" />
    <path d="M3.5 4v5h5" />
    <path d="M4 12.5a8 8 0 0 0 13.7 5.2l2.8-2.7" />
    <path d="M20.5 20v-5h-5" />
  </Svg>
);
export const IconShare = (p: P) => (
  <Svg {...p}>
    <circle cx="17.5" cy="6" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18" r="2.5" />
    <path d="m8.8 10.8 6.5-3.5M8.8 13.2l6.5 3.5" />
  </Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4 6.5h16" />
    <path d="M9 6.5V4.5h6v2" />
    <path d="M6 6.5 6.8 20a1 1 0 0 0 1 .9h8.4a1 1 0 0 0 1-.9L18 6.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p} strokeWidth={2.6}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);
export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconCompare = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M12 4.5v15" />
    <path d="M8.5 10 6 12l2.5 2M15.5 10l2.5 2-2.5 2" />
  </Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.4" />
  </Svg>
);
export const IconBuilding = (p: P) => (
  <Svg {...p}>
    <path d="M4 20.5V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15.5" />
    <path d="M14 10h5a1 1 0 0 1 1 1v9.5" />
    <path d="M3 20.5h18" />
    <path d="M7 8h4M7 12h4M7 16h4M17 13.5v.4M17 17v.4" />
  </Svg>
);
export const IconChevron = ({ open, ...p }: P & { open?: boolean }) => (
  <Svg {...p} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);
export const IconLayers = (p: P) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7" />
    <path d="m3.5 16.8 8.5 4.7 8.5-4.7" />
  </Svg>
);
export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

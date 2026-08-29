interface IconProps {
  size?: number;
  className?: string;
}

const base = (size?: number) => ({
  width: size ?? 16,
  height: size ?? 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconLogo = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M3 12h7M14 12h7M12 3v6M12 15v6" />
    <circle cx="8" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTerminal = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 17l6-5-6-5" />
    <path d="M12 19h8" />
  </svg>
);

export const IconQueue = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export const IconChip = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3" />
  </svg>
);

export const IconShield = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    <path d="M9.2 12l2 2 3.6-4" />
  </svg>
);

export const IconGear = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7 7 0 00-.14-1.4l2-1.55-2-3.46-2.36.95a7 7 0 00-2.42-1.4L13.7 2.6h-3.4l-.38 2.54a7 7 0 00-2.42 1.4l-2.36-.95-2 3.46 2 1.55A7 7 0 005 12c0 .48.05.94.14 1.4l-2 1.55 2 3.46 2.36-.95a7 7 0 002.42 1.4l.38 2.54h3.4l.38-2.54a7 7 0 002.42-1.4l2.36.95 2-3.46-2-1.55c.09-.46.14-.92.14-1.4z" />
  </svg>
);

export const IconSend = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />
    <path d="M11.5 13.5L20 4" />
  </svg>
);

export const IconCheck = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconX = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconPlay = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7 5l12 7-12 7V5z" />
  </svg>
);

export const IconPause = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);

export const IconChevron = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconInbox = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 13l2.5-7h11L20 13v6H4v-6z" />
    <path d="M4 13h5l1.5 2.5h3L15 13h5" />
  </svg>
);

export const IconTrash = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
  </svg>
);

export const IconEye = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 4l16 16M9.9 5.9A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 01-3.2 3.9M6.1 8.3A17 17 0 002.5 12S6 18.5 12 18.5c1.1 0 2.1-.2 3-.6" />
    <path d="M9.5 9.8a3 3 0 004.2 4.2" />
  </svg>
);

export const IconCoffee = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 9h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z" />
    <path d="M16 10h2a2.5 2.5 0 010 5h-2M8 5.5c0-1 .8-1 .8-2M12 5.5c0-1 .8-1 .8-2" />
  </svg>
);

export const IconZap = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
  </svg>
);

export const IconKey = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="8" cy="14" r="4.5" />
    <path d="M11.5 10.5L20 2M16 6l2.5 2.5M13.5 8.5L16 11" />
  </svg>
);

export const IconRadio = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M7.5 7.5a6.4 6.4 0 000 9M16.5 7.5a6.4 6.4 0 010 9M4.6 4.6a10.5 10.5 0 000 14.8M19.4 4.6a10.5 10.5 0 010 14.8" />
  </svg>
);

export const IconWarn = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5L22 20H2L12 3.5z" />
    <path d="M12 10v4.5M12 17.2v.3" />
  </svg>
);

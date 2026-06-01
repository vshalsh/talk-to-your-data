import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps): IconProps => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, ...props,
});

export const UploadIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const PipelineIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="6" height="5" rx="1.2" />
    <rect x="15" y="4" width="6" height="5" rx="1.2" />
    <rect x="9" y="15" width="6" height="5" rx="1.2" />
    <path d="M6 9v3a2 2 0 0 0 2 2h1M18 9v3a2 2 0 0 1-2 2h-1" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

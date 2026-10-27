import React from 'react';

import type { SoChangeDir, SoChangeField } from '../types';

export const SearchIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.6 10.6L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ChevronIcon: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2.5 4.5L6 8L9.5 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FilterIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M1.8 3.2H12.2L8.2 7.6V11.6L5.8 12.4V7.6L1.8 3.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const CloseIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export interface FieldIconProps {
  field: SoChangeField;
}

export const FieldIcon: React.FC<FieldIconProps> = ({ field }) => {
  if (field === 'crd') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="kpi-icon"
      >
        <rect x="1.9" y="3.3" width="12.2" height="10.6" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 6.6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5.2 1.9v2.5M10.8 1.9v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5.6 9.9h2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (field === 'country') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="kpi-icon"
      >
        <circle cx="8" cy="8" r="6.1" stroke="currentColor" strokeWidth="1.4" />
        <ellipse cx="8" cy="8" rx="2.7" ry="6.1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.9 8h12.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (field === 'price') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="kpi-icon"
      >
        <path
          d="M2.6 8.6 8.3 2.9a1.4 1.4 0 0 1 1-.4h3.1a1.2 1.2 0 0 1 1.2 1.2v3.1a1.4 1.4 0 0 1-.4 1l-5.7 5.7a1.4 1.4 0 0 1-2 0L2.6 10.6a1.4 1.4 0 0 1 0-2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="10.7" cy="5.3" r="1.05" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (field === 'qty') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="kpi-icon"
      >
        <rect x="1.9" y="1.9" width="5.4" height="5.4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.7" y="1.9" width="5.4" height="5.4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.9" y="8.7" width="5.4" height="5.4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.7" y="8.7" width="5.4" height="5.4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (field === 'packing') {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="kpi-icon"
      >
        <path
          d="M8 1.9 13.8 4.7v6.6L8 14.1 2.2 11.3V4.7L8 1.9Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M2.4 4.8 8 7.6l5.6-2.8M8 7.6v6.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="kpi-icon"
    >
      <rect x="5.5" y="1.9" width="5" height="3.6" rx="1.1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.9" y="10.5" width="5" height="3.6" rx="1.1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.1" y="10.5" width="5" height="3.6" rx="1.1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5.5v2.6M4.4 8.1h7.2M4.4 8.1v2.4M11.6 8.1v2.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export interface StepIconProps {
  dir: 'prev' | 'next';
}

export const StepIcon: React.FC<StepIconProps> = ({ dir }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d={dir === 'prev' ? 'M7.5 2.5L4 6l3.5 3.5' : 'M4.5 2.5L8 6l-3.5 3.5'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface ArrowIconProps {
  dir: SoChangeDir;
  size?: number;
}

export const ArrowIcon: React.FC<ArrowIconProps> = ({ dir, size = 11 }) => {
  if (dir === 'up') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 9L9 3M9 3H4.5M9 3V7.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (dir === 'down') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 3L9 9M9 9H4.5M9 9V4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

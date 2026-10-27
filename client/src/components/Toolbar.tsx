import React from 'react';

import type { SoCopy } from '../lib/i18n';
import { ChevronIcon, SearchIcon } from './icons';

export interface ToolbarProps {
  query: string;
  buyer: string;
  buyers: string[];
  fromDate: string;
  toDate: string;
  dateFiltered: boolean;
  filtersActive: boolean;
  copy: SoCopy;
  onQueryChange: (value: string) => void;
  onBuyerChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  query,
  buyer,
  buyers,
  fromDate,
  toDate,
  dateFiltered,
  filtersActive,
  copy,
  onQueryChange,
  onBuyerChange,
  onFromChange,
  onToChange,
  onSearch,
  onReset,
}) => {
  return (
    <div className="toolbar">
      <label className="search">
        <SearchIcon />
        <input
          type="search"
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
          aria-label={copy.searchPlaceholder}
        />
      </label>

      <div className={dateFiltered ? 'date-range is-filtered' : 'date-range'}>
        <span className="date-range-k">{copy.changeDate}</span>
        <div className="date-inputs">
          <input
            type="date"
            value={fromDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFromChange(event.target.value)}
            aria-label={copy.changeDate}
          />
          <span className="period-arrow">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onToChange(event.target.value)}
            aria-label={copy.changeDate}
          />
        </div>
        <button type="button" className="search-btn" onClick={onSearch}>
          <SearchIcon />
          {copy.search}
        </button>
      </div>

      <div className="select-wrap">
        <span>{copy.buyerFilter}</span>
        <select
          value={buyer}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onBuyerChange(event.target.value)}
          aria-label={copy.buyerFilter}
        >
          <option value="all">{copy.all}</option>
          {buyers.map((name: string) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </div>

      {filtersActive ? (
        <button type="button" className="ghost-btn" onClick={onReset}>
          {copy.clearFilters}
        </button>
      ) : null}
    </div>
  );
};

export default Toolbar;

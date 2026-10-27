import React from 'react';

import type { SoCopy } from '../lib/i18n';
import { PAGE_SIZE, pageWindow, type PagerItem } from '../lib/timeline';
import { StepIcon } from './icons';

export interface PagerProps {
  page: number;
  pageCount: number;
  total: number;
  copy: SoCopy;
  onPage: (page: number) => void;
  variant?: 'drawer';
}

const Pager: React.FC<PagerProps> = ({ page, pageCount, total, copy, onPage, variant }) => {
  if (pageCount <= 1) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className={variant ? `pager pager-${variant}` : 'pager'}>
      <span className="pager-range">
        {copy.fill(copy.pagerRange, { from, to, total })}
      </span>
      <div className="pager-nav">
        <button
          type="button"
          className="pager-btn pager-step"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          aria-label={copy.pagerPrev}
          title={copy.pagerPrev}
        >
          <StepIcon dir="prev" />
        </button>
        {pageWindow(page, pageCount).map((item: PagerItem) =>
          typeof item === 'number' ? (
            <button
              type="button"
              key={item}
              className="pager-btn"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPage(item)}
            >
              {item}
            </button>
          ) : (
            <span className="pager-gap" key={item} aria-hidden="true">
              …
            </span>
          ),
        )}
        <button
          type="button"
          className="pager-btn pager-step"
          disabled={page === pageCount}
          onClick={() => onPage(page + 1)}
          aria-label={copy.pagerNext}
          title={copy.pagerNext}
        >
          <StepIcon dir="next" />
        </button>
      </div>
    </div>
  );
};

export default Pager;

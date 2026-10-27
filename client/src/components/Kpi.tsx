import React from 'react';

import type { SoChangeField } from '../types';

import type { SoCopy } from '../lib/i18n';
import type { FieldStats } from '../lib/timeline';
import { FieldIcon } from './icons';

export interface KpiProps {
  fieldKey: SoChangeField;
  stats: FieldStats;
  active: boolean;
  copy: SoCopy;
  onClick: () => void;
}

const Kpi: React.FC<KpiProps> = ({ fieldKey, stats, active, copy, onClick }) => {
  const meta = copy.fields[fieldKey];
  const rising = stats.up + stats.swap;

  return (
    <button
      type="button"
      className={`kpi tone-${meta.tone}`}
      aria-pressed={active}
      onClick={onClick}
      title={meta.full}
    >
      <div className="kpi-top">
        <span className="kpi-label">
          <FieldIcon field={fieldKey} />
          {meta.label}
        </span>
        <div className="kpi-legend">
          {rising > 0 ? (
            <span title={meta.upWord}>
              <i className="sym">{meta.upSym}</i>
              <b>{rising}</b>
            </span>
          ) : null}
          {stats.down > 0 ? (
            <span className="alt" title={meta.downWord}>
              <i className="sym">{meta.downSym}</i>
              <b>{stats.down}</b>
            </span>
          ) : null}
        </div>
      </div>
      <div className="kpi-num">{String(stats.affected).padStart(2, '0')}</div>
    </button>
  );
};

export default Kpi;

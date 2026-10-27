import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import type { SoChange, SoChangeField, SoOrder } from '../types';

import type { SoCopy } from '../lib/i18n';
import {
  STAGE_WEIGHTS,
  changeTone,
  changeValue,
  showsArrow,
  stageDates,
  stageWindows,
} from '../lib/timeline';
import { ArrowIcon } from './icons';

const STAGES: number[] = STAGE_WEIGHTS.map((weight: number, index: number) => index + 1);

interface TimelineStyle extends React.CSSProperties {
  '--top-h': string;
  '--bottom-h': string;
}

interface TipState {
  x: number;
  y: number;
  below: boolean;
}

export interface AnnoProps {
  entries: SoChange[];
  activeField: SoChangeField | null;
  copy: SoCopy;
}

/* A single change reads "old → new"; repeated edits of one field inside a stage
   chain into "12-18 → 12-30 → 01-01" with each arrow tinted by its direction. */
const Anno: React.FC<AnnoProps> = ({ entries, activeField, copy }) => {
  const [tip, setTip] = useState<TipState | null>(null);

  const first = entries[0];
  const last = entries[entries.length - 1];
  const field = copy.fields[first.field];
  const chained = entries.length > 1;
  const values: (string | null)[] = [first.from, last.to];

  const openTip = (event: React.SyntheticEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const below = rect.top < 170;
    setTip({
      x: Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150),
      y: below ? rect.bottom + 8 : rect.top - 8,
      below,
    });
  };

  const closeTip = (): void => setTip(null);

  const tooltip = tip
    ? createPortal(
        <div
          className="anno-tip"
          role="tooltip"
          style={{
            left: `${tip.x}px`,
            top: `${tip.y}px`,
            transform: tip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          <div className="anno-tip-k">
            {field.label} · {copy.changedAt}
          </div>
          {entries.map((entry: SoChange, index: number) => (
            <div className="anno-tip-row" key={index}>
              <b>{copy.fmtFull(entry.at)}</b>
              <span>
                {changeValue(entry, entry.from, copy)} → {changeValue(entry, entry.to, copy)}
              </span>
            </div>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      className={activeField === first.field ? 'anno is-active' : 'anno'}
      data-tone={changeTone(first.field, last.dir)}
      tabIndex={0}
      onMouseEnter={openTip}
      onMouseLeave={closeTip}
      onFocus={openTip}
      onBlur={closeTip}
    >
      <div className="anno-field">
        <span>{field.label}</span>
        {showsArrow(first.field) ? <ArrowIcon dir={last.dir} size={10} /> : null}
        {chained ? <span className="anno-times">×{entries.length}</span> : null}
      </div>
      <div className={chained ? 'anno-val chain' : 'anno-val'}>
        {values.map((value: string | null, index: number) => {
          const isLast = index === values.length - 1;
          const segment = entries[Math.max(index - 1, 0)];
          return (
            <React.Fragment key={index}>
              {index > 0 ? (
                <span
                  className="arr seg"
                  data-tone={changeTone(first.field, segment.dir)}
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
              {isLast ? (
                <span className="now">{changeValue(last, value, copy)}</span>
              ) : values.length === 2 ? (
                <s>{changeValue(first, value, copy)}</s>
              ) : (
                <span className="gone">{changeValue(first, value, copy)}</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {tooltip}
    </div>
  );
};

export interface OrderCardProps {
  order: SoOrder;
  index: number;
  activeField: SoChangeField | null;
  copy: SoCopy;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, index, activeField, copy }) => {
  const current = order.stage;

  const grouped: Partial<Record<number, Partial<Record<SoChangeField, SoChange[]>>>> = {};
  order.changes.forEach((change: SoChange) => {
    const stage = Math.min(change.stage, order.stage);
    const stageGroup = grouped[stage] ?? {};
    const list = stageGroup[change.field] ?? [];
    list.push(change);
    stageGroup[change.field] = list;
    grouped[stage] = stageGroup;
  });

  const stageFields: Record<number, SoChange[][]> = {};
  Object.keys(grouped).forEach((key: string) => {
    const stage = Number(key);
    const fieldMap = grouped[stage] ?? {};
    const fields = Object.keys(fieldMap) as SoChangeField[];
    const list = fields.map((field: SoChangeField) =>
      (fieldMap[field] ?? []).slice().sort((a: SoChange, b: SoChange) => (a.at < b.at ? -1 : 1)),
    );
    list.sort((a: SoChange[], b: SoChange[]) =>
      a[0].at < b[0].at ? -1 : a[0].at > b[0].at ? 1 : 0,
    );
    stageFields[stage] = list;
  });

  const laneMax = { top: 0, bottom: 0 };
  Object.keys(stageFields).forEach((key: string) => {
    const count = stageFields[Number(key)].length;
    laneMax.top = Math.max(laneMax.top, Math.ceil(count / 2));
    laneMax.bottom = Math.max(laneMax.bottom, Math.floor(count / 2));
  });
  const topSlotHeight = 56 + Math.max(0, laneMax.top - 1) * 46;
  const bottomSlotHeight = 44 + Math.max(0, laneMax.bottom - 1) * 46;

  const windows = stageWindows(order);
  const recorded = order.stageEvents.length > 0 ? stageDates(order) : null;
  const crdEdits = order.changes.filter((change: SoChange) => change.field === 'crd');
  const crdChange = crdEdits.length ? crdEdits[crdEdits.length - 1] : null;
  const currentStageLabel = copy.stages[order.stage - 1].label;

  const timelineStyle: TimelineStyle = {
    '--top-h': `${topSlotHeight}px`,
    '--bottom-h': `${bottomSlotHeight}px`,
  };

  return (
    <article
      className="so-card"
      id={`card-${order.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      data-screen-label={`SO ${order.soNo}`}
    >
      <header className="so-head">
        <div className="so-id">
          <div className="so-key">
            <span className="so-k">{copy.ordNoLabel}</span>
            <span className="so-style">{order.soNo}</span>
          </div>
          <div className="so-keys">
            <span className="so-kv">
              <b>{copy.ordIdLabel}</b>
              {order.ordId ?? '—'}
            </span>
          </div>
        </div>

        <div className="so-meta">
          <div className="meta">
            <span className="meta-k">{copy.styleMeta}</span>
            <span className="meta-v mono">{(order.styles ?? []).length ? (order.styles ?? []).join(', ') : '—'}</span>
          </div>
          <div className="meta">
            <span className="meta-k">{copy.poNoMeta}</span>
            <span className="meta-v mono">{(order.poNos ?? []).length ? (order.poNos ?? []).join(', ') : '—'}</span>
          </div>
          <div className="meta">
            <span className="meta-k">{copy.poDate}</span>
            <span className="meta-v mono">
              {order.poDate ? copy.fmtFull(order.poDate) : '—'}
            </span>
          </div>
          <div className="meta">
            <span className="meta-k">{copy.crdMeta}</span>
            <span className="meta-v mono crd-cell">
              {order.crd ? copy.fmtFull(order.crd) : '—'}
              {crdChange && crdChange.from ? (
                <span className="crd-old">{copy.fmtFull(crdChange.from)}</span>
              ) : null}
            </span>
          </div>
          <div className="meta">
            <span className="meta-k">{copy.countryMeta}</span>
            <span className="meta-v">{order.country ?? '—'}</span>
          </div>
        </div>

        <div className="so-side">
          <span className="stage-pill">
            <i></i>
            {copy.fill(copy.stepFull, { n: order.stage, stage: currentStageLabel })}
          </span>
          <span className="count-chip">
            {copy.fill(copy.changeCount, { n: order.changes.length })}
          </span>
        </div>
      </header>

      <div className="tl-scroll">
        <div className="timeline" style={timelineStyle}>
          {STAGES.map((stage: number) => {
            const isDone = stage < current;
            const isActive = stage === current;
            const isNext = stage === current + 1;
            const state = isDone ? 'done' : isActive ? 'active' : isNext ? 'next' : 'future';
            const railState = isDone ? 'done' : isActive ? 'next' : 'future';
            const changes = stageFields[stage] ?? [];
            const top = changes.filter((_item: SoChange[], k: number) => k % 2 === 0);
            const bottom = changes.filter((_item: SoChange[], k: number) => k % 2 === 1);
            const label = copy.stages[stage - 1].label;

            return (
              <div className="tl-col" key={stage}>
                <div className="anno-slot top">
                  {top.map((entries: SoChange[], k: number) => (
                    <Anno entries={entries} activeField={activeField} copy={copy} key={k} />
                  ))}
                </div>

                <div className="node-wrap">
                  <span className={`rail ${railState}`}></span>
                  <div className={`node ${state}`}>{stage}</div>
                </div>

                <div className={`stage-label is-${state}`}>{label}</div>
                <div className="stage-dates">
                  <span>
                    {recorded
                      ? recorded[stage]
                        ? copy.fmtFull(recorded[stage] ?? '')
                        : '—'
                      : windows[stage]?.to
                        ? copy.fmtFull(windows[stage].to)
                        : '—'}
                  </span>
                </div>

                <div className="anno-slot bottom">
                  {bottom.map((entries: SoChange[], k: number) => (
                    <Anno entries={entries} activeField={activeField} copy={copy} key={k} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};

export default OrderCard;

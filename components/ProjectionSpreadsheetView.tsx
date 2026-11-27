'use client';

import React, { useMemo, useState } from 'react';
import {
  SPREADSHEET_GROUPS,
  SpreadsheetGroupId,
  SpreadsheetBuildOptions,
  buildSpreadsheetColumns,
  extractSpreadsheetRow,
} from '../lib/projectionSpreadsheet';

interface ProjectionSpreadsheetViewProps {
  timeline: any[];
  options: SpreadsheetBuildOptions;
  onExportDetailedCSV: () => void;
  useRealDollars?: boolean;
}

const ALL_GROUP_IDS: SpreadsheetGroupId[] = SPREADSHEET_GROUPS.map((g) => g.id);

export default function ProjectionSpreadsheetView({
  timeline,
  options,
  onExportDetailedCSV,
  useRealDollars,
}: ProjectionSpreadsheetViewProps) {
  const [activeGroups, setActiveGroups] = useState<Set<SpreadsheetGroupId>>(
    () => new Set(ALL_GROUP_IDS)
  );
  const [freezeTimeline, setFreezeTimelineState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rp_proj_freeze_timeline') === 'true';
  });
  const toggleFreezeTimeline = () => {
    setFreezeTimelineState((prev) => {
      const next = !prev;
      try { localStorage.setItem('rp_proj_freeze_timeline', String(next)); } catch {}
      return next;
    });
  };

  const toggleGroup = (id: SpreadsheetGroupId) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllGroups = () => setActiveGroups(new Set(ALL_GROUP_IDS));

  const allColumns = useMemo(
    () => buildSpreadsheetColumns(options.isCouple, options.p1Label, options.p2Label),
    [options.isCouple, options.p1Label, options.p2Label]
  );

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => c.group === 'core' || activeGroups.has(c.group)),
    [allColumns, activeGroups]
  );

  const coreColOffsets = useMemo(() => {
    const coreCols = visibleColumns.filter((c) => c.group === 'core');
    const widths: Record<string, number> = {
      year: 68,
      p1Age: 64,
      p2Age: 64,
      phase: 86,
    };
    let acc = 0;
    const map: Record<string, { left: number; width: number; isLastCore: boolean }> = {};
    coreCols.forEach((col, i) => {
      const w = widths[col.key] || 72;
      map[col.key] = { left: acc, width: w, isLastCore: i === coreCols.length - 1 };
      acc += w;
    });
    return map;
  }, [visibleColumns]);

  const groupSpans = useMemo(() => {
    const spans: Array<{
      id: string;
      label: string;
      colSpan: number;
      accentClass: string;
      headerBg: string;
    }> = [];

    const coreCount = visibleColumns.filter((c) => c.group === 'core').length;
    if (coreCount > 0) {
      spans.push({
        id: 'core',
        label: 'Timeline',
        colSpan: coreCount,
        accentClass: 'text-muted',
        headerBg: 'transparent',
      });
    }

    SPREADSHEET_GROUPS.forEach((g) => {
      const count = visibleColumns.filter((c) => c.group === g.id).length;
      if (count > 0) {
        spans.push({
          id: g.id,
          label: g.label,
          colSpan: count,
          accentClass: g.accentClass,
          headerBg: g.headerBg,
        });
      }
    });

    return spans;
  }, [visibleColumns]);

  const rows = useMemo(
    () => timeline.map((y) => extractSpreadsheetRow(y, options)),
    [timeline, options]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const formatCell = (val: string | number | undefined, isCurrency?: boolean) => {
    if (!isCurrency) return val ?? '';
    const num = Number(val) || 0;
    if (num === 0) return '—';
    return currencyFormatter.format(num);
  };

  const allSelected = activeGroups.size === ALL_GROUP_IDS.length;

  return (
    <div className="rp-card border border-secondary rounded-4 overflow-hidden shadow-sm">
      {/* Spreadsheet Section Filter Bar */}
      <div className="px-3 py-2.5 border-bottom border-secondary border-opacity-50 d-flex flex-wrap align-items-center justify-content-between gap-2 bg-input bg-opacity-25">
        <div className="d-flex flex-wrap align-items-center gap-1.5">
          <span className="small fw-bold text-uppercase ls-1 text-muted me-1" style={{ fontSize: '0.68rem' }}>
            Sections:
          </span>
          <button
            type="button"
            onClick={selectAllGroups}
            className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold ${
              allSelected ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            style={{ fontSize: '0.72rem' }}
          >
            All ({allColumns.length} cols)
          </button>
          {SPREADSHEET_GROUPS.map((g) => {
            const isOn = activeGroups.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g.id)}
                className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold transition-all ${
                  isOn
                    ? 'btn-outline-info bg-info bg-opacity-10 text-main border-info'
                    : 'btn-outline-secondary opacity-50'
                }`}
                style={{ fontSize: '0.72rem' }}
              >
                <i className={`bi ${isOn ? 'bi-check2' : 'bi-plus'} me-1`}></i>
                {g.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleFreezeTimeline}
            className={`btn btn-sm rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 transition-all ${
              freezeTimeline
                ? 'btn-primary shadow-sm'
                : 'btn-outline-secondary'
            }`}
            style={{ fontSize: '0.72rem' }}
            title="Freeze Year, Age, and Phase columns while scrolling horizontally"
          >
            <i className={`bi ${freezeTimeline ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`}></i>
            Freeze Timeline
          </button>
          <span className="badge bg-secondary bg-opacity-25 text-muted fw-bold" style={{ fontSize: '0.68rem' }}>
            {useRealDollars ? "Today's $" : 'Nominal $'} · {rows.length} yrs
          </span>
          <button
            type="button"
            onClick={onExportDetailedCSV}
            className="btn btn-sm btn-success rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-sm"
            style={{ fontSize: '0.73rem' }}
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            Download Full CSV (Excel)
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Yearly Ledger */}
      <div className="table-responsive" style={{ maxHeight: '72vh' }}>
        <table
          className="table table-sm table-hover align-middle mb-0"
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 12, backgroundColor: 'var(--bg-card)' }}>
            {/* Row 1: Section Group Headers */}
            <tr>
              {groupSpans.map((span) => {
                const isFrozenCore = freezeTimeline && span.id === 'core';
                return (
                  <th
                    key={span.id}
                    colSpan={span.colSpan}
                    className={`py-2 px-2 text-uppercase fw-bolder ls-1 text-center border-bottom border-end border-secondary border-opacity-50 ${span.accentClass}`}
                    style={{
                      fontSize: '0.68rem',
                      backgroundColor: span.headerBg === 'transparent' ? 'var(--bg-card)' : span.headerBg,
                      ...(isFrozenCore
                        ? {
                            position: 'sticky',
                            left: 0,
                            zIndex: 16,
                            boxShadow: '2px 0 6px -2px rgba(0, 0, 0, 0.25)',
                          }
                        : {}),
                    }}
                  >
                    {span.label}
                  </th>
                );
              })}
            </tr>
            {/* Row 2: Individual Column Headers */}
            <tr>
              {visibleColumns.map((col, idx) => {
                const isGroupBoundary =
                  idx < visibleColumns.length - 1 && visibleColumns[idx + 1].group !== col.group;
                const coreMeta = col.group === 'core' ? coreColOffsets[col.key] : undefined;
                const isFrozen = freezeTimeline && !!coreMeta;
                return (
                  <th
                    key={col.key}
                    className={`py-2 px-2.5 text-muted text-uppercase fw-bold border-bottom border-secondary ${
                      col.align === 'left'
                        ? 'text-start'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-end'
                    } ${isGroupBoundary ? 'border-end border-secondary border-opacity-50' : ''}`}
                    style={{
                      fontSize: '0.68rem',
                      backgroundColor: 'var(--bg-card)',
                      ...(coreMeta
                        ? {
                            width: `${coreMeta.width}px`,
                            minWidth: `${coreMeta.width}px`,
                            maxWidth: `${coreMeta.width}px`,
                          }
                        : { minWidth: '86px' }),
                      ...(isFrozen && coreMeta
                        ? {
                            position: 'sticky',
                            left: `${coreMeta.left}px`,
                            zIndex: 15,
                            ...(coreMeta.isLastCore
                              ? { boxShadow: '2px 0 6px -2px rgba(0, 0, 0, 0.25)' }
                              : {}),
                          }
                        : {}),
                    }}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="text-center py-5 text-muted">
                  No projection years match the current phase filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isDepleted = Number(row.liquid_nw) <= 1 && row.phase !== 'Working';
                return (
                  <tr
                    key={String(row.year)}
                    className={isDepleted ? 'bg-danger bg-opacity-10' : ''}
                  >
                    {visibleColumns.map((col, idx) => {
                      const val = row[col.key];
                      const isZeroCurrency = col.isCurrency && (Number(val) || 0) === 0;
                      const isGroupBoundary =
                        idx < visibleColumns.length - 1 && visibleColumns[idx + 1].group !== col.group;
                      const coreMeta = col.group === 'core' ? coreColOffsets[col.key] : undefined;
                      const isFrozen = freezeTimeline && !!coreMeta;

                      return (
                        <td
                          key={col.key}
                          className={`py-1.5 px-2.5 border-bottom border-secondary border-opacity-25 ${
                            col.align === 'left'
                              ? 'text-start fw-bold text-main'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-end'
                          } ${isZeroCurrency ? 'text-muted opacity-25' : col.colorClass || 'text-main'} ${
                            isGroupBoundary ? 'border-end border-secondary border-opacity-50' : ''
                          }`}
                          style={
                            isFrozen && coreMeta
                              ? {
                                  position: 'sticky',
                                  left: `${coreMeta.left}px`,
                                  zIndex: 5,
                                  width: `${coreMeta.width}px`,
                                  minWidth: `${coreMeta.width}px`,
                                  maxWidth: `${coreMeta.width}px`,
                                  backgroundColor: 'var(--bg-card)',
                                  ...(coreMeta.isLastCore
                                    ? { boxShadow: '2px 0 6px -2px rgba(0, 0, 0, 0.25)' }
                                    : {}),
                                }
                              : coreMeta
                              ? {
                                  width: `${coreMeta.width}px`,
                                  minWidth: `${coreMeta.width}px`,
                                  maxWidth: `${coreMeta.width}px`,
                                }
                              : undefined
                          }
                        >
                          {col.key === 'phase' ? (
                            <span
                              className={`badge rounded-pill ${
                                val === 'Working'
                                  ? 'bg-primary bg-opacity-10 text-primary'
                                  : val === 'Transition'
                                  ? 'bg-info bg-opacity-10 text-info'
                                  : val === 'Go-Go'
                                  ? 'bg-success bg-opacity-10 text-success'
                                  : val === 'Slow-Go'
                                  ? 'bg-warning bg-opacity-10 text-warning'
                                  : 'bg-secondary bg-opacity-25 text-muted'
                              }`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {val}
                            </span>
                          ) : (
                            formatCell(val, col.isCurrency)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

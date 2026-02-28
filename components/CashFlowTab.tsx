import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';

export default function CashFlowTab() {
  const { data, results } = useFinance();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null); 

  useEffect(() => {
      let interval: any;
      if (isPlaying && results?.timeline) {
          const endYear = results.timeline[results.timeline.length - 1].year;
          interval = setInterval(() => {
              setSelectedYear(prev => {
                  if (prev >= endYear) {
                      setIsPlaying(false);
                      return prev;
                  }
                  return prev + 1;
              });
          }, 800);
      }
      return () => clearInterval(interval);
  }, [isPlaying, results]);

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <i className="bi bi-diagram-3 fs-1 mb-3 d-block text-primary opacity-50"></i>
        <h5>Waiting for calculation...</h5>
      </div>
    );
  }

  const isCouple = data.mode === 'Couple';
  const startYear = results.timeline[0].year;
  const endYear = results.timeline[results.timeline.length - 1].year;
  const currentVal = Math.max(startYear, Math.min(endYear, selectedYear));
  const yData = results.timeline.find((y: any) => y.year === currentVal) || results.timeline[0];

  // --- Real Dollars Discounting Math ---
  const baseYear = startYear;
  const inflation = (data.inputs.inflation_rate || 2.1) / 100;
  const getRealValue = (nominalValue: number) => {
      if (!data.useRealDollars) return nominalValue;
      const yearsOut = Math.max(0, yData.year - baseYear);
      return nominalValue / Math.pow(1 + inflation, yearsOut);
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

  // --- Data Extraction & Balancing ---
  const p1BaseSalary = (yData.incomeP1 || 0) - (yData.rrspMatchP1 || 0);
  const p2BaseSalary = (yData.incomeP2 || 0) - (yData.rrspMatchP2 || 0);
  const salaryRaw = p1BaseSalary + p2BaseSalary;
  
  const matchRaw = (yData.rrspMatchP1 || 0) + (yData.rrspMatchP2 || 0);
  const govtRaw = (yData.cppP1 || 0) + (yData.cppP2 || 0) + (yData.oasP1 || 0) + (yData.oasP2 || 0) + (yData.ccbP1 || 0);
  const penRaw = (yData.dbP1 || 0) + (yData.dbP2 || 0);
  const wdsRaw = yData.flows && yData.flows.withdrawals ? Object.values(yData.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) as number : 0;
  
  const otherWindfall = (yData.windfall || 0);
  const otherYield = (yData.invIncP1 || 0) + (yData.invIncP2 || 0);
  const otherRefund = (yData.rrspRefundP1 || 0) + (yData.rrspRefundP2 || 0);
  const otherRaw = otherWindfall + otherYield + otherRefund;
  
  const totalIncomeRaw = salaryRaw + matchRaw + govtRaw + penRaw + otherRaw;

  let contsRaw = 0;
  let p1Conts = 0;
  let p2Conts = 0;
  if (yData.flows && yData.flows.contributions) {
      p1Conts = Object.values(yData.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
      contsRaw += p1Conts;
      if (isCouple) {
          p2Conts = Object.values(yData.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          contsRaw += p2Conts;
      }
  }

  const expRaw = yData.expenses || 0;
  const debtRaw = (yData.mortgagePay || 0) + (yData.debtRepayment || 0);
  
  const p1Tax = yData.taxP1 || 0;
  const p2Tax = yData.taxP2 || 0;
  const taxRaw = p1Tax + p2Tax;

  const totalSourcedRaw = totalIncomeRaw + wdsRaw;
  const totalSpentRaw = expRaw + debtRaw + taxRaw + contsRaw;

  let shortfallRaw = 0;
  let unallocatedRaw = 0;
  if (totalSourcedRaw < totalSpentRaw) shortfallRaw = totalSpentRaw - totalSourcedRaw;
  else if (totalSourcedRaw > totalSpentRaw) unallocatedRaw = totalSourcedRaw - totalSpentRaw;

  // --- Node Detail Breakdowns ---
  const nodeBreakdowns: any = {
      'salary': [
          { label: 'P1 Employment', val: p1BaseSalary },
          { label: 'P2 Employment', val: p2BaseSalary }
      ],
      'match': [
          { label: 'P1 RRSP Match', val: yData.rrspMatchP1 || 0 },
          { label: 'P2 RRSP Match', val: yData.rrspMatchP2 || 0 }
      ],
      'govt': [
          { label: 'P1 CPP', val: yData.cppP1 || 0 },
          { label: 'P2 CPP', val: yData.cppP2 || 0 },
          { label: 'P1 OAS', val: yData.oasP1 || 0 },
          { label: 'P2 OAS', val: yData.oasP2 || 0 },
          { label: 'CCB (Tax-Free)', val: yData.ccbP1 || 0 }
      ],
      'pen': [
          { label: 'P1 DB Pension', val: yData.dbP1 || 0 },
          { label: 'P2 DB Pension', val: yData.dbP2 || 0 }
      ],
      'wds': Object.entries(yData.flows?.withdrawals || {}).map(([key, val]) => ({ label: key, val: val as number })),
      'other': [
          { label: 'Non-Reg Yield', val: otherYield },
          { label: 'Tax Refunds', val: otherRefund },
          { label: 'Windfalls/Sales', val: otherWindfall }
      ],
      'shortfall': [
          { label: 'Unfunded Deficit', val: shortfallRaw }
      ],
      'exp': [
          { label: 'Base Lifestyle', val: expRaw }
      ],
      'debt': [
          { label: 'Mortgage Payments', val: yData.mortgagePay || 0 },
          { label: 'Other Debt/Purchases', val: yData.debtRepayment || 0 }
      ],
      'tax': [
          { label: 'P1 Total Tax', val: p1Tax },
          { label: 'P2 Total Tax', val: p2Tax },
          { label: 'Fed Tax Portion', val: (yData.taxDetailsP1?.fed || 0) + (yData.taxDetailsP2?.fed || 0) },
          { label: 'Prov Tax Portion', val: (yData.taxDetailsP1?.prov || 0) + (yData.taxDetailsP2?.prov || 0) },
          { label: 'CPP/EI Premiums', val: (yData.taxDetailsP1?.cpp_ei || 0) + (yData.taxDetailsP2?.cpp_ei || 0) },
          { label: 'OAS Clawback', val: (yData.taxDetailsP1?.oas_clawback || 0) + (yData.taxDetailsP2?.oas_clawback || 0) }
      ],
      'sav': [
          { label: 'P1 Contributions', val: p1Conts },
          { label: 'P2 Contributions', val: p2Conts },
          { label: 'Unallocated Cash', val: unallocatedRaw }
      ],
      'center': [
          { label: 'Total Balanced Flow', val: Math.max(totalSourcedRaw, totalSpentRaw) }
      ]
  };

  // Convert to display nodes
  const rawLeftNodes = [
      { id: 'salary', label: 'Employment', value: getRealValue(salaryRaw), color: '#3b82f6' },
      { id: 'match', label: 'Employer Match', value: getRealValue(matchRaw), color: '#0ea5e9' },
      { id: 'govt', label: 'Govt Benefits', value: getRealValue(govtRaw), color: '#8b5cf6' },
      { id: 'pen', label: 'Pensions', value: getRealValue(penRaw), color: '#6366f1' },
      { id: 'wds', label: 'Withdrawals', value: getRealValue(wdsRaw), color: '#f59e0b' },
      { id: 'other', label: 'Other/Yield', value: getRealValue(otherRaw), color: '#10b981' },
      { id: 'shortfall', label: 'Shortfall', value: getRealValue(shortfallRaw), color: '#ef4444' },
  ];

  const rawRightNodes = [
      { id: 'exp', label: 'Living Expenses', value: getRealValue(expRaw), color: '#f59e0b' },
      { id: 'debt', label: 'Debt/Mortgage', value: getRealValue(debtRaw), color: '#f43f5e' },
      { id: 'tax', label: 'Taxes Paid', value: getRealValue(taxRaw), color: '#ef4444' },
      { id: 'sav', label: 'Saved/Invested', value: getRealValue(contsRaw + unallocatedRaw), color: '#10b981' },
  ];

  const leftData = rawLeftNodes.filter(d => d.value >= 1);
  const rightData = rawRightNodes.filter(d => d.value >= 1);

  // --- Sankey SVG Math Engine ---
  const VIEWBOX_W = 1200;
  const VIEWBOX_H = 650;
  const PADDING = 20; 
  const LEFT_X = 280; 
  const RIGHT_X = 920; 
  const CENTER_LEFT = 585;
  const CENTER_RIGHT = 615;
  const NODE_W = 15;
  const SAFE_PADDING_Y = 50;
  const SAFE_H = VIEWBOX_H - (SAFE_PADDING_Y * 2);

  const totalLeft = leftData.reduce((s, d) => s + d.value, 0);
  const totalRight = rightData.reduce((s, d) => s + d.value, 0);
  const MAX = Math.max(totalLeft, totalRight) || 1; 

  const availableHeightLeft = SAFE_H - (leftData.length - 1) * PADDING;
  const availableHeightRight = SAFE_H - (rightData.length - 1) * PADDING;
  const pxPerDollar = Math.min(availableHeightLeft / MAX, availableHeightRight / MAX);

  let leftNodes: any[] = [];
  let curY = SAFE_PADDING_Y + (SAFE_H - (totalLeft * pxPerDollar + (leftData.length - 1) * PADDING)) / 2;
  let lastTextY = -999;
  
  leftData.forEach(d => {
      const h = d.value * pxPerDollar;
      let ty = curY + h / 2;
      if (ty - lastTextY < 28) ty = lastTextY + 28;
      leftNodes.push({ ...d, y: curY, h, ty });
      lastTextY = ty;
      curY += h + PADDING;
  });

  let rightNodes: any[] = [];
  curY = SAFE_PADDING_Y + (SAFE_H - (totalRight * pxPerDollar + (rightData.length - 1) * PADDING)) / 2;
  lastTextY = -999;

  rightData.forEach(d => {
      const h = d.value * pxPerDollar;
      let ty = curY + h / 2;
      if (ty - lastTextY < 28) ty = lastTextY + 28;
      rightNodes.push({ ...d, y: curY, h, ty });
      lastTextY = ty;
      curY += h + PADDING;
  });

  const centerH = MAX * pxPerDollar;
  const centerY = SAFE_PADDING_Y + (SAFE_H - centerH) / 2;

  let centerLeftRunY = centerY;
  const leftLinks = leftNodes.map(n => {
      const c1x = LEFT_X + (CENTER_LEFT - LEFT_X) * 0.4;
      const c1y = n.y + n.h / 2;
      const c2x = CENTER_LEFT - (CENTER_LEFT - LEFT_X) * 0.4;
      const c2y = centerLeftRunY + n.h / 2;
      const path = `M ${LEFT_X} ${c1y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${CENTER_LEFT} ${c2y}`;
      const link = { ...n, path };
      centerLeftRunY += n.h;
      return link;
  });

  let centerRightRunY = centerY;
  const rightLinks = rightNodes.map(n => {
      const c1x = CENTER_RIGHT + (RIGHT_X - CENTER_RIGHT) * 0.4;
      const c1y = centerRightRunY + n.h / 2;
      const c2x = RIGHT_X - (RIGHT_X - CENTER_RIGHT) * 0.4;
      const c2y = n.y + n.h / 2;
      const path = `M ${CENTER_RIGHT} ${c1y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${RIGHT_X} ${c2y}`;
      const link = { ...n, path };
      centerRightRunY += n.h;
      return link;
  });

  const getOpacity = (id: string) => (!hovered || hovered === id) ? 1 : 0.15;

  return (
    <div className="p-3 p-md-4">
      
      {/* Top Controller */}
      <div className="d-flex flex-column flex-md-row align-items-center mb-4 p-3 surface-card rounded-4 border border-secondary shadow-sm">
          <button 
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} rounded-circle shadow-sm mb-3 mb-md-0 d-flex align-items-center justify-content-center transition-all`} 
              style={{width:'55px', height:'55px', flexShrink: 0}} 
              onClick={() => setIsPlaying(!isPlaying)}
          >
              <i className={`bi ${isPlaying ? 'bi-stop-fill' : 'bi-play-fill'} fs-3`}></i>
          </button>
          <div className="flex-grow-1 mx-md-4 w-100">
              <div className="d-flex justify-content-between align-items-center text-muted small fw-bold mb-2">
                  <span>{startYear}</span>
                  <span className="text-main fs-5 fw-bolder px-3 py-1 bg-black bg-opacity-25 rounded-pill border border-secondary shadow-inner d-flex align-items-center">
                      <i className="bi bi-calendar-event me-2 text-primary"></i> 
                      {currentVal} 
                      <span className="ms-2 small text-muted fw-normal">
                          (Age {yData.p1Age}{isCouple && yData.p2Age ? ` / ${yData.p2Age}` : ''})
                      </span>
                  </span>
                  <span>{endYear}</span>
              </div>
              <input 
                  type="range" 
                  className="form-range w-100 cursor-pointer" 
                  min={startYear} 
                  max={endYear} 
                  value={currentVal} 
                  onChange={(e) => { setIsPlaying(false); setSelectedYear(parseInt(e.target.value)); }} 
              />
          </div>
      </div>

      {/* Sankey Chart Container */}
      <div className="rp-card border border-secondary rounded-4 shadow-sm p-3 p-md-4 overflow-hidden position-relative">
          <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-uppercase ls-1 text-info mb-0">Cash Flow Diagram</h5>
              <span className="small text-muted fst-italic"><i className="bi bi-hand-index-thumb me-1"></i> Click any stream for details</span>
          </div>
          
          <div className="w-100 position-relative d-flex justify-content-center align-items-center" style={{ minHeight: '550px', height: '70vh' }}>
              <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                  
                  {/* Left Nodes & Text */}
                  {leftNodes.map((n, i) => (
                      <g key={`L-${i}`} className="transition-all cursor-pointer" style={{ opacity: getOpacity(n.id) }} 
                         onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} onClick={() => setSelectedNode(n.id)}>
                          <rect x={LEFT_X - NODE_W} y={n.y} width={NODE_W} height={n.h} fill={n.color} rx="2" />
                          <text x={LEFT_X - NODE_W - 15} y={n.ty - 7} textAnchor="end" alignmentBaseline="middle" fill="currentColor" className="fw-bold" style={{ fontSize: '14px', opacity: 0.9 }}>{n.label}</text>
                          <text x={LEFT_X - NODE_W - 15} y={n.ty + 11} textAnchor="end" alignmentBaseline="middle" fill={n.color} className="fw-bold" style={{ fontSize: '12px' }}>
                              {formatCurrency(n.value)} <tspan fill="currentColor" opacity="0.6" fontSize="11px">({((n.value / MAX) * 100).toFixed(1)}%)</tspan>
                          </text>
                      </g>
                  ))}

                  {/* Left Links */}
                  {leftLinks.map((l, i) => (
                      <path key={`LL-${i}`} d={l.path} fill="none" stroke={l.color} strokeWidth={Math.max(1, l.h)} className="transition-all cursor-pointer" 
                            style={{ opacity: hovered === l.id ? 0.7 : (hovered ? 0.05 : 0.3) }} 
                            onMouseEnter={() => setHovered(l.id)} onMouseLeave={() => setHovered(null)} onClick={() => setSelectedNode(l.id)} />
                  ))}

                  {/* Right Links */}
                  {rightLinks.map((l, i) => (
                      <path key={`RL-${i}`} d={l.path} fill="none" stroke={l.color} strokeWidth={Math.max(1, l.h)} className="transition-all cursor-pointer" 
                            style={{ opacity: hovered === l.id ? 0.7 : (hovered ? 0.05 : 0.3) }} 
                            onMouseEnter={() => setHovered(l.id)} onMouseLeave={() => setHovered(null)} onClick={() => setSelectedNode(l.id)} />
                  ))}

                  {/* Right Nodes & Text */}
                  {rightNodes.map((n, i) => (
                      <g key={`R-${i}`} className="transition-all cursor-pointer" style={{ opacity: getOpacity(n.id) }} 
                         onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} onClick={() => setSelectedNode(n.id)}>
                          <rect x={RIGHT_X} y={n.y} width={NODE_W} height={n.h} fill={n.color} rx="2" />
                          <text x={RIGHT_X + NODE_W + 15} y={n.ty - 7} textAnchor="start" alignmentBaseline="middle" fill="currentColor" className="fw-bold" style={{ fontSize: '14px', opacity: 0.9 }}>{n.label}</text>
                          <text x={RIGHT_X + NODE_W + 15} y={n.ty + 11} textAnchor="start" alignmentBaseline="middle" fill={n.color} className="fw-bold" style={{ fontSize: '12px' }}>
                              {formatCurrency(n.value)} <tspan fill="currentColor" opacity="0.6" fontSize="11px">({((n.value / MAX) * 100).toFixed(1)}%)</tspan>
                          </text>
                      </g>
                  ))}

                  {/* Center Node Block */}
                  {MAX > 1 && (
                      <g className="transition-all cursor-pointer" style={{ opacity: getOpacity('center') }} 
                         onMouseEnter={() => setHovered('center')} onMouseLeave={() => setHovered(null)} onClick={() => setSelectedNode('center')}>
                          <rect x={CENTER_LEFT} y={centerY} width={CENTER_RIGHT - CENTER_LEFT} height={centerH} fill="url(#centerGrad)" rx="4" />
                          <text x={VIEWBOX_W / 2} y={centerY - 25} textAnchor="middle" fill="currentColor" className="fw-bold text-uppercase ls-1" style={{ fontSize: '12px', opacity: 0.6 }}>Total Cash Sourced</text>
                          <text x={VIEWBOX_W / 2} y={centerY - 8} textAnchor="middle" fill="#10b981" className="fw-bold" style={{ fontSize: '16px' }}>{formatCurrency(MAX)}</text>
                      </g>
                  )}

                  <defs>
                      <linearGradient id="centerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                      </linearGradient>
                  </defs>
              </svg>

              {/* FLOATING DETAIL OVERLAY - OPAQUE & SHARP */}
              {selectedNode && (
                  <div className="position-absolute top-50 start-50 translate-middle border border-secondary rounded-4 p-4 slide-down" 
                       style={{ minWidth: '320px', zIndex: 10, backgroundColor: '#1e1e24', boxShadow: '0 10px 60px rgba(0,0,0,0.85)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                          <h6 className="fw-bold text-uppercase ls-1 text-info mb-0">Detailed Breakdown</h6>
                          <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedNode(null)}></button>
                      </div>
                      <div className="d-flex flex-column gap-2 mb-2">
                          {nodeBreakdowns[selectedNode]
                              ?.filter((b: any) => Math.abs(b.val) > 1)
                              .map((b: any, i: number) => (
                                  <div className="d-flex justify-content-between align-items-center small" key={i}>
                                      <span className="text-muted fw-bold">{b.label}</span>
                                      <span className="fw-bolder text-white">{formatCurrency(getRealValue(b.val))}</span>
                                  </div>
                              ))}
                          {nodeBreakdowns[selectedNode]?.filter((b: any) => Math.abs(b.val) > 1).length === 0 && (
                              <span className="text-muted small fst-italic">No sub-categories generated value this year.</span>
                          )}
                      </div>
                  </div>
              )}

          </div>
      </div>

    </div>
  );
}
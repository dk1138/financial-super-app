'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn } from './SharedUI';

export default function CashFlowTab() {
  const { data, results } = useFinance();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isPlaying, setIsPlaying] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ id: string; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'sankey' | 'ledger'>('sankey');

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const startYear = results?.timeline?.[0]?.year || new Date().getFullYear();
  const endYear = results?.timeline?.[results.timeline.length - 1]?.year || (startYear + 40);

  useEffect(() => {
      if (results?.timeline && results.timeline.length > 0) {
          const valid = results.timeline.some((y: any) => y.year === selectedYear);
          if (!valid) setSelectedYear(results.timeline[0].year);
      }
  }, [results, selectedYear]);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isPlaying) {
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
  }, [isPlaying, endYear]);

  if (!results || !results.timeline || results.timeline.length === 0) {
      return (
          <div className="p-5 text-center text-muted">
              <i className="bi bi-diagram-3 fs-1 mb-3 opacity-50 d-block"></i>
              <h5>No Cash Flow Data Available</h5>
              <p className="small">Please configure your plan parameters and check back.</p>
          </div>
      );
  }

  const currentVal = selectedYear;
  const yData = results.timeline.find((y: any) => y.year === currentVal) || results.timeline[0];

  const p1Name = data.inputs.p1_name || 'Player 1';
  const p2Name = data.inputs.p2_name || 'Player 2';
  const isCouple = data.mode === 'Couple';

  const rawInf = data.inputs?.inflation_rate;
  const inflation = (rawInf !== undefined && rawInf !== null && rawInf !== '' ? Number(rawInf) : 2.1) / 100;

  const useRealDollars = Boolean(
      data.useRealDollars === true || 
      data.inputs?.todays_dollars === true || 
      data.inputs?.use_real_dollars === true ||
      data.inputs?.useRealDollars === true
  );

  const getRealValue = (nominalValue: number) => {
      if (!useRealDollars) return nominalValue;
      const yearsOut = Math.max(0, currentVal - startYear);
      return nominalValue / Math.pow(1 + inflation, yearsOut);
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
  };

  const getPhaseBadge = () => {
      const p1Ret = Number(data.inputs.p1_retireAge) || 60;
      const p2Ret = isCouple ? (Number(data.inputs.p2_retireAge) || 60) : p1Ret;
      const isP1Ret = (yData.p1Age || yData.ageP1) >= p1Ret;
      const isP2Ret = isCouple ? (yData.p2Age || yData.ageP2) >= p2Ret : true;

      if (!isP1Ret && !isP2Ret) return <span className="badge bg-primary bg-opacity-25 text-primary border border-primary px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-briefcase-fill me-2"></i> Accumulation Phase</span>;
      if (isP1Ret !== isP2Ret) return <span className="badge bg-info bg-opacity-25 text-info border border-info px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-hourglass-split me-2"></i> Semi-Retired Transition</span>;
      
      const maxAge = isCouple ? Math.max(yData.p1Age || 0, yData.p2Age || 0) : (yData.p1Age || yData.ageP1);
      const gogo = Number(data.inputs.exp_gogo_age) || 75;
      const slowgo = Number(data.inputs.exp_slow_age) || 85;

      if (data.expenseMode === 'Advanced') {
          if (maxAge <= gogo) return <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-airplane-fill me-2"></i> Go-Go Phase</span>;
          if (maxAge <= slowgo) return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-car-front-fill me-2"></i> Slow-Go Phase</span>;
          return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-house-heart-fill me-2"></i> No-Go Phase</span>;
      }

      return <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-1 shadow-sm d-flex align-items-center"><i className="bi bi-cup-hot-fill me-2"></i> Retirement</span>;
  };

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

  const getCreditVal = (taxDetails: any, key: string) => {
      if (!taxDetails || !taxDetails.nrtcDetails || !taxDetails.nrtcDetails[key]) return 0;
      return (taxDetails.nrtcDetails[key].fedAmt || 0) + (taxDetails.nrtcDetails[key].provAmt || 0);
  };

  let taxItems: any[] = [
      { id: 'tax-fed', label: 'Federal Tax Paid', val: (yData.taxDetailsP1?.fed || 0) + (yData.taxDetailsP2?.fed || 0) },
      { id: 'tax-prov', label: 'Provincial Tax Paid', val: (yData.taxDetailsP1?.prov || 0) + (yData.taxDetailsP2?.prov || 0) },
      { id: 'tax-cpp-ei', label: 'CPP / EI Premiums', val: (yData.taxDetailsP1?.cpp_ei || 0) + (yData.taxDetailsP2?.cpp_ei || 0) },
  ];
  
  const clawback = (yData.taxDetailsP1?.oas_clawback || 0) + (yData.taxDetailsP2?.oas_clawback || 0);
  if (clawback > 0) taxItems.push({ id: 'tax-oas-clawback', label: 'OAS Clawback', val: clawback });

  let savingsItems: any[] = [];
  const creditsList = ['age', 'pension', 'disability', 'caregiver', 'medical', 'homeBuyer', 'donations'];
  const creditLabels: any = { age: 'Age Amount', pension: 'Pension Amount', disability: 'Disability Credit', caregiver: 'Caregiver Amount', medical: 'Medical Expenses', homeBuyer: 'First-Time Home Buyer', donations: 'Charitable Donations' };
  
  creditsList.forEach(key => {
      const val = getCreditVal(yData.taxDetailsP1, key) + getCreditVal(yData.taxDetailsP2, key);
      if (val > 0) savingsItems.push({ id: `tax-credit-${key}`, label: creditLabels[key], val: val, isSavings: true });
  });

  const transit = (yData.taxDetailsP1?.rtc?.transit || 0) + (yData.taxDetailsP2?.rtc?.transit || 0);
  if (transit > 0) savingsItems.push({ id: 'tax-transit', label: 'Transit Refund', val: transit, isSavings: true });

  const matchSavings = (yData.matchTaxSavingsP1 || 0) + (yData.matchTaxSavingsP2 || 0);
  if (matchSavings > 0) savingsItems.push({ id: 'tax-rrsp-match', label: 'RRSP Match Savings', val: matchSavings, isSavings: true });

  const savingsBreakdown: any[] = [];
  if (yData.flows && yData.flows.contributions) {
      if (yData.flows.contributions.p1) {
          Object.entries(yData.flows.contributions.p1).forEach(([acct, val]) => {
              if ((val as number) > 0) savingsBreakdown.push({ label: `${p1Name} ${acct.toUpperCase()}`, val: val as number });
          });
      }
      if (isCouple && yData.flows.contributions.p2) {
          Object.entries(yData.flows.contributions.p2).forEach(([acct, val]) => {
              if ((val as number) > 0) savingsBreakdown.push({ label: `${p2Name} ${acct.toUpperCase()}`, val: val as number });
          });
      }
  }
  if (savingsBreakdown.length === 0) {
      savingsBreakdown.push({ label: `${p1Name} Contributions`, val: p1Conts });
      if (isCouple) savingsBreakdown.push({ label: `${p2Name} Contributions`, val: p2Conts });
  }
  if (unallocatedRaw > 0) {
      savingsBreakdown.push({ label: 'Unallocated Cash', val: unallocatedRaw });
  }

  const nodeBreakdowns: any = {
      'salary': [
          { label: `${p1Name} Employment`, val: p1BaseSalary },
          { label: `${p2Name} Employment`, val: p2BaseSalary }
      ],
      'match': [
          { label: `${p1Name} RRSP Match`, val: yData.rrspMatchP1 || 0 },
          { label: `${p2Name} RRSP Match`, val: yData.rrspMatchP2 || 0 }
      ],
      'govt': [
          { label: `${p1Name} CPP`, val: yData.cppP1 || 0 },
          { label: `${p2Name} CPP`, val: yData.cppP2 || 0 },
          { label: `${p1Name} OAS`, val: yData.oasP1 || 0 },
          { label: `${p2Name} OAS`, val: yData.oasP2 || 0 },
          { label: 'CCB (Tax-Free)', val: yData.ccbP1 || 0 }
      ],
      'pen': [
          { label: `${p1Name} DB Pension`, val: yData.dbP1 || 0 },
          { label: `${p2Name} DB Pension`, val: yData.dbP2 || 0 }
      ],
      'wds': Object.entries(yData.flows?.withdrawals || {}).map(([key, val]) => {
          const dynamicKey = key
              .replace(/\bP1\b/g, p1Name)
              .replace(/\bP2\b/g, p2Name);
          return { label: dynamicKey, val: val as number };
      }),
      'other': [
          { label: 'Non-Reg / Crypto Yield', val: otherYield },
          { label: 'Simulated RRSP/FHSA Refund', val: otherRefund },
          { label: 'Windfalls & Prop. Sales', val: otherWindfall }
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
      'tax': taxItems,
      'sav': savingsBreakdown,
      'center': [
          { label: 'Total Balanced Flow', val: Math.max(totalSourcedRaw, totalSpentRaw) }
      ]
  };

  let rawLeftNodes: any[] = [];
  if (!detailedMode) {
      rawLeftNodes = [
          { id: 'salary', label: 'Employment', value: getRealValue(salaryRaw), color: '#3b82f6' },
          { id: 'match', label: 'Employer Match', value: getRealValue(matchRaw), color: '#0ea5e9' },
          { id: 'govt', label: 'Govt Benefits', value: getRealValue(govtRaw), color: '#8b5cf6' },
          { id: 'pen', label: 'Pensions', value: getRealValue(penRaw), color: '#6366f1' },
          { id: 'wds', label: 'Withdrawals', value: getRealValue(wdsRaw), color: '#f59e0b' },
          { id: 'other', label: 'Other/Yield', value: getRealValue(otherRaw), color: '#10b981' },
          { id: 'shortfall', label: 'Shortfall', value: getRealValue(shortfallRaw), color: '#ef4444' },
      ];
  } else {
      nodeBreakdowns['salary'].forEach((b: any, i: number) => {
          if (!isCouple && b.label.includes(p2Name)) return;
          rawLeftNodes.push({ id: `salary-${i}`, label: b.label, value: getRealValue(b.val), color: '#3b82f6', parentId: 'salary' });
      });
      nodeBreakdowns['match'].forEach((b: any, i: number) => {
          if (!isCouple && b.label.includes(p2Name)) return;
          rawLeftNodes.push({ id: `match-${i}`, label: b.label, value: getRealValue(b.val), color: '#0ea5e9', parentId: 'match' });
      });
      nodeBreakdowns['govt'].forEach((b: any, i: number) => {
          if (!isCouple && b.label.includes(p2Name)) return;
          rawLeftNodes.push({ id: `govt-${i}`, label: b.label, value: getRealValue(b.val), color: '#8b5cf6', parentId: 'govt' });
      });
      nodeBreakdowns['pen'].forEach((b: any, i: number) => {
          if (!isCouple && b.label.includes(p2Name)) return;
          rawLeftNodes.push({ id: `pen-${i}`, label: b.label, value: getRealValue(b.val), color: '#6366f1', parentId: 'pen' });
      });
      nodeBreakdowns['wds'].forEach((b: any, i: number) => {
          rawLeftNodes.push({ id: `wds-${i}`, label: b.label, value: getRealValue(b.val), color: '#f59e0b', parentId: 'wds' });
      });
      nodeBreakdowns['other'].forEach((b: any, i: number) => {
          rawLeftNodes.push({ id: `other-${i}`, label: b.label, value: getRealValue(b.val), color: '#10b981', parentId: 'other' });
      });
      if (shortfallRaw > 0) {
          rawLeftNodes.push({ id: 'shortfall-0', label: 'Unfunded Deficit', value: getRealValue(shortfallRaw), color: '#ef4444', parentId: 'shortfall' });
      }
  }

  let rawRightNodes: any[] = [];
  if (!detailedMode) {
      rawRightNodes = [
          { id: 'exp', label: 'Living Expenses', value: getRealValue(expRaw), color: '#f59e0b' },
          { id: 'debt', label: 'Debt/Mortgage', value: getRealValue(debtRaw), color: '#f43f5e' },
          { id: 'tax', label: 'Taxes Paid', value: getRealValue(taxRaw), color: '#ef4444' },
          { id: 'sav', label: 'Saved/Invested', value: getRealValue(contsRaw + unallocatedRaw), color: '#10b981' },
      ];
  } else {
      nodeBreakdowns['exp'].forEach((b: any, i: number) => {
          rawRightNodes.push({ id: `exp-${i}`, label: b.label, value: getRealValue(b.val), color: '#f59e0b', parentId: 'exp' });
      });
      nodeBreakdowns['debt'].forEach((b: any, i: number) => {
          rawRightNodes.push({ id: `debt-${i}`, label: b.label, value: getRealValue(b.val), color: '#f43f5e', parentId: 'debt' });
      });
      taxItems.filter(t => !t.isDivider && !t.isHeader && t.val > 0 && !t.isSavings).forEach((b: any, i: number) => {
          rawRightNodes.push({ id: `tax-${i}`, label: b.label, value: getRealValue(b.val), color: '#ef4444', parentId: 'tax' });
      });
      nodeBreakdowns['sav'].forEach((b: any, i: number) => {
          rawRightNodes.push({ id: `sav-${i}`, label: b.label, value: getRealValue(b.val), color: '#10b981', parentId: 'sav' });
      });
  }

  const leftData = rawLeftNodes.filter(d => d.value >= 1);
  const rightData = rawRightNodes.filter(d => d.value >= 1);

  const VIEWBOX_W = 1200;
  const VIEWBOX_H = 650;
  const PADDING = detailedMode ? 14 : 20; 
  const LEFT_X = 260; 
  const RIGHT_X = 940; 
  const CENTER_LEFT = 570;
  const CENTER_RIGHT = 630;
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
      const step = detailedMode ? 22 : 26;
      if (ty - lastTextY < step) ty = lastTextY + step;
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
      const step = detailedMode ? 22 : 26;
      if (ty - lastTextY < step) ty = lastTextY + step;
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

  const handleMouseMove = (e: React.MouseEvent, id: string) => {
      if (!chartContainerRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      setHovered(id);
      setTooltip({
          id,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      });
  };

  const handleMouseLeave = () => {
      setHovered(null);
      setTooltip(null);
  };

  const getOpacity = (id: string) => (!hovered || hovered === id) ? 1 : 0.15;
  const getLinkOpacity = (id: string) => hovered === id ? 0.7 : (hovered ? 0.05 : 0.35);

  const allNodesMeta = [
      ...leftData, 
      ...rightData, 
      { id: 'center', label: 'Total Balanced Flow', value: getRealValue(Math.max(totalSourcedRaw, totalSpentRaw)), color: '#10b981' }
  ];

  const renderTooltip = () => {
      if (!tooltip) return null;
      const meta = allNodesMeta.find(n => n.id === tooltip.id);
      if (!meta) return null;

      const chartWidth = chartContainerRef.current?.clientWidth || 800;
      const isRightHalf = tooltip.x > chartWidth / 2;

      const style: React.CSSProperties = {
          position: 'absolute',
          top: Math.max(10, tooltip.y - 30),
          left: isRightHalf ? 'auto' : tooltip.x + 20,
          right: isRightHalf ? chartWidth - tooltip.x + 20 : 'auto',
          minWidth: '260px',
          maxWidth: '340px',
          backgroundColor: 'var(--bg-card)',
          zIndex: 1050,
          pointerEvents: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          border: '1px solid var(--bs-secondary)'
      };

      const lookUpKey = meta.parentId || meta.id;
      let items: any[] = [];

      if (detailedMode && (meta.parentId === 'exp' || meta.id.startsWith('exp') || meta.label === 'Base Lifestyle')) {
          // 1. In detailed mode, break down Base Lifestyle into its constituent budget categories & active phases
          const p1Ret = Number(data.inputs?.p1_retireAge) || 60;
          const p2Ret = isCouple ? (Number(data.inputs?.p2_retireAge) || 60) : p1Ret;
          const isRet1 = (yData.p1Age || yData.ageP1) >= p1Ret;
          const isRet2 = isCouple ? (yData.p2Age || yData.ageP2) >= p2Ret : true;
          const isFullyRet = isRet1 && isRet2;
          const maxAge = isCouple ? Math.max(yData.p1Age || 0, yData.p2Age || 0) : (yData.p1Age || yData.ageP1);
          const gogoLimit = parseInt(data.inputs?.exp_gogo_age) || 75;
          const slowLimit = parseInt(data.inputs?.exp_slow_age) || 85;

          let expPhaseKey: 'curr' | 'ret' | 'gogo' | 'slow' | 'nogo' = 'curr';
          if (data.expenseMode === 'Simple') {
              expPhaseKey = isFullyRet ? 'ret' : 'curr';
          } else {
              if (!isFullyRet) expPhaseKey = 'curr';
              else if (maxAge <= gogoLimit) expPhaseKey = 'gogo';
              else if (maxAge <= slowLimit) expPhaseKey = 'slow';
              else expPhaseKey = 'nogo';
          }

          const yearsFromStart = Math.max(0, currentVal - startYear);
          const nominalInfFactor = Math.pow(1 + inflation, yearsFromStart);

          const catLabels: Record<string, string> = {
              housing: 'Housing & Utilities',
              transport: 'Transportation',
              lifestyle: 'Lifestyle & Leisure',
              essentials: 'Essentials & Groceries',
              other: 'Miscellaneous / Other'
          };

          items.push({ label: 'Budget Category Breakdown', isHeader: true });

          Object.entries(data.expensesByCategory || {}).forEach(([catKey, cat]: [string, any]) => {
              let catAnnual = 0;
              if (cat?.items && Array.isArray(cat.items)) {
                  cat.items.forEach((item: any) => {
                      const freq = Number(item.freq) || 12;
                      const amt = (Number(item[expPhaseKey]) || 0) * freq;
                      catAnnual += amt;
                  });
              }
              if (catAnnual > 0) {
                  const nominalCatVal = catAnnual * nominalInfFactor;
                  items.push({
                      label: catLabels[catKey] || (catKey.charAt(0).toUpperCase() + catKey.slice(1)),
                      val: nominalCatVal
                  });
              }
          });

          if (yData.activeExpensePhases && Array.isArray(yData.activeExpensePhases) && yData.activeExpensePhases.length > 0) {
              items.push({ isDivider: true });
              items.push({ label: 'Active Expense Phases', isHeader: true });
              yData.activeExpensePhases.forEach((p: any) => {
                  if (p.amount > 0) {
                      items.push({
                          label: p.name || 'Expense Phase',
                          val: p.amount
                      });
                  }
              });
          }
      } else if (detailedMode && meta.parentId === 'wds') {
          // 2. In detailed mode, break down account withdrawals into capital vs taxable gain
          const isP2 = isCouple && meta.label.includes(p2Name);
          const playerKey = isP2 ? 'p2' : 'p1';
          const mathKey = meta.label.match(/Non-?Reg/i) ? 'Non-Reg' : (meta.label.match(/Crypto/i) ? 'Crypto' : (meta.label.match(/RRIF/i) ? 'RRIF' : (meta.label.match(/LIF/i) ? 'LIF' : '')));
          const mathObj = yData.wdBreakdown?.[playerKey]?.[`${mathKey}_math`];

          if (mathObj) {
              items.push({ label: 'Tax & Capital Composition', isHeader: true });
              if (mathKey === 'Non-Reg' || mathKey === 'Crypto') {
                  items.push({ label: 'Gross Withdrawal', val: mathObj.wd });
                  items.push({ label: 'Return of Capital (Tax-Free)', val: mathObj.acb, isSavings: true });
                  items.push({ label: 'Realized Capital Gain', val: mathObj.gain });
                  items.push({ isDivider: true });
                  items.push({ label: 'Taxable Portion (50% Inclusion)', val: mathObj.tax, isDeduction: true, badge: '50% Taxable' });
              } else if (mathKey === 'RRIF' || mathKey === 'LIF') {
                  if ((mathObj.priorBal || 0) > 0) {
                      items.push({ label: 'Prior Year Balance', val: mathObj.priorBal });
                      items.push({ label: 'Prescribed Min Factor', val: 0, textRight: `${((mathObj.factor || 0) * 100).toFixed(2)}%` });
                      items.push({ label: 'Mandatory Minimum', val: mathObj.min || 0 });
                      const extra = Math.max(0, mathObj.wd - (mathObj.min || 0));
                      if (extra > 0) items.push({ label: 'Discretionary Top-up', val: extra });
                      items.push({ isDivider: true });
                  }
                  items.push({ label: 'Taxable Income (100%)', val: mathObj.tax, isDeduction: true, badge: '100% Taxable' });
              }
          } else if (meta.label.match(/TFSA|FHSA|Cash/i)) {
              items = [
                  { label: 'Withdrawal Characterization', isHeader: true },
                  { label: 'Gross Withdrawal', val: meta.value },
                  { label: 'Taxable Portion', val: 0, textRight: '\$0', badge: '100% Tax-Free' }
              ];
          } else {
              items = [{ label: meta.label, val: meta.value }];
          }
      } else if (detailedMode && meta.parentId === 'tax') {
          // 3. In detailed mode, break down federal/provincial taxes into gross generated vs credits applied
          if (meta.label === 'Federal Tax Paid') {
              const fedGross = (yData.taxDetailsP1?.fed || 0) + (yData.taxDetailsP2?.fed || 0) + (yData.taxDetailsP1?.fedCredits || 0) + (yData.taxDetailsP2?.fedCredits || 0);
              const fedCredits = (yData.taxDetailsP1?.fedCredits || 0) + (yData.taxDetailsP2?.fedCredits || 0);
              const fedNet = (yData.taxDetailsP1?.fed || 0) + (yData.taxDetailsP2?.fed || 0);
              items = [
                  { label: 'Federal Tax Details', isHeader: true },
                  { label: 'Gross Federal Tax', val: fedGross },
                  ...(fedCredits > 0 ? [{ label: 'Federal Credits Applied', val: fedCredits, isSavings: true }] : []),
                  { isDivider: true },
                  { label: 'Net Federal Tax Paid', val: fedNet }
              ];
          } else if (meta.label === 'Provincial Tax Paid') {
              const provGross = (yData.taxDetailsP1?.prov || 0) + (yData.taxDetailsP2?.prov || 0) + (yData.taxDetailsP1?.provCredits || 0) + (yData.taxDetailsP2?.provCredits || 0);
              const provCredits = (yData.taxDetailsP1?.provCredits || 0) + (yData.taxDetailsP2?.provCredits || 0);
              const provNet = (yData.taxDetailsP1?.prov || 0) + (yData.taxDetailsP2?.prov || 0);
              items = [
                  { label: 'Provincial Tax Details', isHeader: true },
                  { label: 'Gross Provincial Tax', val: provGross },
                  ...(provCredits > 0 ? [{ label: 'Provincial Credits Applied', val: provCredits, isSavings: true }] : []),
                  { isDivider: true },
                  { label: 'Net Provincial Tax Paid', val: provNet }
              ];
          } else if (meta.label === 'OAS Clawback') {
              const claw = (yData.taxDetailsP1?.oas_clawback || 0) + (yData.taxDetailsP2?.oas_clawback || 0);
              items = [
                  { label: 'OAS Recovery Tax Details', isHeader: true },
                  { label: 'CRA Clawback Threshold', val: yData.oasThreshold || 95323 },
                  { label: 'Recovery Tax (15% Clawback)', val: claw, isDeduction: true }
              ];
          } else {
              items = [{ label: meta.label, val: meta.value }];
          }
      } else if (detailedMode && meta.parentId === 'debt') {
          // 4. In detailed mode, break down mortgage and debt items
          if (meta.label === 'Mortgage Payments') {
              items = [
                  { label: 'Mortgage Details', isHeader: true },
                  { label: 'Annual Payment (P+I)', val: yData.mortgagePay || 0 },
                  { label: 'Remaining Year-End Balance', val: yData.mortgage || 0, badge: 'Balance' }
              ];
          } else {
              items = [{ label: 'Debt & Purchase Breakdown', isHeader: true }];
              if (yData.eduExpense > 0) items.push({ label: 'Education Costs', val: yData.eduExpense });
              if (yData.debtRepayment > 0) items.push({ label: 'Debt Payments / Purchases', val: yData.debtRepayment });
              if (items.length === 1) items.push({ label: meta.label, val: meta.value });
          }
      } else if (detailedMode && meta.parentId === 'govt') {
          // 5. In detailed mode, break down government benefits
          if (meta.label.includes('OAS')) {
              const isP2 = isCouple && meta.label.includes(p2Name);
              const grossOas = isP2 ? (yData.oasP2 || 0) : (yData.oasP1 || 0);
              const oasClaw = isP2 ? (yData.taxDetailsP2?.oas_clawback || 0) : (yData.taxDetailsP1?.oas_clawback || 0);
              items = [
                  { label: 'OAS Pension Details', isHeader: true },
                  { label: 'Gross OAS Entitlement', val: grossOas },
                  ...(oasClaw > 0 ? [{ label: 'Recovery Clawback (15%)', val: oasClaw, isDeduction: true }] : []),
                  { isDivider: true },
                  { label: 'Net OAS Received', val: Math.max(0, grossOas - oasClaw) }
              ];
          } else if (meta.label.includes('CPP')) {
              const isP2 = isCouple && meta.label.includes(p2Name);
              const cppStart = isP2 ? (data.inputs?.p2_cpp_start || 65) : (data.inputs?.p1_cpp_start || 65);
              items = [
                  { label: 'CPP Benefit Details', isHeader: true },
                  { label: 'Start Age', val: 0, textRight: `Age ${cppStart}` },
                  { label: 'Annual Benefit', val: meta.value, badge: '100% Taxable' }
              ];
          } else {
              items = [{ label: meta.label, val: meta.value }];
          }
      } else if (detailedMode && meta.parentId) {
          items = nodeBreakdowns[meta.parentId]?.filter((b: any) => b.label === meta.label) || [{ label: meta.label, val: meta.value }];
      } else {
          // Summary mode
          if (lookUpKey === 'tax') {
              items = [...taxItems];
              if (savingsItems.length > 0) {
                  items.push({ isDivider: true });
                  items.push({ label: 'Tax Reductions Applied', isHeader: true });
                  items = items.concat(savingsItems);
              }
          } else {
              items = nodeBreakdowns[lookUpKey]?.filter((b: any) => b.isDivider || b.isHeader || Math.abs(b.val) > 1) || [];
          }
      }

      return (
          <div className="rounded-2 p-3 transition-none" style={style}>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                  <div className="d-flex align-items-center gap-2">
                      <div style={{ width: '10px', height: '10px', backgroundColor: meta.color }} className="rounded-1"></div>
                      <span className="fw-bold text-main small text-uppercase ls-1">{meta.label}</span>
                  </div>
                  <span className="fw-bolder text-main ms-3">{formatCurrency(meta.value)}</span>
              </div>
              <div className="d-flex flex-column gap-1">
                  {items.map((b: any, i: number) => {
                      if (b.isDivider) return <div key={i} className="border-bottom border-secondary border-opacity-50 my-1"></div>;
                      if (b.isHeader) return <div key={i} className="fw-bold text-main small text-uppercase ls-1 mt-1 opacity-75" style={{fontSize: '0.7rem'}}>{b.label}</div>;
                      return (
                          <div className="d-flex justify-content-between align-items-center small" key={i}>
                              <span className={`fw-medium ${b.isSavings ? 'text-success' : b.isDeduction ? 'text-danger' : 'text-muted'}`}>
                                  {b.isSavings && <i className="bi bi-arrow-down-short me-1"></i>}
                                  {b.label}
                              </span>
                              <div className="d-flex align-items-center gap-2 ms-3">
                                  {b.badge && (
                                      <span className="badge bg-secondary bg-opacity-25 text-muted border border-secondary fw-normal py-0 px-1" style={{ fontSize: '0.65rem' }}>
                                          {b.badge}
                                      </span>
                                  )}
                                  <span className={`fw-bold ${b.isSavings ? 'text-success' : b.isDeduction ? 'text-danger' : 'text-main'}`}>
                                      {b.textRight !== undefined ? b.textRight : ((b.isSavings || b.isDeduction ? '-' : '') + formatCurrency(getRealValue(b.val)))}
                                  </span>
                              </div>
                          </div>
                      );
                  })}
                  {items.length === 0 && (
                      <span className="text-muted small fst-italic">No sub-items this year.</span>
                  )}
              </div>
          </div>
      );
  };

  const topInflowNode = [...leftData].sort((a, b) => b.value - a.value)[0] || { label: 'None', value: 0 };
  const topOutflowNode = [...rightData].filter(d => d.id !== 'sav' && d.parentId !== 'sav').sort((a, b) => b.value - a.value)[0] || { label: 'None', value: 0 };
  const savingsRate = totalSourcedRaw > 0 ? ((contsRaw + unallocatedRaw) / totalSourcedRaw) * 100 : 0;
  const effectiveTax = totalSourcedRaw > 0 ? (taxRaw / totalSourcedRaw) * 100 : 0;

  return (
    <div className="p-3 p-md-4">
      
      <div className="d-flex flex-column flex-md-row align-items-center mb-4 p-3 surface-card rounded-4 border border-secondary shadow-sm">
          <button 
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} rounded-circle shadow-sm mb-3 mb-md-0 d-flex align-items-center justify-content-center transition-all`} 
              style={{width:'55px', height:'55px', flexShrink: 0}} 
              onClick={() => setIsPlaying(!isPlaying)}
          >
              <i className={`bi ${isPlaying ? 'bi-stop-fill' : 'bi-play-fill'} fs-3`}></i>
          </button>
          <div className="flex-grow-1 mx-md-4 w-100">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center text-muted small fw-bold mb-2 gap-2">
                  <span className="d-none d-md-block">{startYear}</span>
                  <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
                      <span className="text-main fs-5 fw-bolder px-3 py-1 bg-black bg-opacity-25 rounded-pill border border-secondary shadow-inner d-flex align-items-center">
                          <i className="bi bi-calendar-event me-2 text-primary"></i> 
                          {currentVal} 
                          <span className="ms-2 small text-muted fw-normal">
                              (Age {yData.p1Age}{isCouple && yData.p2Age ? ` / ${yData.p2Age}` : ''})
                          </span>
                      </span>
                      {getPhaseBadge()}
                  </div>
                  <span className="d-none d-md-block">{endYear}</span>
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

      <div className="row g-3 mb-4 text-center">
          <div className="col-6 col-md-3">
              <div className="rp-card p-3 border-secondary rounded-4 surface-card shadow-sm h-100 d-flex flex-column justify-content-center">
                  <span className="text-muted small fw-bold text-uppercase ls-1 mb-1">Top Inflow</span>
                  <span className="fs-6 fw-bold text-info text-truncate" title={topInflowNode.label}>{topInflowNode.label}</span>
                  <span className="text-main fw-bolder">{formatCurrency(topInflowNode.value)}</span>
              </div>
          </div>
          <div className="col-6 col-md-3">
              <div className="rp-card p-3 border-secondary rounded-4 surface-card shadow-sm h-100 d-flex flex-column justify-content-center">
                  <span className="text-muted small fw-bold text-uppercase ls-1 mb-1">Top Outflow</span>
                  <span className="fs-6 fw-bold text-danger text-truncate" title={topOutflowNode.label}>{topOutflowNode.label}</span>
                  <span className="text-main fw-bolder">{formatCurrency(topOutflowNode.value)}</span>
              </div>
          </div>
          <div className="col-6 col-md-3">
              <div className="rp-card p-3 border-secondary rounded-4 surface-card shadow-sm h-100 d-flex flex-column justify-content-center">
                  <span className="text-muted small fw-bold text-uppercase ls-1 mb-1">Savings Rate</span>
                  <span className="fs-4 fw-bolder text-success">{savingsRate.toFixed(1)}%</span>
                  <span className="text-muted small">{formatCurrency(getRealValue(contsRaw + unallocatedRaw))} saved</span>
              </div>
          </div>
          <div className="col-6 col-md-3">
              <div className="rp-card p-3 border-secondary rounded-4 surface-card shadow-sm h-100 d-flex flex-column justify-content-center">
                  <span className="text-muted small fw-bold text-uppercase ls-1 mb-1">Effective Tax</span>
                  <span className="fs-4 fw-bolder text-danger">{effectiveTax.toFixed(1)}%</span>
                  <span className="text-muted small">{formatCurrency(getRealValue(taxRaw))} tax</span>
              </div>
          </div>
      </div>

      <div className="rp-card p-3 p-md-4 surface-card border-secondary rounded-4 shadow-sm mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pb-3 mb-3 border-bottom border-secondary gap-3">
              <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-bezier2 fs-5 text-primary"></i>
                  <h6 className="mb-0 fw-bold text-uppercase ls-1 text-main">Visual Cash Flow Dynamics</h6>
                  <InfoBtn align="left" title="Cash Flow Dynamics" text="Left side represents total cash inflow sources (income, pensions, benefits, and required portfolio decumulation). Right side tracks destination of cash (living expenses, mortgage, taxes paid, and capital re-invested into savings)." />
              </div>
              <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 cursor-pointer">
                      <input 
                          className="form-check-input cursor-pointer" 
                          type="checkbox" 
                          role="switch" 
                          id="detailedToggle" 
                          checked={detailedMode} 
                          onChange={(e) => setDetailedMode(e.target.checked)} 
                      />
                      <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor="detailedToggle">Detailed View</label>
                  </div>
                  <div className="btn-group btn-group-sm p-1 bg-black bg-opacity-25 rounded-pill border border-secondary shadow-inner">
                      <button 
                          className={`btn rounded-pill px-3 py-1 fw-bold ${viewMode === 'sankey' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} 
                          onClick={() => setViewMode('sankey')}
                      >
                          <i className="bi bi-diagram-3 me-1"></i> Flow
                      </button>
                      <button 
                          className={`btn rounded-pill px-3 py-1 fw-bold ${viewMode === 'ledger' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} 
                          onClick={() => setViewMode('ledger')}
                      >
                          <i className="bi bi-table me-1"></i> Ledger
                      </button>
                  </div>
              </div>
          </div>

          <div className="position-relative w-100 d-flex justify-content-center" ref={chartContainerRef} style={{ minHeight: '550px' }}>
              {viewMode === 'sankey' && (
                  <div className="w-100" style={{ maxWidth: '1200px', overflowX: 'auto' }}>
                      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="w-100 h-auto user-select-none" style={{ minWidth: '850px' }}>
                          {leftLinks.map((l, i) => (
                              <path key={`LL-${i}`} d={l.path} fill="none" stroke={l.color} strokeWidth={l.h} strokeOpacity={getLinkOpacity(l.id)} 
                                    className="transition-all cursor-crosshair" onMouseMove={(e) => handleMouseMove(e, l.id)} onMouseLeave={handleMouseLeave} />
                          ))}

                          {rightLinks.map((l, i) => (
                              <path key={`RL-${i}`} d={l.path} fill="none" stroke={l.color} strokeWidth={l.h} strokeOpacity={getLinkOpacity(l.id)} 
                                    className="transition-all cursor-crosshair" onMouseMove={(e) => handleMouseMove(e, l.id)} onMouseLeave={handleMouseLeave} />
                          ))}

                          {leftNodes.map((n, i) => (
                              <g key={`L-${i}`} className="transition-all cursor-crosshair" style={{ opacity: getOpacity(n.id) }} 
                                 onMouseMove={(e) => handleMouseMove(e, n.id)} onMouseLeave={handleMouseLeave}>
                                  <rect x={LEFT_X - NODE_W} y={n.y} width={NODE_W} height={n.h} fill={n.color} />
                                  <text x={LEFT_X - NODE_W - 12} y={n.ty} textAnchor="end" alignmentBaseline="middle" fill="currentColor" className="fw-bold" style={{ fontSize: detailedMode ? '11px' : '13px' }}>
                                      <tspan fill="currentColor" opacity="0.95">{n.label}</tspan>
                                      <tspan fill={n.color} dx="8px" fontWeight="800">{formatCurrency(n.value)}</tspan>
                                      <tspan fill="currentColor" opacity="0.4" fontSize="10px" fontStyle="italic" dx="6px">({((n.value / MAX) * 100).toFixed(0)}%)</tspan>
                                  </text>
                              </g>
                          ))}

                          {rightNodes.map((n, i) => (
                              <g key={`R-${i}`} className="transition-all cursor-crosshair" style={{ opacity: getOpacity(n.id) }} 
                                 onMouseMove={(e) => handleMouseMove(e, n.id)} onMouseLeave={handleMouseLeave}>
                                  <rect x={RIGHT_X} y={n.y} width={NODE_W} height={n.h} fill={n.color} />
                                  <text x={RIGHT_X + NODE_W + 12} y={n.ty} textAnchor="start" alignmentBaseline="middle" fill="currentColor" className="fw-bold" style={{ fontSize: detailedMode ? '11px' : '13px' }}>
                                      <tspan fill="currentColor" opacity="0.95">{n.label}</tspan>
                                      <tspan fill={n.color} dx="8px" fontWeight="800">{formatCurrency(n.value)}</tspan>
                                      <tspan fill="currentColor" opacity="0.4" fontSize="10px" fontStyle="italic" dx="6px">({((n.value / MAX) * 100).toFixed(0)}%)</tspan>
                                  </text>
                              </g>
                          ))}

                          {MAX > 1 && (
                              <g className="transition-all cursor-crosshair" style={{ opacity: getOpacity('center') }} 
                                 onMouseMove={(e) => handleMouseMove(e, 'center')} onMouseLeave={handleMouseLeave}>
                                  <rect x={CENTER_LEFT} y={centerY} width={CENTER_RIGHT - CENTER_LEFT} height={centerH} fill="url(#centerGrad)" />
                                  <text x={VIEWBOX_W / 2} y={centerY - 25} textAnchor="middle" fill="currentColor" className="fw-bold text-uppercase ls-1" style={{ fontSize: '12px', opacity: 0.6 }}>Total Cash Sourced</text>
                                  <text x={VIEWBOX_W / 2} y={centerY - 8} textAnchor="middle" fill="#10b981" className="fw-bold" style={{ fontSize: '16px' }}>{formatCurrency(MAX)}</text>
                              </g>
                          )}

                          <defs>
                              <linearGradient id="centerGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
                              </linearGradient>
                          </defs>
                      </svg>
                  </div>
              )}

              {viewMode === 'ledger' && (
                  <div className="row g-4 w-100 fade-in py-2 m-0">
                      <div className="col-12 col-lg-6 ps-0">
                          <div className="d-flex justify-content-between align-items-end mb-2">
                              <h6 className="fw-bold text-info text-uppercase ls-1 mb-0">Total Inflows</h6>
                              <span className="fw-bolder fs-5 text-info">{formatCurrency(totalLeft)}</span>
                          </div>
                          
                          <div className="w-100 d-flex rounded-1 overflow-hidden mb-3 shadow-sm border border-secondary" style={{height: '35px'}}>
                              {leftData.map(d => (
                                  <div key={d.id} className="h-100 cursor-crosshair transition-all border-end border-black border-opacity-50" 
                                       style={{width: `${(d.value/MAX)*100}%`, backgroundColor: d.color, opacity: getOpacity(d.id)}} 
                                       onMouseMove={(e) => handleMouseMove(e, d.id)} onMouseLeave={handleMouseLeave} />
                              ))}
                          </div>
                          
                          <div className="d-flex flex-column gap-2 pe-1 custom-scrollbar overflow-auto" style={{maxHeight: '420px'}}>
                              {leftData.map(d => (
                                   <div key={d.id} className="d-flex justify-content-between align-items-center p-3 rounded-1 bg-input border border-secondary shadow-sm cursor-crosshair transition-all hover-bg-secondary" 
                                        style={{opacity: getOpacity(d.id)}}
                                        onMouseMove={(e) => handleMouseMove(e, d.id)} onMouseLeave={handleMouseLeave}>
                                       <div className="d-flex align-items-center gap-3">
                                           <div style={{width: '12px', height: '12px', backgroundColor: d.color}} className="rounded-1 flex-shrink-0"></div>
                                           <span className="fw-bold text-main small">{d.label}</span>
                                       </div>
                                       <div className="d-flex align-items-center gap-3">
                                           <span className="badge bg-secondary bg-opacity-25 text-muted border border-secondary px-2 py-1 font-monospace" style={{fontSize: '0.75rem'}}>
                                               {((d.value/MAX)*100).toFixed(1)}%
                                           </span>
                                           <span className="fw-bolder text-main">{formatCurrency(d.value)}</span>
                                       </div>
                                   </div>
                              ))}
                          </div>
                      </div>

                      <div className="col-12 col-lg-6 pe-0">
                          <div className="d-flex justify-content-between align-items-end mb-2">
                              <h6 className="fw-bold text-danger text-uppercase ls-1 mb-0">Total Outflows & Allocations</h6>
                              <span className="fw-bolder fs-5 text-danger">{formatCurrency(totalRight)}</span>
                          </div>

                          <div className="w-100 d-flex rounded-1 overflow-hidden mb-3 shadow-sm border border-secondary" style={{height: '35px'}}>
                              {rightData.map(d => (
                                  <div key={d.id} className="h-100 cursor-crosshair transition-all border-end border-black border-opacity-50" 
                                       style={{width: `${(d.value/MAX)*100}%`, backgroundColor: d.color, opacity: getOpacity(d.id)}} 
                                       onMouseMove={(e) => handleMouseMove(e, d.id)} onMouseLeave={handleMouseLeave} />
                              ))}
                          </div>

                          <div className="d-flex flex-column gap-2 pe-1 custom-scrollbar overflow-auto" style={{maxHeight: '420px'}}>
                              {rightData.map(d => (
                                   <div key={d.id} className="d-flex justify-content-between align-items-center p-3 rounded-1 bg-input border border-secondary shadow-sm cursor-crosshair transition-all hover-bg-secondary" 
                                        style={{opacity: getOpacity(d.id)}}
                                        onMouseMove={(e) => handleMouseMove(e, d.id)} onMouseLeave={handleMouseLeave}>
                                       <div className="d-flex align-items-center gap-3">
                                           <div style={{width: '12px', height: '12px', backgroundColor: d.color}} className="rounded-1 flex-shrink-0"></div>
                                           <span className="fw-bold text-main small">{d.label}</span>
                                       </div>
                                       <div className="d-flex align-items-center gap-3">
                                           <span className="badge bg-secondary bg-opacity-25 text-muted border border-secondary px-2 py-1 font-monospace" style={{fontSize: '0.75rem'}}>
                                               {((d.value/MAX)*100).toFixed(1)}%
                                           </span>
                                           <span className="fw-bolder text-main">{formatCurrency(d.value)}</span>
                                       </div>
                                   </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {renderTooltip()}
          </div>
      </div>
    </div>
  );
}
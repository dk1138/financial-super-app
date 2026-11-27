'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  useFinanceStore,
  useFinanceCanUndo,
  useFinanceCanRedo,
  useFinanceActions,
} from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';
import { CANADIAN_PERSONAS } from '../lib/personas';

interface CommandItem {
  id: string;
  group: string;
  label: string;
  subtitle?: string;
  icon: string;
  searchIndex: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onQuickSave: () => void;
  onOpenShare: () => void;
}

const QUICK_TOOLS: Array<{ id: string; title: string; frTitle: string; category: string; keywords: string }> = [
  { id: 'sensitivity', title: 'Retirement Age vs. Spend Heatmap & Max Safe Spend Solver', frTitle: 'Carte de sensibilité et dépenses max.', category: 'Master Simulations', keywords: 'heatmap sensitivity max spend safe spend retirement age' },
  { id: 'coast-fire', title: 'Coast FIRE & Barista FIRE Calculator', frTitle: 'Calculateur Coast FIRE et Barista FIRE', category: 'Master Simulations', keywords: 'coast fire barista fire early retirement' },
  { id: 'smoother', title: 'Consumption Smoothing & Die With Zero', frTitle: 'Lissage de la consommation et Mourir avec zéro', category: 'Master Simulations', keywords: 'consumption smoothing die with zero maximum spend lifestyle' },
  { id: 'cpp', title: 'CPP Grid Search', frTitle: 'Optimiseur RPC/RRQ et SV', category: 'Master Simulations', keywords: 'cpp oas rpc rrq sv pension start age' },
  { id: 'pensioncv', title: 'Pension Commuted Value', frTitle: 'Valeur de rachat de pension', category: 'Master Simulations', keywords: 'commuted value db pension lump sum' },
  { id: 'pensionbb', title: 'Pension Buyback', frTitle: 'Rachat de service de pension', category: 'Master Simulations', keywords: 'pension buyback past service' },
  { id: 'tax-curve', title: 'Marginal Tax Rate & Clawback Curve', frTitle: 'Courbe d’impôt marginal et récupération SV', category: 'Tax & Registered', keywords: 'marginal tax clawback oas emtr surtax' },
  { id: 'sweetspot', title: 'RRSP Sweet Spot', frTitle: 'Zone optimale REER', category: 'Tax & Registered', keywords: 'rrsp reer sweet spot deduction bracket' },
  { id: 'grossup', title: 'RRSP Gross-Up Maximizer', frTitle: 'Maximiseur de remboursement REER', category: 'Tax & Registered', keywords: 'rrsp gross up loan refund' },
  { id: 'tfsavsrrsp', title: 'TFSA vs RRSP', frTitle: 'CELI vs REER', category: 'Tax & Registered', keywords: 'tfsa celi rrsp reer comparison' },
  { id: 'tfsa-room', title: 'TFSA Room Calculator', frTitle: 'Calculateur de droits CELI', category: 'Tax & Registered', keywords: 'tfsa celi room contribution cra' },
  { id: 'lif-unlock', title: 'LIF to RRIF Flexibility Optimizer', frTitle: 'Déblocage FRV vers FERR', category: 'Tax & Registered', keywords: 'lif frv rrif ferr lira cri unlocking' },
  { id: 'gis-maximizer', title: 'GIS & Low-Income Maximizer', frTitle: 'Maximiseur SRG et faible revenu', category: 'Tax & Registered', keywords: 'gis srg low income clawback' },
  { id: 'estate-tax', title: 'Canadian Estate & Final Tax Calculator', frTitle: 'Impôt successoral canadien', category: 'Tax & Registered', keywords: 'estate tax terminal probate inheritance' },
  { id: 'ccb', title: 'CCB Maximizer', frTitle: 'Maximiseur ACE', category: 'Tax & Registered', keywords: 'ccb ace canada child benefit' },
  { id: 'fhsa', title: 'FHSA vs RRSP', frTitle: 'CELIAPP vs REER', category: 'Tax & Registered', keywords: 'fhsa celiapp first home buyer hbp' },
  { id: 'resp', title: 'RESP Grant Maximizer', frTitle: 'Maximiseur de subventions REEE', category: 'Tax & Registered', keywords: 'resp reee cesg education grant' },
  { id: 'medical', title: 'Medical Expense Optimizer', frTitle: 'Optimiseur de frais médicaux', category: 'Tax & Registered', keywords: 'medical metc health tax credit' },
  { id: 'sidehustle', title: 'Side Hustle ROI', frTitle: 'Rentabilité de revenu d’appoint', category: 'Business & Income', keywords: 'side hustle business self employed' },
  { id: 'buyvsrent', title: 'Buy vs Rent Analyzer', frTitle: 'Acheter vs Louer', category: 'Debt, Real Estate & Cash', keywords: 'buy vs rent housing mortgage' },
  { id: 'mvi', title: 'Mortgage vs Invest', frTitle: 'Hypothèque vs Investir', category: 'Debt, Real Estate & Cash', keywords: 'mortgage vs invest debt paydown' },
  { id: 'smith', title: 'Smith Maneuver', frTitle: 'Manœuvre Smith', category: 'Debt, Real Estate & Cash', keywords: 'smith maneuver heloc tax deductible' },
  { id: 'emerg', title: 'Emergency Fund', frTitle: 'Fonds d’urgence', category: 'Debt, Real Estate & Cash', keywords: 'emergency fund cash cushion' },
  { id: 'car', title: 'Car Lease vs Buy', frTitle: 'Location vs Achat auto', category: 'Debt, Real Estate & Cash', keywords: 'car lease buy vehicle' },
  { id: 'afford', title: 'Mortgage Affordability', frTitle: 'Capacité d’emprunt hypothécaire', category: 'Debt, Real Estate & Cash', keywords: 'mortgage affordability gds tds stress test' },
  { id: 'moveup', title: 'Home Move-Up', frTitle: 'Agrandissement de propriété', category: 'Debt, Real Estate & Cash', keywords: 'home move up upgrade house' },
  { id: 'renewal', title: 'Mortgage Renewal', frTitle: 'Renouvellement hypothécaire', category: 'Debt, Real Estate & Cash', keywords: 'mortgage renewal fixed variable' },
  { id: 'reversemortgage', title: 'Reverse Mortgage', frTitle: 'Hypothèque inversée', category: 'Debt, Real Estate & Cash', keywords: 'reverse mortgage chip home equity' },
  { id: 'cppimport', title: 'CPP Statement Importer', frTitle: 'Importateur relevé RPC', category: 'Data Importers', keywords: 'cpp import service canada statement' },
];

function CommandPaletteContent({
  onClose,
  onToggleTheme,
  onQuickSave,
  onOpenShare,
}: Omit<CommandPaletteModalProps, 'isOpen'>) {
  const router = useRouter();
  const pathname = usePathname();
  const useRealDollars = useFinanceStore((s) => Boolean(s.data.useRealDollars));
  const canUndo = useFinanceCanUndo();
  const canRedo = useFinanceCanRedo();
  const { updateUseRealDollars, undo, redo, loadData } = useFinanceActions();
  const { lang, toggleLang, t } = useTranslation();
  const isFr = lang === 'fr';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigatePlanner = (tab: string, toolId?: string, sectionId?: string) => {
    onClose();
    if (!pathname.startsWith('/planner')) {
      const qs = new URLSearchParams();
      if (toolId) qs.set('tool', toolId);
      else qs.set('tab', tab);
      router.push(`/planner?${qs.toString()}`);
      return;
    }
    window.dispatchEvent(
      new CustomEvent('planfolio:navigate', { detail: { tab, toolId, sectionId } })
    );
  };

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    const pushItem = (
      item: Omit<CommandItem, 'searchIndex'> & { keywords: string }
    ) => {
      items.push({
        ...item,
        searchIndex: `${item.label} ${item.subtitle || ''} ${item.group} ${item.keywords}`.toLowerCase(),
      });
    };

    // 1. Quick Actions
    const actionsGroup = isFr ? 'Actions rapides' : 'Quick Actions';
    pushItem({
      id: 'act-save',
      group: actionsGroup,
      label: isFr ? 'Sauvegarder le plan actuel' : 'Quick Save Current Plan',
      icon: 'bi-floppy-fill text-primary',
      keywords: 'save sauvegarde enregistrer ctrl+s',
      shortcut: 'Ctrl+S',
      action: () => {
        onClose();
        onQuickSave();
      },
    });
    pushItem({
      id: 'act-real',
      group: actionsGroup,
      label: useRealDollars
        ? (isFr ? 'Passer en dollars nominaux ($)' : 'Switch to Nominal Dollars')
        : (isFr ? "Passer en dollars d'aujourd'hui" : "Switch to Today's Dollars (Real)"),
      icon: 'bi-currency-dollar text-info',
      keywords: 'real nominal todays dollars inflation toggle',
      action: () => {
        updateUseRealDollars(!useRealDollars);
        onClose();
      },
    });
    pushItem({
      id: 'act-lang',
      group: actionsGroup,
      label: isFr ? 'Switch to English (EN)' : 'Passer en français (FR)',
      icon: 'bi-translate text-primary',
      keywords: 'language langue english french francais en fr',
      action: () => {
        toggleLang();
        onClose();
      },
    });
    pushItem({
      id: 'act-theme',
      group: actionsGroup,
      label: isFr ? 'Changer le thème (Sombre / Clair)' : 'Toggle Dark / Light Theme',
      icon: 'bi-circle-half text-warning',
      keywords: 'dark light theme mode sombre clair',
      action: () => {
        onToggleTheme();
        onClose();
      },
    });
    pushItem({
      id: 'act-share',
      group: actionsGroup,
      label: isFr ? 'Partager le lien du plan (URL)' : 'Share Plan Link (URL)',
      icon: 'bi-share-fill text-success',
      keywords: 'share link url export',
      action: () => {
        onClose();
        onOpenShare();
      },
    });

    if (canUndo) {
      pushItem({
        id: 'act-undo',
        group: actionsGroup,
        label: isFr ? 'Annuler la dernière modification' : 'Undo Last Change',
        icon: 'bi-arrow-counterclockwise text-secondary',
        keywords: 'undo annuler ctrl+z',
        shortcut: 'Ctrl+Z',
        action: () => {
          undo();
          onClose();
        },
      });
    }
    if (canRedo) {
      pushItem({
        id: 'act-redo',
        group: actionsGroup,
        label: isFr ? 'Rétablir la modification' : 'Redo Change',
        icon: 'bi-arrow-clockwise text-secondary',
        keywords: 'redo retablir ctrl+y',
        shortcut: 'Ctrl+Y',
        action: () => {
          redo();
          onClose();
        },
      });
    }

    // 2. Navigation Tabs
    const tabsGroup = isFr ? 'Onglets du planificateur' : 'Planner Tabs';
    const tabDefs = [
      { id: 'plan', label: t('tabs.inputs', 'Inputs'), icon: 'bi-pencil-square', kw: 'inputs plan donnees' },
      { id: 'strategy', label: t('tabs.strategy', 'Strategy'), icon: 'bi-sliders', kw: 'strategy strategie meltdown matrix' },
      { id: 'dashboard', label: t('tabs.summary', 'Summary'), icon: 'bi-clipboard2-data', kw: 'summary dashboard sommaire score' },
      { id: 'projection', label: t('tabs.projection', 'Projection'), icon: 'bi-table', kw: 'projection table year by year tableau' },
      { id: 'risk', label: t('tabs.risk', 'Risk'), icon: 'bi-activity', kw: 'risk monte carlo sorr survivor stress' },
      { id: 'cashflow', label: t('tabs.cashflow', 'Cash Flow'), icon: 'bi-diagram-3', kw: 'cashflow sankey flux tresorerie' },
      { id: 'optimizers', label: t('tabs.tools', 'Tools & Calculators'), icon: 'bi-magic', kw: 'tools calculators outils calculateurs' },
      { id: 'compare', label: t('tabs.compare', 'Compare'), icon: 'bi-bar-chart-line', kw: 'compare benchmark comparer' },
      { id: 'databank', label: t('tabs.dataBank', 'Data Bank'), icon: 'bi-clock-history', kw: 'data bank banque donnees' },
    ];
    tabDefs.forEach((tb) => {
      pushItem({
        id: `tab-${tb.id}`,
        group: tabsGroup,
        label: tb.label,
        icon: `${tb.icon} text-primary`,
        keywords: tb.kw,
        action: () => navigatePlanner(tb.id),
      });
    });

    // 3. Input Sections
    const secGroup = isFr ? 'Cartes de saisie (1–10)' : 'Input Cards (1–10)';
    const sections = [
      { id: 'personal', en: '1. Personal Information', fr: '1. Informations personnelles', icon: 'bi-person-vcard' },
      { id: 'dependents', en: '2. Dependents & Family', fr: '2. Personnes à charge', icon: 'bi-people' },
      { id: 'portfolio', en: '3. Portfolio Assets (TFSA, RRSP, FHSA)', fr: '3. Actifs du portefeuille (CELI, REER, CELIAPP)', icon: 'bi-wallet2' },
      { id: 'realestate', en: '4. Real Estate & Housing', fr: '4. Immobilier et logement', icon: 'bi-house-heart' },
      { id: 'tax', en: '5. Income & Taxation', fr: '5. Revenus et impôts', icon: 'bi-cash-coin' },
      { id: 'living', en: '6. Living Expenses', fr: '6. Frais de subsistance', icon: 'bi-cart4' },
      { id: 'future', en: '7. Debts & Future Expenses', fr: '7. Dettes et dépenses futures', icon: 'bi-cart-dash' },
      { id: 'windfalls', en: '8. Windfalls & Inflows', fr: '8. Rentrées et héritages', icon: 'bi-gift' },
      { id: 'govt', en: '9. Government Benefits (CPP, OAS, DB)', fr: '9. Prestations gouv. (RPC/RRQ, SV, PD)', icon: 'bi-bank' },
      { id: 'economic', en: '10. Economic Assumptions', fr: '10. Hypothèses économiques', icon: 'bi-graph-up-arrow' },
    ];
    sections.forEach((s) => {
      pushItem({
        id: `sec-${s.id}`,
        group: secGroup,
        label: isFr ? s.fr : s.en,
        icon: `${s.icon} text-info`,
        keywords: `${s.en} ${s.fr}`,
        action: () => navigatePlanner('plan', undefined, s.id),
      });
    });

    // 4. 30 Tools & Calculators
    const toolsGroup = isFr ? 'Outils et calculateurs (30)' : 'Tools & Calculators (30)';
    QUICK_TOOLS.forEach((tool) => {
      pushItem({
        id: `tool-${tool.id}`,
        group: toolsGroup,
        label: isFr ? tool.frTitle : tool.title,
        subtitle: tool.category,
        icon: 'bi-calculator text-success',
        keywords: `${tool.title} ${tool.frTitle} ${tool.keywords}`,
        action: () => navigatePlanner('optimizers', tool.id),
      });
    });

    // 5. Canadian Personas
    const personaGroup = isFr ? 'Profils canadiens prêts à l’emploi' : 'Canadian Persona Presets';
    CANADIAN_PERSONAS.forEach((p) => {
      pushItem({
        id: `persona-${p.id}`,
        group: personaGroup,
        label: p.title,
        subtitle: p.subtitle,
        icon: 'bi-person-badge text-warning',
        keywords: 'persona preset sample',
        action: () => {
          if (loadData) {
            loadData(p.buildPlan());
            localStorage.setItem('active_plan_name', p.title);
            window.dispatchEvent(new CustomEvent('updateActivePlan', { detail: p.title }));
          }
          navigatePlanner('dashboard');
        },
      });
    });

    return items;
  }, [isFr, useRealDollars, canUndo, canRedo, pathname]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 16);
    const tokens = q.split(/\s+/);
    const matches: CommandItem[] = [];
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      let ok = true;
      for (let j = 0; j < tokens.length; j++) {
        if (!item.searchIndex.includes(tokens[j])) {
          ok = false;
          break;
        }
      }
      if (ok) {
        matches.push(item);
        if (matches.length >= 16) break;
      }
    }
    return matches;
  }, [allItems, query]);

  const safeSelectedIndex =
    filteredItems.length === 0 ? 0 : Math.min(selectedIndex, filteredItems.length - 1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      );
    } else if (e.key === 'Enter' && filteredItems[safeSelectedIndex]) {
      e.preventDefault();
      filteredItems[safeSelectedIndex].action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center px-3"
      style={{
        zIndex: 10050,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        paddingTop: '11vh',
      }}
      onClick={onClose}
    >
      <div
        className="rp-card border border-secondary rounded-4 shadow-lg overflow-hidden w-100"
        style={{
          maxWidth: '620px',
          backgroundColor: 'var(--bg-card)',
          contain: 'layout style',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="d-flex align-items-center gap-2 px-3 py-2.5 border-bottom border-secondary surface-card">
          <i className="bi bi-search text-primary fs-5"></i>
          <input
            ref={inputRef}
            type="text"
            className="form-control border-0 bg-transparent text-main shadow-none fw-medium"
            placeholder={
              isFr
                ? 'Rechercher un onglet, une carte, un calculateur (ex. RPC, REER, FIRE)...'
                : 'Jump to any tab, input card, calculator (e.g. CPP, RRSP, FIRE), or action...'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{ fontSize: '0.95rem' }}
          />
          <kbd className="bg-secondary bg-opacity-25 text-muted px-2 py-1 rounded small fw-bold" style={{ fontSize: '0.68rem' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2" style={{ maxHeight: '58vh', overflowY: 'auto' }}>
          {filteredItems.length === 0 ? (
            <div className="text-center text-muted py-4 small">
              <i className="bi bi-search fs-4 d-block mb-2 opacity-50"></i>
              {isFr ? 'Aucun résultat trouvé.' : 'No matching tools, cards, or actions.'}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const isSelected = idx === safeSelectedIndex;

              return (
                <React.Fragment key={item.id}>
                  {showGroup && (
                    <div
                      className="text-muted fw-bold text-uppercase ls-1 px-2.5 pt-2 pb-1"
                      style={{ fontSize: '0.66rem' }}
                    >
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`w-100 btn text-start d-flex align-items-center justify-content-between gap-2 px-2.5 py-2 rounded-3 border-0 ${
                      isSelected ? 'bg-primary bg-opacity-10 text-main' : 'bg-transparent text-main'
                    }`}
                    onMouseMove={isSelected ? undefined : () => setSelectedIndex(idx)}
                    onClick={item.action}
                  >
                    <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                      <i className={`bi ${item.icon} fs-6 flex-shrink-0`}></i>
                      <div className="overflow-hidden">
                        <div className="fw-bold small text-truncate">{item.label}</div>
                        {item.subtitle && (
                          <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.shortcut ? (
                      <kbd
                        className="bg-secondary bg-opacity-25 text-muted px-2 py-0.5 rounded small fw-bold flex-shrink-0"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {item.shortcut}
                      </kbd>
                    ) : isSelected ? (
                      <i className="bi bi-return-left text-primary small flex-shrink-0"></i>
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top border-secondary bg-secondary bg-opacity-10 text-muted" style={{ fontSize: '0.7rem' }}>
          <div className="d-flex align-items-center gap-3">
            <span>
              <kbd className="bg-secondary bg-opacity-25 text-muted px-1.5 py-0.5 rounded me-1">↑↓</kbd>
              {isFr ? 'Naviguer' : 'Navigate'}
            </span>
            <span>
              <kbd className="bg-secondary bg-opacity-25 text-muted px-1.5 py-0.5 rounded me-1">↵</kbd>
              {isFr ? 'Ouvrir' : 'Select'}
            </span>
          </div>
          <span className="fw-bold text-primary">Planfolio Quick Jump</span>
        </div>
      </div>
    </div>
  );
}

export default function CommandPaletteModal(props: CommandPaletteModalProps) {
  if (!props.isOpen) return null;
  return (
    <CommandPaletteContent
      onClose={props.onClose}
      onToggleTheme={props.onToggleTheme}
      onQuickSave={props.onQuickSave}
      onOpenShare={props.onOpenShare}
    />
  );
}

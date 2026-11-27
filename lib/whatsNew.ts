export type ChangeCategory = 'new' | 'improved' | 'fixed';

export interface ChangeItem {
  category: ChangeCategory;
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
}

export interface ReleaseEntry {
  version: string;
  date: string;
  headlineEn: string;
  headlineFr: string;
  items: ChangeItem[];
}

export const WHATS_NEW_RELEASES: ReleaseEntry[] = [
  {
    version: '1.2.3',
    date: 'Nov 2026',
    headlineEn: 'Full Yearly Spreadsheet, Command Palette, Historical Crash Presets & Speed Upgrades',
    headlineFr: 'Feuille de calcul annuelle, Palette Ctrl+K, Scénarios de krach et gains de vitesse',
    items: [
      {
        category: 'new',
        titleEn: 'Full Yearly Spreadsheet View & Excel CSV Export (P1 & P2)',
        titleFr: 'Vue Feuille de calcul annuelle et export CSV Excel (P1 et P2)',
        descEn: 'Switch between Summary and Spreadsheet in the Projection tab to see Income, CPP, OAS, DB Pensions, Gov Benefits, account-by-account Contributions & Withdrawals (Non-Reg, TFSA, RRSP, RRIF, LIF), Spending, Taxes, and Ending Balances in one place — with a Freeze Timeline toggle and 1-click Full CSV export.',
        descFr: 'Basculez entre Résumé et Feuille de calcul dans l’onglet Projection pour voir tous les revenus, RRQ/RPC, SV, régimes PD, prestations, cotisations, retraits, dépenses, impôts et soldes de P1 et P2 — avec gel des colonnes Chronologie et export CSV complet.',
      },
      {
        category: 'new',
        titleEn: 'Ctrl+K Command Palette & Ctrl+S Quick Save',
        titleFr: 'Palette de commandes Ctrl+K et sauvegarde rapide Ctrl+S',
        descEn: 'Press Ctrl+K (⌘K) anywhere to instantly jump to any tab, input section, or any of the 30 calculators. An amber Save pill now tracks unsaved changes with 1-click or Ctrl+S quick save.',
        descFr: 'Appuyez sur Ctrl+K (⌘K) pour accéder instantanément à tout onglet, section ou calculateur. Un badge Sauvegarder ambré suit désormais vos modifications non enregistrées.',
      },
      {
        category: 'new',
        titleEn: 'Historical Crash Presets & Monte Carlo Percentiles',
        titleFr: 'Scénarios de krach historiques et percentiles Monte Carlo',
        descEn: 'Stress-test your retirement against 2008 GFC, 2000 Dot-Com Bust, and 1966 Stagflation in the Risk tab, and inspect 10th / 50th / 90th percentile terminal portfolio outcomes.',
        descFr: 'Testez votre retraite face aux krachs de 2008, 2000 et 1966 dans l’onglet Risque et consultez les résultats aux 10e, 50e et 90e percentiles.',
      },
      {
        category: 'new',
        titleEn: '1-Click Go-Go / Slow-Go / No-Go Spending & Plan Notes',
        titleFr: 'Phases Go-Go / Slow-Go / No-Go en 1 clic et Notes du plan',
        descEn: 'Auto-fill retirement spending phases (100% / -15% / -30%) across all expense items in Living Expenses, document assumptions per scenario with the new Notes journal, and export a 1-click AI Review Summary from Share.',
        descFr: 'Remplissez automatiquement les phases de dépenses (100 % / -15 % / -30 %), consignez vos hypothèses dans le journal de notes et copiez un résumé prêt pour l’IA.',
      },
      {
        category: 'improved',
        titleEn: 'Faster Rendering, 60fps Scrolling & Full French Localization',
        titleFr: 'Affichage plus rapide, défilement fluide et français canadien complet',
        descEn: 'Code-split tabs, lazy-mounted calculators, granular state updates, and removed heavy modal blurs for snappier editing and smooth scrolling. Completed Canadian French (fr-CA) translations and currency formatting.',
        descFr: 'Chargement paresseux des onglets et calculateurs, mises à jour granulaires pour une navigation fluide, et traduction complète en français canadien (fr-CA).',
      },
      {
        category: 'fixed',
        titleEn: 'Tax, Engine & Light Mode Polish',
        titleFr: 'Correctifs fiscaux, moteur et mode clair',
        descEn: 'Fixed FHSA 15-year rollover tracking, Ontario Surtax & Dividend Tax Credit order (CRA ON428), survivor expense timing, and improved Light Mode badge/table contrast.',
        descFr: 'Correction du suivi CELIAPP sur 15 ans, de l’ordre du crédit pour dividendes et surtaxe de l’Ontario, des dépenses de survivant et du contraste en mode clair.',
      },
    ],
  },
];

export interface ProvinceSeoEntry {
  slug: string;
  code: string;
  name: string;
  highlight2026: string;
}

export const PROVINCIAL_TAX_PAGES: ProvinceSeoEntry[] = [
  {
    slug: 'ontario',
    code: 'ON',
    name: 'Ontario',
    highlight2026: 'Includes Ontario’s 20% ($5,818) and 36% ($7,446) stacked surtaxes (up to 56% combined), Ontario Health Premium ($0–$900), ON428 pre-surtax Dividend Tax Credit, and $300 basic Ontario Tax Reduction.',
  },
  {
    slug: 'british-columbia',
    code: 'BC',
    name: 'British Columbia',
    highlight2026: 'Reflects BC Budget 2026’s 5.60% lowest personal tax rate (up to $50,363), $13,216 BC Basic Personal Amount, 12.0% eligible dividend tax credit, and the 2027–2030 bracket indexation pause.',
  },
  {
    slug: 'alberta',
    code: 'AB',
    name: 'Alberta',
    highlight2026: 'Reflects Alberta’s 8.0% lowest tax bracket up to $61,200, Canada’s highest provincial Basic Personal Amount ($22,769), and zero provincial surtaxes or health levies.',
  },
  {
    slug: 'quebec',
    code: 'QC',
    name: 'Quebec',
    highlight2026: 'Models Revenu Québec’s 14%–25.75% brackets, the 16.5% federal Quebec Tax Abatement, $18,952 Line 350 Basic Personal Amount, QPP (6.30%) + QPP2 (4%), reduced 1.30% EI, and 0.43% QPIP.',
  },
  {
    slug: 'manitoba',
    code: 'MB',
    name: 'Manitoba',
    highlight2026: 'Reflects Manitoba’s statutory $47,000 / $100,000 frozen bracket thresholds (10.80%, 12.75%, 17.40%) and the $15,780 Manitoba BPA clawback between $200,000 and $400,000.',
  },
  {
    slug: 'saskatchewan',
    code: 'SK',
    name: 'Saskatchewan',
    highlight2026: 'Reflects Saskatchewan’s 3-bracket progressive schedule (10.5%, 12.5%, 14.5%), enhanced $20,381 Basic Personal Amount under the Affordability Act, and 11.0% eligible dividend credit.',
  },
  {
    slug: 'nova-scotia',
    code: 'NS',
    name: 'Nova Scotia',
    highlight2026: 'Reflects Nova Scotia’s 2026 indexed 5-bracket schedule (8.79% to 21.0%) and $11,932 universal Basic Personal Amount.',
  },
  {
    slug: 'new-brunswick',
    code: 'NB',
    name: 'New Brunswick',
    highlight2026: 'Reflects New Brunswick’s 4-bracket 2026 schedule (9.4% to 19.5%), $13,664 Basic Personal Amount, and generous 14.0% provincial eligible dividend tax credit.',
  },
  {
    slug: 'newfoundland-and-labrador',
    code: 'NL',
    name: 'Newfoundland and Labrador',
    highlight2026: 'Reflects Newfoundland and Labrador’s 8-bracket progressive schedule (8.7% up to 21.8% above $1,141,275) and $11,188 Basic Personal Amount.',
  },
  {
    slug: 'prince-edward-island',
    code: 'PE',
    name: 'Prince Edward Island',
    highlight2026: 'Reflects PEI Budget 2026’s new 6th bracket at 20.0% above $200,000 (replacing the repealed surtax), 1.8% bracket indexation, and $15,000 Basic Personal Amount.',
  },
  {
    slug: 'yukon',
    code: 'YT',
    name: 'Yukon',
    highlight2026: 'Reflects Yukon’s 5-bracket schedule (6.4% to 15.0% above the unindexed $500,000 threshold) and federal-mirrored Basic Personal Amount ($16,452 clawing back to $14,829).',
  },
  {
    slug: 'northwest-territories',
    code: 'NT',
    name: 'Northwest Territories',
    highlight2026: 'Reflects the Northwest Territories’ 4-bracket 2026 schedule (5.9% to 14.05%), $18,198 Basic Personal Amount, and 11.5% eligible dividend tax credit.',
  },
  {
    slug: 'nunavut',
    code: 'NU',
    name: 'Nunavut',
    highlight2026: 'Reflects Canada’s lowest territorial income tax rates (4.0%, 7.0%, 9.0%, and 11.5%) alongside Nunavut’s $19,659 Basic Personal Amount.',
  },
];

export const PROVINCE_BY_SLUG: Record<string, ProvinceSeoEntry> = Object.fromEntries(
  PROVINCIAL_TAX_PAGES.map((p) => [p.slug, p])
);

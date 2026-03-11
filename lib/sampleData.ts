// lib/sampleData.ts

export const sampleProfile = {
  mode: "Couple",
  useRealDollars: false,
  expenseMode: "Simple",
  inputs: {
    p1_dob: "1996-01",
    p1_age: 30,
    p1_retireAge: 65,
    p1_lifeExp: 90,
    p1_income: 85000,
    p1_income_growth: 2,
    p1_rrsp_match: 3,
    p1_rrsp_match_tier: 100,
    p1_cash: 10000,
    p1_cash_ret: 2,
    p1_tfsa: 25000,
    p1_tfsa_ret: 6,
    p1_fhsa: 0,
    p1_fhsa_ret: 6,
    p1_rrsp: 35000,
    p1_rrsp_ret: 6,
    p1_resp: 0,
    p1_resp_ret: 6,
    p1_lirf: 0,
    p1_lirf_ret: 6,
    p1_lif: 0,
    p1_lif_ret: 5,
    p1_rrif_acct: 0,
    p1_rrif_acct_ret: 5,
    p1_nonreg: 0,
    p1_nonreg_acb: 0,
    p1_nonreg_ret: 5,
    p1_nonreg_yield: 2,
    p1_crypto: 0,
    p1_crypto_acb: 0,
    p1_crypto_ret: 8,
    p1_cpp_enabled: true,
    p1_cpp_est_base: 12000,
    p1_cpp_start: 65,
    p1_oas_enabled: true,
    p1_oas_years: 40,
    p1_oas_start: 65,
    p2_dob: "1996-01",
    p2_age: 30,
    p2_retireAge: 65,
    p2_lifeExp: 90,
    p2_income: 75000,
    p2_income_growth: 2,
    p2_rrsp_match: 0,
    p2_rrsp_match_tier: 100,
    p2_cash: 5000,
    p2_cash_ret: 2,
    p2_tfsa: 15000,
    p2_tfsa_ret: 6,
    p2_fhsa: 0,
    p2_fhsa_ret: 6,
    p2_rrsp: 25000,
    p2_rrsp_ret: 6,
    p2_resp: 0,
    p2_resp_ret: 6,
    p2_lirf: 0,
    p2_lirf_ret: 6,
    p2_lif: 0,
    p2_lif_ret: 5,
    p2_rrif_acct: 0,
    p2_rrif_acct_ret: 5,
    p2_nonreg: 0,
    p2_nonreg_acb: 0,
    p2_nonreg_ret: 5,
    p2_nonreg_yield: 2,
    p2_crypto: 0,
    p2_crypto_acb: 0,
    p2_crypto_ret: 8,
    p2_cpp_enabled: true,
    p2_cpp_est_base: 10000,
    p2_cpp_start: 65,
    p2_oas_enabled: true,
    p2_oas_years: 40,
    p2_oas_start: 65,
    inflation_rate: 2.1,
    tax_province: "ON",
    cfg_tfsa_limit: 7000,
    cfg_rrsp_limit: 32960,
    cfg_fhsa_limit: 8000,
    cfg_resp_limit: 2500,
    cfg_crypto_limit: 5000,
    portfolio_allocation: "custom",
    use_glide_path: false,
    fully_optimize_tax: false,
    oas_clawback_optimize: false,
    rrsp_meltdown_enabled: false,
    enable_guardrails: false,
    skip_first_tfsa_p1: false,
    skip_first_rrsp_p1: false,
    skip_first_tfsa_p2: false,
    skip_first_rrsp_p2: false,
    exp_gogo_age: 75,
    exp_slow_age: 85,
    pension_split_enabled: false
  },
  properties: [
    {
      name: "Primary Residence",
      value: 700000,
      mortgage: 350000,
      rate: 4.5,
      payment: 1945,
      growth: 3,
      includeInNW: true,
      sellEnabled: false
    }
  ],
  windfalls: [],
  additionalIncome: [],
  customAssets: [],
  leaves: [],
  dependents: [],
  debt: [],
  strategies: {
    accum: [
      "tfsa",
      "rrsp",
      "fhsa",
      "resp",
      "nonreg",
      "cash",
      "crypto"
    ],
    decum: [
      "nonreg",
      "cash",
      "tfsa",
      "fhsa",
      "rrsp",
      "rrif_acct",
      "lif",
      "lirf",
      "crypto"
    ]
  },
  expensesByCategory: {
    housing: {
      items: [
        {
          name: "Property Tax, Insurance & Utilities",
          curr: 800,
          ret: 800,
          trans: 800,
          gogo: 800,
          slow: 800,
          nogo: 800,
          freq: 12
        }
      ]
    },
    transport: {
      items: [
        {
          name: "Vehicle / Insurance / Gas",
          curr: 800,
          ret: 600,
          trans: 700,
          gogo: 600,
          slow: 400,
          nogo: 150,
          freq: 12
        }
      ]
    },
    lifestyle: {
      items: [
        {
          name: "Dining, Travel & Hobbies",
          curr: 1200,
          ret: 1800,
          trans: 1500,
          gogo: 1800,
          slow: 800,
          nogo: 300,
          freq: 12
        }
      ]
    },
    essentials: {
      items: [
        {
          name: "Groceries / Health",
          curr: 1000,
          ret: 1000,
          trans: 1000,
          gogo: 1000,
          slow: 1200,
          nogo: 1500,
          freq: 12
        }
      ]
    },
    other: {
      items: [
        {
          name: "Miscellaneous",
          curr: 500,
          ret: 300,
          trans: 400,
          gogo: 300,
          slow: 300,
          nogo: 300,
          freq: 12
        }
      ]
    }
  }
};
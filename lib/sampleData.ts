// lib/sampleData.ts

export const sampleProfile = {
  mode: "Couple",
  useRealDollars: false,
  expenseMode: "Simple",
  
  // 1. Core Variables & Investment Accounts
  inputs: {
    p1_dob: "1983-04", p1_age: 43, p1_retireAge: 60, p1_lifeExp: 95,
    p1_income: 85000, p1_income_growth: 2, p1_rrsp_match: 3, p1_rrsp_match_tier: 100,
    p1_cash: 10000, p1_cash_ret: 2,
    p1_tfsa: 65000, p1_tfsa_ret: 6,
    p1_fhsa: 0, p1_fhsa_ret: 6,
    p1_rrsp: 135000, p1_rrsp_ret: 6,
    p1_resp: 0, p1_resp_ret: 6,
    p1_lirf: 0, p1_lirf_ret: 6,
    p1_lif: 0, p1_lif_ret: 5,
    p1_rrif_acct: 0, p1_rrif_acct_ret: 5,
    p1_nonreg: 10000, p1_nonreg_acb: 5000, p1_nonreg_ret: 5, p1_nonreg_yield: 2,
    p1_crypto: 0, p1_crypto_acb: 0, p1_crypto_ret: 8,
    p1_cpp_enabled: true, p1_cpp_est_base: 12000, p1_cpp_start: 65,
    p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,

    p2_dob: "1981-08", p2_age: 45, p2_retireAge: 62, p2_lifeExp: 95,
    p2_income: 75000, p2_income_growth: 2, p2_rrsp_match: 0, p2_rrsp_match_tier: 100,
    p2_cash: 5000, p2_cash_ret: 2,
    p2_tfsa: 40000, p2_tfsa_ret: 6,
    p2_fhsa: 0, p2_fhsa_ret: 6,
    p2_rrsp: 105000, p2_rrsp_ret: 6,
    p2_resp: 0, p2_resp_ret: 6,
    p2_lirf: 0, p2_lirf_ret: 6,
    p2_lif: 0, p2_lif_ret: 5,
    p2_rrif_acct: 0, p2_rrif_acct_ret: 5,
    p2_nonreg: 5000, p2_nonreg_acb: 2500, p2_nonreg_ret: 5, p2_nonreg_yield: 2,
    p2_crypto: 0, p2_crypto_acb: 0, p2_crypto_ret: 8,
    p2_cpp_enabled: true, p2_cpp_est_base: 10000, p2_cpp_start: 65,
    p2_oas_enabled: true, p2_oas_years: 40, p2_oas_start: 65,

    // DB Pension for Sarah
    p1_db_lifetime: 35000, 
    p1_db_lifetime_start: 60,
    p1_db_indexed: true,

    inflation_rate: 2.1,
    tax_province: "ON",
    cfg_tfsa_limit: 7000, cfg_rrsp_limit: 32960, cfg_fhsa_limit: 8000, 
    cfg_resp_limit: 2500, cfg_crypto_limit: 5000,
    
    portfolio_allocation: "custom", 
    use_glide_path: false,
    fully_optimize_tax: true, 
    oas_clawback_optimize: false, 
    rrsp_meltdown_enabled: true,
    enable_guardrails: true,
    
    skip_first_tfsa_p1: false, skip_first_rrsp_p1: false,
    skip_first_tfsa_p2: false, skip_first_rrsp_p2: false,
    exp_gogo_age: 75, exp_slow_age: 85,
    pension_split_enabled: true,
    retire_same_time: true
  },

  // 2. Real Estate (Ontario Family Home)
  properties: [
    {
      name: "Primary Residence",
      value: 850000,
      mortgage: 280000,
      rate: 4.5,
      payment: 2166,
      growth: 3.0,
      includeInNW: true,
      sellEnabled: false
    }
  ],

  // 3. Expected Inheritance / Windfall
  windfalls: [
    {
      name: "Expected Inheritance",
      amount: 150000,
      year: 2045,
      owner: "p1",
      inflation_adjusted: false
    }
  ],
  additionalIncome: [],
  customAssets: [],
  leaves: [],

  // 4. Dependents (Activates CCB Engine)
  dependents: [
    {
      name: "Child 1",
      birthYear: 2016
    }
  ],

  // 5. Debt (Car Loan)
  debt: [
    {
      name: "Car Loan",
      balance: 25000,
      rate: 6.5,
      payment: 500,
      type: "loan",
      deductible: false
    }
  ],

  // 6. Drawdown Strategies
  strategies: { 
    accum: ["tfsa", "rrsp", "fhsa", "resp", "nonreg", "cash", "crypto"], 
    decum: ["nonreg", "cash", "tfsa", "fhsa", "rrsp", "rrif_acct", "lif", "lirf", "crypto"] 
  },

  // 7. Granular Living Expenses
  expensesByCategory: {
    housing: { items: [{ name: "Property Tax, Insurance & Utilities", curr: 800, ret: 800, trans: 800, gogo: 800, slow: 800, nogo: 800, freq: 12 }] },
    transport: { items: [{ name: "Vehicle / Insurance / Gas", curr: 600, ret: 400, trans: 400, gogo: 400, slow: 200, nogo: 100, freq: 12 }] },
    lifestyle: { items: [{ name: "Dining, Travel & Hobbies", curr: 1500, ret: 2000, trans: 1800, gogo: 2000, slow: 800, nogo: 300, freq: 12 }] },
    essentials: { items: [{ name: "Groceries / Health", curr: 1000, ret: 1000, trans: 1000, gogo: 1000, slow: 1200, nogo: 1500, freq: 12 }] },
    other: { items: [{ name: "Miscellaneous Buffer", curr: 500, ret: 400, trans: 400, gogo: 400, slow: 300, nogo: 300, freq: 12 }] }
  }
};
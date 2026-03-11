// lib/sampleData.ts

export const sampleProfile = {
  // Basic Info - Sarah (45) & John (45)
  mode: "Couple",
  p1_dob: "1981-01",
  p1_retireAge: 60,
  p1_lifeExp: 95,
  p2_dob: "1981-01",
  p2_retireAge: 60,
  p2_lifeExp: 95,

  // Income
  p1_income: 90000,
  p2_income: 60000,
  
  // Current Liquid Assets
  p1_rrsp: 150000,
  p1_tfsa: 50000,
  p1_nonreg: 20000,
  p2_rrsp: 80000,
  p2_tfsa: 25000,
  p2_nonreg: 5000,

  // Default Return Rates
  p1_rrsp_ret: 6.0,
  p1_tfsa_ret: 6.0,
  p1_nonreg_ret: 5.0,
  p2_rrsp_ret: 6.0,
  p2_tfsa_ret: 6.0,
  p2_nonreg_ret: 5.0,

  // Government Benefits
  p1_cpp_enabled: true,
  p1_oas_enabled: true,
  p1_cpp_start: 65,
  p1_oas_start: 65,
  p2_cpp_enabled: true,
  p2_oas_enabled: true,
  p2_cpp_start: 65,
  p2_oas_start: 65,

  // Base assumptions
  inflation_rate: 2.1,
  asset_mode_advanced: false,
  use_glide_path: true,
  enable_guardrails: true,
  pension_split_enabled: true,
  rrsp_meltdown_enabled: true,
};
// lib/sampleData.ts

export const sampleProfile = {
  // --- Core Setup ---
  mode: "Couple",
  province: "ON", // Ontario taxes and rules apply

  // --- Basic Info - Sarah (43) & John (45) ---
  p1_dob: "1983-04",
  p1_retireAge: 60,
  p1_lifeExp: 95,
  p2_dob: "1981-08",
  p2_retireAge: 62, 
  p2_lifeExp: 95,
  retire_same_time: true, // They will retire together when Sarah is 60 and John is 62

  // --- Dependents ---
  num_children: 1,
  child_1_dob: "2016-06", // 10-year-old child (CCB calculations will apply for a few more years)

  // --- Income (Medium/Middle-Class) ---
  p1_income: 85000,
  p2_income: 75000,

  // --- Expenses & Lifestyle ---
  base_expenses: 60000,       // Current annual living expenses (excluding debt/mortgage)
  retirement_expenses: 55000, // Expected annual living expenses in retirement

  // --- Real Estate & Debt ---
  property_value: 850000,
  mortgage_balance: 280000,
  mortgage_rate: 4.5,
  mortgage_payment: 26000, // Annual mortgage payments ($2,166/mo)

  // --- Liquid Assets (Middle Class Accumulation) ---
  p1_rrsp: 135000,
  p1_tfsa: 65000,
  p1_nonreg: 10000,
  p2_rrsp: 105000,
  p2_tfsa: 40000,
  p2_nonreg: 5000,

  // --- Annual Savings Contributions ---
  p1_rrsp_cont: 6000,
  p1_tfsa_cont: 3000,
  p2_rrsp_cont: 4000,
  p2_tfsa_cont: 3000,

  // --- Default Return Rates ---
  p1_rrsp_ret: 6.0,
  p1_tfsa_ret: 6.0,
  p1_nonreg_ret: 5.0,
  p2_rrsp_ret: 6.0,
  p2_tfsa_ret: 6.0,
  p2_nonreg_ret: 5.0,

  // --- Government Benefits ---
  p1_cpp_enabled: true,
  p1_oas_enabled: true,
  p1_cpp_start: 65,
  p1_oas_start: 65,
  p2_cpp_enabled: true,
  p2_oas_enabled: true,
  p2_cpp_start: 65,
  p2_oas_start: 65,

  // --- Defined Benefit (DB) Pension ---
  // Let's assume Sarah (P1) is a teacher or government employee with a pension
  p1_db_pension_amount: 35000,
  p1_db_start_age: 60,
  p1_db_indexed: true,

  // --- Future Windfalls / Liquidity Events ---
  // e.g., an expected inheritance or downsizing the house in the future
  windfall_amount: 150000, 
  windfall_year: 2045, // Arrives when Sarah is roughly 62

  // --- Base Engine Assumptions ---
  inflation_rate: 2.1,
  asset_mode_advanced: false,
  use_glide_path: true,
  enable_guardrails: true,
  pension_split_enabled: true,
  rrsp_meltdown_enabled: true,
};
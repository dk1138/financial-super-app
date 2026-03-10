/**
 * config.js
 * Contains all externalized financial constants, tax brackets, and historical data.
 * Update these values annually (e.g., CRA tax bracket adjustments, max CPP/OAS).
 * Sources: CRA, Taxtips.ca
 */

export const FINANCIAL_CONSTANTS = {
    // ---------------------------------------------------------
    // 2026 PAYROLL & PREMIUM LIMITS
    // ---------------------------------------------------------
    MAX_CPP: 18092, 
    MAX_OAS: 8560, 
    OAS_CLAWBACK_THRESHOLD: 95323, 
    
    YMPE: 74600, 
    YAMPE: 85000, 
    EI_MAX_INSURABLE: 68900,
    CPP_EXEMPTION: 3500,
    CPP_RATE: 0.0495,
    CPP_ENHANCED_RATE: 0.01,
    CPP_ENHANCED_TIER2_RATE: 0.04,
    EI_RATE: 0.0163,

    // Base & Enhanced CPP Projections (Annualized approximations)
    CPP_PROJECTED_MAX_BASE: 16375, 
    CPP_PROJECTED_MAX_ENHANCED: 2500,
    
    // EI & Maternity Leave Rules (2026 Estimates)
    MAX_EI_WEEKLY_BENEFIT: 720,
    EI_REPLACEMENT_RATE: 0.55, 

    // ---------------------------------------------------------
    // ACCOUNT LIMITS & RULES
    // ---------------------------------------------------------
    RRIF_START_AGE: 72, 

    FHSA_ANNUAL_LIMIT: 8000,
    FHSA_LIFETIME_LIMIT: 40000,
    FHSA_MAX_YEARS: 15,

    RESP_LIFETIME_LIMIT: 50000,
    RESP_CESG_MATCH_RATE: 0.20, 
    RESP_CESG_ANNUAL_MAX: 500, 
    RESP_CESG_LIFETIME_MAX: 7200,

    CCB_RULES: {
        MAX_UNDER_6: 7787,
        MAX_6_TO_17: 6570,
        THRESHOLD_1: 37160,
        THRESHOLD_2: 79087,
        RATE_1: [0.07, 0.135, 0.19, 0.23],
        RATE_2: [0.032, 0.057, 0.08, 0.095] 
    },

    // ---------------------------------------------------------
    // 2026 NON-REFUNDABLE TAX CREDITS (Taxtips.ca Base Amounts)
    // ---------------------------------------------------------
    
    // FEDERAL CREDITS (Applied at 15% Lowest Tax Rate)
    FED_CREDITS: {
        BPA_MAX: 16452,              // Base Personal Amount
        BPA_MIN: 14829,              // Minimum BPA for high earners
        BPA_PHASE_START: 181440,     // Net income where BPA starts reducing
        BPA_PHASE_END: 258482,       // Net income where BPA hits minimum
        AGE_AMOUNT: 9212,            // Age 65+ amount
        AGE_PHASE_START: 46432,      // Net income where Age Amount reduces (by 15%)
        EMPLOYMENT_AMOUNT: 1501,     // Max Canada Employment Amount
        PENSION_AMOUNT: 2000,        // Max Pension Income Amount
        LOWEST_RATE: 0.15            // 15% applied to the sum of the above
    },

    // PROVINCIAL CREDITS (Applied at Province's Lowest Tax Rate)
    PROV_CREDITS: {
        'ON': {
            BPA: 12989,
            AGE_AMOUNT: 6342,
            AGE_PHASE_START: 47210,
            PENSION_AMOUNT: 1796,
            LOWEST_RATE: 0.0505
        },
        'BC': { BPA: 13216, LOWEST_RATE: 0.0506 },
        'AB': { BPA: 22769, LOWEST_RATE: 0.10 },
        'QC': { BPA: 18952, LOWEST_RATE: 0.14 },
        'MB': { BPA: 15780, LOWEST_RATE: 0.108 },
        'SK': { BPA: 20381, LOWEST_RATE: 0.105 },
        'NS': { BPA: 11932, LOWEST_RATE: 0.0879 },
        'NB': { BPA: 13664, LOWEST_RATE: 0.094 },
        'NL': { BPA: 11188, LOWEST_RATE: 0.087 },
        'PE': { BPA: 15000, LOWEST_RATE: 0.0965 }
    },

    // ---------------------------------------------------------
    // DIVIDEND TAX RATES & GROSS-UPS
    // ---------------------------------------------------------
    DIVIDEND_GROSS_UP_ELIGIBLE: 1.38,
    DIVIDEND_GROSS_UP_NON_ELIGIBLE: 1.15,
    FED_DIVIDEND_CREDIT_RATE_ELIGIBLE: 0.150198,
    FED_DIVIDEND_CREDIT_RATE_NON_ELIGIBLE: 0.090301,
    
    PROV_DIV_CREDIT_ELIGIBLE: { 
        'ON': 0.1005, 'AB': 0.0812, 'BC': 0.12, 'MB': 0.08, 'NB': 0.14, 
        'NL': 0.054, 'NS': 0.0885, 'PE': 0.105, 'QC': 0.119, 'SK': 0.11 
    },
    
    PROV_DIV_CREDIT_NON_ELIGIBLE: { 
        'ON': 0.0298, 'AB': 0.0218, 'BC': 0.0196, 'MB': 0.0078, 'NB': 0.0275, 
        'NL': 0.032, 'NS': 0.0299, 'PE': 0.015, 'QC': 0.0398, 'SK': 0.0336 
    },

    // ---------------------------------------------------------
    // ONTARIO SPECIFIC TAX RULES
    // ---------------------------------------------------------
    ON_OTR_BASE: 284,

    ON_LIFT_MAX: 875,
    ON_LIFT_RATE: 0.0505,
    ON_LIFT_PHASE_OUT_START: 32500,
    ON_LIFT_PHASE_OUT_RATE: 0.05, 

    ON_OHP_TIERS: [
        { threshold: 20000, base: 0,   maxAdd: 300, rate: 0.06 },
        { threshold: 36000, base: 300, maxAdd: 150, rate: 0.06 },
        { threshold: 48000, base: 450, maxAdd: 150, rate: 0.25 },
        { threshold: 72000, base: 600, maxAdd: 150, rate: 0.25 },
        { threshold: 200000, base: 750, maxAdd: 150, rate: 0.25 }
    ],

    // ---------------------------------------------------------
    // TAX BRACKETS
    // ---------------------------------------------------------
    TAX_DATA: {
        FED: { brackets: [58523, 117045, 181440, 258482], rates: [0.15, 0.205, 0.26, 0.29, 0.33] },
        BC: { brackets: [48638, 97277, 111718, 136592, 184511, 262334], rates: [0.0506, 0.077, 0.105, 0.1229, 0.147, 0.168, 0.205] },
        AB: { brackets: [152504, 203339, 355843], rates: [0.10, 0.12, 0.13, 0.14, 0.15] },
        SK: { brackets: [52057, 148734], rates: [0.105, 0.125, 0.145] },
        MB: { brackets: [47000, 100000], rates: [0.108, 0.1275, 0.174] },
        ON: { brackets: [53891, 107785, 150000, 220000], rates: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316], surtax: { t1: 5853, r1: 0.20, t2: 7490, r2: 0.36 } },
        QC: { brackets: [51780, 103545, 126000], rates: [0.14, 0.19, 0.24, 0.2575], abatement: 0.165 },
        NB: { brackets: [49958, 99916, 185000], rates: [0.094, 0.14, 0.16, 0.195] },
        NS: { brackets: [29590, 59180, 93000, 150000], rates: [0.0879, 0.1495, 0.1667, 0.175, 0.21] },
        PE: { brackets: [32656, 64313, 105000], rates: [0.0965, 0.1363, 0.1667, 0.1875], surtax: { t1: 12500, r1: 0.10 } },
        NL: { brackets: [43198, 86395, 154244, 215943], rates: [0.087, 0.145, 0.158, 0.178, 0.198] },
        YT: { brackets: [55867, 111733, 173205, 500000], rates: [0.064, 0.09, 0.109, 0.128, 0.15] },
        NT: { brackets: [50597, 101198, 164525], rates: [0.059, 0.086, 0.122, 0.1405] },
        NU: { brackets: [50877, 101754, 165429], rates: [0.04, 0.07, 0.09, 0.115] }
    },

    // Historical YMPE Data
    HISTORICAL_YMPE: {
        1966: 5000, 1967: 5000, 1968: 5100, 1969: 5200, 1970: 5300,
        1971: 5400, 1972: 5500, 1973: 5600, 1974: 6600, 1975: 7400,
        1976: 8300, 1977: 9300, 1978: 10400, 1979: 11700, 1980: 13100,
        1981: 14700, 1982: 16500, 1983: 18500, 1984: 20800, 1985: 23400,
        1986: 25800, 1987: 25900, 1988: 26500, 1989: 27700, 1990: 28900,
        1991: 30500, 1992: 32200, 1993: 33400, 1994: 34400, 1995: 34900,
        1996: 35400, 1997: 35800, 1998: 36900, 1999: 37400, 2000: 37600,
        2001: 38300, 2002: 39100, 2003: 39900, 2004: 40500, 2005: 41100,
        2006: 42100, 2007: 42500, 2008: 44900, 2009: 46300, 2010: 47200,
        2011: 48300, 2012: 50100, 2013: 51100, 2014: 52500, 2015: 53600,
        2016: 54900, 2017: 55300, 2018: 55900, 2019: 57400, 2020: 58700,
        2021: 61600, 2022: 64900, 2023: 66600, 2024: 68500, 2025: 71300, 
        2026: 74600
    },

    // Historical YAMPE Data
    HISTORICAL_YAMPE: {
        2024: 73200, 2025: 80500, 2026: 85000 
    },

    // S&P 500 Annual Returns (1928 - 2023)
    SP500_HISTORICAL: [
        0.4381, -0.0830, -0.2512, -0.4384, -0.0864, 0.4998, -0.0119, 0.4674, 0.3194, -0.3534,
        0.2928, -0.0110, -0.1067, -0.1277, 0.1917, 0.2506, 0.1903, 0.3582, -0.0843, 0.0520,
        0.0570, 0.1830, 0.3081, 0.2368, 0.1815, -0.0121, 0.5230, 0.3260, 0.0630, -0.1046,
        0.4336, 0.1196, 0.0047, 0.2681, -0.0881, 0.2280, 0.1648, 0.1245, -0.1006, 0.2398,
        0.1106, -0.0850, 0.0401, 0.1431, 0.1898, -0.1466, -0.2647, 0.3720, 0.2384, -0.0718,
        0.0656, 0.1844, 0.3250, -0.0491, 0.2155, 0.2256, 0.0627, 0.3173, 0.1867, 0.0525,
        0.1661, 0.3169, -0.0310, 0.3047, 0.0762, 0.1008, 0.0132, 0.3758, 0.2296, 0.3336,
        0.2858, 0.2104, -0.0910, -0.1189, -0.2210, 0.2868, 0.1088, 0.0491, 0.1579, 0.0549,
        -0.3849, 0.2646, 0.1506, 0.0211, 0.1600, 0.3239, 0.1369, 0.0138, 0.1196, 0.2183,
        -0.0438, 0.3149, 0.1840, 0.2871, -0.1811, 0.2423
    ]
};
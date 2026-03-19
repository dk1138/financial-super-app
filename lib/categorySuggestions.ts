// A dictionary of keywords to softly suggest categories.
// You can edit this file at any time to improve the app's guessing power.

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
    // Shortened root words are better: 'mcdonald' catches "McDonalds", "McDonald's", and "McDonald"
    'Food & Dining': ['mcdonald', 'tim horton', 'starbucks', 'uber eats', 'doordash', 'restaurant', 'cafe', 'pizza', 'sushi', 'wendy', 'subway'],
    'Grocery': ['loblaw', 'metro', 'sobey', 'no frills', 'walmart', 'whole foods', 'instacart', 'farm boy', 'grocery', 'costco', 'freshco'],
    'Transport': ['shell', 'esso', 'petro', 'uber', 'lyft', 'ttc', 'go transit', 'presto', 'parking', 'gas'],
    'Housing': ['rent', 'mortgage', 'hydro', 'water', 'home depot', 'ikea', 'property tax'],
    'Essentials': ['shopper', 'rexall', 'pharmacy', 'bell', 'rogers', 'telus', 'koodo', 'fido', 'insurance', 'barber', 'hair'],
    'Lifestyle': ['netflix', 'spotify', 'amazon', 'cineplex', 'steam', 'apple', 'gym', 'goodlife', 'lcbo', 'beer'],
    'Income': ['payroll', 'salary', 'deposit', 'e-transfer', 'cash back', 'refund', 'paycheck'], 
};

export const getSuggestedCategory = (merchant: string, amount: number): string | undefined => {
    // Strip apostrophes, periods, and dashes to make matching bulletproof
    // e.g., "McDonald's" becomes "mcdonalds"
    const cleanMerchant = merchant.toLowerCase().replace(/['".,\-]/g, '');
    
    for (const [category, keywords] of Object.entries(DEFAULT_SUGGESTIONS)) {
        // Also strip the keyword just in case you ever accidentally type an apostrophe in the list above
        if (keywords.some(keyword => cleanMerchant.includes(keyword.replace(/['".,\-]/g, '')))) {
            return category;
        }
    }
    
    return undefined; // No suggestion found
};
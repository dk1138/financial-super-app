// A dictionary of keywords to softly suggest categories.
// You can edit this file at any time to improve the app's guessing power.

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
    'Food & Dining': ['mcdonalds', 'tim hortons', 'starbucks', 'uber eats', 'doordash', 'restaurant', 'cafe', 'pizza', 'sushi'],
    'Grocery': ['loblaws', 'metro', 'sobeys', 'no frills', 'walmart', 'whole foods', 'instacart', 'farm boy'],
    'Transport': ['shell', 'esso', 'petro', 'uber', 'lyft', 'ttc', 'go transit', 'presto', 'parking', 'gas'],
    'Housing': ['rent', 'mortgage', 'hydro', 'water', 'home depot', 'ikea', 'property tax'],
    'Essentials': ['shoppers', 'rexall', 'pharmacy', 'bell', 'rogers', 'telus', 'koodo', 'fido', 'insurance', 'barber'],
    'Lifestyle': ['netflix', 'spotify', 'amazon', 'cineplex', 'steam', 'apple', 'gym', 'goodlife', 'lcbo'],
};

export const getSuggestedCategory = (merchant: string, amount: number): string | undefined => {
    if (amount > 0) return 'Income'; // Default positive cashflow to Income
    
    const lowerMerchant = merchant.toLowerCase();
    
    for (const [category, keywords] of Object.entries(DEFAULT_SUGGESTIONS)) {
        if (keywords.some(keyword => lowerMerchant.includes(keyword))) {
            return category;
        }
    }
    
    return undefined; // No suggestion found
};
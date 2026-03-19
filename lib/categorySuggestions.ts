// A massive dictionary of keywords to softly suggest categories.
// Tailored for the Canadian market. Root words are used to maximize fuzzy matching.

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
    
    'Food & Dining': [
        // Fast Food & Coffee
        'mcdonald', 'tim horton', 'starbucks', 'wendy', 'subway', 'burger king', 'a&w', 'kfc', 
        'dairy queen', 'harvey', 'pizza', 'domino', 'panago', 'little caesar', 'popeye', 'church', 
        'mary brown', 'nando', 'pita pit', 'mr sub', 'qdoba', 'five guy', 'shake shack', 'osmow', 
        'barburrito', 'fat bastard', 'freshii', 'thai express', 'jugo juice', 'booster juice', 
        'second cup', 'peet', 'blenz', 'aroma', 
        // Casual Dining & Restaurants
        'boston pizza', 'kelsey', 'swiss chalet', 'montana', 'keg', 'earls', 'jack astor', 
        'cactus club', 'moxie', 'browns social', 'oliver & bonacini', 'chipotle', 'milestone',
        'restaurant', 'cafe', 'sushi', 'diner', 'pub', 'bar ', 'tavern', 'eatery',
        // Delivery
        'uber eat', 'doordash', 'skip the dish', 'foodora', 'fantuan'
    ],
    
    'Grocery': [
        // Major Supermarkets
        'loblaw', 'metro', 'sobey', 'no frills', 'walmart', 'costco', 'freshco', 'food basic', 
        'real canadian', 'superstore', 'zehr', 'fortino', 'independent grocer', 'provigo', 
        'valumart', 'maxi', 'iga', 'save on food', 'farm boy', 'whole food', 'pusateri', 'longo',
        // Specialty & Ethnic
        't&t', 'h mart', 'nation', 'foody mart', 'adonis', 'rabba', 'coppa', 'highland farm',
        // Convenience & Delivery
        'instacart', 'macs', 'circle k', '7 eleven', '7-11', 'convenience', 'market', 'grocery'
    ],
    
    'Transport': [
        // Gas Stations
        'shell', 'esso', 'petro', 'husky', 'pioneer', 'mobil', 'ultramar', 'chevron', 'canadian tire gas',
        // Transit & Commute
        'ttc', 'go transit', 'presto', 'via rail', 'up express', 'miway', 'zum', 'brampton transit', 
        'yrt', 'viva', 'translink', 'stm', 'oc transpo', '407 etr', 'toll',
        // Ride Share & Parking
        'uber', 'lyft', 'taxi', 'beck', 'green p', 'impark', 'indigo', 'easypark', 'parking', 
        // Auto Maintenance & Dealerships
        'honda', 'toyota', 'ford', 'hyundai', 'kia', 'mazda', 'nissan', 'chevrolet', 'volkswagen', 'subaru', 
        'mr lube', 'jiffy lube', 'kal tire', 'active green', 'speedy', 'mechanic', 'auto part',
        // Rentals
        'enterprise', 'hertz', 'avis', 'budget', 'zipcar', 'communauto'
    ],
    
    'Housing': [
        // Utilities & Bills
        'rent', 'mortgage', 'hydro', 'water', 'gas', 'enbridge', 'reliance', 'epcor', 'alectra', 
        'enercare', 'property tax', 'strata', 'condo corp', 'waste',
        // Hardware & Home Improvement
        'home depot', 'rona', 'lowe', 'home hardware', 'canadian tire', 'kent',
        // Furniture & Decor
        'ikea', 'wayfair', 'structube', 'leon', 'the brick', 'ashley', 'brault', 'bad boy', 'cb2', 
        'eq3', 'west elm', 'pottery barn', 'crate & barrel', 'bouclair', 'jysk', 'home sense', 'bed bath'
    ],
    
    'Essentials': [
        // Pharmacy & Health
        'shopper', 'rexall', 'pharmaprix', 'jean coutu', 'guardian', 'ida', 'medicine shoppe', 
        'london drug', 'pharmacy', 'dentist', 'dental', 'eye', 'vision', 'optometrist', 'doctor', 
        'clinic', 'hospital', 'therapy', 'physio', 'chiro', 'massage',
        // Telecom & Internet
        'bell', 'rogers', 'telus', 'koodo', 'fido', 'virgin', 'freedom', 'public mobile', 'chatr', 
        'fizz', 'teksavvy', 'shaw', 'videotron', 'cogeco',
        // Insurance
        'intact', 'rbc ins', 'td ins', 'desjardins', 'belair', 'state farm', 'allstate', 'co-operator', 
        'aviva', 'sonnet', 'insurance',
        // Personal Care
        'barber', 'salon', 'hair', 'nail', 'spa'
    ],
    
    'Lifestyle': [
        // Subscriptions & Digital
        'netflix', 'spotify', 'amazon', 'prime', 'disney', 'crave', 'hulu', 'apple', 'itunes', 'google', 
        'playstation', 'xbox', 'nintendo', 'steam', 'ea', 'onlyfans', 'patreon', 'github', 'microsoft',
        // Entertainment & Hobbies
        'cineplex', 'landmark', 'ticketmaster', 'live nation', 'seatgeek', 'eventbrite', 'indigo', 
        'chapter', 'mastermind', 'toy', 'ebgames', 'gamestop', 'casino', 'olg', 'lottery',
        // Fitness & Sports
        'gym', 'goodlife', 'fit4less', 'anytime fitness', 'planet fitness', 'ymca', 'peloton', 'golf',
        // Alcohol
        'lcbo', 'beer store', 'wine rack', 'saq', 'bc liquor', 'brewery',
        // Retail, Clothing & Pets
        'root', 'aritzia', 'lululemon', 'h&m', 'zara', 'uniqlo', 'old navy', 'gap', 'best buy', 
        'hudson bay', 'mark', 'sport chek', 'atmosphere', 'decathlon', 'mec', 'pet smart', 'pet value', 
        'ren pet', 'sephora', 'mac '
    ],
    
    'Income': [
        'payroll', 'salary', 'deposit', 'e-transfer', 'cash back', 'refund', 'paycheck', 'dividen', 
        'interest', 'ccb', 'cra', 'rrsp', 'tfsa', 'return', 'bonus', 'trillium', 'gst', 'hst', 'payment from'
    ],
};

export const getSuggestedCategory = (merchant: string, amount: number): string | undefined => {
    // Strip apostrophes, periods, and dashes to make matching bulletproof
    // e.g., "McDonald's" becomes "mcdonalds"
    const cleanMerchant = merchant.toLowerCase().replace(/['".,\-]/g, '');
    
    for (const [category, keywords] of Object.entries(DEFAULT_SUGGESTIONS)) {
        if (keywords.some(keyword => cleanMerchant.includes(keyword.replace(/['".,\-]/g, '')))) {
            return category;
        }
    }
    
    return undefined; // No suggestion found
};
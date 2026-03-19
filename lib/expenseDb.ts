import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ExpenseDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number };
  };
}

export interface Transaction {
  id: string;
  date: number;
  dateString: string;
  merchant: string;
  category: string;
  account: string;
  amount: number;
}

let dbPromise: Promise<IDBPDatabase<ExpenseDB>>;

export const initDB = () => {
  if (typeof window === 'undefined') return;
  
  if (!dbPromise) {
    dbPromise = openDB<ExpenseDB>('FinancialSuperApp_DB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
      },
    });
  }
};

export const saveTransactions = async (transactions: Transaction[]) => {
  if (!dbPromise) initDB();
  const db = await dbPromise;
  const tx = db.transaction('transactions', 'readwrite');
  await Promise.all(transactions.map((t) => tx.store.put(t)));
  await tx.done;
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  if (!dbPromise) initDB();
  const db = await dbPromise;
  const all = await db.getAllFromIndex('transactions', 'by-date');
  return all.reverse(); 
};

export const clearTransactions = async () => {
  if (!dbPromise) initDB();
  const db = await dbPromise;
  await db.clear('transactions');
};

export const updateTransactionCategory = async (id: string, newCategory: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = await db.get('transactions', id);
    if (tx) {
        tx.category = newCategory;
        await db.put('transactions', tx);
    }
};

// --- NEW SMART NORMALIZATION LOGIC ---
export const normalizeMerchantName = (merchant: string): string => {
    let name = merchant.toLowerCase();

    // 1. Known Entity Overrides (Catch the worst offenders instantly)
    if (name.includes('amazon') || name.includes('amzn')) return 'Amazon';
    if (name.includes('presto')) return 'Presto';
    if (name.includes('uber') && name.includes('eats')) return 'Uber Eats';
    if (name.includes('uber') && !name.includes('eats')) return 'Uber';
    if (name.includes('tim horton')) return 'Tim Hortons';
    if (name.includes('mcdonald')) return 'McDonalds';
    if (name.includes('walmart')) return 'Walmart';
    if (name.includes('shoppers') && name.includes('drug')) return 'Shoppers Drug Mart';
    if (name.includes('lcbo')) return 'LCBO';
    if (name.includes('netflix')) return 'Netflix';
    if (name.includes('spotify')) return 'Spotify';
    
    // 2. Generic Cleanup
    name = name.replace(/\.com|\.ca|\.net|\.org/g, ''); // Remove web domains
    name = name.replace(/\b(inc|ltd|corp|corporation|llc)\b/g, ''); // Remove corporate suffixes
    name = name.replace(/[0-9#*\-/_.,]/g, ' '); // Remove numbers and special characters
    name = name.replace(/\s+/g, ' ').trim(); // Remove double spaces

    // 3. Title Case formatting
    if (!name) return merchant; // Fallback
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const updateCategoryByNormalizedMerchant = async (normalizedMerchantName: string, newCategory: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    const allTxs = await store.getAll();

    // Find all transactions where the CLEANED name matches the requested name
    const updates = allTxs
        .filter(t => normalizeMerchantName(t.merchant) === normalizedMerchantName)
        .map(t => {
            t.category = newCategory;
            return store.put(t);
        });

    await Promise.all(updates);
    await tx.done;
};
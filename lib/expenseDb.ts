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
  suggestedCategory?: string; // NEW: Holds ghosted suggestions
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
        tx.suggestedCategory = undefined; // Clear suggestion once manually categorized
        await db.put('transactions', tx);
    }
};

export const normalizeMerchantName = (merchant: string): string => {
    let name = merchant.toLowerCase();
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
    
    name = name.replace(/\.com|\.ca|\.net|\.org/g, '');
    name = name.replace(/\b(inc|ltd|corp|corporation|llc)\b/g, '');
    name = name.replace(/[0-9#*\-/_.,]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    if (!name) return merchant;
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const updateCategoryByNormalizedMerchant = async (normalizedMerchantName: string, newCategory: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const allTxs = await store.getAll();

    const updates = allTxs
        .filter(t => normalizeMerchantName(t.merchant) === normalizedMerchantName)
        .map(t => {
            t.category = newCategory;
            t.suggestedCategory = undefined; // Clear suggestion
            return store.put(t);
        });

    await Promise.all(updates);
    await tx.done;
};

// --- NEW FEATURE: TRANSACTION SPLITTING ---
export const splitTransaction = async (originalId: string, splits: { amount: number, category: string, merchant: string }[]) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    const original = await store.get(originalId);
    if (!original) return;

    // Delete the original master transaction
    await store.delete(originalId);

    // Insert the new pieces
    const inserts = splits.map((split, index) => {
        const newTx: Transaction = {
            ...original,
            id: `${originalId}-split-${index}-${Date.now()}`, // Ensure unique ID
            amount: original.amount < 0 ? -Math.abs(split.amount) : Math.abs(split.amount), // Maintain sign
            category: split.category,
            merchant: split.merchant,
            suggestedCategory: undefined // Sub-transactions are already categorized by the user
        };
        return store.put(newTx);
    });

    await Promise.all(inserts);
    await tx.done;
};
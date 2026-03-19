import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the shape of our database
interface ExpenseDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number };
  };
}

// Define what a single row looks like
export interface Transaction {
  id: string;
  date: number; // Stored as timestamp for easy sorting
  dateString: string;
  merchant: string;
  category: string;
  account: string;
  amount: number;
}

let dbPromise: Promise<IDBPDatabase<ExpenseDB>>;

// Initialize the database safely (only runs in the browser)
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
  
  // Use Promise.all to save thousands of rows in milliseconds
  await Promise.all(
    transactions.map((t) => tx.store.put(t))
  );
  await tx.done;
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  if (!dbPromise) initDB();
  const db = await dbPromise;
  // Get all and sort by date descending (newest first)
  const all = await db.getAllFromIndex('transactions', 'by-date');
  return all.reverse(); 
};

export const clearTransactions = async () => {
  if (!dbPromise) initDB();
  const db = await dbPromise;
  await db.clear('transactions');
};

// Add this to the bottom of lib/expenseDb.ts
export const updateTransactionCategory = async (id: string, newCategory: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = await db.get('transactions', id);
    if (tx) {
        tx.category = newCategory;
        await db.put('transactions', tx);
    }
};

// Add this to the bottom of lib/expenseDb.ts
export const updateCategoryByMerchant = async (merchant: string, newCategory: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    // Get all transactions
    const allTxs = await store.getAll();

    // Find all matching the exact merchant name and update them
    const updates = allTxs
        .filter(t => t.merchant === merchant)
        .map(t => {
            t.category = newCategory;
            return store.put(t);
        });

    await Promise.all(updates);
    await tx.done;
};
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
  suggestedCategory?: string; 
  tags?: string[];
  notes?: string; 
  workspace?: string; // e.g. 'Personal' or 'Konbinii Shop'
  account: string; // Used to store the CSV filename
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
        tx.suggestedCategory = undefined; 
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
            t.suggestedCategory = undefined; 
            return store.put(t);
        });

    await Promise.all(updates);
    await tx.done;
};

export const splitTransaction = async (originalId: string, splits: { amount: number, category: string, merchant: string }[]) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    const original = await store.get(originalId);
    if (!original) return;

    await store.delete(originalId);

    const inserts = splits.map((split, index) => {
        const newTx: Transaction = {
            ...original,
            id: `${originalId}-split-${index}-${Date.now()}`,
            amount: original.amount < 0 ? -Math.abs(split.amount) : Math.abs(split.amount), 
            category: split.category,
            merchant: split.merchant,
            suggestedCategory: undefined,
            workspace: original.workspace || 'Personal'
        };
        return store.put(newTx);
    });

    await Promise.all(inserts);
    await tx.done;
};

export const updateTransactionTags = async (id: string, tags: string[]) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = await db.get('transactions', id);
    if (tx) {
        tx.tags = tags;
        await db.put('transactions', tx);
    }
};

export const bulkAddTag = async (ids: string[], tag: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    const promises = ids.map(async (id) => {
        const item = await store.get(id);
        if (item) {
            if (!item.tags) item.tags = [];
            if (!item.tags.includes(tag)) {
                item.tags.push(tag);
                await store.put(item);
            }
        }
    });

    await Promise.all(promises);
    await tx.done;
};

export const updateTransactionNote = async (id: string, notes: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = await db.get('transactions', id);
    if (tx) {
        tx.notes = notes;
        await db.put('transactions', tx);
    }
};

export const updateTransactionWorkspace = async (id: string, newWorkspace: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = await db.get('transactions', id);
    if (tx) {
        tx.workspace = newWorkspace;
        await db.put('transactions', tx);
    }
};

export const bulkMoveToWorkspace = async (ids: string[], newWorkspace: string) => {
    if (!dbPromise) initDB();
    const db = await dbPromise;
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    const promises = ids.map(async (id) => {
        const item = await store.get(id);
        if (item) {
            item.workspace = newWorkspace;
            await store.put(item);
        }
    });

    await Promise.all(promises);
    await tx.done;
};
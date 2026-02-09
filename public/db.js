// db.js - Client-side IndexedDB storage layer replacing the Go backend
// All data is stored locally in the user's browser via IndexedDB.

const DB_NAME = 'expenseowl';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('expenses')) {
                db.createObjectStore('expenses', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains('recurringExpenses')) {
                db.createObjectStore('recurringExpenses', { keyPath: 'id' });
            }
        };
    });
}

function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}

const DEFAULT_CONFIG = {
    categories: [
        'Food', 'Groceries', 'Travel', 'Rent', 'Utilities',
        'Entertainment', 'Healthcare', 'Shopping', 'Miscellaneous', 'Income'
    ],
    currency: 'usd',
    startDate: 1,
    budgets: {}
};

// ---- Config Operations ----

async function getConfig() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('config', 'readonly');
        const store = tx.objectStore('config');
        const results = {};
        const keys = ['categories', 'currency', 'startDate', 'budgets'];
        let completed = 0;
        keys.forEach(key => {
            const req = store.get(key);
            req.onsuccess = () => {
                results[key] = req.result ? req.result.value : DEFAULT_CONFIG[key];
                completed++;
                if (completed === keys.length) {
                    resolve({
                        categories: results.categories,
                        currency: results.currency,
                        startDate: results.startDate,
                        budgets: results.budgets || {}
                    });
                }
            };
            req.onerror = () => reject(req.error);
        });
    });
}

async function setConfigValue(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('config', 'readwrite');
        const store = tx.objectStore('config');
        const req = store.put({ key, value });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getCategories() {
    const config = await getConfig();
    return config.categories;
}

async function updateCategories(categories) {
    return setConfigValue('categories', categories);
}

async function getCurrency() {
    const config = await getConfig();
    return config.currency;
}

async function updateCurrency(currency) {
    return setConfigValue('currency', currency);
}

async function getStartDate() {
    const config = await getConfig();
    return config.startDate;
}

async function updateStartDate(startDate) {
    if (startDate < 1 || startDate > 31) throw new Error('Invalid start date');
    return setConfigValue('startDate', startDate);
}

// ---- Expense Operations ----

async function getAllExpenses() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readonly');
        const store = tx.objectStore('expenses');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function getExpense(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readonly');
        const store = tx.objectStore('expenses');
        const req = store.get(id);
        req.onsuccess = () => {
            if (req.result) resolve(req.result);
            else reject(new Error('Expense not found'));
        };
        req.onerror = () => reject(req.error);
    });
}

async function addExpense(expense) {
    if (!expense.id) expense.id = generateUUID();
    if (!expense.date) expense.date = new Date().toISOString();
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        const req = store.put(expense);
        req.onsuccess = () => resolve(expense);
        req.onerror = () => reject(req.error);
    });
}

async function updateExpense(id, expense) {
    expense.id = id;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        const req = store.put(expense);
        req.onsuccess = () => resolve(expense);
        req.onerror = () => reject(req.error);
    });
}

async function deleteExpense(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function deleteMultipleExpenses(ids) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        let completed = 0;
        ids.forEach(id => {
            const req = store.delete(id);
            req.onsuccess = () => {
                completed++;
                if (completed === ids.length) resolve();
            };
            req.onerror = () => reject(req.error);
        });
        if (ids.length === 0) resolve();
    });
}

// ---- Recurring Expense Operations ----

function generateExpensesFromRecurring(recExp, fromToday) {
    const expenses = [];
    let currentDate = new Date(recExp.startDate);
    const today = new Date();
    let occurrencesToGenerate = recExp.occurrences;

    if (fromToday) {
        while (currentDate < today && (recExp.occurrences === 0 || occurrencesToGenerate > 0)) {
            switch (recExp.interval) {
                case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                case 'monthly': currentDate.setMonth(currentDate.getMonth() + 1); break;
                case 'yearly': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                default: return expenses;
            }
            if (recExp.occurrences > 0) occurrencesToGenerate--;
        }
    }

    const limit = occurrencesToGenerate;
    for (let i = 0; i < limit; i++) {
        expenses.push({
            id: generateUUID(),
            recurringID: recExp.id,
            name: recExp.name,
            category: recExp.category,
            amount: recExp.amount,
            currency: recExp.currency || 'usd',
            date: currentDate.toISOString(),
            tags: recExp.tags || []
        });
        switch (recExp.interval) {
            case 'daily': currentDate = new Date(currentDate); currentDate.setDate(currentDate.getDate() + 1); break;
            case 'weekly': currentDate = new Date(currentDate); currentDate.setDate(currentDate.getDate() + 7); break;
            case 'monthly': currentDate = new Date(currentDate); currentDate.setMonth(currentDate.getMonth() + 1); break;
            case 'yearly': currentDate = new Date(currentDate); currentDate.setFullYear(currentDate.getFullYear() + 1); break;
            default: return expenses;
        }
    }
    return expenses;
}

async function getRecurringExpenses() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('recurringExpenses', 'readonly');
        const store = tx.objectStore('recurringExpenses');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addRecurringExpense(re) {
    if (!re.id) re.id = generateUUID();
    const config = await getConfig();
    if (!re.currency) re.currency = config.currency;

    const db = await openDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction('recurringExpenses', 'readwrite');
        const store = tx.objectStore('recurringExpenses');
        const req = store.put(re);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    // Generate individual expense entries
    const expenses = generateExpensesFromRecurring(re, false);
    for (const exp of expenses) {
        await addExpense(exp);
    }
    return re;
}

async function updateRecurringExpense(id, re, updateAll) {
    re.id = id;
    const config = await getConfig();
    if (!re.currency) re.currency = config.currency;

    // Update the recurring expense record
    const db = await openDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction('recurringExpenses', 'readwrite');
        const store = tx.objectStore('recurringExpenses');
        const req = store.put(re);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    // Remove old generated expenses
    const allExpenses = await getAllExpenses();
    const today = new Date();
    const toRemove = allExpenses.filter(exp => {
        if (exp.recurringID !== id) return false;
        if (!updateAll && new Date(exp.date) <= today) return false;
        return true;
    });
    await deleteMultipleExpenses(toRemove.map(e => e.id));

    // Regenerate expenses
    const newExpenses = generateExpensesFromRecurring(re, !updateAll);
    for (const exp of newExpenses) {
        await addExpense(exp);
    }
}

async function deleteRecurringExpense(id, removeAll) {
    // Remove from recurring store
    const db = await openDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction('recurringExpenses', 'readwrite');
        const store = tx.objectStore('recurringExpenses');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    // Remove associated expenses
    const allExpenses = await getAllExpenses();
    const today = new Date();
    const toRemove = allExpenses.filter(exp => {
        if (exp.recurringID !== id) return false;
        if (!removeAll && new Date(exp.date) <= today) return false;
        return true;
    });
    await deleteMultipleExpenses(toRemove.map(e => e.id));
}

// ---- CSV Export/Import ----

async function exportCSV() {
    const expenses = await getAllExpenses();
    const headers = ['ID', 'Name', 'Category', 'Amount', 'Date', 'Tags'];
    const rows = expenses.map(exp => [
        exp.id,
        exp.name,
        exp.category,
        exp.amount.toFixed(2),
        exp.date,
        (exp.tags || []).join(',')
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => {
            const str = String(field);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? '"' + str.replace(/"/g, '""') + '"'
                : str;
        }).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
}

async function importCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length < 2) {
                    reject(new Error('CSV must have a header and at least one data row'));
                    return;
                }

                const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
                const colMap = {};
                header.forEach((col, i) => colMap[col] = i);

                const required = ['name', 'category', 'amount', 'date'];
                for (const col of required) {
                    if (!(col in colMap)) {
                        reject(new Error(`Missing required column: ${col}`));
                        return;
                    }
                }

                const idIdx = colMap['id'];
                const tagsIdx = colMap['tags'];
                const existingExpenses = await getAllExpenses();
                const existingIds = new Set(existingExpenses.map(e => e.id));
                const config = await getConfig();
                const categorySet = new Set(config.categories.map(c => c.toLowerCase()));
                const newCategories = [];
                let imported = 0, skipped = 0;

                for (let i = 1; i < lines.length; i++) {
                    const record = parseCSVLine(lines[i]);
                    if (record.length !== header.length) { skipped++; continue; }

                    if (idIdx !== undefined && existingIds.has(record[idIdx])) {
                        skipped++;
                        continue;
                    }

                    const amount = parseFloat(record[colMap['amount']]);
                    if (isNaN(amount)) { skipped++; continue; }

                    const dateStr = record[colMap['date']];
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) { skipped++; continue; }

                    const category = record[colMap['category']].trim();
                    if (!categorySet.has(category.toLowerCase())) {
                        newCategories.push(category);
                        categorySet.add(category.toLowerCase());
                    }

                    let tags = [];
                    if (tagsIdx !== undefined && record[tagsIdx]) {
                        tags = record[tagsIdx].split(',').map(t => t.trim()).filter(Boolean);
                    }

                    await addExpense({
                        name: record[colMap['name']].trim(),
                        category: category,
                        amount: amount,
                        currency: config.currency,
                        date: date.toISOString(),
                        tags: tags
                    });
                    imported++;
                }

                if (newCategories.length > 0) {
                    await updateCategories([...config.categories, ...newCategories]);
                }

                resolve({
                    total_processed: lines.length - 1,
                    imported,
                    skipped,
                    new_categories: newCategories
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// ---- JSON Backup/Restore ----

async function exportAllData() {
    const db = await openDB();
    const readStore = (storeName) => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const [expenses, configItems, recurringExpenses] = await Promise.all([
        readStore('expenses'),
        readStore('config'),
        readStore('recurringExpenses')
    ]);

    const config = {};
    configItems.forEach(item => { config[item.key] = item.value; });

    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        expenses,
        config,
        recurringExpenses
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenseowl-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importAllData(file) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.expenses || !Array.isArray(data.expenses)) {
        throw new Error('Invalid backup: missing expenses array');
    }
    if (!data.config || typeof data.config !== 'object') {
        throw new Error('Invalid backup: missing config object');
    }

    const db = await openDB();

    const clearAndWrite = (storeName, items) => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        items.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    const configItems = Object.entries(data.config).map(([key, value]) => ({ key, value }));

    await Promise.all([
        clearAndWrite('expenses', data.expenses),
        clearAndWrite('config', configItems),
        clearAndWrite('recurringExpenses', data.recurringExpenses || [])
    ]);

    return {
        expenses: data.expenses.length,
        recurringExpenses: (data.recurringExpenses || []).length,
        configKeys: Object.keys(data.config).length
    };
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

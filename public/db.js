// db.js - IndexedDB storage for Wildman Money Tracker

const DB_NAME = 'wildman-money-tracker';
const DB_VERSION = 2;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('bills')) {
                db.createObjectStore('bills', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('income')) {
                db.createObjectStore('income', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'key' });
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

// ---- Config ----

async function getConfig() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('config', 'readonly');
        const store = tx.objectStore('config');
        const req = store.get('currency');
        req.onsuccess = () => {
            resolve({ currency: req.result ? req.result.value : 'usd' });
        };
        req.onerror = () => reject(req.error);
    });
}

async function updateCurrency(currency) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('config', 'readwrite');
        const store = tx.objectStore('config');
        const req = store.put({ key: 'currency', value: currency });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ---- Bills ----

async function getAllBills() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('bills', 'readonly');
        const store = tx.objectStore('bills');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addBill(bill) {
    if (!bill.id) bill.id = generateUUID();
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('bills', 'readwrite');
        const store = tx.objectStore('bills');
        const req = store.put(bill);
        req.onsuccess = () => resolve(bill);
        req.onerror = () => reject(req.error);
    });
}

async function updateBill(id, bill) {
    bill.id = id;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('bills', 'readwrite');
        const store = tx.objectStore('bills');
        const req = store.put(bill);
        req.onsuccess = () => resolve(bill);
        req.onerror = () => reject(req.error);
    });
}

async function deleteBill(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('bills', 'readwrite');
        const store = tx.objectStore('bills');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ---- Income ----

async function getAllIncome() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('income', 'readonly');
        const store = tx.objectStore('income');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addIncome(entry) {
    if (!entry.id) entry.id = generateUUID();
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('income', 'readwrite');
        const store = tx.objectStore('income');
        const req = store.put(entry);
        req.onsuccess = () => resolve(entry);
        req.onerror = () => reject(req.error);
    });
}

async function updateIncome(id, entry) {
    entry.id = id;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('income', 'readwrite');
        const store = tx.objectStore('income');
        const req = store.put(entry);
        req.onsuccess = () => resolve(entry);
        req.onerror = () => reject(req.error);
    });
}

async function deleteIncome(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('income', 'readwrite');
        const store = tx.objectStore('income');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ---- JSON Backup/Restore ----

async function exportAllData() {
    const db = await openDB();
    const readStore = (name) => new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(name)) { resolve([]); return; }
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const [bills, income, configItems] = await Promise.all([
        readStore('bills'), readStore('income'), readStore('config')
    ]);

    const config = {};
    configItems.forEach(item => { config[item.key] = item.value; });

    const blob = new Blob([JSON.stringify({
        version: 2,
        exportDate: new Date().toISOString(),
        bills, income, config
    }, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildman-money-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importAllData(file) {
    const data = JSON.parse(await file.text());
    if (!data.bills || !Array.isArray(data.bills)) {
        throw new Error('Invalid backup: missing bills array');
    }

    const db = await openDB();
    const clearAndWrite = (name, items) => new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(name)) { resolve(); return; }
        const tx = db.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        store.clear();
        items.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    const configItems = Object.entries(data.config || {}).map(([key, value]) => ({ key, value }));
    await Promise.all([
        clearAndWrite('bills', data.bills),
        clearAndWrite('income', data.income || []),
        clearAndWrite('config', configItems)
    ]);

    return { bills: data.bills.length, income: (data.income || []).length };
}

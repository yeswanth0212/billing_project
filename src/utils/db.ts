import { 
  User, 
  HotelSettings, 
  MenuItem, 
  Category, 
  Table, 
  Room, 
  Bill, 
  KOT, 
  AuditLog 
} from '../types';
import { 
  DEFAULT_USERS, 
  DEFAULT_HOTEL_SETTINGS, 
  DEFAULT_MENU_ITEMS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_TABLES, 
  DEFAULT_ROOMS, 
  DEFAULT_BILLS, 
  DEFAULT_KOTS, 
  DEFAULT_AUDIT_LOGS 
} from '../data/seedData';

const DB_NAME = 'HotelBillingDB';
const DB_VERSION = 1;

export const STORES = {
  USERS: 'users',
  SETTINGS: 'settings',
  MENU_ITEMS: 'menuItems',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  ROOMS: 'rooms',
  BILLS: 'bills',
  KOTS: 'kots',
  AUDIT_LOGS: 'auditLogs',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

export interface BackupData {
  version: string;
  exportedAt: string;
  hotelName: string;
  data: {
    users: User[];
    settings: HotelSettings;
    menuItems: MenuItem[];
    categories: Category[];
    tables: Table[];
    rooms: Room[];
    bills: Bill[];
    kots: KOT[];
    auditLogs: AuditLog[];
  };
}

class IndexedDBEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Object Stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MENU_ITEMS)) {
          const store = db.createObjectStore(STORES.MENU_ITEMS, { keyPath: 'id' });
          store.createIndex('categoryId', 'categoryId', { unique: false });
          store.createIndex('code', 'code', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.TABLES)) {
          db.createObjectStore(STORES.TABLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ROOMS)) {
          db.createObjectStore(STORES.ROOMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.BILLS)) {
          const store = db.createObjectStore(STORES.BILLS, { keyPath: 'id' });
          store.createIndex('billNumber', 'billNumber', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('tableNumber', 'tableNumber', { unique: false });
          store.createIndex('roomNumber', 'roomNumber', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.KOTS)) {
          const store = db.createObjectStore(STORES.KOTS, { keyPath: 'id' });
          store.createIndex('kotNumber', 'kotNumber', { unique: true });
          store.createIndex('tableNumber', 'tableNumber', { unique: false });
          store.createIndex('roomNumber', 'roomNumber', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
          const store = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('action', 'action', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Seed default data if database is empty
  public async initAndSeed(): Promise<void> {
    const db = await this.getDB();

    const checkEmpty = (storeName: StoreName): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result === 0);
        countReq.onerror = () => reject(countReq.error);
      });
    };

    const isUsersEmpty = await checkEmpty(STORES.USERS);
    if (isUsersEmpty) {
      await this.putBulk(STORES.USERS, DEFAULT_USERS);
    }

    const isSettingsEmpty = await checkEmpty(STORES.SETTINGS);
    if (isSettingsEmpty) {
      await this.put(STORES.SETTINGS, { id: 'primary_settings', ...DEFAULT_HOTEL_SETTINGS });
    }

    const isCategoriesEmpty = await checkEmpty(STORES.CATEGORIES);
    if (isCategoriesEmpty) {
      await this.putBulk(STORES.CATEGORIES, DEFAULT_CATEGORIES);
    }

    const isMenuEmpty = await checkEmpty(STORES.MENU_ITEMS);
    if (isMenuEmpty) {
      await this.putBulk(STORES.MENU_ITEMS, DEFAULT_MENU_ITEMS);
    }

    const isTablesEmpty = await checkEmpty(STORES.TABLES);
    if (isTablesEmpty) {
      await this.putBulk(STORES.TABLES, DEFAULT_TABLES);
    }

    const isRoomsEmpty = await checkEmpty(STORES.ROOMS);
    if (isRoomsEmpty) {
      await this.putBulk(STORES.ROOMS, DEFAULT_ROOMS);
    }

    const isBillsEmpty = await checkEmpty(STORES.BILLS);
    if (isBillsEmpty) {
      await this.putBulk(STORES.BILLS, DEFAULT_BILLS);
    }

    const isKotsEmpty = await checkEmpty(STORES.KOTS);
    if (isKotsEmpty) {
      await this.putBulk(STORES.KOTS, DEFAULT_KOTS);
    }

    const isLogsEmpty = await checkEmpty(STORES.AUDIT_LOGS);
    if (isLogsEmpty) {
      await this.putBulk(STORES.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    }
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: StoreName, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async putBulk<T>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearStore(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Backup: Export entire IndexedDB database into a JSON string
  public async exportAllData(): Promise<BackupData> {
    const [users, settingsArr, menuItems, categories, tables, rooms, bills, kots, auditLogs] = await Promise.all([
      this.getAll<User>(STORES.USERS),
      this.getAll<HotelSettings & { id: string }>(STORES.SETTINGS),
      this.getAll<MenuItem>(STORES.MENU_ITEMS),
      this.getAll<Category>(STORES.CATEGORIES),
      this.getAll<Table>(STORES.TABLES),
      this.getAll<Room>(STORES.ROOMS),
      this.getAll<Bill>(STORES.BILLS),
      this.getAll<KOT>(STORES.KOTS),
      this.getAll<AuditLog>(STORES.AUDIT_LOGS),
    ]);

    const settings = settingsArr.length > 0 ? settingsArr[0] : DEFAULT_HOTEL_SETTINGS;

    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      hotelName: settings.hotelName,
      data: {
        users,
        settings,
        menuItems,
        categories,
        tables,
        rooms,
        bills,
        kots,
        auditLogs,
      },
    };
  }

  // Restore: Import complete database from JSON
  public async importAllData(backup: BackupData): Promise<void> {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file format.');
    }

    const { users, settings, menuItems, categories, tables, rooms, bills, kots, auditLogs } = backup.data;

    // Clear existing stores
    await Promise.all([
      this.clearStore(STORES.USERS),
      this.clearStore(STORES.SETTINGS),
      this.clearStore(STORES.MENU_ITEMS),
      this.clearStore(STORES.CATEGORIES),
      this.clearStore(STORES.TABLES),
      this.clearStore(STORES.ROOMS),
      this.clearStore(STORES.BILLS),
      this.clearStore(STORES.KOTS),
      this.clearStore(STORES.AUDIT_LOGS),
    ]);

    // Restore stores
    if (users && users.length > 0) await this.putBulk(STORES.USERS, users);
    if (settings) await this.put(STORES.SETTINGS, { id: 'primary_settings', ...settings });
    if (menuItems && menuItems.length > 0) await this.putBulk(STORES.MENU_ITEMS, menuItems);
    if (categories && categories.length > 0) await this.putBulk(STORES.CATEGORIES, categories);
    if (tables && tables.length > 0) await this.putBulk(STORES.TABLES, tables);
    if (rooms && rooms.length > 0) await this.putBulk(STORES.ROOMS, rooms);
    if (bills && bills.length > 0) await this.putBulk(STORES.BILLS, bills);
    if (kots && kots.length > 0) await this.putBulk(STORES.KOTS, kots);
    if (auditLogs && auditLogs.length > 0) await this.putBulk(STORES.AUDIT_LOGS, auditLogs);
  }

  // Clear All Data and reset to factory defaults
  public async clearDatabase(): Promise<void> {
    const stores: StoreName[] = [
      STORES.USERS,
      STORES.SETTINGS,
      STORES.MENU_ITEMS,
      STORES.CATEGORIES,
      STORES.TABLES,
      STORES.ROOMS,
      STORES.BILLS,
      STORES.KOTS,
      STORES.AUDIT_LOGS,
    ];

    for (const store of stores) {
      await this.clearStore(store);
    }

    await this.initAndSeed();
  }

  // Mobile Device Storage Persistence
  public async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) return true;
        return await navigator.storage.persist();
      } catch (err) {
        console.warn('Could not request persistent storage:', err);
      }
    }
    return false;
  }

  public async isPersistenceGranted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  // Get storage counts and statistics
  public async getStorageStats() {
    const [bills, menuItems, tables, rooms, kots, auditLogs] = await Promise.all([
      this.getAll<Bill>(STORES.BILLS),
      this.getAll<MenuItem>(STORES.MENU_ITEMS),
      this.getAll<Table>(STORES.TABLES),
      this.getAll<Room>(STORES.ROOMS),
      this.getAll<KOT>(STORES.KOTS),
      this.getAll<AuditLog>(STORES.AUDIT_LOGS),
    ]);

    let estimatedSizeBytes = 0;
    let quotaBytes = 0;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        estimatedSizeBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch {
        // ignore
      }
    }

    const isPersisted = await this.isPersistenceGranted();

    return {
      totalBills: bills.length,
      totalMenuItems: menuItems.length,
      totalTables: tables.length,
      totalRooms: rooms.length,
      totalKots: kots.length,
      totalLogs: auditLogs.length,
      estimatedSizeKB: Math.round(estimatedSizeBytes / 1024),
      estimatedSizeMB: (estimatedSizeBytes / (1024 * 1024)).toFixed(2),
      quotaMB: quotaBytes > 0 ? (quotaBytes / (1024 * 1024)).toFixed(0) : undefined,
      isPersisted,
    };
  }
}

export const db = new IndexedDBEngine();

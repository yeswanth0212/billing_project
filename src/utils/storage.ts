import { db, STORES, BackupData } from './db';
import { 
  MenuItem, 
  Category, 
  User, 
  HotelSettings, 
  Bill, 
  AuditLog, 
  Table, 
  Room, 
  KOT 
} from '../types';
import { DEFAULT_HOTEL_SETTINGS, DEFAULT_USERS } from '../data/seedData';

const SESSION_KEYS = {
  ACTIVE_USER_ID: 'hbms_active_user_id',
  THEME_MODE: 'hbms_theme_mode',
};

export const Storage = {
  async init(): Promise<void> {
    await db.initAndSeed();
    // Ensure mobile device storage is set to persistent to prevent browser eviction
    try {
      await db.requestPersistence();
    } catch {
      // ignore
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    return db.getAll<User>(STORES.USERS);
  },
  async saveUser(user: User): Promise<void> {
    await db.put(STORES.USERS, user);
  },
  async deleteUser(userId: string): Promise<void> {
    await db.delete(STORES.USERS, userId);
  },

  // Active User session (stored in localStorage only as requested)
  getActiveUserId(): string | null {
    return localStorage.getItem(SESSION_KEYS.ACTIVE_USER_ID);
  },
  setActiveUserId(id: string | null): void {
    if (id) {
      localStorage.setItem(SESSION_KEYS.ACTIVE_USER_ID, id);
    } else {
      localStorage.removeItem(SESSION_KEYS.ACTIVE_USER_ID);
    }
  },

  // Hotel Settings
  async getSettings(): Promise<HotelSettings> {
    const list = await db.getAll<HotelSettings & { id: string }>(STORES.SETTINGS);
    if (list && list.length > 0) {
      const { ...settings } = list[0];
      return settings as HotelSettings;
    }
    return DEFAULT_HOTEL_SETTINGS;
  },
  async saveSettings(settings: HotelSettings): Promise<void> {
    await db.put(STORES.SETTINGS, { id: 'primary_settings', ...settings });
  },

  // Menu Items & Categories
  async getMenuItems(): Promise<MenuItem[]> {
    return db.getAll<MenuItem>(STORES.MENU_ITEMS);
  },
  async saveMenuItem(item: MenuItem): Promise<void> {
    await db.put(STORES.MENU_ITEMS, item);
  },
  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(STORES.MENU_ITEMS, id);
  },
  async saveBulkMenuItems(items: MenuItem[]): Promise<void> {
    await db.putBulk(STORES.MENU_ITEMS, items);
  },

  async getCategories(): Promise<Category[]> {
    return db.getAll<Category>(STORES.CATEGORIES);
  },
  async saveCategory(category: Category): Promise<void> {
    await db.put(STORES.CATEGORIES, category);
  },

  // Tables
  async getTables(): Promise<Table[]> {
    return db.getAll<Table>(STORES.TABLES);
  },
  async saveTable(table: Table): Promise<void> {
    await db.put(STORES.TABLES, table);
  },
  async saveBulkTables(tables: Table[]): Promise<void> {
    await db.putBulk(STORES.TABLES, tables);
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    return db.getAll<Room>(STORES.ROOMS);
  },
  async saveRoom(room: Room): Promise<void> {
    await db.put(STORES.ROOMS, room);
  },
  async saveBulkRooms(rooms: Room[]): Promise<void> {
    await db.putBulk(STORES.ROOMS, rooms);
  },

  // Bills
  async getBills(): Promise<Bill[]> {
    const bills = await db.getAll<Bill>(STORES.BILLS);
    return bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async saveBill(bill: Bill): Promise<void> {
    await db.put(STORES.BILLS, bill);
  },

  // KOTs
  async getKOTs(): Promise<KOT[]> {
    const kots = await db.getAll<KOT>(STORES.KOTS);
    return kots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async saveKOT(kot: KOT): Promise<void> {
    await db.put(STORES.KOTS, kot);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const logs = await db.getAll<AuditLog>(STORES.AUDIT_LOGS);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    await db.put(STORES.AUDIT_LOGS, newLog);
    return newLog;
  },

  // Bill & KOT Number Generators
  getNextBillNumber(existingBillsCount: number): string {
    const prefix = 'GRP';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(existingBillsCount + 1).padStart(4, '0');
    return `${prefix}-${dateStr}-${seq}`;
  },

  getNextKotNumber(existingKotsCount: number): string {
    return `KOT-${1000 + existingKotsCount + 1}`;
  },

  // Backup Database -> Download JSON file
  async downloadBackupJSON(): Promise<void> {
    const backupData = await db.exportAllData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.download = `HotelBilling_DB_Backup_${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Record audit log and update lastBackupDate in settings
    const settings = await this.getSettings();
    settings.lastBackupDate = new Date().toISOString();
    await this.saveSettings(settings);

    await this.addAuditLog({
      userId: 'system',
      userName: 'System',
      action: 'DATABASE_BACKUP',
      details: `Full JSON Database backup exported (${backupData.data.bills.length} bills, ${backupData.data.menuItems.length} menu items)`,
    });
  },

  // Restore Database from JSON string
  async restoreFromJSON(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString) as BackupData;
    if (!parsed || !parsed.data) {
      throw new Error('Invalid JSON format: Missing "data" root key.');
    }
    await db.importAllData(parsed);

    await this.addAuditLog({
      userId: 'system',
      userName: 'System',
      action: 'DATABASE_RESTORE',
      details: `Database restored from backup dated ${parsed.exportedAt || 'unknown'}`,
    });
  },

  // Factory Reset Database
  async clearAllData(): Promise<void> {
    await db.clearDatabase();
    await this.addAuditLog({
      userId: 'system',
      userName: 'System',
      action: 'DATABASE_RESET',
      details: 'All database records wiped and reset to factory seed defaults',
    });
  },

  async getStorageStats() {
    return db.getStorageStats();
  },

  async requestPersistence(): Promise<boolean> {
    return db.requestPersistence();
  },

  async isPersistenceGranted(): Promise<boolean> {
    return db.isPersistenceGranted();
  },
};

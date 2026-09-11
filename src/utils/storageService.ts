import { db, STORES, BackupData, StoreName } from './db';
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
import { DEFAULT_HOTEL_SETTINGS } from '../data/seedData';

export interface StorageValidationResult {
  valid: boolean;
  recordCount: number;
  exportedAt?: string;
  hotelName?: string;
  error?: string;
  backupData?: BackupData;
}

export interface StorageServiceContract {
  get<T>(store: StoreName, id: string): Promise<T | null>;
  getAll<T>(store: StoreName): Promise<T[]>;
  save<T extends { id: string }>(store: StoreName, item: T): Promise<void>;
  update<T extends { id: string }>(store: StoreName, item: T): Promise<void>;
  delete(store: StoreName, id: string): Promise<void>;
  exportBackup(): Promise<{ backup: BackupData; recordCount: number; fileName: string }>;
  validateBackup(jsonString: string): StorageValidationResult;
  importBackup(jsonString: string): Promise<{ recordCount: number }>;
  clearAll(): Promise<void>;
  getStats(): Promise<any>;
}

/**
 * StorageService provides a clean abstraction over the local IndexedDB database.
 * This ensures the UI remains fully decoupled from database internals,
 * allowing optional AWS S3 or cloud sync backends to be plugged in effortlessly in the future.
 */
export class StorageService implements StorageServiceContract {
  public async get<T>(store: StoreName, id: string): Promise<T | null> {
    return db.get<T>(store, id);
  }

  public async getAll<T>(store: StoreName): Promise<T[]> {
    return db.getAll<T>(store);
  }

  public async save<T extends { id: string }>(store: StoreName, item: T): Promise<void> {
    const itemWithTimestamp = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    await db.put(store, itemWithTimestamp);
  }

  public async update<T extends { id: string }>(store: StoreName, item: T): Promise<void> {
    await this.save(store, item);
  }

  public async delete(store: StoreName, id: string): Promise<void> {
    await db.delete(store, id);
  }

  /**
   * Validates a backup JSON string before attempting any restoration
   */
  public validateBackup(jsonString: string): StorageValidationResult {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { valid: false, recordCount: 0, error: 'Backup content is empty or invalid.' };
      }

      const parsed = JSON.parse(jsonString) as BackupData;
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, recordCount: 0, error: 'Backup file is not valid JSON.' };
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        return { valid: false, recordCount: 0, error: 'Backup format error: Missing "data" container.' };
      }

      const { users, settings, menuItems, categories, tables, rooms, bills, kots, auditLogs } = parsed.data;

      // Count total records in backup
      const count = 
        (Array.isArray(users) ? users.length : 0) +
        (settings ? 1 : 0) +
        (Array.isArray(menuItems) ? menuItems.length : 0) +
        (Array.isArray(categories) ? categories.length : 0) +
        (Array.isArray(tables) ? tables.length : 0) +
        (Array.isArray(rooms) ? rooms.length : 0) +
        (Array.isArray(bills) ? bills.length : 0) +
        (Array.isArray(kots) ? kots.length : 0) +
        (Array.isArray(auditLogs) ? auditLogs.length : 0);

      if (count === 0) {
        return { valid: false, recordCount: 0, error: 'Backup contains zero records.' };
      }

      return {
        valid: true,
        recordCount: count,
        exportedAt: parsed.exportedAt,
        hotelName: parsed.hotelName || settings?.hotelName || 'Hotel Billing',
        backupData: parsed,
      };
    } catch (err: any) {
      return { valid: false, recordCount: 0, error: err.message || 'Corrupted or unreadable JSON file.' };
    }
  }

  /**
   * Exports all IndexedDB records into a single JSON backup file
   */
  public async exportBackup(): Promise<{ backup: BackupData; recordCount: number; fileName: string }> {
    const backup = await db.exportAllData();
    const { users, settings, menuItems, categories, tables, rooms, bills, kots, auditLogs } = backup.data;

    const recordCount =
      users.length +
      (settings ? 1 : 0) +
      menuItems.length +
      categories.length +
      tables.length +
      rooms.length +
      bills.length +
      kots.length +
      auditLogs.length;

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `hotel-billing-backup-${dateStamp}.json`;

    return { backup, recordCount, fileName };
  }

  /**
   * Imports a validated backup JSON string into IndexedDB
   */
  public async importBackup(jsonString: string): Promise<{ recordCount: number }> {
    const validation = this.validateBackup(jsonString);
    if (!validation.valid || !validation.backupData) {
      throw new Error(validation.error || 'Failed validation of backup file.');
    }

    await db.importAllData(validation.backupData);
    return { recordCount: validation.recordCount };
  }

  public async clearAll(): Promise<void> {
    await db.clearDatabase();
  }

  public async getStats() {
    return db.getStorageStats();
  }
}

export const storageService = new StorageService();

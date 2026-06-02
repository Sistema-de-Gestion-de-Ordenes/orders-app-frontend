import { knownFolders } from '@nativescript/core';
import { openOrCreate, SQLiteDatabase } from '@nativescript-community/sqlite';
import { Delivery } from '../models/delivery.model';

export class SqliteService {
    private db: SQLiteDatabase | null = null;

    async open(): Promise<void> {
        if (this.db) return;
        const dbPath = `${knownFolders.documents().path}/deliveries.db`;
        this.db = openOrCreate(dbPath);
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS deliveries (
                id   INTEGER PRIMARY KEY,
                data TEXT    NOT NULL
            )
        `);
    }

    async saveDeliveries(deliveries: Delivery[]): Promise<void> {
        if (!this.db) return;
        await this.db.execute('DELETE FROM deliveries');
        for (const d of deliveries) {
            await this.db.execute(
                'INSERT INTO deliveries (id, data) VALUES (?, ?)',
                [d.id, JSON.stringify(d)]
            );
        }
    }

    async getDeliveries(): Promise<Delivery[]> {
        if (!this.db) return [];
        const rows = await this.db.selectArray('SELECT data FROM deliveries ORDER BY id DESC');
        return rows.map((r: any[]) => JSON.parse(r[0]) as Delivery);
    }
}

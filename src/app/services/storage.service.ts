import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { DocumentModel, Folder } from '../models/document.model';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private dbName = 'notion-clone-db';
    private stores = {
        documents: 'documents',
        folders: 'folders'
    };
    private dbPromise: Promise<IDBPDatabase>;

    constructor() {
        this.dbPromise = openDB(this.dbName, 2, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    db.createObjectStore('documents', { keyPath: 'id' });
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('folders')) {
                        db.createObjectStore('folders', { keyPath: 'id' });
                    }
                }
            }
        });
    }

    // Document methods
    async getAllDocuments(): Promise<DocumentModel[]> {
        const db = await this.dbPromise;
        return db.getAll(this.stores.documents);
    }

    async getDocument(id: string): Promise<DocumentModel | undefined> {
        const db = await this.dbPromise;
        return db.get(this.stores.documents, id);
    }

    async saveDocument(doc: DocumentModel): Promise<string> {
        const db = await this.dbPromise;
        doc.updatedAt = Date.now();
        await db.put(this.stores.documents, doc);
        return doc.id;
    }

    async deleteDocument(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(this.stores.documents, id);
    }

    // Folder methods
    async getAllFolders(): Promise<Folder[]> {
        const db = await this.dbPromise;
        return db.getAll(this.stores.folders);
    }

    async saveFolder(folder: Folder): Promise<string> {
        const db = await this.dbPromise;
        folder.updatedAt = Date.now();
        await db.put(this.stores.folders, folder);
        return folder.id;
    }

    async deleteFolder(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(this.stores.folders, id);
    }
}

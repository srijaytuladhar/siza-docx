import { Injectable, signal } from '@angular/core';
import { Block, BlockType, DocumentModel, Folder } from '../models/document.model';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Subject, debounceTime } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EditorService {
    activeDocument = signal<DocumentModel | null>(null);
    documents = signal<DocumentModel[]>([]);
    folders = signal<Folder[]>([]);
    private autosave$ = new Subject<DocumentModel>();

    constructor(private storage: StorageService) {
        this.refreshAll();
        this.autosave$.pipe(debounceTime(1000)).subscribe(doc => {
            this.storage.saveDocument(doc);
        });
    }

    async refreshAll() {
        const [docs, folders] = await Promise.all([
            this.storage.getAllDocuments(),
            this.storage.getAllFolders()
        ]);
        this.documents.set(docs.sort((a, b) => b.updatedAt - a.updatedAt));
        this.folders.set(folders.sort((a, b) => b.updatedAt - a.updatedAt));
    }

    async createDocument(title: string = 'Untitled', parentId: string | null = null) {
        const newDoc: DocumentModel = {
            id: uuidv4(),
            title,
            blocks: [this.createBlock('paragraph')],
            parentId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await this.storage.saveDocument(newDoc);
        await this.refreshAll();
        this.setActiveDocument(newDoc.id);
        return newDoc;
    }

    async createFolder(name: string = 'New Folder', parentId: string | null = null) {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            parentId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await this.storage.saveFolder(newFolder);
        await this.refreshAll();
        return newFolder;
    }

    async setActiveDocument(id: string) {
        const doc = await this.storage.getDocument(id);
        if (doc) {
            this.activeDocument.set(doc);
        }
    }

    updateTitle(title: string) {
        const doc = this.activeDocument();
        if (doc) {
            const updated = { ...doc, title, updatedAt: Date.now() };
            this.activeDocument.set(updated);
            this.autosave$.next(updated);
            this.refreshDocumentsListOnly(updated);
        }
    }

    private refreshDocumentsListOnly(updatedDoc: DocumentModel) {
        const current = this.documents();
        const index = current.findIndex(d => d.id === updatedDoc.id);
        if (index !== -1) {
            current[index] = updatedDoc;
            this.documents.set([...current]);
        }
    }

    addBlock(index: number, type: BlockType = 'paragraph', content: string = '') {
        const doc = this.activeDocument();
        if (doc) {
            const newBlock = this.createBlock(type, content);
            const blocks = [...doc.blocks];
            blocks.splice(index + 1, 0, newBlock);
            this.updateBlocks(blocks);
            return newBlock.id;
        }
        return null;
    }

    updateBlock(id: string, content: string) {
        const doc = this.activeDocument();
        if (doc) {
            const blocks = doc.blocks.map(b => b.id === id ? { ...b, content } : b);
            this.updateBlocks(blocks);
        }
    }

    changeBlockType(id: string, type: BlockType) {
        const doc = this.activeDocument();
        if (doc) {
            const blocks = doc.blocks.map(b => b.id === id ? { ...b, type } : b);
            this.updateBlocks(blocks);
        }
    }

    deleteBlock(id: string) {
        const doc = this.activeDocument();
        if (doc && doc.blocks.length > 1) {
            const blocks = doc.blocks.filter(b => b.id !== id);
            this.updateBlocks(blocks);
        }
    }

    private updateBlocks(blocks: Block[]) {
        const doc = this.activeDocument();
        if (doc) {
            const updated = { ...doc, blocks, updatedAt: Date.now() };
            this.activeDocument.set(updated);
            this.autosave$.next(updated);
        }
    }

    private createBlock(type: BlockType, content: string = ''): Block {
        return {
            id: uuidv4(),
            type,
            content
        };
    }

    async deleteDocument(id: string) {
        await this.storage.deleteDocument(id);
        if (this.activeDocument()?.id === id) {
            this.activeDocument.set(null);
        }
        await this.refreshAll();
    }

    async deleteFolder(id: string) {
        // Simple deletion for now. Cascade deletion could be added later.
        await this.storage.deleteFolder(id);
        await this.refreshAll();
    }

    // New: Rename folder
    async renameFolder(id: string, name: string) {
        const folder = this.folders().find(f => f.id === id);
        if (folder) {
            const updated = { ...folder, name, updatedAt: Date.now() };
            await this.storage.saveFolder(updated);
            await this.refreshAll();
        }
    }

    async moveDocument(id: string, parentId: string | null) {
        const doc = this.documents().find(d => d.id === id);
        if (doc) {
            const updated = { ...doc, parentId, updatedAt: Date.now() };
            await this.storage.saveDocument(updated);
            await this.refreshAll();
        }
    }

    async moveFolder(id: string, parentId: string | null) {
        // Prevent moving a folder into itself
        if (id === parentId) return;

        const folder = this.folders().find(f => f.id === id);
        if (folder) {
            const updated = { ...folder, parentId, updatedAt: Date.now() };
            await this.storage.saveFolder(updated);
            await this.refreshAll();
        }
    }
}

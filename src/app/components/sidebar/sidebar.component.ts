import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorService } from '../../services/editor.service';
import { Folder, DocumentModel } from '../../models/document.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar" 
         (dragover)="onSidebarDragOver($event)" 
         (drop)="onSidebarDrop($event)">
      <div class="sidebar-header">
        <span class="user-info">Siza Docx</span>
      </div>
      
      <div class="sidebar-section">
        <div class="section-actions">
          <button class="action-btn" (click)="editorService.createDocument()">
            <span class="btn-icon">📄</span> Page
          </button>
          <button class="action-btn" (click)="editorService.createFolder()">
            <span class="btn-icon">📁</span> Folder
          </button>
        </div>
      </div>

      <div class="sidebar-list">
        <!-- Root level items -->
        @for (folder of getFoldersFor(null); track folder.id) {
          <ng-container *ngTemplateOutlet="folderTemplate; context: { $implicit: folder, depth: 0 }"></ng-container>
        }
        @for (doc of getDocsFor(null); track doc.id) {
          <ng-container *ngTemplateOutlet="docTemplate; context: { $implicit: doc, depth: 0 }"></ng-container>
        }
      </div>
    </div>

    <ng-template #folderTemplate let-folder let-depth="depth">
      <div class="sidebar-item folder-item" 
           [style.padding-left.px]="depth * 12 + 12"
           [class.drag-over]="dragOverId() === folder.id"
           draggable="true"
           (dragstart)="onDragStart($event, 'folder', folder.id)"
           (dragover)="onItemDragOver($event, folder.id)"
           (dragleave)="onItemDragLeave($event)"
           (drop)="onItemDrop($event, folder.id)"
           (click)="toggleFolder(folder.id)">
        <span class="doc-icon">{{ isExpanded(folder.id) ? '📂' : '📁' }}</span>
        
        @if (editingFolderId() === folder.id) {
          <input #folderInput
                 class="folder-edit-input"
                 [value]="folder.name"
                 (click)="$event.stopPropagation()"
                 (keydown.enter)="renameFolder(folder.id, folderInput.value)"
                 (blur)="renameFolder(folder.id, folderInput.value)"
                 (keydown.escape)="editingFolderId.set(null)"
                 autofocus />
        } @else {
          <span class="doc-title" (dblclick)="$event.stopPropagation(); startRenaming(folder.id)">{{ folder.name }}</span>
          <div class="item-actions">
            <button class="item-action-btn" title="Add Page" (click)="$event.stopPropagation(); editorService.createDocument('Untitled', folder.id); expandFolder(folder.id)">+</button>
            <button class="item-action-btn" title="Rename" (click)="$event.stopPropagation(); startRenaming(folder.id)">✏️</button>
            <button class="item-action-btn" title="Delete" (click)="$event.stopPropagation(); deleteFolder(folder.id)">🗑️</button>
          </div>
        }
      </div>
      @if (isExpanded(folder.id)) {
        @for (subFolder of getFoldersFor(folder.id); track subFolder.id) {
          <ng-container *ngTemplateOutlet="folderTemplate; context: { $implicit: subFolder, depth: depth + 1 }"></ng-container>
        }
        @for (doc of getDocsFor(folder.id); track doc.id) {
          <ng-container *ngTemplateOutlet="docTemplate; context: { $implicit: doc, depth: depth + 1 }"></ng-container>
        }
      }
    </ng-template>

    <!-- Document Template -->
    <ng-template #docTemplate let-doc let-depth="depth">
      <div class="sidebar-item doc-item" 
           [style.padding-left.px]="depth * 12 + 12"
           [class.active]="editorService.activeDocument()?.id === doc.id"
           draggable="true"
           (dragstart)="onDragStart($event, 'doc', doc.id)"
           (click)="editorService.setActiveDocument(doc.id)">
        <span class="doc-icon">📄</span>
        <span class="doc-title">{{ doc.title || 'Untitled' }}</span>
        <button class="delete-btn" (click)="$event.stopPropagation(); deleteDoc(doc.id)">🗑️</button>
      </div>
    </ng-template>
  `,
  styles: `
    .sidebar {
      width: 300px;
      height: 100vh;
      background: var(--sidebar-gradient);
      background-attachment: fixed;
      color: white;
      display: flex;
      flex-direction: column;
      border-right: none;
      box-shadow: 10px 0 30px rgba(0,0,0,0.1);
      position: relative;
      z-index: 10;
    }
    .sidebar-header {
      padding: 24px 20px;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      background: rgba(0, 0, 0, 0.4);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--sidebar-text);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .sidebar-header::before {
      content: 'S';
      width: 32px;
      height: 32px;
      background: var(--side-nav-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(217, 4, 41, 0.3);
    }
    .sidebar-section {
      padding: 8px 16px;
    }
    .section-actions {
      display: flex;
      gap: 4px;
    }
    .action-btn {
      flex: 1;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      transition: var(--transition-elegant);
      backdrop-filter: blur(10px);
    }
    .action-btn:hover {
      background: var(--side-nav-accent);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px var(--accent-red-glow);
      border-color: transparent;
    }
    .btn-icon {
      font-size: 14px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 0;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      margin: 4px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      gap: 12px;
      position: relative;
      transition: var(--transition-elegant);
      color: rgba(255, 255, 255, 0.75);
    }
    .sidebar-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
      transform: translateX(4px);
    }
    .sidebar-item.active {
      background: linear-gradient(90deg, rgba(217, 4, 41, 0.15) 0%, rgba(217, 4, 41, 0.05) 100%);
      border-left: 3px solid var(--side-nav-accent);
      font-weight: 600;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .sidebar-item.drag-over {
      background: var(--accent-red-glow);
      outline: 1px dashed var(--side-nav-accent);
    }
    .doc-icon { opacity: 0.8; font-size: 16px; transition: transform 0.2s; }
    .sidebar-item:hover .doc-icon { transform: scale(1.1); opacity: 1; }
    .doc-title {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
    }
    .item-actions, .delete-btn {
      opacity: 0;
      display: flex;
      gap: 4px;
    }
    .sidebar-item:hover .item-actions, .sidebar-item:hover .delete-btn {
      opacity: 0.6;
    }
    .item-action-btn, .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      font-size: 12px;
    }
    .item-action-btn:hover, .delete-btn:hover {
      opacity: 1 !important;
    }
    .folder-edit-input {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 2px;
      padding: 0 4px;
      font-size: 14px;
      width: 100%;
      outline: none;
      color: var(--text-primary);
    }
  `
})
export class SidebarComponent {
  editorService = inject(EditorService);
  expandedFolders = signal<Set<string>>(new Set());
  dragOverId = signal<string | null>(null);
  editingFolderId = signal<string | null>(null);

  getFoldersFor(parentId: string | null): Folder[] {
    return this.editorService.folders().filter(f => f.parentId === parentId);
  }

  getDocsFor(parentId: string | null): DocumentModel[] {
    return this.editorService.documents().filter(d => d.parentId === parentId);
  }

  toggleFolder(id: string) {
    const set = new Set(this.expandedFolders());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.expandedFolders.set(set);
  }

  expandFolder(id: string) {
    const set = new Set(this.expandedFolders());
    set.add(id);
    this.expandedFolders.set(set);
  }

  isExpanded(id: string): boolean {
    return this.expandedFolders().has(id);
  }

  // Drag and Drop Logic
  onDragStart(event: DragEvent, type: 'doc' | 'folder', id: string) {
    event.dataTransfer?.setData('type', type);
    event.dataTransfer?.setData('id', id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onItemDragOver(event: DragEvent, folderId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverId.set(folderId);
  }

  onItemDragLeave(event: DragEvent) {
    this.dragOverId.set(null);
  }

  onItemDrop(event: DragEvent, folderId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.handleDrop(event, folderId);
  }

  onSidebarDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onSidebarDrop(event: DragEvent) {
    event.preventDefault();
    this.handleDrop(event, null);
  }

  private handleDrop(event: DragEvent, parentId: string | null) {
    this.dragOverId.set(null);
    const type = event.dataTransfer?.getData('type');
    const id = event.dataTransfer?.getData('id');

    if (!id) return;

    if (type === 'doc') {
      this.editorService.moveDocument(id, parentId);
    } else if (type === 'folder') {
      this.editorService.moveFolder(id, parentId);
    }

    if (parentId) {
      this.expandFolder(parentId);
    }
  }

  deleteDoc(id: string) {
    if (confirm('Delete this document?')) {
      this.editorService.deleteDocument(id);
    }
  }

  deleteFolder(id: string) {
    if (confirm('Delete this folder? (Note: Documents inside will be moved to root)')) {
      this.editorService.deleteFolder(id);
    }
  }

  startRenaming(id: string) {
    this.editingFolderId.set(id);
  }

  renameFolder(id: string, newName: string) {
    if (newName.trim() && newName !== this.editingFolderId()) {
      this.editorService.renameFolder(id, newName);
    }
    this.editingFolderId.set(null);
  }
}

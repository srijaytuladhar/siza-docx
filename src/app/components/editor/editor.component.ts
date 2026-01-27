import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorService } from '../../services/editor.service';
import { BlockComponent } from '../block/block.component';
import { CommandMenuComponent } from '../command-menu/command-menu.component';
import { BlockType } from '../../models/document.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, BlockComponent, CommandMenuComponent],
  template: `
    @if (editorService.activeDocument(); as doc) {
      <div class="editor-container">
        <input class="title-input" 
               [value]="doc.title" 
               (input)="onTitleInput($event)"
               placeholder="Untitled" />
        
        <div class="blocks-list">
          @for (block of doc.blocks; track block.id; let i = $index) {
            <app-block [block]="block"
                       [focused]="focusedBlockId() === block.id"
                       (update)="editorService.updateBlock(block.id, $event)"
                       (enter)="onBlockEnter(i)"
                       (backspace)="onBlockBackspace(block.id, i)"
                       (showMenu)="openMenu($event, block.id)"
                       (focusChanged)="focusedBlockId.set(block.id)">
            </app-block>
          }
        </div>

        @if (menuVisible()) {
          <app-command-menu [position]="menuPosition"
                            (select)="onTypeSelect($event)"
                            (close)="menuVisible.set(false)">
          </app-command-menu>
        }
      </div>
    } @else {
      <div class="empty-state">
        <div class="empty-content">
          <div class="logo-circle">S</div>
          <h1>Siza Docx</h1>
          <p>Your premium space for thoughts and documentation.</p>
          <div class="empty-actions">
            <button class="hero-btn" (click)="editorService.createDocument()">
              Create Your First Page
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .editor-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 100px;
    }
    .title-input {
      width: 100%;
      border: none;
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 30px;
      outline: none;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }
    .title-input::placeholder {
      color: rgba(0, 0, 0, 0.08);
    }
    .blocks-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, rgba(217, 4, 41, 0.05), transparent),
                  radial-gradient(circle at bottom left, rgba(0, 0, 0, 0.05), transparent);
    }
    .empty-content {
      text-align: center;
      animation: fadeIn 0.8s ease-out;
    }
    .logo-circle {
      width: 80px;
      height: 80px;
      background: var(--sidebar-gradient);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
      font-weight: 800;
      color: white;
      box-shadow: var(--shadow-premium);
      transform: rotate(-5deg);
    }
    .empty-content h1 {
      font-size: 3.5rem;
      font-weight: 900;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #000 0%, #d90429 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.04em;
    }
    .empty-content p {
      font-size: 1.25rem;
      color: var(--text-secondary);
      margin-bottom: 32px;
    }
    .hero-btn {
      padding: 16px 32px;
      background: var(--accent-black);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-smooth);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .hero-btn:hover {
      background: var(--accent-red);
      transform: translateY(-4px);
      box-shadow: 0 15px 30px rgba(217, 4, 41, 0.3);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
})
export class EditorComponent {
  editorService = inject(EditorService);
  focusedBlockId = signal<string | null>(null);

  menuVisible = signal(false);
  menuPosition = { x: 0, y: 0 };
  private menuBlockId: string | null = null;

  onTitleInput(event: any) {
    this.editorService.updateTitle(event.target.value);
  }

  onBlockEnter(index: number) {
    const newId = this.editorService.addBlock(index);
    if (newId) {
      this.focusedBlockId.set(newId);
    }
  }

  onBlockBackspace(id: string, index: number) {
    const doc = this.editorService.activeDocument();
    if (doc && doc.blocks.length > 1) {
      const prevBlock = doc.blocks[index - 1];
      this.editorService.deleteBlock(id);
      if (prevBlock) {
        this.focusedBlockId.set(prevBlock.id);
      }
    }
  }

  openMenu(position: { x: number, y: number }, blockId: string) {
    this.menuPosition = position;
    this.menuBlockId = blockId;
    this.menuVisible.set(true);
  }

  onTypeSelect(type: BlockType) {
    if (this.menuBlockId) {
      // Clear the '/' before changing type
      const block = this.editorService.activeDocument()?.blocks.find(b => b.id === this.menuBlockId);
      if (block) {
        const content = block.content.replace('/', '');
        this.editorService.updateBlock(this.menuBlockId, content);
      }
      this.editorService.changeBlockType(this.menuBlockId, type);
      this.menuVisible.set(false);
      this.focusedBlockId.set(this.menuBlockId);
    }
  }
}

import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockType } from '../../models/document.model';

@Component({
  selector: 'app-command-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="command-menu" [style.top.px]="position.y" [style.left.px]="position.x">
      <div class="menu-header">Basic blocks</div>
      @for (item of items; track item.type; let i = $index) {
        <div class="menu-item" 
             [class.active]="i === selectedIndex"
             (click)="select.emit(item.type)">
          <span class="item-icon">{{ item.icon }}</span>
          <div class="item-info">
            <div class="item-label">{{ item.label }}</div>
            <div class="item-desc">{{ item.desc }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .command-menu {
      position: fixed;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px) saturate(180%);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      width: 300px;
      padding: 8px;
      max-height: 440px;
      overflow-y: auto;
      animation: menuPop 0.2s cubic-bezier(0, 0, 0.2, 1);
    }
    @keyframes menuPop {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .menu-header {
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .menu-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      gap: 12px;
    }
    .menu-item:hover, .menu-item.active {
      background: var(--accent-red);
      color: white;
      transform: translateX(4px);
    }
    .menu-item.active .item-desc {
      color: rgba(255, 255, 255, 0.8);
    }
    .item-icon {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 4px;
      font-size: 20px;
    }
    .item-label {
      font-size: 14px;
      font-weight: 500;
    }
    .item-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }
  `
})
export class CommandMenuComponent {
  @Input() position = { x: 0, y: 0 };
  @Output() select = new EventEmitter<BlockType>();
  @Output() close = new EventEmitter<void>();

  items: { type: BlockType; label: string; desc: string; icon: string }[] = [
    { type: 'paragraph', label: 'Text', desc: 'Just start writing with plain text.', icon: '📄' },
    { type: 'h1', label: 'Heading 1', desc: 'Big section heading.', icon: 'H1' },
    { type: 'h2', label: 'Heading 2', desc: 'Medium section heading.', icon: 'H2' },
    { type: 'h3', label: 'Heading 3', desc: 'Small section heading.', icon: 'H3' },
    { type: 'bullet-list', label: 'Bulleted list', desc: 'Create a simple bulleted list.', icon: '•' },
    { type: 'numbered-list', label: 'Numbered list', desc: 'Create a list with numbering.', icon: '1.' },
    { type: 'quote', label: 'Quote', desc: 'Capture a quotation.', icon: '\"' },
    { type: 'code', label: 'Code', desc: 'Capture a code snippet.', icon: '<>' },
  ];

  selectedIndex = 0;

  get selectedItem() {
    return this.items[this.selectedIndex];
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.select.emit(this.selectedItem.type);
    }
  }
}

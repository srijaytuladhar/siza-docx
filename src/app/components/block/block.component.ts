import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { EditorService } from '../../services/editor.service';
import { CommonModule } from '@angular/common';
import { MermaidBlockComponent } from './mermaid-block.component';
import { Block, BlockType } from '../../models/document.model';

@Component({
    selector: 'app-block',
    standalone: true,
    imports: [CommonModule, MermaidBlockComponent],
    template: `
    <div class="block" [class]="'block-' + block.type">
      @if (block.type === 'mermaid') {
        <app-mermaid-block 
          [code]="block.content" 
          (codeChange)="editorService.updateBlock(block.id, $event)">
        </app-mermaid-block>
      } @else {
        <div #editable
             contenteditable="true"
             class="editable-area"
             (input)="onInput()"
             (keydown)="onKeyDown($event)"
             (focus)="onFocus()"
             [attr.placeholder]="getPlaceholder()">
        </div>
      }
    </div>
  `,
    styles: `
    .block {
      width: 100%;
      position: relative;
      transition: var(--transition-smooth);
      border-radius: 6px;
      margin: 1px 0;
    }
    .block:focus-within {
      background: rgba(217, 4, 41, 0.02);
      box-shadow: -2px 0 0 var(--accent-red);
    }
    .editable-area {
      min-height: 1.5em;
      padding: 6px 10px;
      outline: none;
      word-break: break-word;
      line-height: 1.7;
    }
    .editable-area:empty:before {
      content: attr(placeholder);
      color: rgba(0, 0, 0, 0.1);
      pointer-events: none;
    }
    .block-h1 .editable-area { font-size: 2.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-top: 1.5rem; }
    .block-h2 .editable-area { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; margin-top: 1.25rem; }
    .block-h3 .editable-area { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-top: 1rem; }
    .block-code .editable-area {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-light);
      font-size: 0.9rem;
    }
    .block-quote .editable-area {
      border-left: 4px solid var(--accent-red);
      padding-left: 20px;
      font-style: italic;
      color: var(--text-secondary);
      font-size: 1.1rem;
    }
  `
})
export class BlockComponent implements AfterViewInit, OnChanges {
    editorService = inject(EditorService);
    @Input() block!: Block;
    @Input() focused = false;
    @Output() update = new EventEmitter<string>();
    @Output() enter = new EventEmitter<void>();
    @Output() backspace = new EventEmitter<void>();
    @Output() showMenu = new EventEmitter<{ x: number, y: number }>();
    @Output() focusChanged = new EventEmitter<void>();

    @ViewChild('editable') editableElement!: ElementRef<HTMLDivElement>;

    ngAfterViewInit() {
        this.updateContent();
        if (this.focused) {
            this.focus();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['focused']?.currentValue && !changes['focused']?.previousValue) {
            this.focus();
        }
        if (changes['block'] && this.editableElement) {
            const currentText = this.editableElement.nativeElement.innerText;
            if (currentText !== this.block.content) {
                // Only update if not focused to avoid cursor jumping
                if (document.activeElement !== this.editableElement.nativeElement) {
                    this.updateContent();
                }
            }
        }
    }

    private updateContent() {
        if (this.editableElement) {
            this.editableElement.nativeElement.innerText = this.block.content;
        }
    }

    onInput() {
        const text = this.editableElement.nativeElement.innerText;
        if (text === '/') {
            const rect = this.editableElement.nativeElement.getBoundingClientRect();
            this.showMenu.emit({ x: rect.left, y: rect.bottom });
        }
        this.update.emit(text);
    }

    onFocus() {
        this.focusChanged.emit();
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.enter.emit();
        } else if (event.key === 'Backspace' && this.editableElement.nativeElement.innerText === '') {
            event.preventDefault();
            this.backspace.emit();
        }
    }

    getPlaceholder() {
        switch (this.block.type) {
            case 'h1': return 'Heading 1';
            case 'h2': return 'Heading 2';
            case 'h3': return 'Heading 3';
            case 'paragraph': return "Type '/' for commands";
            default: return '';
        }
    }

    focus() {
        setTimeout(() => {
            const el = this.editableElement?.nativeElement;
            if (el) {
                el.focus();
                // Move cursor to end
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        });
    }
}

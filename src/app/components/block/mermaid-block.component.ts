import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import mermaid from 'mermaid';

@Component({
    selector: 'app-mermaid-block',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mermaid-block" [class.editing]="isEditing">
        <div class="mermaid-controls">
            <span class="block-type-label">Mermaid Diagram</span>
            <div class="control-actions">
                <button class="icon-btn" (click)="toggleEdit()" title="{{ isEditing ? 'View Diagram' : 'Edit Code' }}">
                    {{ isEditing ? '👁️' : '✏️' }}
                </button>
            </div>
        </div>

        @if (isEditing) {
            <div class="code-editor">
                <textarea #editor
                          [value]="code"
                          (input)="onCodeInput($event)"
                          placeholder="Enter Mermaid code here..."
                          (keydown.enter)="$event.stopPropagation()"></textarea>
            </div>
        }

        <div class="mermaid-preview" [class.hidden]="isEditing && !code">
            <div #mermaidContainer class="diagram-container"></div>
            @if (error) {
                <div class="error-message">{{ error }}</div>
            }
        </div>
    </div>
  `,
    styles: `
    .mermaid-block {
        background: white;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        margin: 1rem 0;
        overflow: hidden;
        transition: box-shadow 0.2s;
    }
    .mermaid-block:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .mermaid-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f8f9fa;
        border-bottom: 1px solid var(--border-light);
    }
    .block-type-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    .icon-btn:hover {
        opacity: 1;
        background: rgba(0,0,0,0.05);
    }
    .code-editor textarea {
        width: 100%;
        min-height: 150px;
        padding: 12px;
        border: none;
        font-family: 'SFMono-Regular', Consolas, monospace;
        font-size: 13px;
        resize: vertical;
        outline: none;
        background: #fdfdfd;
        color: var(--text-primary);
        line-height: 1.5;
    }
    .mermaid-preview {
        padding: 20px;
        display: flex;
        justify-content: center;
        background: white;
        min-height: 100px;
    }
    .mermaid-preview.hidden {
        display: none;
    }
    .error-message {
        color: var(--accent-red);
        font-size: 12px;
        margin-top: 8px;
        font-family: monospace;
    }
  `
})
export class MermaidBlockComponent implements AfterViewInit, OnChanges {
    @Input() code = '';
    @Output() codeChange = new EventEmitter<string>();
    @ViewChild('mermaidContainer') mermaidContainer!: ElementRef<HTMLDivElement>;

    isEditing = true;
    error: string | null = null;
    private renderId = 'mermaid-' + Math.random().toString(36).substr(2, 9);

    ngAfterViewInit() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
        if (this.code) {
            this.renderDiagram();
            this.isEditing = false;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['code'] && !changes['code'].firstChange) {
            // If external code changes happen
            if (!this.isEditing) {
                this.renderDiagram();
            }
        }
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        if (!this.isEditing) {
            this.renderDiagram();
        }
    }

    onCodeInput(event: any) {
        const newCode = event.target.value;
        this.code = newCode;
        this.codeChange.emit(newCode);
    }

    async renderDiagram() {
        if (!this.mermaidContainer || !this.code.trim()) return;

        try {
            this.error = null;
            this.mermaidContainer.nativeElement.innerHTML = '';
            const { svg } = await mermaid.render(this.renderId, this.code);
            this.mermaidContainer.nativeElement.innerHTML = svg;
        } catch (e: any) {
            this.error = 'Invalid Mermaid Syntax';
            console.error('Mermaid Render Error:', e);
            // Mermaid adds an error element to the body, we should probably remove it to be clean
            const errorElement = document.querySelector(`#d${this.renderId}`);
            if (errorElement) errorElement.remove();
        }
    }
}

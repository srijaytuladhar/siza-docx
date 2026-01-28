import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, AfterViewInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
                <button class="icon-btn" (click)="toggleFullscreen()" title="Full Screen" *ngIf="!isEditing && !error">
                    ⛶
                </button>
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

        <div class="mermaid-preview" 
             [class.hidden]="isEditing && !code"
             (click)="!isEditing && !error && toggleFullscreen()"
             [title]="!isEditing ? 'Click to view full screen' : ''">
            <div #mermaidContainer class="diagram-container"></div>
            @if (error) {
                <div class="error-message">{{ error }}</div>
            }
        </div>
    </div>

    @if (isFullscreen) {
        <div class="fullscreen-overlay" (click)="toggleFullscreen()">
            <div class="fullscreen-content-wrapper">
                 <button class="close-btn" (click)="$event.stopPropagation(); toggleFullscreen()">×</button>
                <div class="fullscreen-content" [innerHTML]="currentSvg" (click)="$event.stopPropagation()"></div>
            </div>
        </div>
    }
  `,
    styles: `
    .mermaid-block {
        background: white;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        margin: 1rem 0;
        overflow: hidden;
        transition: box-shadow 0.2s;
        /* ... styles truncated in tool output but preserved in file ... */
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
    .control-actions {
        display: flex;
        gap: 8px;
    }
    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
        font-size: 1.1em;
        line-height: 1;
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
        overflow-x: auto;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .mermaid-preview:hover {
        background-color: #fafafa;
    }
    .mermaid-preview.hidden {
        display: none;
    }
    /* Force SVG to be larger in preview */
    .diagram-container {
        width: 100%;
        display: flex;
        justify-content: center;
    }
    :host ::ng-deep .diagram-container svg {
        max-width: 100% !important;
        height: auto !important;
        min-width: 200px; /* Ensure it's not tiny */
    }

    .error-message {
        color: var(--accent-red);
        font-size: 12px;
        margin-top: 8px;
        font-family: monospace;
    }

    /* Fullscreen Overlay Styles */
    .fullscreen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease-out;
        padding: 20px;
        box-sizing: border-box;
    }
    .fullscreen-content-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .fullscreen-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 95vw;
        height: 90vh; /* Fixed height to force scaling */
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden; /* Hide overflow so SVG scales to fit */
    }
    /* Styles for SVG inside fullscreen */
    :host ::ng-deep .fullscreen-content svg {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
    }
    .close-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.6);
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        opacity: 0.8;
        transition: all 0.2s;
        z-index: 10000;
        backdrop-filter: blur(4px);
    }
    .close-btn:hover {
        opacity: 1;
        background: rgba(0,0,0,0.8);
        transform: scale(1.05);
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
  `
})
export class MermaidBlockComponent implements AfterViewInit, OnChanges {
    @Input() code = '';
    @Output() codeChange = new EventEmitter<string>();
    @ViewChild('mermaidContainer') mermaidContainer!: ElementRef<HTMLDivElement>;

    isEditing = true;
    isFullscreen = false;
    error: string | null = null;
    currentSvg: SafeHtml | null = null;
    private renderId = 'mermaid-' + Math.random().toString(36).substr(2, 9);

    private sanitizer = inject(DomSanitizer);

    @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: any) {
        if (this.isFullscreen) {
            this.isFullscreen = false;
        }
    }

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

    toggleFullscreen() {
        if (!this.isFullscreen && this.error) return;
        this.isFullscreen = !this.isFullscreen;
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
            this.mermaidContainer.nativeElement.innerHTML = ''; // Clear previous

            // Render to get the SVG string
            const { svg } = await mermaid.render(this.renderId, this.code);

            // Set for preview
            this.mermaidContainer.nativeElement.innerHTML = svg;

            // Store for fullscreen (sanitize just in case, though usually mermaid output is fine to trust directly if we trust mermaid)
            this.currentSvg = this.sanitizer.bypassSecurityTrustHtml(svg);

        } catch (e: any) {
            this.error = 'Invalid Mermaid Syntax';
            console.error('Mermaid Render Error:', e);
            // Mermaid adds an error element to the body, remove it
            const errorElement = document.querySelector(`#d${this.renderId}`);
            if (errorElement) errorElement.remove();
        }
    }
}

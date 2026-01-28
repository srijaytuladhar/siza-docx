import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { EditorComponent } from './components/editor/editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, EditorComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <app-editor></app-editor>
      </main>
    </div>
  `,
  styles: `
    .app-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      background-color: #f8f9fa;
      background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
      background-size: 25px 25px;
    }
  `
})
export class AppComponent { }

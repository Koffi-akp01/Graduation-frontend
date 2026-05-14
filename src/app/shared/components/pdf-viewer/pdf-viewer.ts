import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  template: `
    <div class="pdf-overlay" (click)="close.emit()">
      <div class="pdf-modal" (click)="$event.stopPropagation()">
        <div class="pdf-toolbar">
          <button (click)="close.emit()">✕ Fermer</button>
          <button (click)="downloadPdf()">⬇ Télécharger</button>
        </div>
        <pdf-viewer
          [src]="pdfSrc"
          [render-text]="true"
          [original-size]="false"
          style="width: 100%; height: 80vh;">
        </pdf-viewer>
      </div>
    </div>
  `,
  styles: [`
    .pdf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .pdf-modal { background: white; border-radius: 12px; width: 90%; max-width: 1000px; overflow: hidden; }
    .pdf-toolbar { display: flex; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #E2DDD4; }
  `]
})
export class PdfViewerComponent {
  @Input() src!: string | Blob;
  @Output() close = new EventEmitter<void>();

  get pdfSrc(): string | Uint8Array | undefined {
    if (typeof this.src === 'string') return this.src;
    if (this.src instanceof Blob) return URL.createObjectURL(this.src);
    return undefined;
  }

  downloadPdf() {
    if (typeof this.src === 'string') window.open(this.src, '_blank');
    else if (this.src instanceof Blob) {
      const url = URL.createObjectURL(this.src);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
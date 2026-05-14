import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-wrap" [class.fullscreen]="fullscreen">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size">
        <div class="ring"></div>
      </div>
      <p class="spinner-label" *ngIf="label">{{ label }}</p>
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
    }
    .spinner-wrap.fullscreen {
      position: fixed; inset: 0; background: rgba(255,255,255,0.85);
      z-index: 300;
    }
    .spinner { position: relative; }
    .ring {
      width: 100%; height: 100%; border-radius: 50%;
      border: 3px solid #E2DDD4;
      border-top-color: #C8963E;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-label { font-size: 13px; color: #718096; font-weight: 500; }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 36;
  @Input() label: string = '';
  @Input() fullscreen: boolean = false;
}
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div class="toast" *ngFor="let t of toastService.toasts()" [ngClass]="'toast-' + t.type" (click)="toastService.remove(t.id)">
        <span class="toast-icon">{{ icons[t.type] }}</span>
        <span class="toast-msg">{{ t.message }}</span>
        <span class="toast-close">✕</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 400; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 10px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      animation: slideIn 0.25s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    .toast-msg { flex: 1; }
    .toast-close { opacity: 0.6; font-size: 11px; }
    .toast-success { background: #276749; color: #fff; }
    .toast-danger  { background: #9B2226; color: #fff; }
    .toast-warning { background: #7B4F00; color: #fff; }
    .toast-info    { background: #1A3C5E; color: #fff; }
    @media (max-width: 480px) {
      .toast-container { bottom: 16px; right: 16px; left: 16px; max-width: unset; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  icons: Record<string, string> = {
    success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️'
  };
}
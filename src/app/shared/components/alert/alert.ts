import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert" [ngClass]="'alert-' + type" *ngIf="visible">
      <span class="alert-icon">{{ icons[type] }}</span>
      <div class="alert-content">
        <div class="alert-title" *ngIf="title">{{ title }}</div>
        <div class="alert-message">{{ message }}</div>
      </div>
      <button class="alert-close" *ngIf="dismissible" (click)="dismiss()">✕</button>
    </div>
  `,
  styles: [`
    .alert {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 10px;
      border: 1px solid; margin-bottom: 12px;
      font-size: 13px; line-height: 1.5;
    }
    .alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .alert-content { flex: 1; }
    .alert-title { font-weight: 700; margin-bottom: 2px; font-size: 13px; }
    .alert-message { opacity: 0.9; }
    .alert-close {
      background: none; border: none; cursor: pointer;
      font-size: 12px; opacity: 0.6; padding: 2px;
      flex-shrink: 0; line-height: 1;
      &:hover { opacity: 1; }
    }
    .alert-success { background: #D8F3DC; border-color: #276749; color: #1a4a30; }
    .alert-danger  { background: #FFE8E8; border-color: #9B2226; color: #6b1518; }
    .alert-warning { background: #FFF3CD; border-color: #7B4F00; color: #5a3900; }
    .alert-info    { background: #EBF4FF; border-color: #2B6CB0; color: #1a4a80; }
  `]
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() message: string = '';
  @Input() title: string = '';
  @Input() dismissible: boolean = true;
  @Output() dismissed = new EventEmitter<void>();

  visible = true;

  icons: Record<AlertType, string> = {
    success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️'
  };

  dismiss() { this.visible = false; this.dismissed.emit(); }
}
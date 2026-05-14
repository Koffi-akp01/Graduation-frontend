import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [style.borderTopColor]="color">
      <div class="stat-icon" [style.background]="color + '18'">
        {{ icon }}
      </div>
      <div class="stat-body">
        <div class="stat-value" [style.color]="color">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
        <div class="stat-sub" *ngIf="sub">{{ sub }}</div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #fff; border: 1px solid #E2DDD4;
      border-top: 3px solid; border-radius: 12px;
      padding: 20px; display: flex; gap: 14px;
      align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 0.2s ease;
    }
    .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .stat-value {
      font-size: 28px; font-weight: 700; line-height: 1;
      font-family: 'Playfair Display', serif;
    }
    .stat-label {
      font-size: 12px; color: #718096; margin-top: 4px; font-weight: 500;
    }
    .stat-sub {
      font-size: 11px; color: #A0AEC0; margin-top: 2px;
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '📊';
  @Input() color: string = '#2B6CB0';
  @Input() sub: string = '';
}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'navy' | 'gold' | 'neutral';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge-' + variant">
      <span *ngIf="dot" class="badge-dot"></span>
      {{ text }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 9999px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor; flex-shrink: 0;
    }
    .badge-success { background: #D8F3DC; color: #276749; }
    .badge-danger  { background: #FFE8E8; color: #9B2226; }
    .badge-warning { background: #FFF3CD; color: #7B4F00; }
    .badge-info    { background: #EBF4FF; color: #2B6CB0; }
    .badge-navy    { background: #1A3C5E; color: #FFFFFF; }
    .badge-gold    { background: #C8963E; color: #FFFFFF; }
    .badge-neutral { background: #E2E8F0; color: #4A5568; }
  `]
})
export class BadgeComponent {
  @Input() text: string = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() dot: boolean = false;
}
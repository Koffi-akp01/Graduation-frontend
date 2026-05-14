import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent, RouterLink, RouterLinkActive],
  template: `
    <nav class="topnav">
      <div class="topnav-brand">
        <span class="brand-logo">🎓</span>
        <span class="brand-name">Graduation Plan</span>
        <span class="brand-school">IPNET</span>
      </div>
      <div class="topnav-actions">
        <button class="notif-btn" (click)="toggleNotifs()">🔔<span class="notif-count" *ngIf="notifCount > 0">{{ notifCount }}</span></button>
        <div class="user-chip">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </div>
        <button class="hamburger" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
      </div>
    </nav>

    <div class="shell">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-role">
          <span class="role-icon">{{ roleIcon }}</span>
          <div>
            <div class="role-name">{{ userName }}</div>
            <div class="role-label">{{ userRole }}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item" *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="active">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </nav>
      </aside>
      <div class="overlay" [class.visible]="sidebarOpen()" (click)="sidebarOpen.set(false)"></div>
      <main class="shell-main">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-toast></app-toast>
  `,
  styles: [`
    .topnav {
      height: 60px; background: #0F2237;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; position: sticky; top: 0; z-index: 200;
      border-bottom: 2px solid #C8963E;
    }
    .topnav-brand { display: flex; align-items: center; gap: 10px; }
    .brand-logo  { font-size: 22px; }
    .brand-name  { font-family: 'Playfair Display', serif; font-size: 16px; color: #fff; font-weight: 700; }
    .brand-school { font-size: 10px; color: #C8963E; font-weight: 700; background: rgba(200,150,62,0.15); padding: 2px 8px; border-radius: 9999px; }
    .topnav-actions { display: flex; align-items: center; gap: 12px; }
    .notif-btn {
      position: relative; background: none; border: none; font-size: 18px;
      cursor: pointer; padding: 6px; border-radius: 8px; color: rgba(255,255,255,0.7);
      &:hover { background: rgba(255,255,255,0.08); }
    }
    .notif-count {
      position: absolute; top: 2px; right: 2px; background: #9B2226; color: #fff;
      font-size: 9px; font-weight: 700; min-width: 16px; height: 16px;
      border-radius: 9999px; display: flex; align-items: center; justify-content: center; padding: 0 3px;
    }
    .user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .user-avatar { width: 34px; height: 34px; background: #C8963E; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; }
    .user-name { font-size: 12px; font-weight: 600; color: #fff; line-height: 1.2; }
    .user-role { font-size: 10px; color: rgba(255,255,255,0.5); }
    .hamburger { display: none; background: none; border: none; color: rgba(255,255,255,0.8); font-size: 20px; cursor: pointer; padding: 6px; border-radius: 6px; &:hover { background: rgba(255,255,255,0.08); } }
    @media (max-width: 768px) {
      .user-info { display: none; }
      .hamburger { display: block; }
      .brand-school { display: none; }
    }

    .shell { display: flex; height: calc(100vh - 60px); overflow: hidden; }
    .sidebar {
      width: 230px; min-height: 100%; background: #fff; border-right: 1px solid #E2DDD4;
      display: flex; flex-direction: column; gap: 0; flex-shrink: 0;
    }
    .sidebar-role { display: flex; align-items: center; gap: 10px; padding: 20px 16px; border-bottom: 1px solid #E2DDD4; background: #FAF8F3; }
    .role-icon { font-size: 26px; }
    .role-name { font-size: 13px; font-weight: 700; color: #0F2237; }
    .role-label { font-size: 11px; color: #718096; margin-top: 1px; }
    .sidebar-nav { display: flex; flex-direction: column; padding: 8px 0; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 11px 16px;
      text-decoration: none; color: #4A5568; font-size: 13px; font-weight: 500;
      transition: all 0.15s; border-left: 3px solid transparent;
      &:hover { background: #FAF8F3; color: #0F2237; }
      &.active { background: #EBF4FF; color: #1A3C5E; font-weight: 700; border-left-color: #C8963E; }
    }
    .nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; top: 60px; left: -100%; bottom: 0;
        z-index: 150; width: 260px; transition: left 0.3s ease;
        box-shadow: 4px 0 20px rgba(0,0,0,0.1);
        &.open { left: 0; }
      }
      .overlay {
        display: none; position: fixed; inset: 60px 0 0 0;
        background: rgba(0,0,0,0.4); z-index: 140;
        &.visible { display: block; }
      }
    }
    .shell-main { flex: 1; overflow-y: auto; padding: 32px; background: #F7F5F0; }
    @media (max-width: 768px) { .shell-main { padding: 20px 16px; } }
  `]
})
export class AppShellComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);
  notifCount = 0;

  get userName() {
    const user = this.auth.currentUser();
    return user ? `${user.first_name} ${user.last_name}` : 'Invité';
  }
  get userRole() {
    const roleMap: Record<string, string> = {
      etudiant: 'Étudiant', directeur: 'Directeur', jury: 'Jury',
      direction: 'Direction', organisation: 'Organisation',
      recouvrement: 'Recouvrement', examen: 'Service Examen', admin: 'Administrateur'
    };
    return roleMap[this.auth.currentUser()?.role || ''] || 'Utilisateur';
  }
  get userInitial() {
    const first = this.auth.currentUser()?.first_name?.charAt(0) || '?';
    return first.toUpperCase();
  }
  get roleIcon() {
    const icons: Record<string, string> = {
      etudiant: '🎓', directeur: '📘', jury: '⚖️', direction: '🏛',
      organisation: '📅', recouvrement: '💰', examen: '📋', admin: '⚙️'
    };
    return icons[this.auth.currentUser()?.role || ''] || '👤';
  }

  navItems = [
    { label: 'Tableau de bord', icon: '🏠', route: '/dashboard' },
    { label: 'Étudiants', icon: '🎓', route: '/etudiants' },
    { label: 'Documents', icon: '📄', route: '/documents' },
    { label: 'Soutenances', icon: '📅', route: '/soutenances' },
    { label: 'Paramètres', icon: '⚙️', route: '/settings' },
  ];

  toggleNotifs() { /* sera implémenté semaine 4 */ }
}

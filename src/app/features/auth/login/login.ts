// src/app/features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type RoleKey = 'etudiant' | 'examen' | 'direction' | 'directeur' | 'jury' | 'admin';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-box">
        <!-- Entête -->
        <div class="login-brand">
          <span class="brand-icon">🎓</span>
          <div>
            <div class="brand-title">Graduation Plan</div>
            <div class="brand-sub">PLATEFORME DE GESTION DES SOUTENANCES</div>
          </div>
        </div>

        <!-- Sélecteur de rôles -->
        <div class="role-selector">
          <div
            class="role-card"
            *ngFor="let role of roles"
            [class.active]="selectedRole === role.key"
            (click)="selectedRole = role.key">
            <span class="role-icon">{{ role.icon }}</span>
            <span class="role-label">{{ role.label }}</span>
          </div>
        </div>

        <!-- Formulaire -->
        <div class="login-form">
          <div class="input-group">
            <label class="input-label">Identifiant / Email institutionnel</label>
            <input
              class="input"
              type="text"
              [(ngModel)]="username"
              placeholder="ex: etudiant@ipnet.edu"
              (keyup.enter)="onLogin()" />
          </div>
          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <input
              class="input"
              type="password"
              [(ngModel)]="password"
              placeholder="••••••••"
              (keyup.enter)="onLogin()" />
          </div>

          <div class="login-error" *ngIf="auth.error()">
            <span>❌</span> {{ auth.error() }}
          </div>

          <button class="btn btn-primary w-full" (click)="onLogin()" [disabled]="auth.isLoading()">
            <span *ngIf="!auth.isLoading()">Se connecter →</span>
            <span *ngIf="auth.isLoading()">Connexion en cours...</span>
          </button>

          <div class="login-links">
            <a href="#" class="forgot-link">Mot de passe oublié ? Réinitialiser</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--navy, #0F2237);
      padding: 16px;
    }

    .login-box {
      background: #fff;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    /* Brand */
    .login-brand {
      text-align: center;
      margin-bottom: 32px;
    }
    .brand-icon {
      font-size: 48px;
      display: inline-block;
      margin-bottom: 8px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 800;
      color: #0F2237;
      letter-spacing: -0.3px;
    }
    .brand-sub {
      font-size: 11px;
      color: #718096;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 6px;
    }

    /* Role selector */
    .role-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 32px;
    }
    .role-card {
      background: #F7F5F0;
      border: 1.5px solid #E2DDD4;
      border-radius: 12px;
      padding: 12px 6px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .role-card:hover {
      border-color: #C8963E;
      background: #FDF3E0;
    }
    .role-card.active {
      background: #FDF3E0;
      border-color: #C8963E;
      box-shadow: 0 2px 8px rgba(200, 150, 62, 0.2);
    }
    .role-icon {
      display: block;
      font-size: 24px;
      margin-bottom: 6px;
    }
    .role-label {
      font-size: 12px;
      font-weight: 700;
      color: #2D3748;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-label {
      font-size: 12px;
      font-weight: 600;
      color: #2D3748;
    }
    .input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #E2DDD4;
      border-radius: 10px;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.2s;
    }
    .input:focus {
      outline: none;
      border-color: #2B6CB0;
      box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
    }
    .btn-primary {
      background: #0F2237;
      color: white;
      padding: 12px;
      font-weight: 700;
      border-radius: 10px;
      justify-content: center;
      width: 100%;
    }
    .btn-primary:hover:not(:disabled) {
      background: #1A3C5E;
    }
    .login-error {
      background: #FFE8E8;
      color: #9B2226;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .login-links {
      text-align: center;
      margin-top: 8px;
    }
    .forgot-link {
      font-size: 12px;
      color: #2B6CB0;
      text-decoration: none;
    }
    .forgot-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .login-box {
        padding: 24px 20px;
      }
      .role-selector {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .brand-title {
        font-size: 24px;
      }
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  username = '';
  password = '';

  roles: { key: RoleKey; label: string; icon: string }[] = [
    { key: 'etudiant', label: 'Étudiant', icon: '🎓' },
    { key: 'examen', label: 'Service Examen', icon: '📋' },
    { key: 'direction', label: 'Direction', icon: '🏛' },
    { key: 'directeur', label: 'Directeur', icon: '📘' },
    { key: 'jury', label: 'Jury / Président', icon: '⚖️' },
    { key: 'admin', label: 'Administrateur', icon: '⚙️' }
  ];
  selectedRole: RoleKey = 'etudiant';

  onLogin() {
    if (!this.username || !this.password) return;
    this.auth.login(this.username, this.password).subscribe({
      error: () => this.auth.error.set('Identifiant ou mot de passe incorrect.')
    });
  }
}
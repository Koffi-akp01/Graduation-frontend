import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth';

const PREFIX_ROLES: Record<string, { role: string; label: string; icon: string }> = {
  DM: { role: 'INTERNAL_TRAINER',     label: 'Directeur de Mémoire',    icon: '📘' },
  DA: { role: 'ADMIN_ACADEMIC',        label: 'Direction Académique',     icon: '🏛' },
  SE: { role: 'CHEF_SERVICE_EXAM',     label: 'Service Examen',           icon: '📋' },
  SR: { role: 'SERVICE_RECOUVREMENT',  label: 'Service Recouvrement',     icon: '💰' },
  CO: { role: 'CHARGE_ORGANISATION',   label: 'Chargé d\'Organisation',   icon: '🗓' },
  EX: { role: 'EXAMINER',              label: 'Examinateur',              icon: '⚖' },
};

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  form = {
    username:             '',
    email:                '',
    password:             '',
    confirmPassword:      '',
    first_name:           '',
    last_name:            '',
    matricule:            '',
    annee_formation:      '',
    niveau_professionnel: '',
    genre:                '',
    filiere_choisie:      '',
  };

  detectedRole: { role: string; label: string; icon: string } | null = null;
  isStudent = true;

  isLoading      = false;
  errorMessage   = '';
  successMessage = '';
  showPwd        = false;
  showConfirm    = false;

  constructor(private authService: AuthService, private router: Router) {}

  // ── Détection du rôle depuis le matricule ──────────────
  onMatriculeChange(): void {
    const prefix = this.form.matricule.substring(0, 2).toUpperCase();
    const found = PREFIX_ROLES[prefix] ?? null;
    this.detectedRole = found;
    this.isStudent = !found;

    // Auto-suggest email based on name
    this.suggestEmail();
  }

  onNameChange(): void {
    this.suggestEmail();
  }

  private suggestEmail(): void {
    if (this.form.email && !this.form.email.endsWith('@ipnetinstitute.com')) return;
    const prenom = this.form.first_name.toLowerCase().replace(/\s+/g, '.');
    const nom    = this.form.last_name.toLowerCase().replace(/\s+/g, '.');
    if (prenom && nom) {
      this.form.email    = `${prenom}.${nom}@ipnetinstitute.com`;
      this.form.username = this.form.username || `${prenom}.${nom}`;
    }
  }

  // ── Force du mot de passe ──────────────────────────────
  private get pwdScore(): number {
    const pwd = this.form.password;
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8)          s++;
    if (/[A-Z]/.test(pwd))        s++;
    if (/[0-9]/.test(pwd))        s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  }

  get pwdStrengthPct():   string { return `${this.pwdScore * 25}%`; }
  get pwdStrengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.pwdScore] ?? '';
  }
  get pwdStrengthLabel(): string {
    return ({ weak: 'Faible', fair: 'Moyen', good: 'Bon', strong: 'Fort' } as Record<string,string>)[this.pwdStrengthClass] ?? '';
  }

  // ── Inscription ────────────────────────────────────────
  onRegister(): void {
    this.errorMessage   = '';
    this.successMessage = '';

    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    const { confirmPassword, ...payload } = this.form;
    const { username, password } = this.form;

    this.authService.registerStudent(payload).subscribe({
      next: () => {
        this.successMessage = 'Compte créé ! Connexion en cours…';
        this.authService.login({ username, password }).subscribe({
          next: () => { /* redirection gérée par AuthService */ },
          error: () => {
            this.isLoading = false;
            sessionStorage.setItem('pending_login_username', username);
            this.router.navigate(['/login']);
          },
        });
      },
      error: (err) => {
        const e = err?.error;
        if (e && typeof e === 'object') {
          const parts: string[] = [];
          if (e.email)      parts.push(...(Array.isArray(e.email)      ? e.email      : [e.email]));
          if (e.username)   parts.push(...(Array.isArray(e.username)   ? e.username   : [e.username]));
          if (e.password)   parts.push(...(Array.isArray(e.password)   ? e.password   : [e.password]));
          if (e.matricule)  parts.push(...(Array.isArray(e.matricule)  ? e.matricule  : [e.matricule]));
          if (e.detail)     parts.push(e.detail);
          this.errorMessage = parts.length ? parts.join(' — ') : 'Inscription impossible. Vérifiez les informations saisies.';
        } else {
          this.errorMessage = 'Inscription impossible. Vérifiez les informations saisies.';
        }
        this.isLoading = false;
      },
    });
  }
}

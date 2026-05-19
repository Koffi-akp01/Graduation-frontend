import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, StudentRegisterPayload } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  form: StudentRegisterPayload & { confirmPassword: string } = {
    username:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    first_name:      '',
    last_name:       '',
    matricule:       '',
  };

  isLoading      = false;
  errorMessage   = '';
  successMessage = '';
  showPwd        = false;
  showConfirm    = false;

  constructor(private authService: AuthService, private router: Router) {}

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

    this.authService.registerStudent(payload).subscribe({
      next: () => {
        this.successMessage = 'Compte créé ! Redirection vers la connexion…';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.email?.[0] ?? err?.error?.username?.[0];
        this.errorMessage = detail ?? 'Inscription impossible. Vérifiez les informations saisies.';
        this.isLoading = false;
      },
    });
  }
}

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        const role = localStorage.getItem('user_role');
        this.redirectByUserRole(role);
      },
      error: (err) => {
        console.error('Erreur de connexion', err);
        this.errorMessage = 'Identifiants incorrects ou serveur indisponible.';
        this.isLoading = false;
      },
    });
  }

  private redirectByUserRole(role: string | null): void {
    if (role === 'STUDENT' || role === 'ETUDIANT') this.router.navigate(['/etudiant']);
    else if (role === 'ADMIN_ACADEMIC' || role === 'DIRECTION') this.router.navigate(['/direction']);
    else if (role === 'CHEF_SERVICE_EXAM') this.router.navigate(['/service-examen']);
    else if (role === 'SERVICE_RECOUVREMENT') this.router.navigate(['/recouvrement']);
    else if (role === 'CHARGE_ORGANISATION') this.router.navigate(['/organisation']);
    else if (role === 'INTERNAL_TRAINER' || role === 'EXTERNAL_TRAINER') this.router.navigate(['/encadreur']);
    else if (role === 'EXAMINER' || role === 'PRESIDENT_JURY') this.router.navigate(['/jury']);
    else if (role === 'MC') this.router.navigate(['/ceremonie']);
    else this.router.navigate(['/']);
  }
}

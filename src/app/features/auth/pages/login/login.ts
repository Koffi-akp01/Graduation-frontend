import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  credentials  = { username: '', password: '' };
  isLoading    = false;
  errorMessage = '';
  selectedRole = 'STUDENT';

  constructor(private authService: AuthService) {}

  onLogin(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        // La redirection est gérée par AuthService.login()
        // selon le rôle détecté dans le token JWT ou via /me/
      },
      error: () => {
        this.errorMessage = 'Identifiants incorrects ou serveur indisponible.';
        this.isLoading    = false;
      },
    });
  }
}

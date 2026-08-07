import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  credentials     = { username: '', password: '' };
  isLoading       = false;
  errorMessage    = '';
  justRegistered  = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const pending = sessionStorage.getItem('pending_login_username');
    if (pending) {
      this.credentials.username = pending;
      this.justRegistered = true;
      sessionStorage.removeItem('pending_login_username');
    }
  }

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

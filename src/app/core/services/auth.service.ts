import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<UserInfo | null>(null);
  isLoading = signal(false);
  error = signal('');

  login(username: string, password: string) {
    this.isLoading.set(true);
    this.error.set('');
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/token/`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem('access_token', res.access);
          localStorage.setItem('refresh_token', res.refresh);
          this.loadCurrentUser();
        })
      );
  }

  loadCurrentUser() {
    this.http.get<UserInfo>(`${environment.apiUrl}/auth/me/`).subscribe({
      next: user => {
        this.currentUser.set(user);
        this.redirectByRole(user.role);
      },
      error: () => this.logout()
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }

  private redirectByRole(role: string) {
    const routes: Record<string, string> = {
      etudiant: '/etudiant/dashboard',
      directeur: '/directeur/dashboard',
      jury: '/jury/dashboard',
      direction: '/direction/dashboard',
      organisation: '/organisation/dashboard',
      recouvrement: '/recouvrement/dashboard',
      examen: '/examen/dashboard',
      admin: '/admin/dashboard'
    };
    this.router.navigate([routes[role] ?? '/dashboard']);
  }
}
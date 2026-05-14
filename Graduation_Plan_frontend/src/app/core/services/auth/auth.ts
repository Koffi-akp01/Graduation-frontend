import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface LoginResponse {
  access: string;
  refresh: string;
  role?: string;
  user?: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

export interface StudentRegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  matricule: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<UserInfo | null>(null);
  isLoading = signal(false);
  error = signal('');

  login(credentials: { username: string; password: string }): Observable<LoginResponse>;
  login(username: string, password: string): Observable<LoginResponse>;
  login(
    credentialsOrUsername: { username: string; password: string } | string,
    password?: string
  ): Observable<LoginResponse> {
    const credentials =
      typeof credentialsOrUsername === 'string'
        ? { username: credentialsOrUsername, password: password ?? '' }
        : credentialsOrUsername;
    const shouldLoadCurrentUser = typeof credentialsOrUsername === 'string';

    this.isLoading.set(true);
    this.error.set('');

    return this.http.post<LoginResponse>(`${this.apiUrl}/token/`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);

        const role = this.extractUserRole(response);
        if (role) {
          localStorage.setItem('user_role', role);
        }

        if (shouldLoadCurrentUser) {
          this.loadCurrentUser();
        }
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refresh = localStorage.getItem('refresh_token');

    return this.http.post<LoginResponse>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access);
      })
    );
  }

  registerStudent(payload: StudentRegisterPayload): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.apiUrl}/register/student/`, payload);
  }

  loadCurrentUser(): void {
    this.http.get<UserInfo>(`${this.apiUrl}/me/`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        localStorage.setItem('user_role', user.role);
        this.redirectByRole(user.role);
      },
      error: () => this.logout(),
    });
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
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
    const currentRole = this.currentUser()?.role ?? localStorage.getItem('user_role');
    return currentRole === role;
  }

  private extractUserRole(response: any): string | null {
    if (response.role) {
      return response.role;
    }

    if (response.user?.role) {
      return response.user.role;
    }

    if (!response.access) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(response.access.split('.')[1]));
      return payload.role ?? payload.user_role ?? null;
    } catch {
      return null;
    }
  }

  private redirectByRole(role: string): void {
    const routes: Record<string, string> = {
      etudiant: '/etudiant/dashboard',
      STUDENT: '/etudiant',
      ETUDIANT: '/etudiant',
      directeur: '/directeur/suivi',
      jury: '/jury/notation',
      direction: '/direction/themes',
      organisation: '/organisation/planification',
      recouvrement: '/recouvrement/dashboard',
      examen: '/examen',
      admin: '/admin',
      ADMIN_ACADEMIC: '/direction/themes',
      DIRECTION: '/direction/themes',
      CHEF_SERVICE_EXAM: '/examen',
      SERVICE_RECOUVREMENT: '/recouvrement',
      CHARGE_ORGANISATION: '/organisation/planification',
      EXAMINER: '/jury/notation',
      PRESIDENT_JURY: '/jury/notation',
    };

    this.router.navigate([routes[role] ?? '/etudiant/dashboard']);
  }
}

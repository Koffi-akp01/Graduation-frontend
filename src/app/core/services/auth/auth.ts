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

// Mapping rôle → route
const ROLE_ROUTES: Record<string, string> = {
  STUDENT:              '/etudiant',
  ETUDIANT:             '/etudiant',
  etudiant:             '/etudiant',
  ADMIN_ACADEMIC:       '/direction/themes',
  DIRECTION:            '/direction/themes',
  direction:            '/direction/themes',
  CHEF_SERVICE_EXAM:    '/examen/conformite',
  examen:               '/examen/conformite',
  SERVICE_RECOUVREMENT: '/recouvrement',
  recouvrement:         '/recouvrement',
  CHARGE_ORGANISATION:  '/organisation/planification',
  organisation:         '/organisation/planification',
  INTERNAL_TRAINER:     '/directeur/suivi',
  EXTERNAL_TRAINER:     '/directeur/suivi',
  directeur:            '/directeur/suivi',
  EXAMINER:             '/jury/notation',
  PRESIDENT_JURY:       '/jury/notation',
  jury:                 '/jury/notation',
  ADMIN:                '/admin',
  admin:                '/admin',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<UserInfo | null>(null);
  isLoading   = signal(false);
  error       = signal('');

  // ── Login ──────────────────────────────────────────────
  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.post<LoginResponse>(`${this.apiUrl}/token/`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);

        // 1. Essayer d'extraire le rôle du token / de la réponse
        const role = this.extractRole(response);

        if (role) {
          localStorage.setItem('user_role', role);
          this.redirectByRole(role);
        } else {
          // 2. Fallback : appeler /me/ pour récupérer le profil
          this.loadCurrentUser();
        }
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  // ── Refresh token ──────────────────────────────────────
  refreshToken(): Observable<LoginResponse> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post<LoginResponse>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap((r) => localStorage.setItem('access_token', r.access))
    );
  }

  // ── Inscription étudiant ───────────────────────────────
  registerStudent(payload: StudentRegisterPayload): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.apiUrl}/register/student/`, payload);
  }

  // ── Chargement profil (/me/) ───────────────────────────
  loadCurrentUser(): void {
    this.http.get<UserInfo>(`${this.apiUrl}/me/`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        localStorage.setItem('user_role', user.role);
        this.redirectByRole(user.role);
      },
      error: () => {
        // /me/ indisponible → utiliser le rôle déjà stocké ou défaut
        const stored = localStorage.getItem('user_role');
        this.redirectByRole(stored ?? '');
      },
    });
  }

  // ── Déconnexion ────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null   { return localStorage.getItem('access_token'); }
  isLoggedIn(): boolean       { return !!this.getToken(); }
  hasRole(role: string): boolean {
    const cur = this.currentUser()?.role ?? localStorage.getItem('user_role');
    return cur === role;
  }

  // ── Redirect selon rôle ────────────────────────────────
  redirectByRole(role: string): void {
    const route = ROLE_ROUTES[role] ?? '/etudiant';
    this.router.navigate([route]);
  }

  // ── Extraction du rôle depuis la réponse / JWT ─────────
  private extractRole(response: LoginResponse): string | null {
    if (response.role)       return response.role;
    if (response.user?.role) return response.user.role;

    try {
      const payload = JSON.parse(atob(response.access.split('.')[1]));
      return payload.role ?? payload.user_role ?? payload.user?.role ?? null;
    } catch {
      return null;
    }
  }
}

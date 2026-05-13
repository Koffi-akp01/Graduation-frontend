import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/token/`, credentials).pipe(
      tap((response: any) => {
        // Stockage des tokens pour la Tache 1.3
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);

        const role = this.extractUserRole(response);
        if (role) {
          localStorage.setItem('user_role', role);
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    const refresh = localStorage.getItem('refresh_token');

    return this.http.post(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access);
      })
    );
  }

  logout(): void {
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
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
}

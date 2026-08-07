import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuditLog, GlobalStats, UserListItem } from '../../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.apiUrl}/stats/`);
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs/`);
  }

  getUsersList(role?: string): Observable<UserListItem[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<UserListItem[]>(`${this.apiUrl}/users/`, { params });
  }

  createUser(data: {
    first_name: string; last_name: string; email: string; role: string; password: string;
  }): Observable<UserListItem> {
    return this.http.post<UserListItem>(`${this.apiUrl}/users/create/`, data);
  }

  toggleUser(id: number): Observable<{ id: number; actif: boolean; message: string }> {
    return this.http.patch<{ id: number; actif: boolean; message: string }>(
      `${this.apiUrl}/users/${id}/toggle/`, {}
    );
  }

  downloadReporting(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reporting/`, { responseType: 'blob' });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuditLog, GlobalStats } from '../../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.apiUrl}/stats/`);
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs/`);
  }

  downloadReporting(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reporting/`, { responseType: 'blob' });
  }
}

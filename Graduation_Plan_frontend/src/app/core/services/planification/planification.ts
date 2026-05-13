import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlanificationService {
  private readonly apiUrl = `${environment.apiUrl}/planification`;

  constructor(private http: HttpClient) {}

  genererPlanningAuto(params: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/generer/`, params);
  }

  getPlanningActuel(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getConflits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conflits/`);
  }

  publierPlanning(): Observable<any> {
    return this.http.post(`${this.apiUrl}/publier/`, {});
  }
}

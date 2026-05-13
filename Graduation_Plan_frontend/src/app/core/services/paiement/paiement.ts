import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Paiement, StatsPaiement } from '../../models/paiement.model';

@Injectable({
  providedIn: 'root',
})
export class PaiementService {
  private readonly apiUrl = `${environment.apiUrl}/paiements/`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<StatsPaiement> {
    return this.http.get<StatsPaiement>(`${this.apiUrl}stats/`);
  }

  getAllPaiements(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  validerPaiement(id: number): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.apiUrl}${id}/valider/`, {});
  }

  getRecu(id: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}${id}/recu/`);
  }
}

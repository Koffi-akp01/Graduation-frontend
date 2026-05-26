import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AlerteImpaye, Bordereau, StatsPaiement } from '../../models/paiement.model';

@Injectable({
  providedIn: 'root',
})
export class PaiementService {
  private readonly apiUrl = `${environment.apiUrl}/bordereaux/`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<StatsPaiement> {
    return this.http.get<StatsPaiement>(`${this.apiUrl}stats/`);
  }

  getAllBordereaux(params?: Record<string, string>): Observable<Bordereau[]> {
    return this.http.get<Bordereau[]>(this.apiUrl, { params });
  }

  /** @deprecated Use getAllBordereaux */
  getAllPaiements(params?: Record<string, string>): Observable<Bordereau[]> {
    return this.getAllBordereaux(params);
  }

  validerPaiement(id: number): Observable<Bordereau> {
    return this.http.patch<Bordereau>(`${this.apiUrl}${id}/`, { est_valide: true });
  }

  soumettreBordereau(formData: FormData): Observable<Bordereau> {
    return this.http.post<Bordereau>(this.apiUrl, formData);
  }

  getAlertes(): Observable<AlerteImpaye[]> {
    return this.http.get<AlerteImpaye[]>(`${this.apiUrl}alertes/`);
  }

  validerBordereau(id: number): Observable<Bordereau> {
    return this.http.patch<Bordereau>(`${this.apiUrl}${id}/valider/`, {});
  }
}

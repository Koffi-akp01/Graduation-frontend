import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bordereau, StatsPaiement, AlerteImpaye } from '../models/paiement.model';

@Injectable({ providedIn: 'root' })
export class RecouvrementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bordereaux/`;

  getPaiements(): Observable<Bordereau[]> {
    return this.http.get<Bordereau[]>(this.apiUrl);
  }

  getStats(): Observable<StatsPaiement> {
    return this.http.get<StatsPaiement>(`${this.apiUrl}stats/`);
  }

  getAlertes(): Observable<AlerteImpaye[]> {
    return this.http.get<AlerteImpaye[]>(`${this.apiUrl}alertes/`);
  }

  validerPaiement(id: number): Observable<Bordereau> {
    return this.http.patch<Bordereau>(`${this.apiUrl}${id}/valider/`, {});
  }
}

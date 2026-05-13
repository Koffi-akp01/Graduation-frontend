import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { VerificationMemoire } from '../../models/examen.model';

@Injectable({
  providedIn: 'root',
})
export class ExamenService {
  private readonly apiUrl = `${environment.apiUrl}/examens/memoires/`;

  constructor(private http: HttpClient) {}

  getMemoiresEnAttente(): Observable<VerificationMemoire[]> {
    return this.http.get<VerificationMemoire[]>(`${this.apiUrl}en-attente/`);
  }

  updateConformite(
    id: number,
    data: { statut: 'VALIDE' | 'REJETE'; observations: string }
  ): Observable<VerificationMemoire> {
    return this.http.patch<VerificationMemoire>(`${this.apiUrl}${id}/conformite/`, data);
  }
}

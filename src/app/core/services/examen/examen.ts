import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { VerificationMemoire } from '../../models/examen.model';

export interface MemoireAVerifier {
  id: number;
  etudiant_nom: string;
  titre: string;
  score_similarite: number;
  score_ia: number;
  nb_pages: number;
}

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

  getMemoiresAVerifier(): Observable<MemoireAVerifier[]> {
    return this.http.get<MemoireAVerifier[]>(`${environment.apiUrl}/examen/memoires/en_attente/`);
  }

  verifierMemoire(
    id: number,
    decision: 'valider' | 'rejeter' | 'correction',
    commentaire?: string
  ): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/examen/memoires/${id}/verifier/`, {
      decision,
      commentaire,
    });
  }
}

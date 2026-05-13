import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MemoireAVerifier {
  id: number;
  etudiant_nom: string;
  titre: string;
  score_similarite: number;
  score_ia: number;
  nb_pages: number;
}

@Injectable({ providedIn: 'root' })
export class ExamenService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMémoiresÀVérifier(): Observable<MemoireAVerifier[]> {
    return this.http.get<MemoireAVerifier[]>(`${this.apiUrl}/examen/memoires/en_attente/`);
  }

  verifierMemoire(id: number, decision: 'valider' | 'rejeter' | 'correction', commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/examen/memoires/${id}/verifier/`, { decision, commentaire });
  }
}
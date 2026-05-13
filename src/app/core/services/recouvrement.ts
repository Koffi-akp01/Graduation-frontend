import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Paiement {
  id: number;
  etudiant_nom: string;
  montant: number;
  statut: 'payé' | 'impayé' | 'en_verification';
  date: string;
  reçu_url?: string;
}

@Injectable({ providedIn: 'root' })
export class RecouvrementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPaiements(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/recouvrement/paiements/`);
  }

  validerPaiement(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/recouvrement/paiements/${id}/valider/`, {});
  }

  getReçu(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/recouvrement/paiements/${id}/recu/`, { responseType: 'blob' });
  }
}
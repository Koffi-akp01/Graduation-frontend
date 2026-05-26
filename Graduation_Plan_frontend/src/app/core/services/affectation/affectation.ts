import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Directeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  is_internal: boolean;
  charge_travail: number;
  niveau_pro: string;
  filiere_principale: string;
}

export interface Affectation {
  id: number;
  etudiant: number;
  directeur: number;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
  date_demande: string;
  date_decision: string | null;
  decide_par: number | null;
  motif_refus: string | null;
  etudiant_nom: string;
  directeur_nom: string;
  decide_par_nom: string | null;
}

@Injectable({ providedIn: 'root' })
export class AffectationService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getDirecteurs(): Observable<Directeur[]> {
    return this.http.get<Directeur[]>(`${this.base}/directeurs/`);
  }

  getAffectations(): Observable<Affectation[]> {
    return this.http.get<Affectation[]>(`${this.base}/affectations/`);
  }

  demanderAffectation(directeurId: number): Observable<Affectation> {
    return this.http.post<Affectation>(`${this.base}/affectations/`, { directeur: directeurId });
  }

  decider(id: number, statut: 'ACCEPTE' | 'REFUSE', motif?: string): Observable<Affectation> {
    return this.http.patch<Affectation>(`${this.base}/affectations/${id}/`, {
      statut,
      ...(motif ? { motif_refus: motif } : {}),
    });
  }
}

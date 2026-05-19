import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface Soutenance {
  id: number;
  etudiant: number;
  etudiant_details: string;
  filiere: string;
  theme: number;
  salle: number | null;
  salle_nom: string | null;
  date_soutenance: string;
  session: string;
  president: number;
  president_nom: string;
  examinateur: number;
  examinateur_nom: string;
  directeur_memoire: number;
  directeur_nom: string;
  pre_soutenance_validee: boolean;
  est_cloturee: boolean;
  lien_meet: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SoutenanceService {
  private readonly apiUrl = `${environment.apiUrl}/soutenances/`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Soutenance[]> {
    return this.http.get<Soutenance[]>(this.apiUrl);
  }

  getById(id: number): Observable<Soutenance> {
    return this.http.get<Soutenance>(`${this.apiUrl}${id}/`);
  }
}

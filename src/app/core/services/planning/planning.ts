import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface Indisponibilite {
  id: number;
  type_indisponible: string;
  utilisateur: number | null;
  salle: number | null;
  date_debut: string;
  date_fin: string;
  raison: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PlanningService {
  private readonly apiUrl = `${environment.apiUrl}/scheduling/indisponibilites/`;

  constructor(private http: HttpClient) {}

  getIndisponibilites(): Observable<Indisponibilite[]> {
    return this.http.get<Indisponibilite[]>(this.apiUrl);
  }

  createIndisponibilite(data: Partial<Indisponibilite>): Observable<Indisponibilite> {
    return this.http.post<Indisponibilite>(this.apiUrl, data);
  }
}

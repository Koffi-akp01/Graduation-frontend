import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EvenementCalendrier {
  id: number;
  titre: string;
  type_evenement: string;
  description: string;
  date_debut: string;
  date_fin: string | null;
  tout_la_journee: boolean;
  couleur: string;
  soutenance: number | null;
  cree_par: number | null;
  cree_par_nom: string | null;
  date_creation: string;
}

export type EvenementForm = Omit<EvenementCalendrier, 'id' | 'cree_par' | 'cree_par_nom' | 'date_creation'>;

@Injectable({ providedIn: 'root' })
export class CalendrierService {
  private readonly base = `${environment.apiUrl}/scheduling`;

  constructor(private http: HttpClient) {}

  getEvenements(type?: string): Observable<EvenementCalendrier[]> {
    const params = type ? `?type=${type}` : '';
    return this.http.get<EvenementCalendrier[]>(`${this.base}/evenements/${params}`);
  }

  creer(data: EvenementForm): Observable<EvenementCalendrier> {
    return this.http.post<EvenementCalendrier>(`${this.base}/evenements/`, data);
  }

  modifier(id: number, data: Partial<EvenementForm>): Observable<EvenementCalendrier> {
    return this.http.patch<EvenementCalendrier>(`${this.base}/evenements/${id}/`, data);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/evenements/${id}/`);
  }
}

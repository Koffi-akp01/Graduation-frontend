import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AlerteImpaye, Bordereau, StatsPaiement,
  TarifScolarite, EtudiantScolarite, PaiementScolarite,
  EngagementPaiement, NouveauPaiementForm, NouvelEngagementForm,
} from '../../models/paiement.model';

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

  // ── Scolarité ────────────────────────────────────────────────────────────
  private readonly scol = `${environment.apiUrl}/scolarite`;

  getTarifs(): Observable<TarifScolarite[]> {
    return this.http.get<TarifScolarite[]>(`${this.scol}/tarifs/`);
  }

  getEtudiantsScolarite(annee?: string): Observable<EtudiantScolarite[]> {
    let params = new HttpParams();
    if (annee) params = params.set('annee_academique', annee);
    return this.http.get<EtudiantScolarite[]>(`${this.scol}/etudiants/`, { params });
  }

  getPaiementsScolarite(etudiantId?: number): Observable<PaiementScolarite[]> {
    let params = new HttpParams();
    if (etudiantId) params = params.set('etudiant', String(etudiantId));
    return this.http.get<PaiementScolarite[]>(`${this.scol}/paiements/`, { params });
  }

  enregistrerPaiement(form: NouveauPaiementForm): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.scol}/paiements/`, form);
  }

  getEngagements(etudiantId?: number): Observable<EngagementPaiement[]> {
    let params = new HttpParams();
    if (etudiantId) params = params.set('etudiant', String(etudiantId));
    return this.http.get<EngagementPaiement[]>(`${this.scol}/engagements/`, { params });
  }

  creerEngagement(form: NouvelEngagementForm): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.scol}/engagements/`, form);
  }

  mettreAJourEngagement(id: number, data: Partial<EngagementPaiement>): Observable<{ id: number; statut: string }> {
    return this.http.patch<{ id: number; statut: string }>(`${this.scol}/engagements/${id}/`, data);
  }
}

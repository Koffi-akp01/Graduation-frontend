import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Evaluation,
  EtudiantSansSoutenance,
  MembreJury,
  Salle,
  Soutenance,
  SoutenanceForm,
  StatsSession,
} from '../../models/soutenance.model';

@Injectable({ providedIn: 'root' })
export class SoutenanceService {
  private readonly base = `${environment.apiUrl}/scheduling`;

  constructor(private http: HttpClient) {}

  // ── Soutenances ────────────────────────────────────────────────────────────

  getSoutenances(): Observable<Soutenance[]> {
    return this.http.get<Soutenance[]>(`${this.base}/soutenances/`);
  }

  creerSoutenance(data: SoutenanceForm): Observable<Soutenance> {
    return this.http.post<Soutenance>(`${this.base}/soutenances/`, data);
  }

  mettreAJourSoutenance(id: number, data: Partial<SoutenanceForm>): Observable<Soutenance> {
    return this.http.patch<Soutenance>(`${this.base}/soutenances/${id}/`, data);
  }

  cloturerSoutenance(id: number): Observable<Soutenance> {
    return this.http.patch<Soutenance>(`${this.base}/soutenances/${id}/cloturer/`, {});
  }

  getEtudiantsSansSoutenance(): Observable<EtudiantSansSoutenance[]> {
    return this.http.get<EtudiantSansSoutenance[]>(`${this.base}/soutenances/etudiants_sans_soutenance/`);
  }

  getStats(): Observable<StatsSession> {
    return this.http.get<StatsSession>(`${this.base}/soutenances/statistiques_session/`);
  }

  // ── Salles ─────────────────────────────────────────────────────────────────

  getSalles(): Observable<Salle[]> {
    return this.http.get<Salle[]>(`${this.base}/salles/`);
  }

  // ── Évaluations ────────────────────────────────────────────────────────────

  getEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.base}/evaluations/`);
  }

  creerEvaluation(data: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.base}/evaluations/`, data);
  }

  mettreAJourEvaluation(id: number, data: Partial<Evaluation>): Observable<Evaluation> {
    return this.http.patch<Evaluation>(`${this.base}/evaluations/${id}/`, data);
  }

  validerEvaluation(id: number): Observable<{ message: string; pv_url: string | null; evaluation_id: number }> {
    return this.http.post<{ message: string; pv_url: string | null; evaluation_id: number }>(
      `${this.base}/evaluations/${id}/valider/`, {}
    );
  }

  telechargerPVUrl(evaluationId: number): string {
    return `${this.base}/evaluations/${evaluationId}/telecharger-pv/`;
  }

  // ── Membres jury / directeurs (via UserViewSet filtré par rôle) ─────────────

  getDirecteurs(): Observable<MembreJury[]> {
    const params = new HttpParams().set('role', 'INTERNAL_TRAINER');
    return this.http.get<MembreJury[]>(`${environment.apiUrl}/users/`, { params });
  }

  getDirecteursExternes(): Observable<MembreJury[]> {
    const params = new HttpParams().set('role', 'EXTERNAL_TRAINER');
    return this.http.get<MembreJury[]>(`${environment.apiUrl}/users/`, { params });
  }

  getPresidents(): Observable<MembreJury[]> {
    const params = new HttpParams().set('role', 'PRESIDENT_JURY');
    return this.http.get<MembreJury[]>(`${environment.apiUrl}/users/`, { params });
  }

  getExaminateurs(): Observable<MembreJury[]> {
    const params = new HttpParams().set('role', 'EXAMINER');
    return this.http.get<MembreJury[]>(`${environment.apiUrl}/users/`, { params });
  }

  // ── Planification automatique ───────────────────────────────────────────────

  planificationAuto(payload: {
    creneaux: string[];
    session: string;
    salles_ids?: number[];
    presidents_ids?: number[];
    examinateurs_ids?: number[];
  }): Observable<{
    planifiees: number;
    non_planifiees: number;
    taux: number;
    message?: string;
  }> {
    return this.http.post<{
      planifiees: number;
      non_planifiees: number;
      taux: number;
      message?: string;
    }>(`${this.base}/soutenances/planification-auto/`, payload);
  }
}

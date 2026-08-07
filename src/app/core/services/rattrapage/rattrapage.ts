import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Rattrapage {
  id: number;
  etudiant: number;
  etudiant_nom: string;
  ue: number;
  ue_code: string;
  ue_libelle: string;
  ue_credits: number;
  ue_est_informatique: boolean;
  ue_tarif: number;
  date: string;
  salle: string | null;
  statut: string;
  frais: number;
  facture_envoyee: boolean;
  preuve_paiement: string | null;
  valide_par_recouvrement: boolean;
  note_obtenue: number | null;
  date_creation: string;
}

export interface RattrapagePending {
  ue_code:          string;
  ue_libelle:       string;
  credits:          number;
  est_informatique: boolean;
  tarif_credit:     number;
  montant:          number;
  id:               number;
}

export interface FacturationPending {
  etudiant_id:   number;
  nom:           string;
  matricule:     string;
  filiere:       string;
  rattrapages:   RattrapagePending[];
  total_estime:  number;
}

export interface FactureResult {
  message:        string;
  nb_rattrapages: number;
  total_fcfa:     number;
}

@Injectable({ providedIn: 'root' })
export class RattrapageService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getRattrapages(): Observable<Rattrapage[]> {
    return this.http.get<Rattrapage[]>(`${this.base}/rattrapages/`);
  }

  creer(data: Partial<Rattrapage>): Observable<Rattrapage> {
    return this.http.post<Rattrapage>(`${this.base}/rattrapages/`, data);
  }

  modifier(id: number, data: Partial<Rattrapage>): Observable<Rattrapage> {
    return this.http.patch<Rattrapage>(`${this.base}/rattrapages/${id}/`, data);
  }

  soumettrePreuve(id: number, fichier: File): Observable<Rattrapage> {
    const form = new FormData();
    form.append('preuve_paiement', fichier);
    return this.http.post<Rattrapage>(`${this.base}/rattrapages/${id}/soumettre-paiement/`, form);
  }

  validerPaiement(id: number): Observable<Rattrapage> {
    return this.http.post<Rattrapage>(`${this.base}/rattrapages/${id}/valider-paiement/`, {});
  }

  autoriser(id: number): Observable<Rattrapage> {
    return this.http.post<Rattrapage>(`${this.base}/rattrapages/${id}/autoriser/`, {});
  }

  verifierAutorisation(etudiantId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/soutenance/verifier-autorisation/${etudiantId}/`);
  }

  getPendingFactures(): Observable<FacturationPending[]> {
    return this.http.get<FacturationPending[]>(`${this.base}/recouvrement/pending/`);
  }

  envoyerFacture(etudiantId: number): Observable<FactureResult> {
    return this.http.post<FactureResult>(`${this.base}/recouvrement/etudiants/${etudiantId}/facturer/`, {});
  }
}

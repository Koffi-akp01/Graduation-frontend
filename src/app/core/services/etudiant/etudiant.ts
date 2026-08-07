import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { EligibiliteStatus, EtudiantProfile } from '../../models/etudiant.model';

export interface MemoireInfo {
  id: number;
  titre: string;
  directeur: string;
  niveau: string;
  version: string;
  pages: number;
  pages_max: number;
  commentaire: string;
  date_depot: string;
  statut: 'en_attente' | 'en_revision' | 'valide' | 'rejete';
  fichier_url?: string;
}

export interface SoutenanceInfo {
  id: number;
  date: string;
  salle: string;
  batiment: string;
  president: string;
  examinateur: string;
  convocation_url?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class EtudiantService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<EtudiantProfile> {
    return this.http.get<EtudiantProfile>(`${this.base}/etudiant/profile/`);
  }

  getEligibilite(): Observable<EligibiliteStatus> {
    return this.http.get<EligibiliteStatus>(`${this.base}/etudiant/eligibilite/`);
  }

  getMemoire(): Observable<MemoireInfo> {
    return this.http.get<MemoireInfo>(`${this.base}/etudiant/memoire/`);
  }

  getSoutenance(): Observable<SoutenanceInfo> {
    return this.http.get<SoutenanceInfo>(`${this.base}/etudiant/soutenance/`);
  }

  getEtudiantsByDirecteur(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/etudiants/directeur/mes-etudiants/`);
  }
}

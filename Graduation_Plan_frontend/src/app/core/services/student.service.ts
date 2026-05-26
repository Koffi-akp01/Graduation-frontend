// src/app/core/services/student.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudentProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  filiere: string;
  niveau: string;
  matricule: string;
  has_paid_fees: boolean;
  ue_validees: number;
  ue_total: number;
}

export interface EtudiantListItem {
  id:            number;
  nom:           string;
  prenom:        string;
  matricule:     string;
  filiere_code:  string;
  filiere_nom:   string;
  has_paid_fees: boolean;
  ue_validees:   number;
  total_ue:      number;
  phase:         number;
  theme_statut:  'PENDING' | 'VALIDATED' | 'REJECTED' | null;
  eligible:      boolean;
}

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
}

export interface SoutenanceInfo {
  id: number;
  date: Date;
  salle: string;
  batiment: string;
  president: string;
  examinateur: string;
}

export interface NoteItem {
  id: number;
  ue_code: string;
  ue_libelle: string;
  note: number | null;
  statut: 'VALIDE' | 'ECHOUE' | 'RATTRAPAGE';
  annee_academique: string;
}

export interface AnneeNotes {
  annee: string;
  notes: NoteItem[];
  nb_validees: number;
  nb_total: number;
}

export interface ReleveNotes {
  etudiant: { nom: string; prenom: string; matricule: string; filiere: string };
  annees: AnneeNotes[];
}

export interface MemoireVersion {
  id: number;
  version: number;
  date_upload: string;
  taille: number;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.apiUrl}/etudiant/profile/`);
  }

  getMemoire(): Observable<MemoireInfo> {
    return this.http.get<MemoireInfo>(`${this.apiUrl}/etudiant/memoire/`);
  }

  getSoutenance(): Observable<SoutenanceInfo> {
    return this.http.get<SoutenanceInfo>(`${this.apiUrl}/etudiant/soutenance/`);
  }

  getEligibilite(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/etudiant/eligibilite/`);
  }

  getVersions(): Observable<MemoireVersion[]> {
    return this.http.get<MemoireVersion[]>(`${this.apiUrl}/etudiant/memoire/versions/`);
  }

  uploadMemoire(file: File): Observable<MemoireVersion> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post<MemoireVersion>(`${this.apiUrl}/etudiant/memoire/upload/`, formData);
  }

  getMesNotes(): Observable<ReleveNotes> {
    return this.http.get<ReleveNotes>(`${this.apiUrl}/etudiant/mes-notes/`);
  }

  getAllEtudiants(): Observable<EtudiantListItem[]> {
    return this.http.get<EtudiantListItem[]>(`${this.apiUrl}/etudiants/`);
  }
}
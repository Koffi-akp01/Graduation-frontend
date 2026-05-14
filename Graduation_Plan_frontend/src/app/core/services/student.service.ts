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
}
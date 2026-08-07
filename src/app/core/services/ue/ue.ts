import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Filiere {
  id: number;
  nom: string;
  code: string;
  niveau: string;
}

export interface UE {
  id: number;
  code_ue: string;
  libelle: string;
  credits_ects: number;
  filiere: number;
}

export interface UEManquantes {
  etudiant: string;
  filiere: string;
  total_ue: number;
  validees: number;
  manquantes: UE[];
}

@Injectable({ providedIn: 'root' })
export class UEService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getFilieres(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>(`${this.base}/filieres/`);
  }

  getUEParFiliere(filiereId: number): Observable<UE[]> {
    return this.http.get<UE[]>(`${this.base}/filieres/${filiereId}/ue/`);
  }

  getUEManquantes(etudiantId: number): Observable<UEManquantes> {
    return this.http.get<UEManquantes>(`${this.base}/etudiants/${etudiantId}/ue-manquantes/`);
  }

  getNotes(etudiantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/etudiants/${etudiantId}/notes/`);
  }
}

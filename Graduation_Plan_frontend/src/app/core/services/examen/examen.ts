import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface DossierExamen {
  id: number;
  etudiant_id: number;
  etudiant_nom: string;
  matricule: string;
  filiere: string;
  niveau: string;
  titre_memoire: string;
  statut: 'PENDING' | 'VALIDATED' | 'REJECTED';
  ue: string;
  paiement: 'PAYE' | 'NON_PAYE';
  anti_ia: 'EN_COURS' | 'VALIDE' | 'SUSPICION' | null;
  score_plagiat: number;
  verifie_plagiat: boolean;
  verifie_ia: boolean;
}

export type NoteStatut = 'VALIDE' | 'ECHOUE' | 'RATTRAPAGE' | 'NON_SAISI';

export interface UeNote {
  ue_id:            number;
  code_ue:          string;
  libelle:          string;
  semestre:         number;
  credits:          number;
  est_informatique: boolean;
  note:             number | null;
  statut:           NoteStatut;
  annee:            string;
}

export interface NotesEtudiant {
  etudiant_id:  number;
  etudiant_nom: string;
  matricule:    string;
  filiere:      string;
  ues:          UeNote[];
}

export interface SaisieNote {
  ue_id: number;
  note:  number;
}

export interface NotifierResult {
  message:     string;
  nb_echouees: number;
  nb_saisies:  number;
}

@Injectable({ providedIn: 'root' })
export class ExamenService {
  constructor(private http: HttpClient) {}

  getDossiersExamen(): Observable<DossierExamen[]> {
    return this.http.get<DossierExamen[]>(`${environment.apiUrl}/themes/dossiers_examen/`);
  }

  updateStatutTheme(id: number, statut: 'VALIDATED' | 'REJECTED', remarques: string): Observable<unknown> {
    return this.http.patch(`${environment.apiUrl}/themes/${id}/`, { statut, remarques_examinateur: remarques });
  }

  verifierAntiPlagiat(themeId: number, data: { verifie_plagiat: boolean; verifie_ia: boolean; commentaire: string }): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/themes/${themeId}/verifier/`, data);
  }

  getNotesEtudiant(etudiantId: number): Observable<NotesEtudiant> {
    return this.http.get<NotesEtudiant>(`${environment.apiUrl}/examen/etudiants/${etudiantId}/notes/`);
  }

  saisirEtNotifier(etudiantId: number, annee: string, notes: SaisieNote[]): Observable<NotifierResult> {
    return this.http.post<NotifierResult>(
      `${environment.apiUrl}/examen/etudiants/${etudiantId}/saisir/`,
      { annee, notes },
    );
  }
}

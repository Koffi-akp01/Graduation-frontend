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
  statut: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'BLOCKED';
  ue: string;
  ue_validees: number;
  total_ue: number;
  paiement: 'PAYE' | 'NON_PAYE';
  anti_ia: 'EN_COURS' | 'VALIDE' | 'SUSPICION' | null;
  score_plagiat: number;
  verifie_plagiat: boolean;
  verifie_ia: boolean;
  examinateur_assigne_id: number | null;
  examinateur_assigne_nom: string | null;
  document_nom: string | null;
  document_url: string | null;
  document_version: number | null;
}

export interface EtudiantDuDirecteur {
  id: number;
  affectation_id: number;
  nom: string;
  prenom: string;
  matricule: string;
}

export interface DirecteurAvecEtudiants {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  etudiants: EtudiantDuDirecteur[];
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

  validerDossier(id: number): Observable<unknown> {
    return this.http.patch(
      `${environment.apiUrl}/themes/${id}/`,
      { statut: 'VALIDATED', remarques_examinateur: 'Dossier conforme — toutes les conditions requises sont remplies.' }
    );
  }

  rejeterDossierAvecMotif(id: number, motif: string): Observable<unknown> {
    return this.http.patch(
      `${environment.apiUrl}/themes/${id}/`,
      { statut: 'REJECTED', remarques_examinateur: motif }
    );
  }

  bloquerDossier(id: number, motif: string): Observable<unknown> {
    return this.http.patch(
      `${environment.apiUrl}/themes/${id}/`,
      { statut: 'BLOCKED', remarques_examinateur: motif }
    );
  }

  debloquerDossier(id: number): Observable<unknown> {
    return this.http.patch(
      `${environment.apiUrl}/themes/${id}/`,
      { statut: 'PENDING', remarques_examinateur: 'Dossier débloqué — retour en vérification.' }
    );
  }

  verifierAntiPlagiat(themeId: number, data: { verifie_plagiat: boolean; verifie_ia: boolean; commentaire: string }): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/themes/${themeId}/verifier/`, data);
  }

  assignerExaminateur(themeId: number, examinateurId: number): Observable<{ detail: string; examinateur_assigne_id: number; examinateur_assigne_nom: string }> {
    return this.http.patch<{ detail: string; examinateur_assigne_id: number; examinateur_assigne_nom: string }>(
      `${environment.apiUrl}/themes/${themeId}/assigner-examinateur/`,
      { examinateur_id: examinateurId },
    );
  }

  getDirecteursAvecEtudiants(): Observable<DirecteurAvecEtudiants[]> {
    return this.http.get<DirecteurAvecEtudiants[]>(`${environment.apiUrl}/directeurs/avec-etudiants/`);
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

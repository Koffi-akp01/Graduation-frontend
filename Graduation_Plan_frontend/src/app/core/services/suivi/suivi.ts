import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type SuiviStatut = 'VERROUILLE' | 'EN_COURS' | 'SOUMIS' | 'EN_REVISION' | 'VALIDE';

export interface SuiviEtape {
  id:                     number;
  ordre:                  number;
  titre:                  string;
  description:            string;
  statut:                 SuiviStatut;
  remarques:              string;
  fichier_url:            string | null;
  fichier_nom:            string;
  fichier_correction_url: string | null;
  fichier_correction_nom: string;
  date_soumission:        string | null;
  date_validation:        string | null;
  valide_par_nom:         string | null;
}

export interface SuiviEtudiant {
  affectation_id: number;
  etudiant_nom:   string;
  matricule:      string;
  nb_etapes:      number;
  nb_validees:    number;
  nb_soumises:    number;
  etapes:         SuiviEtape[];
}

export interface SuiviMemoire {
  affectation_id: number;
  etudiant:       string;
  directeur:      string;
  etapes:         SuiviEtape[];
}

@Injectable({ providedIn: 'root' })
export class SuiviService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSuivi(affectationId: number): Observable<SuiviMemoire> {
    return this.http.get<SuiviMemoire>(`${this.base}/affectations/${affectationId}/suivi/`);
  }

  soumettre(affectationId: number, etapeId: number, fichier: File): Observable<{ message: string; etape: SuiviEtape }> {
    const fd = new FormData();
    fd.append('fichier', fichier);
    return this.http.post<{ message: string; etape: SuiviEtape }>(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/soumettre/`, fd
    );
  }

  getSuiviList(): Observable<SuiviEtudiant[]> {
    return this.http.get<SuiviEtudiant[]>(`${this.base}/directeur/suivi-list/`);
  }

  demanderCorrection(affectationId: number, etapeId: number, remarques: string): Observable<{ message: string; etape: SuiviEtape }> {
    return this.http.post<{ message: string; etape: SuiviEtape }>(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/corriger/`, { remarques }
    );
  }

  valider(affectationId: number, etapeId: number): Observable<{ message: string; prochaine_debloquee: string | null; etape: SuiviEtape }> {
    return this.http.post<{ message: string; prochaine_debloquee: string | null; etape: SuiviEtape }>(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/valider/`, {}
    );
  }

  /** Récupère le document de l'étudiant converti en PDF (pour iframe directeur). */
  getApercuPdf(affectationId: number, etapeId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/apercu/`,
      { responseType: 'blob' }
    );
  }

  /** Télécharge le document Word de l'étudiant pour annotation. */
  getTelechargerWordUrl(affectationId: number, etapeId: number): string {
    return `${this.base}/affectations/${affectationId}/suivi/${etapeId}/telecharger-word/`;
  }

  /** Le directeur dépose son document corrigé. */
  deposerCorrection(affectationId: number, etapeId: number, fichier: File): Observable<{ message: string; etape: SuiviEtape }> {
    const fd = new FormData();
    fd.append('fichier_correction', fichier);
    return this.http.post<{ message: string; etape: SuiviEtape }>(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/deposer-correction/`, fd
    );
  }

  /** Récupère la correction du directeur en PDF (pour téléchargement étudiant). */
  getCorrectionPdf(affectationId: number, etapeId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/correction-pdf/`,
      { responseType: 'blob' }
    );
  }

  /** Le directeur remet une étape VALIDE à EN_COURS. */
  resetEtape(affectationId: number, etapeId: number): Observable<{ message: string; etape: SuiviEtape }> {
    return this.http.post<{ message: string; etape: SuiviEtape }>(
      `${this.base}/affectations/${affectationId}/suivi/${etapeId}/reset/`, {}
    );
  }
}

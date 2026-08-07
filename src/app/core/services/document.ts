import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MemoireVersion {
  id: number;
  version: number;
  fichier: string;
  date_upload: string;
  taille: number;
}

export interface DocumentAnalysable {
  id: number;
  version: number;
  date_upload: string;
  taille: number;
  titre: string;
  etudiant: string;
  statut: 'valide' | 'en_attente' | 'rejete';
  url: string | null;
}

export interface DecisionResultat {
  document_id: number;
  statut: 'valide' | 'en_attente' | 'rejete';
  message: string;
}

export interface HistoriqueEntry {
  id: number;
  utilisateur: string;
  action: string;
  action_label: string;
  details: Record<string, any>;
  date: string;
}

export interface AnalyseMatch {
  doc_id: number;
  titre: string;
  similarite: number;
}

export interface AnalyseResultat {
  document_id: number;
  etudiant: string;
  version: number;
  plagiat: {
    score: number;
    label: string;
    matches: AnalyseMatch[];
  };
  ia: {
    score: number;
    label: string;
    metrics: {
      uniformite_phrases: number;
      formules_ia_detectees: number;
      richesse_vocabulaire_pct: number;
      uniformite_paragraphes: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  uploadMemoire(file: File, _typeDocument: string = 'memoire'): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post(`${this.apiUrl}/etudiant/memoire/upload/`, formData);
  }

  getVersions(): Observable<MemoireVersion[]> {
    return this.http.get<MemoireVersion[]>(`${this.apiUrl}/etudiant/memoire/versions/`);
  }

  getMemoireUrl(id: number): string {
    return `${this.apiUrl}/etudiant/memoire/versions/${id}/fichier/`;
  }

  telechargerFichier(url: string, nomFichier: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objUrl = URL.createObjectURL(blob);
        const a      = document.createElement('a');
        a.href        = objUrl;
        a.download    = nomFichier;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
      },
      error: () => {
        window.open(url, '_blank');
      },
    });
  }

  getDocumentsAnalysables(): Observable<DocumentAnalysable[]> {
    return this.http.get<DocumentAnalysable[]>(`${this.apiUrl}/documents/analysables/`);
  }

  analyserDocument(docId: number): Observable<AnalyseResultat> {
    return this.http.post<AnalyseResultat>(`${this.apiUrl}/documents/${docId}/analyser/`, {});
  }

  decisionDocument(docId: number, action: 'valider' | 'rejeter', motif: string): Observable<DecisionResultat> {
    return this.http.post<DecisionResultat>(`${this.apiUrl}/documents/${docId}/decision/`, { action, motif });
  }

  getHistoriqueDocument(docId: number): Observable<HistoriqueEntry[]> {
    return this.http.get<HistoriqueEntry[]>(`${this.apiUrl}/documents/${docId}/historique/`);
  }

  // ── Archives ─────────────────────────────────────────────────────────
  getArchives(statut?: string): Observable<ArchiveDossier[]> {
    const params = statut ? `?statut=${statut}` : '';
    return this.http.get<ArchiveDossier[]>(`${this.apiUrl}/documents/archives/${params}`);
  }

  getEtudiantsSansArchive(): Observable<EtudiantDisponible[]> {
    return this.http.get<EtudiantDisponible[]>(`${this.apiUrl}/documents/archives/etudiants-disponibles/`);
  }

  creerArchive(payload: FormData): Observable<ArchiveDossier> {
    return this.http.post<ArchiveDossier>(`${this.apiUrl}/documents/archives/creer/`, payload);
  }

  signerPV(archId: number, payload: FormData): Observable<ArchiveDossier> {
    return this.http.patch<ArchiveDossier>(`${this.apiUrl}/documents/archives/${archId}/signer/`, payload);
  }

  signerNumerique(archId: number, role: SignatureRole, password: string): Observable<ArchiveDossier> {
    return this.http.post<ArchiveDossier>(
      `${this.apiUrl}/documents/archives/${archId}/signer-numerique/`,
      { role, password },
    );
  }

  verifierCodePV(code: string): Observable<VerificationPV> {
    return this.http.get<VerificationPV>(`${this.apiUrl}/documents/archives/verifier/${code}/`);
  }

  validerServiceExamen(archId: number, numeroRegistreManuel?: string): Observable<ArchiveDossier> {
    return this.http.post<ArchiveDossier>(
      `${this.apiUrl}/documents/archives/${archId}/valider-examen/`,
      { numero_registre_manuel: numeroRegistreManuel || '' },
    );
  }
}

// ── Interfaces Archives ────────────────────────────────────────────────
export interface EtudiantDisponible {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  filiere: string;
  memoire_depose: boolean;
  memoire_valide: boolean;
}

export interface PVSignatures {
  url: string | null;
  signe_president: boolean;
  signe_examinateur: boolean;
  signe_directeur: boolean;
  signe_directeur_academique: boolean;
}

export interface SoutenanceInfo {
  date: string;
  titre_theme: string;
  president: string;
  examinateur: string;
  directeur: string;
  salle: string;
}

export type SignatureRole = 'PRESIDENT' | 'EXAMINATEUR' | 'DIRECTEUR' | 'DIRECTEUR_ACADEMIQUE';

export interface SignatureEntry {
  role: SignatureRole;
  role_label: string;
  signe: boolean;
  signataire: string | null;
  code_verification: string | null;
  date_signature: string | null;
}

export interface VerificationPV {
  valide: boolean;
  detail?: string;
  code_archive?: string;
  etudiant?: string;
  role?: string;
  signataire?: string;
  date_signature?: string;
}

export interface JuryMembreDetail {
  grade: string;
  etablissement: string;
}

export interface JuryDetails {
  president: JuryMembreDetail;
  examinateur: JuryMembreDetail;
  membre2: JuryMembreDetail & { nom: string };
  directeur: JuryMembreDetail;
}

export interface ArchiveDossier {
  id: number;
  code_archive: string;
  statut: 'EN_ATTENTE' | 'PV_PARTIEL' | 'EN_VALIDATION' | 'ARCHIVE';
  statut_label: string;
  nb_signatures: number;
  etudiant: { id: number; matricule: string; nom: string; prenom: string; filiere: string };
  memoire: { id: number; version: number; url: string | null } | null;
  pv: PVSignatures;
  signatures: SignatureEntry[];
  peut_signer: SignatureRole[];
  note_finale: number | null;
  mention: string;
  commentaire: string | null;
  specialite: string;
  promotion: string;
  ville_soutenance: string;
  jury_details: JuryDetails;
  digne_memoire: boolean | null;
  niveau_scientifique: string;
  niveau_scientifique_label: string;
  rapport_scientifique: string;
  decision_jury: string;
  decision_jury_label: string;
  jury_signatures_completes: boolean;
  valide_service_examen: boolean;
  valide_par_examen: string | null;
  date_validation_examen: string | null;
  numero_registre: string | null;
  date_enregistrement: string | null;
  numero_registre_manuel: string;
  peut_valider_examen: boolean;
  date_archivage: string;
  date_cloture: string | null;
  archive_par: string | null;
  soutenance_info: SoutenanceInfo | null;
}
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
}

export interface DecisionResultat {
  document_id: number;
  statut: 'valide' | 'en_attente' | 'rejete';
  message: string;
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

  getMemoireUrl(_id: number): string {
    return `${this.apiUrl}/etudiant/memoire/versions/`;
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
}

export interface SoutenanceInfo {
  date: string;
  titre_theme: string;
  president: string;
  examinateur: string;
  directeur: string;
  salle: string;
}

export interface ArchiveDossier {
  id: number;
  code_archive: string;
  statut: 'EN_ATTENTE' | 'PV_PARTIEL' | 'ARCHIVE';
  statut_label: string;
  nb_signatures: number;
  etudiant: { id: number; matricule: string; nom: string; prenom: string; filiere: string };
  memoire: { id: number; version: number; url: string | null } | null;
  pv: PVSignatures;
  note_finale: number | null;
  mention: string;
  commentaire: string | null;
  date_archivage: string;
  date_cloture: string | null;
  archive_par: string | null;
  soutenance_info: SoutenanceInfo | null;
}
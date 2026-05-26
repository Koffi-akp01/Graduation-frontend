export interface MembreJury {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  is_doctor: boolean;
  is_internal: boolean;
}

export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  equipements: string;
  est_disponible: boolean;
}

export interface EtudiantSansSoutenance {
  etudiant_id: number;
  theme_id: number;
  nom: string;
  prenom: string;
  matricule: string;
  filiere: string;
  titre_theme: string;
  est_eligible: boolean;
}

export interface Soutenance {
  id?: number;
  etudiant: number;
  etudiant_details?: string;
  filiere?: string;
  theme: number;
  theme_titre?: string;
  salle: number;
  salle_nom?: string;
  date_soutenance: string;
  session: string;
  president: number;
  president_nom?: string;
  examinateur: number;
  examinateur_nom?: string;
  directeur_memoire: number;
  directeur_nom?: string;
  pre_soutenance_validee?: boolean;
  est_cloturee?: boolean;
  lien_meet?: string | null;
}

export interface Evaluation {
  id: number;
  soutenance: number;
  note_presentation: number;
  note_maitrise: number;
  note_memoire: number;
  note_reponses: number;
  note_finale: number;
  mention: string;
  remarques_jury: string;
  est_signe_par_tous: boolean;
  pv_genere?: string | null;
}

export interface StatsSession {
  total_soutenances: number;
  soutenances_cloturees: number;
  moyenne_generale: number | null;
  repartition_mentions: { mention: string; nombre: number }[];
}

export interface SoutenanceForm {
  etudiant: number;
  theme: number;
  directeur_memoire: number;
  president: number;
  examinateur: number;
  salle: number;
  date_soutenance: string;
  session: string;
  lien_meet: string;
}

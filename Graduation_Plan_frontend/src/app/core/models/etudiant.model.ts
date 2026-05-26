export interface EtudiantProfile {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  filiere: string;
  niveau: string;
  photo_url?: string;
  matricule: string;
  has_paid_fees?: boolean;
  current_phase?: number;
  ue_validees_count?: number;
  ue_total?: number;
}

export interface EligibiliteStatus {
  eligible?: boolean;
  ue_validees: boolean;
  frais_payes: boolean;
  theme_valide?: boolean;
  memoire_valide: boolean;
  pre_soutenance_faite?: boolean;
  message_bloquant?: string;
}

export interface EtudiantProfile {
  id: number;
  nom: string;
  prenom: string;
  filiere: string;
  niveau: string;
  photo_url?: string;
  matricule: string;
  current_phase?: number;
}

export interface EligibiliteStatus {
  ue_validees: boolean;
  frais_payes: boolean;
  memoire_valide: boolean;
  pre_soutenance_faite: boolean;
  message_bloquant?: string;
}

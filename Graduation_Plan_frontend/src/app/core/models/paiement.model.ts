export interface Bordereau {
  id: number;
  etudiant?: number;
  etudiant_nom: string;
  numero_bordereau: string;
  banque: string;
  montant: 100000 | 150000;
  image_bordereau: string;
  est_valide: boolean;
  date_depot: string;
}

/** @deprecated Use Bordereau */
export type Paiement = Bordereau;

export interface StatsPaiement {
  total: number;
  valides: number;
  en_attente: number;
}

export interface AlerteImpaye {
  etudiant_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  bordereau_soumis: boolean;
  numero_bordereau: string | null;
  montant: number | null;
  date_soumission: string | null;
}

// ── Scolarité ──────────────────────────────────────────────────────────────

export interface TarifScolarite {
  annee: string;
  annee_label: string;
  scolarite: number;
  inscription: number;
  total: number;
}

export interface EtudiantScolarite {
  etudiant_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  annee_formation: string;
  annee_label: string;
  total_du: number;
  total_paye: number;
  restant: number;
  en_regle: boolean;
  a_engagement: boolean;
  engagement_statut: string | null;
  engagement_id: number | null;
}

export interface PaiementScolarite {
  id: number;
  etudiant_id: number;
  etudiant_nom: string;
  matricule: string;
  montant: number;
  type_paiement: string;
  mode_paiement: string;
  reference: string;
  annee_academique: string;
  date_paiement: string;
  valide_par_nom: string | null;
  remarques: string;
}

export interface EngagementPaiement {
  id: number;
  etudiant_id: number;
  etudiant_nom: string;
  matricule: string;
  montant_total: number;
  frequence: string;
  frequence_label: string;
  date_debut: string;
  date_fin_prevue: string | null;
  annee_academique: string;
  statut: string;
  statut_label: string;
  notes: string;
  date_creation: string;
}

export interface NouveauPaiementForm {
  etudiant_id: number;
  montant: number;
  type_paiement: string;
  mode_paiement: string;
  reference: string;
  annee_academique: string;
  remarques: string;
}

export interface NouvelEngagementForm {
  etudiant_id: number;
  montant_total: number;
  frequence: string;
  date_debut: string;
  date_fin_prevue: string;
  annee_academique: string;
  notes: string;
}

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

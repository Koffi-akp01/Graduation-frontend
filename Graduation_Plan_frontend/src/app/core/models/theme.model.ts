export interface Theme {
  id?: number;
  titre: string;
  description: string;
  domaine: string;
  etudiant_nom?: string;
  directeur_souhaite_id?: number;
  statut?: 'PENDING' | 'VALIDATED' | 'REJECTED';
  remarques_examinateur?: string;
  date_soumission?: string;
}

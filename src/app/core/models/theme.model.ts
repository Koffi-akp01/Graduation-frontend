export interface Theme {
  id?: number;
  titre: string;
  description: string;
  domaine: string;
  etudiant_nom?: string;
  directeur_souhaite_id?: number;
  statut?: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' | 'CORRECTION_DEMANDEE';
  message_feedback?: string;
}

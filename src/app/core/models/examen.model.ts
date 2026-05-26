export interface VerificationMemoire {
  id: number;
  etudiant_nom: string;
  titre_memoire: string;
  score_plagiat: number;
  detecte_IA: boolean;
  statut_conformite: 'VALIDE' | 'REJETE' | 'EN_ATTENTE';
  observations?: string;
}

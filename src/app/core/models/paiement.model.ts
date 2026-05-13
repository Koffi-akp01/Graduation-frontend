export interface Paiement {
  id: number;
  montant: number;
  date_paiement: string;
  type_frais: 'INSCRIPTION' | 'SCOLARITE' | 'SOUTENANCE';
  statut: 'PAYE' | 'IMPAYE' | 'EN_VERIFICATION';
  recu_url?: string;
  etudiant_id: number;
}

export interface StatsPaiement {
  total_attendu: number;
  total_encaisse: number;
  total_impayes: number;
}

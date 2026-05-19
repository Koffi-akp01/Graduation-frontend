export interface AuditLog {
  id: number;
  utilisateur: string;
  action: string;
  date: string;
  ip_address: string;
}

export interface GlobalStats {
  total_etudiants: number;
  soutenances_terminees: number;
  taux_reussite: number;
  total_paiements: number;
}

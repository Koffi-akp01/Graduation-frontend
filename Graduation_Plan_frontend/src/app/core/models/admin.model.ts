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
  total_utilisateurs: number;
  utilisateurs_actifs: number;
}

export interface UserListItem {
  id: number;
  nom: string;
  role: string;
  role_code: string;
  actif: boolean;
}

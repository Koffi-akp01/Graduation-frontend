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
  prenom: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  role_code: string;
  actif: boolean;
  last_login: string | null;
}

export interface CreateUserForm {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  password: string;
}

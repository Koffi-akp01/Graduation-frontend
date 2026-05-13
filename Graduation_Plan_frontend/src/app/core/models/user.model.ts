export type UserRole =
  | 'ETUDIANT'
  | 'DIRECTION'
  | 'EXAMEN'
  | 'DIRECTEUR_MEMOIRE'
  | 'JURY'
  | 'ORGANISATION'
  | 'RECOUVREMENT'
  | 'ADMIN'
  | 'PUBLIC';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

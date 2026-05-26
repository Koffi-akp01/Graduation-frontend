export interface Soutenance {
  id: number;
  etudiant_nom: string;
  theme_titre: string;
  date: string;
  heure: string;
  salle: string;
  jury: {
    president: string;
    examinateur: string;
    rapporteur: string;
  };
  statut: 'PLANIFIE' | 'TERMINE' | 'EN_ATTENTE';
}

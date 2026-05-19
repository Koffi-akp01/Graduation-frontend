import { Component, OnInit, computed, signal } from '@angular/core';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { ExamenService } from '../../../../core/services/examen/examen';

export interface DossierExamen {
  id: number;
  etudiant_nom: string;
  matricule: string;
  niveau: string;
  titre_memoire: string;
  ue: string;
  paiement: 'PAYE' | 'NON_PAYE';
  anti_ia: 'EN_COURS' | 'VALIDE' | 'SUSPICION' | null;
  score_plagiat: number;
}

const MOCK_DOSSIERS: DossierExamen[] = [
  {
    id: 1,
    etudiant_nom: 'Ama Koffi',
    matricule: 'M2-INFO-2025',
    niveau: 'Master 2',
    titre_memoire: "Détection d'intrusions ML",
    ue: '14/15',
    paiement: 'PAYE',
    anti_ia: 'EN_COURS',
    score_plagiat: 12,
  },
  {
    id: 2,
    etudiant_nom: 'Kofi Asante',
    matricule: 'M2-INFO-2025',
    niveau: 'Master 2',
    titre_memoire: 'Blockchain & sécurité des données',
    ue: '15/15',
    paiement: 'PAYE',
    anti_ia: 'VALIDE',
    score_plagiat: 3,
  },
  {
    id: 3,
    etudiant_nom: 'Abena Mensah',
    matricule: 'L3-MATH-2025',
    niveau: 'Licence 3',
    titre_memoire: 'Optimisation des réseaux de transport',
    ue: '14/14',
    paiement: 'NON_PAYE',
    anti_ia: null,
    score_plagiat: 0,
  },
  {
    id: 4,
    etudiant_nom: 'Yaw Boateng',
    matricule: 'M1-GESTION-2025',
    niveau: 'Master 1',
    titre_memoire: 'Finance islamique et PME',
    ue: '12/12',
    paiement: 'PAYE',
    anti_ia: 'SUSPICION',
    score_plagiat: 38,
  },
];

@Component({
  selector: 'app-examen-check',
  imports: [TopNav],
  templateUrl: './examen-check.html',
  styleUrl: './examen-check.scss',
})
export class ExamenCheckComponent implements OnInit {
  dossiers        = signal<DossierExamen[]>(MOCK_DOSSIERS);
  searchTerm      = signal('');
  niveauFilter    = signal('');
  selectedDossier = signal<DossierExamen | null>(null);

  filteredDossiers = computed(() => {
    const q = this.searchTerm().toLowerCase();
    const n = this.niveauFilter();
    return this.dossiers().filter((d) => {
      const matchSearch =
        !q ||
        d.etudiant_nom.toLowerCase().includes(q) ||
        d.matricule.toLowerCase().includes(q);
      const matchNiveau = !n || d.niveau.includes(n);
      return matchSearch && matchNiveau;
    });
  });

  stats = computed(() => ({
    total:     87,
    enAttente: 24,
    valides:   58,
    rejetes:    5,
  }));

  constructor(private examenService: ExamenService) {}

  ngOnInit(): void {
    this.examenService.getMemoiresEnAttente().subscribe({
      next: () => {},
      error: () => {},
    });
  }

  actionLabel(d: DossierExamen): string {
    if (d.paiement === 'NON_PAYE')    return 'Bloquer';
    if (d.anti_ia === 'SUSPICION')    return 'Rejeter';
    if (d.anti_ia === 'VALIDE')       return 'Valider';
    return 'Vérifier';
  }

  doAction(d: DossierExamen): void {
    this.selectedDossier.set(d);
  }

  retourListe(): void {
    this.selectedDossier.set(null);
  }

  validerTechnique(id: number, decision: 'VALIDE' | 'REJETE'): void {
    const note =
      decision === 'REJETE'
        ? (prompt('Motif du rejet :') ?? '')
        : 'Conforme aux attentes.';
    if (!note) return;
    this.examenService
      .updateConformite(id, { statut: decision, observations: note })
      .subscribe(() => this.selectedDossier.set(null));
  }
}

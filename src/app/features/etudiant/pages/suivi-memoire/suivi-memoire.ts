import { Component, OnInit, signal } from '@angular/core';
import { DatePipe }                  from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav }             from '../../../../core/components/top-nav/top-nav';
import { AuthService }        from '../../../../core/services/auth/auth';
import { AffectationService, Affectation } from '../../../../core/services/affectation/affectation';
import { SuiviService, SuiviMemoire } from '../../../../core/services/suivi/suivi';

@Component({
  selector: 'app-etudiant-suivi-memoire',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TopNav, FormsModule, DatePipe],
  templateUrl: './suivi-memoire.html',
  styleUrls: ['./suivi-memoire.scss'],
})
export class EtudiantSuiviMemoireComponent implements OnInit {
  suivi            = signal<SuiviMemoire | null>(null);
  affectationId    = signal<number | null>(null);
  isLoading        = signal(true);
  errorMsg         = signal('');
  suiviInProgress  = signal<number | null>(null);
  successMsg       = signal('');

  prenom = signal('');
  nom    = signal('');

  constructor(
    private suiviService: SuiviService,
    private affectationService: AffectationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const u = this.authService.currentUser();
    this.prenom.set(u?.first_name ?? '');
    this.nom.set(u?.last_name ?? '');
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.affectationService.getAffectations().subscribe({
      next: (affs: Affectation[]) => {
        const accepted = affs.find(a => a.statut === 'ACCEPTE');
        if (!accepted) {
          this.errorMsg.set('Aucune affectation active trouvée. Veuillez d\'abord choisir un directeur.');
          this.isLoading.set(false);
          return;
        }
        this.affectationId.set(accepted.id);
        this.suiviService.getSuivi(accepted.id).subscribe({
          next:  data => { this.suivi.set(data); this.isLoading.set(false); },
          error: ()   => { this.errorMsg.set('Impossible de charger le suivi.'); this.isLoading.set(false); },
        });
      },
      error: () => { this.errorMsg.set('Erreur lors du chargement.'); this.isLoading.set(false); },
    });
  }

  // etapeId en attente de sélection de fichier
  etapeEnAttenteFichier = signal<number | null>(null);

  demanderFichier(etapeId: number): void {
    this.etapeEnAttenteFichier.set(etapeId);
  }

  annulerFichier(): void {
    this.etapeEnAttenteFichier.set(null);
  }

  onFichierChange(event: Event, etapeId: number): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;
    const affId = this.affectationId();
    if (!affId) return;
    this.suiviInProgress.set(etapeId);
    this.etapeEnAttenteFichier.set(null);
    this.successMsg.set('');
    this.suiviService.soumettre(affId, etapeId, fichier).subscribe({
      next: () => {
        this.successMsg.set('Document soumis au directeur.');
        this.suiviInProgress.set(null);
        this.charger();
      },
      error: () => { this.errorMsg.set('Erreur lors de la soumission.'); this.suiviInProgress.set(null); },
    });
  }

  telechargerCorrection(etapeId: number, nom: string): void {
    const affId = this.affectationId();
    if (!affId) return;
    this.suiviService.getCorrectionPdf(affId, etapeId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = nom ? nom.replace(/\.(docx?|doc)$/i, '_corrige.pdf') : `correction_etape_${etapeId}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.errorMsg.set('Impossible de télécharger la correction.'),
    });
  }

  get initiales(): string {
    const p = this.prenom();
    const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'ET';
  }

  get nbEtapesValidees(): number {
    return this.suivi()?.etapes.filter(e => e.statut === 'VALIDE').length ?? 0;
  }

  get progressPercent(): number {
    const s = this.suivi();
    if (!s || s.etapes.length === 0) return 0;
    return Math.round((this.nbEtapesValidees / s.etapes.length) * 100);
  }

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      VERROUILLE:  'etape-locked',
      EN_COURS:    'etape-active',
      SOUMIS:      'etape-soumis',
      EN_REVISION: 'etape-revision',
      VALIDE:      'etape-valide',
    };
    return map[statut] ?? '';
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      VERROUILLE:  '🔒 Verrouillé',
      EN_COURS:    '✏️ En cours',
      SOUMIS:      '📤 Soumis au directeur',
      EN_REVISION: '🔄 Correction demandée',
      VALIDE:      '✅ Validé',
    };
    return map[statut] ?? statut;
  }
}

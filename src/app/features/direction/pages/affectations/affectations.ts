import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AffectationService, Affectation, Directeur } from '../../../../core/services/affectation/affectation';

@Component({
  selector: 'app-affectations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './affectations.html',
  styleUrls: ['./affectations.scss'],
})
export class AffectationsComponent implements OnInit {
  affectations     = signal<Affectation[]>([]);
  directeurs       = signal<Directeur[]>([]);
  isLoading        = signal(false);
  errorMsg         = signal('');
  successMsg       = signal('');
  actionInProgress = signal<number | null>(null);

  reattributionFor   = signal<number | null>(null);
  nouveauDirecteurId = 0;
  motifReattribution = '';

  private _msgTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private affectationService: AffectationService) {}

  ngOnInit(): void {
    this.charger();
    this.affectationService.getDirecteurs().subscribe({
      next: data => this.directeurs.set(data),
    });
  }

  charger(): void {
    this.isLoading.set(true);
    this.affectationService.getAffectations().subscribe({
      next:  (data) => { this.affectations.set(data); this.isLoading.set(false); },
      error: ()     => { this.showError('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  enAttente(): Affectation[] {
    return this.affectations().filter(a => a.statut === 'EN_ATTENTE');
  }

  traitees(): Affectation[] {
    return this.affectations().filter(a => a.statut !== 'EN_ATTENTE');
  }

  accepter(id: number): void {
    this.fermerReattribution();
    this.actionInProgress.set(id);
    this.affectationService.accepter(id).subscribe({
      next:  () => { this.showSuccess('Affectation acceptée.'); this.charger(); this.actionInProgress.set(null); },
      error: () => { this.showError('Erreur lors de l\'acceptation.'); this.actionInProgress.set(null); },
    });
  }

  ouvrirReattribution(id: number): void {
    this.reattributionFor.set(this.reattributionFor() === id ? null : id);
    this.nouveauDirecteurId = 0;
    this.motifReattribution = '';
    this.errorMsg.set('');
  }

  fermerReattribution(): void {
    this.reattributionFor.set(null);
    this.nouveauDirecteurId = 0;
    this.motifReattribution = '';
  }

  soumettrReattribution(affId: number): void {
    if (!this.nouveauDirecteurId) {
      this.showError('Veuillez sélectionner un nouveau directeur.'); return;
    }
    if (!this.motifReattribution.trim()) {
      this.showError('Veuillez saisir le motif de réattribution.'); return;
    }
    this.actionInProgress.set(affId);
    this.affectationService.reattribuer(affId, this.nouveauDirecteurId, this.motifReattribution).subscribe({
      next: () => {
        this.showSuccess('Directeur réattribué. L\'étudiant et le nouveau directeur ont été notifiés.');
        this.fermerReattribution();
        this.charger();
        this.actionInProgress.set(null);
      },
      error: (err) => {
        this.showError(err?.error?.detail ?? 'Erreur lors de la réattribution.');
        this.actionInProgress.set(null);
      },
    });
  }

  directeurNom(d: Directeur): string {
    return `${d.prenom} ${d.nom}${d.is_internal ? '' : ' (Externe)'}`;
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    this.errorMsg.set('');
    this.scheduleClr();
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    this.successMsg.set('');
    this.scheduleClr();
  }

  private scheduleClr(): void {
    if (this._msgTimer) clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => { this.successMsg.set(''); this.errorMsg.set(''); }, 5000);
  }
}

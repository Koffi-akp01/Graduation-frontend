import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AffectationService, Affectation } from '../../../../core/services/affectation/affectation';

@Component({
  selector: 'app-affectations',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './affectations.html',
  styleUrls: ['./affectations.scss'],
})
export class AffectationsComponent implements OnInit {
  affectations  = signal<Affectation[]>([]);
  isLoading     = signal(false);
  errorMsg      = signal('');
  successMsg    = signal('');

  motifRefus    = '';
  actionInProgress = signal<number | null>(null);

  constructor(private affectationService: AffectationService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.affectationService.getAffectations().subscribe({
      next: (data) => { this.affectations.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  enAttente(): Affectation[] {
    return this.affectations().filter(a => a.statut === 'EN_ATTENTE');
  }

  traitees(): Affectation[] {
    return this.affectations().filter(a => a.statut !== 'EN_ATTENTE');
  }

  accepter(id: number): void {
    this.actionInProgress.set(id);
    this.affectationService.decider(id, 'ACCEPTE').subscribe({
      next: () => { this.successMsg.set('Affectation acceptée.'); this.charger(); this.actionInProgress.set(null); },
      error: () => { this.errorMsg.set('Erreur.'); this.actionInProgress.set(null); },
    });
  }

  refuser(id: number): void {
    if (!this.motifRefus.trim()) { this.errorMsg.set('Veuillez saisir un motif de refus.'); return; }
    this.actionInProgress.set(id);
    this.affectationService.decider(id, 'REFUSE', this.motifRefus).subscribe({
      next: () => { this.successMsg.set('Demande refusée.'); this.motifRefus = ''; this.charger(); this.actionInProgress.set(null); },
      error: () => { this.errorMsg.set('Erreur.'); this.actionInProgress.set(null); },
    });
  }
}

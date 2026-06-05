import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AffectationService, Affectation, Directeur } from '../../../../core/services/affectation/affectation';

@Component({
  selector: 'app-choisir-directeur',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './choisir-directeur.html',
  styleUrls: ['./choisir-directeur.scss'],
})
export class ChoisirDirecteurComponent implements OnInit {
  directeurs      = signal<Directeur[]>([]);
  affectations    = signal<Affectation[]>([]);
  isLoading       = signal(false);
  isSubmitting    = signal(false);
  successMsg      = signal('');
  errorMsg        = signal('');

  constructor(private affectationService: AffectationService) {}

  ngOnInit(): void {
    this.isLoading.set(true);
    this.affectationService.getDirecteurs().subscribe({
      next: (d) => { this.directeurs.set(d); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Impossible de charger la liste des directeurs.'); this.isLoading.set(false); },
    });
    this.affectationService.getAffectations().subscribe({
      next: (a) => this.affectations.set(a),
    });
  }

  demandeEnAttente(): Affectation | undefined {
    return this.affectations().find(a => a.statut === 'EN_ATTENTE');
  }

  affectationAcceptee(): Affectation | undefined {
    return this.affectations().find(a => a.statut === 'ACCEPTE');
  }

  demanderAffectation(directeurId: number): void {
    if (this.demandeEnAttente()) {
      this.errorMsg.set('Vous avez déjà une demande en attente.');
      return;
    }
    this.isSubmitting.set(true);
    this.errorMsg.set('');
    this.affectationService.demanderAffectation(directeurId).subscribe({
      next: (a) => {
        this.affectations.update(list => [...list, a]);
        this.successMsg.set(`Demande envoyée à ${a.directeur_nom}. En attente de validation.`);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.detail || 'Erreur lors de la demande.');
        this.isSubmitting.set(false);
      },
    });
  }
}

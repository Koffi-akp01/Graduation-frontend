import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  RattrapageService, Rattrapage, FacturationPending,
} from '../../../../core/services/rattrapage/rattrapage';

type Tab = 'facturation' | 'validation' | 'historique';

@Component({
  selector: 'app-rattrapage-recouvrement',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './rattrapage-recouvrement.html',
  styleUrls: ['./rattrapage-recouvrement.scss'],
})
export class RattrapageRecouvrementComponent implements OnInit {
  // ── Tab ──────────────────────────────────────────────────────────────
  activeTab = signal<Tab>('facturation');

  // ── Facturation ───────────────────────────────────────────────────────
  pendingFactures   = signal<FacturationPending[]>([]);
  facturesLoading   = signal(false);
  factureInProgress = signal<number | null>(null);

  // ── Validation paiements ─────────────────────────────────────────────
  rattrapages = signal<Rattrapage[]>([]);
  isLoading   = signal(false);
  inProgress  = signal<number | null>(null);

  // ── Messages partagés ────────────────────────────────────────────────
  successMsg = signal('');
  errorMsg   = signal('');

  constructor(private rattrapageService: RattrapageService) {}

  ngOnInit(): void {
    this.chargerFactures();
    this.charger();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.successMsg.set('');
    this.errorMsg.set('');
  }

  // ── Facturation ───────────────────────────────────────────────────────

  chargerFactures(): void {
    this.facturesLoading.set(true);
    this.rattrapageService.getPendingFactures().subscribe({
      next: (data) => { this.pendingFactures.set(data); this.facturesLoading.set(false); },
      error: () => { this.facturesLoading.set(false); },
    });
  }

  envoyerFacture(etudiantId: number): void {
    this.factureInProgress.set(etudiantId);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.rattrapageService.envoyerFacture(etudiantId).subscribe({
      next: (res) => {
        this.successMsg.set(`Facture envoyée — ${res.total_fcfa.toLocaleString('fr-FR')} FCFA pour ${res.nb_rattrapages} UE(s).`);
        this.factureInProgress.set(null);
        this.chargerFactures();
        this.charger();
      },
      error: () => {
        this.errorMsg.set('Erreur lors de l\'envoi de la facture.');
        this.factureInProgress.set(null);
      },
    });
  }

  // ── Validation paiements ─────────────────────────────────────────────

  charger(): void {
    this.isLoading.set(true);
    this.rattrapageService.getRattrapages().subscribe({
      next: (data) => { this.rattrapages.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  aValider(): Rattrapage[] {
    return this.rattrapages().filter(r => r.statut === 'PAIEMENT_SOUMIS' && !r.valide_par_recouvrement);
  }

  historique(): Rattrapage[] {
    return this.rattrapages().filter(r => r.valide_par_recouvrement);
  }

  valider(id: number): void {
    this.inProgress.set(id);
    this.rattrapageService.validerPaiement(id).subscribe({
      next: () => { this.successMsg.set('Paiement validé.'); this.charger(); this.inProgress.set(null); },
      error: () => { this.errorMsg.set('Erreur lors de la validation.'); this.inProgress.set(null); },
    });
  }
}

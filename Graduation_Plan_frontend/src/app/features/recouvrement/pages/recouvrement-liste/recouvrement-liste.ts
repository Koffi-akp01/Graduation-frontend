import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AlerteImpaye, Bordereau, StatsPaiement } from '../../../../core/models/paiement.model';
import { PaiementService } from '../../../../core/services/paiement/paiement';

export type RecouvrementVue = 'bordereaux' | 'alertes' | 'rapport';

@Component({
  selector: 'app-recouvrement-liste',
  imports: [CommonModule, TopNav],
  templateUrl: './recouvrement-liste.html',
  styleUrl: './recouvrement-liste.scss',
})
export class RecouvrementListeComponent implements OnInit {
  vue = signal<RecouvrementVue>('bordereaux');
  bordereaux = signal<Bordereau[]>([]);
  alertes = signal<AlerteImpaye[]>([]);
  stats = signal<StatsPaiement | null>(null);

  totalEncaisse = computed(() =>
    this.bordereaux()
      .filter((b) => b.est_valide)
      .reduce((sum, b) => sum + b.montant, 0),
  );

  totalEnAttente = computed(() =>
    this.bordereaux()
      .filter((b) => !b.est_valide)
      .reduce((sum, b) => sum + b.montant, 0),
  );

  bordereauValides = computed(() => this.bordereaux().filter((b) => b.est_valide));

  constructor(private paiementService: PaiementService) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.paiementService.getAllBordereaux().subscribe((data) => this.bordereaux.set(data));
    this.paiementService.getStats().subscribe((s) => this.stats.set(s));
    this.paiementService.getAlertes().subscribe((a) => this.alertes.set(a));
  }

  afficherVue(v: RecouvrementVue): void {
    this.vue.set(v);
  }

  confirmerPaiement(id: number): void {
    if (confirm("Confirmez-vous la réception des fonds ? Cela débloquera l'éligibilité de l'étudiant.")) {
      this.paiementService.validerBordereau(id).subscribe(() => this.chargerDonnees());
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import { Paiement, StatsPaiement } from '../../../../core/models/paiement.model';
import { PaiementService } from '../../../../core/services/paiement/paiement';

@Component({
  selector: 'app-recouvrement-liste',
  imports: [CommonModule],
  templateUrl: './recouvrement-liste.html',
  styleUrl: './recouvrement-liste.scss',
})
export class RecouvrementListeComponent implements OnInit {
  paiements = signal<Paiement[]>([]);
  stats = signal<StatsPaiement | null>(null);

  constructor(private paiementService: PaiementService) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.paiementService.getAllPaiements({ statut: 'EN_VERIFICATION' }).subscribe((data) => {
      this.paiements.set(data);
    });
    this.paiementService.getStats().subscribe((stats) => this.stats.set(stats));
  }

  confirmerPaiement(id: number): void {
    if (confirm("Confirmez-vous la reception des fonds ? Cela debloquera l'eligibilite de l'etudiant.")) {
      this.paiementService.validerPaiement(id).subscribe(() => this.chargerDonnees());
    }
  }
}

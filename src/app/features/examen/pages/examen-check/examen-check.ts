import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import { ExamenService } from '../../../../core/services/examen/examen';

@Component({
  selector: 'app-examen-check',
  imports: [CommonModule],
  templateUrl: './examen-check.html',
  styleUrl: './examen-check.scss',
})
export class ExamenCheckComponent implements OnInit {
  memoiresAverifier = signal<any[]>([]);

  constructor(private examenService: ExamenService) {}

  ngOnInit(): void {
    this.chargerMemoires();
  }

  chargerMemoires(): void {
    this.examenService.getMemoiresEnAttente().subscribe((data) => {
      this.memoiresAverifier.set(data);
    });
  }

  validerTechnique(id: number, decision: 'VALIDE' | 'REJETE'): void {
    const note = decision === 'REJETE' ? prompt('Motif du rejet :') : 'Conforme aux attentes.';
    if (note) {
      this.examenService
        .updateConformite(id, { statut: decision, observations: note })
        .subscribe(() => this.chargerMemoires());
    }
  }
}

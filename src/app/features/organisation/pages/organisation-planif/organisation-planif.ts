import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { PlanificationService } from '../../../../core/services/planification/planification';

@Component({
  selector: 'app-organisation-planif',
  imports: [CommonModule, RouterLink, TopNav],
  templateUrl: './organisation-planif.html',
  styleUrl: './organisation-planif.scss',
})
export class OrganisationPlanifComponent {
  isProcessing = signal(false);
  generationSuccess = signal(false);

  constructor(private planifService: PlanificationService) {}

  lancerAlgorithme(): void {
    this.isProcessing.set(true);
    const params = { date_debut: '2026-06-01', date_fin: '2026-06-15' };

    this.planifService.genererPlanningAuto(params).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.generationSuccess.set(true);
      },
      error: () => this.isProcessing.set(false),
    });
  }
}

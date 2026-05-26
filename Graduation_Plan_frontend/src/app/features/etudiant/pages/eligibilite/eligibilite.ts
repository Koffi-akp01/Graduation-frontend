import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { EligibiliteStatus } from '../../../../core/models/etudiant.model';
import { EtudiantService } from '../../../../core/services/etudiant/etudiant';

@Component({
  selector: 'app-eligibilite',
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './eligibilite.html',
  styleUrl: './eligibilite.scss',
})
export class EligibiliteComponent implements OnInit {
  status = signal<EligibiliteStatus | null>(null);
  isLoading = signal<boolean>(true);

  constructor(private etudiantService: EtudiantService) {}

  ngOnInit(): void {
    this.etudiantService.getEligibilite().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

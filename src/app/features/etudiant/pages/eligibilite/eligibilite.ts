import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { interval } from 'rxjs';

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
  status    = signal<EligibiliteStatus | null>(null);
  isLoading = signal<boolean>(true);
  lastRefreshed = signal<string>('');

  private destroyRef = inject(DestroyRef);

  constructor(private etudiantService: EtudiantService) {}

  charger(): void {
    this.isLoading.set(true);
    this.etudiantService.getEligibilite().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
        this.lastRefreshed.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnInit(): void {
    this.charger();
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.charger());
  }
}

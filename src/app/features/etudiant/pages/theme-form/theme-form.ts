import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../../../../core/services/theme/theme';
import { Theme } from '../../../../core/models/theme.model';
import { TopNav } from '../../../../core/components/top-nav/top-nav';

@Component({
  selector: 'app-theme-form',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './theme-form.html',
  styleUrl: './theme-form.scss',
})
export class ThemeFormComponent implements OnInit {
  private themeService = inject(ThemeService);

  themes = signal<Theme[]>([]);
  isLoading = signal(true);
  errorMsg = signal('');

  readonly domaineLabels: Record<string, string> = {
    GL: 'Génie Logiciel', ASSR: 'Réseaux & Sécurité', DATA: 'Data Science',
    IA: 'Intelligence Artificielle', BLOCKCHAIN: 'Blockchain & Web3',
    IOT: 'Internet des Objets', MOBILE: 'Développement Mobile',
    CLOUD: 'Cloud Computing', CYBER: 'Cybersécurité',
    SID: "Systèmes d'Information", AUTRE: 'Autre',
  };

  ngOnInit(): void {
    this.themeService.getAllThemes().subscribe({
      next: (data: Theme[]) => { this.themes.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Impossible de charger vos thèmes.'); this.isLoading.set(false); },
    });
  }

  statutBadge(statut: string): string {
    const map: Record<string, string> = {
      VALIDATED: 'badge-success', REJECTED: 'badge-danger', PENDING: 'badge-warn',
    };
    return map[statut] ?? 'badge-warn';
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      VALIDATED: 'Validé', REJECTED: 'Corrigé / Rejeté', PENDING: 'En attente',
    };
    return map[statut] ?? statut;
  }

  domaineLabel(domaine: string): string {
    return this.domaineLabels[domaine] ?? domaine;
  }
}

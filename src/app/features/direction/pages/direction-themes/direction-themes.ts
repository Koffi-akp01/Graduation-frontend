import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import { Theme } from '../../../../core/models/theme.model';
import { ThemeService } from '../../../../core/services/theme/theme';

@Component({
  selector: 'app-direction-themes',
  imports: [CommonModule],
  templateUrl: './direction-themes.html',
  styleUrl: './direction-themes.scss',
})
export class DirectionThemesComponent implements OnInit {
  themesEnAttente = signal<Theme[]>([]);

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.chargerThemes();
  }

  chargerThemes(): void {
    this.themeService.getAllThemes().subscribe((data) => {
      this.themesEnAttente.set(data.filter((theme) => theme.statut === 'EN_ATTENTE'));
    });
  }

  valider(id: number): void {
    this.themeService.updateTheme(id, { statut: 'ACCEPTE' }).subscribe(() => this.chargerThemes());
  }

  demanderCorrection(id: number): void {
    const feedback = prompt('Quel est le motif de la correction ?');
    if (feedback) {
      this.themeService
        .updateTheme(id, {
          statut: 'CORRECTION_DEMANDEE',
          message_feedback: feedback,
        })
        .subscribe(() => this.chargerThemes());
    }
  }
}

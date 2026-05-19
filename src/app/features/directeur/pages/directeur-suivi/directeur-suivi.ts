import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { EtudiantService } from '../../../../core/services/etudiant/etudiant';
import { ThemeService } from '../../../../core/services/theme/theme';

@Component({
  selector: 'app-directeur-suivi',
  standalone: true,
  imports: [CommonModule, TopNav],
  templateUrl: './directeur-suivi.html',
  styleUrls: ['./directeur-suivi.scss'],  // ← styleUrl → styleUrls (tableau)
})
export class DirecteurSuiviComponent implements OnInit {
  mesEtudiants = signal<any[]>([]);

  constructor(
    private etudiantService: EtudiantService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.chargerMesEtudiants();
  }

  chargerMesEtudiants(): void {
    this.etudiantService.getEtudiantsByDirecteur().subscribe((data) => {
      this.mesEtudiants.set(data);
    });
  }

  validerVersionFinale(themeId: number): void {
    if (confirm('Confirmez-vous que le memoire est pret pour la soutenance ?')) {
      this.themeService.updateTheme(themeId, { statut: 'ACCEPTE' }).subscribe(() => {
        this.chargerMesEtudiants();
      });
    }
  }
}
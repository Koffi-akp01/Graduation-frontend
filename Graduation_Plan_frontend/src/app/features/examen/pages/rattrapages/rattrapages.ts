import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { RattrapageService, Rattrapage } from '../../../../core/services/rattrapage/rattrapage';
import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-rattrapages',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './rattrapages.html',
  styleUrls: ['./rattrapages.scss'],
})
export class RattrapagesComponent implements OnInit {
  rattrapages   = signal<Rattrapage[]>([]);
  isLoading     = signal(false);
  successMsg    = signal('');
  errorMsg      = signal('');
  role          = signal('');

  showForm = false;
  form = { etudiant: 0, ue: 0, date: '', salle: '', frais: 5000 };

  constructor(
    private rattrapageService: RattrapageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.role.set(user?.role || '');
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.rattrapageService.getRattrapages().subscribe({
      next: (data) => { this.rattrapages.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  creer(): void {
    this.rattrapageService.creer(this.form).subscribe({
      next: (r) => {
        this.rattrapages.update(list => [r, ...list]);
        this.successMsg.set('Rattrapage créé.');
        this.showForm = false;
        this.form = { etudiant: 0, ue: 0, date: '', salle: '', frais: 5000 };
      },
      error: (err) => this.errorMsg.set(err?.error?.detail || 'Erreur création.'),
    });
  }

  autoriser(id: number): void {
    this.rattrapageService.autoriser(id).subscribe({
      next: () => { this.successMsg.set('Étudiant autorisé.'); this.charger(); },
      error: () => this.errorMsg.set('Erreur.'),
    });
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      PROGRAMME: 'Programmé', EN_ATTENTE_PAIEMENT: 'Attente paiement',
      PAIEMENT_SOUMIS: 'Paiement soumis', AUTORISE: 'Autorisé',
      PASSE: 'Passé', ANNULE: 'Annulé',
    };
    return map[statut] || statut;
  }
}

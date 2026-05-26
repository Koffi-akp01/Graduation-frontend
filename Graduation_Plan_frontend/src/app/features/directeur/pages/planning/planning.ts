import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { TopNav }       from '../../../../core/components/top-nav/top-nav';
import { ChatService, RendezVous } from '../../../../core/services/chat/chat';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNav],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit {
  rendezVous = signal<RendezVous[]>([]);
  isLoading  = signal(false);
  errorMsg   = signal('');
  successMsg = signal('');

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.chatService.getPlanning().subscribe({
      next: rdvs => { this.rendezVous.set(rdvs); this.isLoading.set(false); },
      error: ()  => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  prochains(): RendezVous[] {
    const now = new Date().toISOString();
    return this.rendezVous().filter(r => r.statut === 'CONFIRME' && r.date_heure > now);
  }

  aValider(): RendezVous[] {
    return this.rendezVous().filter(r => r.statut === 'PROPOSE');
  }

  historique(): RendezVous[] {
    const now = new Date().toISOString();
    return this.rendezVous().filter(r =>
      r.statut === 'ANNULE' || r.statut === 'PASSE' ||
      (r.statut === 'CONFIRME' && r.date_heure < now)
    );
  }

  confirmer(id: number): void {
    this.chatService.deciderRendezVous(id, 'CONFIRME').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous confirmé.');
      },
      error: () => this.errorMsg.set('Erreur.'),
    });
  }

  annuler(id: number): void {
    this.chatService.deciderRendezVous(id, 'ANNULE').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous annulé.');
      },
      error: () => this.errorMsg.set('Erreur.'),
    });
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      PROPOSE: 'Proposé', CONFIRME: 'Confirmé', ANNULE: 'Annulé', PASSE: 'Passé',
    };
    return map[s] ?? s;
  }
}

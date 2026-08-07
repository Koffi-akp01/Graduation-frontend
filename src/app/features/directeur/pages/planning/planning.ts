import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { ChatService, RendezVous } from '../../../../core/services/chat/chat';
import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit {
  rendezVous = signal<RendezVous[]>([]);
  isLoading  = signal(false);
  errorMsg   = signal('');
  successMsg = signal('');

  prenom = signal('');
  nom    = signal('');

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const u = this.authService.currentUser();
    this.prenom.set(u?.first_name ?? '');
    this.nom.set(u?.last_name ?? '');
    this.charger();
  }

  get initiales(): string {
    const p = this.prenom(); const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'DM';
  }

  charger(): void {
    this.isLoading.set(true);
    this.chatService.getPlanning().subscribe({
      next: rdvs => { this.rendezVous.set(rdvs); this.isLoading.set(false); },
      error: ()  => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  aValider(): RendezVous[] {
    return this.rendezVous().filter(r => r.statut === 'PROPOSE');
  }

  prochains(): RendezVous[] {
    const now = new Date().toISOString();
    return this.rendezVous().filter(r => r.statut === 'CONFIRME' && r.date_heure > now);
  }

  historique(): RendezVous[] {
    const now = new Date().toISOString();
    return this.rendezVous().filter(r =>
      r.statut === 'ANNULE' || r.statut === 'PASSE' ||
      (r.statut === 'CONFIRME' && r.date_heure < now)
    );
  }

  confirmer(id: number): void {
    this.successMsg.set('');
    this.chatService.deciderRendezVous(id, 'CONFIRME').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous confirmé. L\'étudiant est notifié.');
      },
      error: () => this.errorMsg.set('Erreur lors de la confirmation.'),
    });
  }

  annuler(id: number): void {
    this.successMsg.set('');
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
      PROPOSE:  '⏳ Proposé',
      CONFIRME: '✅ Confirmé',
      ANNULE:   '❌ Annulé',
      PASSE:    '🗓 Passé',
    };
    return map[s] ?? s;
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      PROPOSE: 'badge-pending', CONFIRME: 'badge-success',
      ANNULE:  'badge-danger',  PASSE:    'badge-neutral',
    };
    return map[s] ?? 'badge-neutral';
  }
}

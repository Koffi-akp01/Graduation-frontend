import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

import { TopNav }              from '../../../../core/components/top-nav/top-nav';
import { AuthService }         from '../../../../core/services/auth/auth';
import { AffectationService, Affectation } from '../../../../core/services/affectation/affectation';
import { ChatService, ChatMessage, RendezVous, RendezVousForm } from '../../../../core/services/chat/chat';

@Component({
  selector: 'app-etudiant-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './etudiant-chat.html',
  styleUrls: ['./etudiant-chat.scss'],
})
export class EtudiantChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private affSvc  = inject(AffectationService);
  private chatSvc = inject(ChatService);
  private authSvc = inject(AuthService);

  affectation   = signal<Affectation | null>(null);
  messages      = signal<ChatMessage[]>([]);
  rendezVous    = signal<RendezVous[]>([]);
  isLoadingAff  = signal(true);
  noAffectation = signal(false);

  currentUserId = computed(() => this.authSvc.currentUser()?.id ?? 0);
  directeurNom  = computed(() => this.affectation()?.directeur_nom ?? '—');

  newMessage  = '';
  showRdvForm = false;
  rdvForm: RendezVousForm = { date_heure: '', lieu: '', description: '' };
  successMsg = signal('');
  errorMsg   = signal('');

  private destroy$ = new Subject<void>();
  private shouldScroll = false;

  @ViewChild('msgList') private msgList!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.affSvc.getAffectations().subscribe({
      next: affs => {
        const acc = affs.find(a => a.statut === 'ACCEPTE');
        if (!acc) {
          this.isLoadingAff.set(false);
          this.noAffectation.set(true);
          return;
        }
        this.affectation.set(acc);
        this.isLoadingAff.set(false);

        interval(8000).pipe(
          startWith(0),
          takeUntil(this.destroy$),
          switchMap(() => this.chatSvc.getMessages(acc.id)),
        ).subscribe({
          next: msgs => {
            const prev = this.messages().length;
            this.messages.set(msgs);
            if (msgs.length !== prev) this.shouldScroll = true;
          },
        });

        this.chatSvc.getRendezVous(acc.id).subscribe({
          next: rdvs => this.rendezVous.set(rdvs),
        });
      },
      error: () => {
        this.isLoadingAff.set(false);
        this.errorMsg.set('Impossible de charger votre affectation.');
      },
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(event?: Event): void {
    const ke = event as KeyboardEvent | undefined;
    if (ke?.shiftKey) return;
    if (event) event.preventDefault();
    const text = this.newMessage.trim();
    const aff  = this.affectation();
    if (!text || !aff) return;

    this.chatSvc.sendMessage(aff.id, text).subscribe({
      next: msg => {
        this.messages.update(list => [...list, msg]);
        this.newMessage = '';
        this.shouldScroll = true;
      },
      error: () => this.errorMsg.set('Erreur lors de l\'envoi.'),
    });
  }

  proposerRdv(): void {
    const aff = this.affectation();
    if (!aff) return;
    if (!this.rdvForm.date_heure) {
      this.errorMsg.set('Date et heure obligatoires.');
      return;
    }
    this.chatSvc.proposerRendezVous(aff.id, this.rdvForm).subscribe({
      next: rdv => {
        this.rendezVous.update(list => [...list, rdv]);
        this.showRdvForm = false;
        this.rdvForm = { date_heure: '', lieu: '', description: '' };
        this.successMsg.set('Rendez-vous proposé. Votre directeur a été notifié.');
      },
      error: err => this.errorMsg.set(err?.error?.detail || 'Erreur lors de la proposition.'),
    });
  }

  confirmerRdv(id: number): void {
    this.chatSvc.deciderRendezVous(id, 'CONFIRME').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous confirmé.');
      },
    });
  }

  annulerRdv(id: number): void {
    this.chatSvc.deciderRendezVous(id, 'ANNULE').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous annulé.');
      },
    });
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      PROPOSE: 'Proposé', CONFIRME: 'Confirmé', ANNULE: 'Annulé', PASSE: 'Passé',
    };
    return map[s] ?? s;
  }

  private scrollToBottom(): void {
    try {
      this.msgList.nativeElement.scrollTop = this.msgList.nativeElement.scrollHeight;
    } catch { /* noop */ }
  }
}

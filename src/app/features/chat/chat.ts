import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

import { TopNav }       from '../../core/components/top-nav/top-nav';
import { AuthService }  from '../../core/services/auth/auth';
import { ChatService, ChatMessage, RendezVous, RendezVousForm } from '../../core/services/chat/chat';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private route       = inject(ActivatedRoute);

  affectationId = signal(0);
  messages      = signal<ChatMessage[]>([]);
  rendezVous    = signal<RendezVous[]>([]);
  currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);
  userRole      = computed(() => this.authService.currentUser()?.role ?? '');
  proposePar    = computed(() => this.userRole() === 'STUDENT' ? 'ETUDIANT' : 'DIRECTEUR');
  partnerName   = computed(() => {
    const rdvs = this.rendezVous();
    if (!rdvs.length) return '—';
    return this.userRole() === 'STUDENT' ? rdvs[0].directeur_nom : rdvs[0].etudiant_nom;
  });

  newMessage  = '';
  showRdvForm = false;
  rdvForm: RendezVousForm = { date_heure: '', lieu: '', description: '' };
  successMsg = signal('');
  errorMsg   = signal('');

  private destroy$ = new Subject<void>();
  private shouldScroll = false;

  @ViewChild('msgList') private msgList!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.affectationId.set(id);

    interval(8000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.chatService.getMessages(id)),
    ).subscribe({
      next: msgs => {
        const prev = this.messages().length;
        this.messages.set(msgs);
        if (msgs.length !== prev) this.shouldScroll = true;
      },
    });

    this.chatService.getRendezVous(id).subscribe({
      next: rdvs => this.rendezVous.set(rdvs),
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
    if (!text) return;
    this.chatService.sendMessage(this.affectationId(), text).subscribe({
      next: msg => {
        this.messages.update(list => [...list, msg]);
        this.newMessage = '';
        this.shouldScroll = true;
      },
      error: () => this.errorMsg.set('Erreur envoi.'),
    });
  }

  proposerRdv(): void {
    if (!this.rdvForm.date_heure) {
      this.errorMsg.set('Date et heure obligatoires.');
      return;
    }
    this.chatService.proposerRendezVous(this.affectationId(), this.rdvForm).subscribe({
      next: rdv => {
        this.rendezVous.update(list => [...list, rdv]);
        this.showRdvForm = false;
        this.rdvForm = { date_heure: '', lieu: '', description: '' };
        this.successMsg.set('Rendez-vous proposé.');
      },
      error: err => this.errorMsg.set(err?.error?.detail || 'Erreur proposition rendez-vous.'),
    });
  }

  confirmerRdv(id: number): void {
    this.chatService.deciderRendezVous(id, 'CONFIRME').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous confirmé.');
      },
    });
  }

  annulerRdv(id: number): void {
    this.chatService.deciderRendezVous(id, 'ANNULE').subscribe({
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

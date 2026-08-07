import { Component, OnInit, OnDestroy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval, of, forkJoin } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';

import { NotificationService, Notification, MessageRecu } from '../../services/notification/notification';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private router       = inject(Router);
  private elRef        = inject(ElementRef);

  isOpen        = signal(false);
  activeTab     = signal<'notifs' | 'messages'>('notifs');
  notifications = signal<Notification[]>([]);
  messages      = signal<MessageRecu[]>([]);
  nonLues       = this.notifService.nonLues;

  messagesNonLus = signal<number>(0);

  private pollSub?: Subscription;

  readonly typeIcons: Record<string, string> = {
    INFO:        'ℹ️',
    AFFECTATION: '👤',
    ANNOTATION:  '📝',
    RATTRAPAGE:  '📋',
    PAIEMENT:    '💳',
    SOUTENANCE:  '🎓',
    THEME:       '💡',
    MESSAGE:     '✉️',
    RENDEZ_VOUS: '📅',
  };

  ngOnInit(): void {
    this.pollSub = interval(30_000).pipe(
      startWith(0),
      switchMap(() => forkJoin({
        notifs: this.notifService.getNotifications().pipe(catchError(() => of(null))),
        msgs:   this.notifService.getMessagesRecus().pipe(catchError(() => of(null))),
      })),
    ).subscribe(({ notifs, msgs }) => {
      if (notifs) this.notifications.set(notifs.notifications);
      if (msgs) {
        this.messages.set(msgs);
        this.messagesNonLus.set(msgs.filter(m => !m.lu).length);
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) this.activeTab.set('notifs');
  }

  setTab(tab: 'notifs' | 'messages'): void {
    this.activeTab.set(tab);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  cliquerNotif(n: Notification, event: Event): void {
    event.stopPropagation();
    if (!n.lu) {
      this.notifService.marquerLue(n.id).subscribe({
        next: updated => this.notifications.update(list =>
          list.map(x => x.id === updated.id ? updated : x)
        ),
      });
    }
    if (n.lien) {
      this.isOpen.set(false);
      this.router.navigateByUrl(n.lien);
    }
  }

  ouvrirMessage(m: MessageRecu, event: Event): void {
    event.stopPropagation();
    this.isOpen.set(false);
    this.router.navigateByUrl(`/chat/${m.affectation_id}`);
  }

  toutMarquerLues(): void {
    this.notifService.marquerToutesLues().subscribe({
      next: () => this.notifications.update(list => list.map(n => ({ ...n, lu: true }))),
    });
  }

  iconFor(type: string): string {
    return this.typeIcons[type] ?? 'ℹ️';
  }

  totalBadge(): number {
    return this.nonLues() + this.messagesNonLus();
  }
}

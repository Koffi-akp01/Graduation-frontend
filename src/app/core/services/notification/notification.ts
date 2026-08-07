import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type_notif: string;
  lu: boolean;
  lien: string | null;
  date_creation: string;
}

export interface NotificationResponse {
  count: number;
  non_lues: number;
  notifications: Notification[];
}

export interface MessageRecu {
  id: number;
  contenu: string;
  expediteur_nom: string;
  date_envoi: string;
  lu: boolean;
  affectation_id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}`;
  private _nonLues = signal<number>(0);
  readonly nonLues = computed(() => this._nonLues());

  constructor(private http: HttpClient) {}

  getNotifications(nonLuesOnly = false): Observable<NotificationResponse> {
    const params = nonLuesOnly ? '?non_lues=1' : '';
    return this.http.get<NotificationResponse>(`${this.base}/notifications/${params}`).pipe(
      tap(r => this._nonLues.set(r.non_lues))
    );
  }

  getMessagesRecus(): Observable<MessageRecu[]> {
    return this.http.get<MessageRecu[]>(`${this.base}/messages/recus/`);
  }

  marquerLue(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/notifications/${id}/lire/`, {}).pipe(
      tap(() => this._nonLues.update(n => Math.max(0, n - 1)))
    );
  }

  marquerToutesLues(): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.base}/notifications/lire-tout/`, {}).pipe(
      tap(() => this._nonLues.set(0))
    );
  }
}

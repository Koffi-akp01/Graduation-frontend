import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  id: number;
  affectation: number;
  expediteur: number;
  expediteur_nom: string;
  contenu: string;
  date_envoi: string;
  lu: boolean;
}

export interface RendezVous {
  id: number;
  affectation: number;
  date_heure: string;
  lieu: string;
  description: string;
  statut: 'PROPOSE' | 'CONFIRME' | 'ANNULE' | 'PASSE';
  propose_par: 'ETUDIANT' | 'DIRECTEUR';
  rappel_1h_envoye: boolean;
  rappel_30min_envoye: boolean;
  date_creation: string;
  etudiant_nom: string;
  directeur_nom: string;
}

export interface RendezVousForm {
  date_heure: string;
  lieu: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMessages(affectationId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/affectations/${affectationId}/messages/`);
  }

  sendMessage(affectationId: number, contenu: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/affectations/${affectationId}/messages/`, { contenu });
  }

  getRendezVous(affectationId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.base}/affectations/${affectationId}/rendez-vous/`);
  }

  proposerRendezVous(affectationId: number, form: RendezVousForm): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${this.base}/affectations/${affectationId}/rendez-vous/`, form);
  }

  deciderRendezVous(pk: number, statut: 'CONFIRME' | 'ANNULE'): Observable<RendezVous> {
    return this.http.patch<RendezVous>(`${this.base}/rendez-vous/${pk}/`, { statut });
  }

  getPlanning(): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.base}/directeur/planning/`);
  }
}

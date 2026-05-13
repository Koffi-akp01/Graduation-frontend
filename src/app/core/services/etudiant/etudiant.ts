import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { EligibiliteStatus, EtudiantProfile } from '../../models/etudiant.model';

@Injectable({
  providedIn: 'root',
})
export class EtudiantService {
  private readonly apiUrl = `${environment.apiUrl}/etudiants`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<EtudiantProfile> {
    return this.http.get<EtudiantProfile>(`${this.apiUrl}/me/`);
  }

  getEligibilite(): Observable<EligibiliteStatus> {
    return this.http.get<EligibiliteStatus>(`${this.apiUrl}/me/eligibilite/`);
  }

  getEtudiantsByDirecteur(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/directeur/mes-etudiants/`);
  }
}

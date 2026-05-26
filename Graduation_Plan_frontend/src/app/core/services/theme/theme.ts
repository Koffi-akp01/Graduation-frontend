import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Theme } from '../../models/theme.model';

export interface EtudiantSimple {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  filiere: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly apiUrl = `${environment.apiUrl}/themes/`;
  private readonly etudiantsUrl = `${environment.apiUrl}/etudiants/`;

  constructor(private http: HttpClient) {}

  getMyTheme(): Observable<Theme> {
    return this.http.get<Theme>(`${this.apiUrl}me/`);
  }

  getMyThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(this.apiUrl);
  }

  getAllThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(this.apiUrl);
  }

  submitThemeForStudent(etudiantId: number, theme: Partial<Theme>): Observable<Theme> {
    return this.http.post<Theme>(this.apiUrl, { ...theme, etudiant_id: etudiantId });
  }

  updateTheme(id: number, theme: Partial<Theme>): Observable<Theme> {
    return this.http.patch<Theme>(`${this.apiUrl}${id}/`, theme);
  }

  getStudents(): Observable<EtudiantSimple[]> {
    return this.http.get<EtudiantSimple[]>(this.etudiantsUrl);
  }
}

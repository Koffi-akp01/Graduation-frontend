import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Theme } from '../../models/theme.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly apiUrl = `${environment.apiUrl}/themes/`;

  constructor(private http: HttpClient) {}

  submitTheme(theme: Theme): Observable<Theme> {
    return this.http.post<Theme>(this.apiUrl, theme);
  }

  getMyTheme(): Observable<Theme> {
    return this.http.get<Theme>(`${this.apiUrl}me/`);
  }

  getAllThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(this.apiUrl);
  }

  updateTheme(id: number, theme: Partial<Theme>): Observable<Theme> {
    return this.http.patch<Theme>(`${this.apiUrl}${id}/`, theme);
  }
}

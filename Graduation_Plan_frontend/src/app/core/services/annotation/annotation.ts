import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Annotation {
  id: number;
  document: number;
  annotateur: string;
  page: number;
  x_pct: number;
  y_pct: number;
  texte: string;
  couleur: string;
  est_resolu: boolean;
  date_creation: string;
}

export interface NouvelleAnnotation {
  page: number;
  x_pct: number;
  y_pct: number;
  texte: string;
  couleur?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private http   = inject(HttpClient);
  private base   = `${environment.apiUrl}/documents`;

  getAnnotations(docId: number): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.base}/${docId}/annotations/`);
  }

  ajouter(docId: number, data: NouvelleAnnotation): Observable<Annotation> {
    return this.http.post<Annotation>(`${this.base}/${docId}/annotations/`, data);
  }

  resoudre(id: number): Observable<Annotation> {
    return this.http.patch<Annotation>(`${this.base}/annotations/${id}/`, { est_resolu: true });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/annotations/${id}/`);
  }
}

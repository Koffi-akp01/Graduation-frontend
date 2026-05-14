import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MemoireVersion {
  id: number;
  version: number;
  fichier: string;
  date_upload: string;
  taille: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  uploadMemoire(file: File, typeDocument: string = 'memoire'): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('type_document', typeDocument);
    return this.http.post(`${this.apiUrl}/documents/upload-memoire/`, formData);
  }

  getVersions(): Observable<MemoireVersion[]> {
    return this.http.get<MemoireVersion[]>(`${this.apiUrl}/documents/memoires/versions/`);
  }

  getMemoireUrl(id: number): string {
    return `${this.apiUrl}/documents/memoires/${id}/download/`;
  }
}
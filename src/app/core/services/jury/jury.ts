import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface JuryMember {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class JuryService {
  private readonly apiUrl = `${environment.apiUrl}/users/`;

  constructor(private http: HttpClient) {}

  getMembers(): Observable<JuryMember[]> {
    return this.http.get<JuryMember[]>(this.apiUrl);
  }

  submitNotes(notes: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/scheduling/evaluations/`, notes);
  }
}

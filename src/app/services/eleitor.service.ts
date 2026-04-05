import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Eleitor, EleitorStats } from '../shared/interfaces/eleitor.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EleitorService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEleitores(): Observable<Eleitor[]> {
    return this.http.get<Eleitor[]>(`${this.api}/eleitores`);
  }

  getStats(): Observable<EleitorStats> {
    return this.http.get<EleitorStats>(`${this.api}/eleitores/stats`);
  }

  searchEleitores(query: string, provincia?: string): Observable<Eleitor[]> {
    let params = new HttpParams().set('q', query || '');
    if (provincia) params = params.set('provincia', provincia);

    return this.http.get<Eleitor[]>(`${this.api}/eleitores/search`, { params });
  }

  createEleitor(eleitor: Eleitor): Observable<Eleitor> {
    return this.http.post<Eleitor>(`${this.api}/eleitores`, eleitor);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Eleitor, EleitorStats } from '../shared/interfaces/eleitor.interface';
import { Candidato, CandidatoStats } from '../shared/interfaces/candidato.interface';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api'; // URL base do seu backend Node.js

  constructor(private http: HttpClient) { }

  // Eleitores
  getEleitores(): Observable<Eleitor[]> {
    return this.http.get<Eleitor[]>(`${this.apiUrl}/eleitores`);
  }

  getEleitorStats(): Observable<EleitorStats> {
    return this.http.get<EleitorStats>(`${this.apiUrl}/eleitores/stats`);
  }

  // Candidatos
  getCandidatos(): Observable<Candidato[]> {
    return this.http.get<Candidato[]>(`${this.apiUrl}/candidatos`);
  }

  getCandidatoStats(): Observable<CandidatoStats> {
    return this.http.get<CandidatoStats>(`${this.apiUrl}/candidatos/stats`);
  }

  // Métodos para filtros e busca (exemplo)
  searchEleitores(query: string, provincia?: string): Observable<Eleitor[]> {
    let params: any = { q: query };
    if (provincia) {
      params.provincia = provincia;
    }
    return this.http.get<Eleitor[]>(`${this.apiUrl}/eleitores/search`, { params });
  }

  searchCandidatos(query: string): Observable<Candidato[]> {
    let params: any = { q: query };
    return this.http.get<Candidato[]>(`${this.apiUrl}/candidatos/search`, { params });
  }
}

/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Candidato } from '../candidato/candidato';

@Injectable({
  providedIn: 'root',
})
export class Criar {

  private apiUrl = 'https://localhost:3002/candidatos';

  constructor(private http: HttpClient) {}

  criar(andidato: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, Candidato);
  }

  listar(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl);
  }
}*/

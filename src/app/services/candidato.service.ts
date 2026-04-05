import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Pessoa } from '../models/Pessoa';

@Injectable({
  providedIn: 'root'
})
export class CandidatoService {
  private apiUrl = `http://localhost:3003/candidatos`;    // ajuste se necessário
  private votarUrl = `http://localhost:3003/votar`;
  private candidatosSubject = new BehaviorSubject<Pessoa[]>([]);

  candidatos$ = this.candidatosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarCandidatos();  // carrega a lista ao iniciar o serviço
  }

  // Carrega os candidatos e atualiza o subject (usado internamente)
  carregarCandidatos(): void {
    this.http.get<Pessoa[]>(this.apiUrl).subscribe({
      next: (candidatos) => this.candidatosSubject.next(candidatos),
      error: (err) => console.error('Erro ao carregar candidatos', err)
    });
  }

  // GET /candidatos – retorna Observable e atualiza o subject (opcional)
  listar(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.apiUrl).pipe(
      tap(candidatos => this.candidatosSubject.next(candidatos))
    );
  }

  // Método para compatibilidade com o componente (chama listar internamente)
  getCandidatos(): Observable<Pessoa[]> {
    return this.listar();
  }

  // POST /candidatos
  adicionar(candidato: Omit<Pessoa, 'id'>): Observable<Pessoa> {
    return this.http.post<Pessoa>(this.apiUrl, candidato).pipe(
      tap(novoCandidato => {
        const lista = this.candidatosSubject.value;
        this.candidatosSubject.next([...lista, novoCandidato]);
      })
    );
  }

  // PUT /candidatos/:id
  atualizar(id: number, candidato: Partial<Pessoa>): Observable<Pessoa> {
    return this.http.put<Pessoa>(`${this.apiUrl}/${id}`, candidato).pipe(
      tap(candidatoAtualizado => {
        const lista = this.candidatosSubject.value.map(c =>
          c.id === id ? candidatoAtualizado : c
        );
        this.candidatosSubject.next(lista);
      })
    );
  }

  // DELETE /candidatos/:id
  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const lista = this.candidatosSubject.value.filter(c => c.id !== id);
        this.candidatosSubject.next(lista);
      })
    );
  }

  // POST /votar
  votar(candidatoId: number): Observable<any> {
    return this.http.post(this.votarUrl, { candidato_id: candidatoId }, { withCredentials: true }).pipe(
      tap(() => {
        // Após votar, recarrega a lista para atualizar a contagem de votos
        this.carregarCandidatos();
      })
    );
  }
}

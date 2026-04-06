import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceEnviar {
  private socket: Socket;
  private api = environment.apiUrl;

  private documentoSubject = new BehaviorSubject<any>(null);
  public documento$ = this.documentoSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(environment.apiUrl, { withCredentials: true, transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => console.log('Socket conectado'));
    this.socket.on('connect_error', (err) => console.log('Erro no socket:', err));
  }

  // ======================== SOCKETS ========================
  mostrarEleitoresEmTemporeal(): Observable<any> {
    return new Observable((observa) => {
      this.socket.on('totais_Eleitores', (dados) => observa.next(dados));
      return () => this.socket.off('totais_Eleitores');
    });
  }

  // Adicione outros métodos de socket conforme necessário

  // ======================== AUTENTICAÇÃO ========================
  enviarBI(numeroBI: string): Observable<any> {
    return this.http.post(`${this.api}/cne/auth`, { numeroBI }, { withCredentials: true });
  }

  enviarKYC(kyc: boolean): Observable<any> {
    return this.http.post(`${this.api}/cne/validarKYC`, { ativo: kyc });
  }

  mostrarPerfil(): Observable<any> {
    return this.http.get(`${this.api}/criarUsuario`);
  }

  // ======================== DOCUMENTOS ========================
  enviarDocumentos(frente: string, verso: string): Observable<any> {
    return this.http.post(`${this.api}/validar-documento`, { frente, verso }, { withCredentials: true });
  }

  setDocumento(dados: any) {
    this.documentoSubject.next(dados);
  }

  // ======================== CANDIDATOS E VOTAÇÃO ========================
  BuscarCandidatos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/candidatos`);
  }

  CriarCandidato(formData: FormData): Observable<any> {
    return this.http.post(`${this.api}/candidatos/criar`, formData);
  }

  ApagarCandidato(id: number): Observable<any> {
    return this.http.delete(`${this.api}/candidatos/apagar/${id}`);
  }

  Votar(candidato_id: number): Observable<any> {
    return this.http.post(`${this.api}/votar`, { candidato_id });
  }

  validarBI(imagemFrente: string, imagemVerso: string): Observable<any> {
    const formData = new FormData();
    formData.append('frente', imagemFrente);
    formData.append('verso', imagemVerso);
    return this.http.post(`${this.api}/ad/verify`, formData);
  }

  // ======================== ESTATÍSTICAS ========================
  getParticipacaoFaixaEtaria(): Observable<any> {
    return this.http.get(`${this.api}/cne/MostrarEleitoresPorFaixaEtaria`);
  }

  getVotosPorHora(): Observable<any> {
    return this.http.get(`${this.api}/cne/votos/hora`);
  }

  getVotosPorGenero(): Observable<any> {
    return this.http.get(`${this.api}/cne/MostrarEleitoresPorGenero`);
  }

  getParticipacaoPorProvincia(): Observable<any> {
    return this.http.get(`${this.api}/votos/provincia/contagem`);
  }

  totaisEleitoresProvincias(body: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.api}/cne/MostrarEleitoresAgregados`, { body });
  }
}

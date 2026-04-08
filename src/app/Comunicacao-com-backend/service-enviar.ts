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

  // Subject para compartilhar os dados do documento
  private documentoSubject = new BehaviorSubject<any>(null);
  public documento$ = this.documentoSubject.asObservable();

  // Subject para compartilhar a imagem da frente do BI
  private imagemFrenteSubject = new BehaviorSubject<string | null>(null);
  public imagemFrente$ = this.imagemFrenteSubject.asObservable();

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

  // ... (coloque aqui os outros métodos de socket que você já tinha)

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

  setImagemFrente(base64: string) {
    this.imagemFrenteSubject.next(base64);
  }

  // ======================== CANDIDATOS E VOTAÇÃO ========================
  BuscarCandidatos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/candidatos`);
  }

  // ... (outros métodos existentes)
}

/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VotingFlow } from '../models/voting-flow.model';

@Injectable({
  providedIn: 'root'
})
export class FluxoDeEstatisticasService {
  private apiUrl = 'http://localhost:3000/api/fluxo-estatisticas';

  constructor(private http: HttpClient) { }

  getVotingFlow(date: string): Observable<VotingFlow> {
    return this.http.get<VotingFlow>(`${this.apiUrl}/${date}`);
  }
}
*/

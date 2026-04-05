/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GenderDistribution } from '../models/gender-distribution.model';
import { AgeDistribution } from '../models/age-distribution.model';

@Injectable({
  providedIn: 'root'
})
export class DistribuicaoParticipacaoEstatisticasService {
  private apiUrl = 'http://localhost:3000/api/distribuicao-participacao-estatisticas';

  constructor(private http: HttpClient) { }

  getGenderDistribution(): Observable<GenderDistribution> {
    return this.http.get<GenderDistribution>(`${this.apiUrl}/genero`);
  }

  getAgeDistribution(): Observable<AgeDistribution> {
    return this.http.get<AgeDistribution>(`${this.apiUrl}/faixa-etaria`);
  }
}
*/

/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatisticCard } from '../models/statistic-card.model';

@Injectable({
  providedIn: 'root'
})
export class ContadorEstatisticaService {
  private apiUrl = 'http://localhost:3000/api/contador-estatisticas';

  constructor(private http: HttpClient) { }

  getStatisticCards(): Observable<StatisticCard[]> {
    return this.http.get<StatisticCard[]>(this.apiUrl);
  }

  getStatisticCardById(id: string): Observable<StatisticCard> {
    return this.http.get<StatisticCard>(`${this.apiUrl}/${id}`);
  }
}
*/

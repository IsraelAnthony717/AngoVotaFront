/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatisticData } from '../models/statistic-data.model';

@Injectable({
  providedIn: 'root'
})
export class EstatisticaService {
  private apiUrl = 'http://localhost:3000/api/estatisticas';

  constructor(private http: HttpClient) { }

  getStatistics(): Observable<StatisticData[]> {
    return this.http.get<StatisticData[]>(this.apiUrl);
  }

  getStatisticById(id: string): Observable<StatisticData> {
    return this.http.get<StatisticData>(`${this.apiUrl}/${id}`);
  }
}
*/

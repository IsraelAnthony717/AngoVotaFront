/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HeaderStatistic } from '../models/header-statistic.model';

@Injectable({
  providedIn: 'root'
})
export class HeaderEstatisticasService {
  private apiUrl = 'http://localhost:3000/api/header-estatisticas';

  constructor(private http: HttpClient) { }

  getHeaderStatistics(): Observable<HeaderStatistic> {
    return this.http.get<HeaderStatistic>(this.apiUrl);
  }

  updateScope(scope: 'Nacional' | 'Provincial' | 'Municipal'): Observable<HeaderStatistic> {
    return this.http.put<HeaderStatistic>(`${this.apiUrl}/scope`, { scope });
  }
}
*/

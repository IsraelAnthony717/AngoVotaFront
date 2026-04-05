import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private API = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getTotalListas(): Observable<any> {
    return this.http.get(`${this.API}/candidatos/total`);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'criar-perfil-cne',
  imports: [CommonModule, FormsModule],
  templateUrl: './criar-perfil-cne.html',
  styleUrl: './criar-perfil-cne.css'
})
export class CriaPerfilCne {

  numero_bi: string = '';
  mensagem: string = '';
  loading = false;

  private apiUrl = `${environment.apiUrl}/criarUsuario`;

  constructor(private http: HttpClient) {}

  criarPerfilRapido() {

    if (!this.numero_bi) {
      this.mensagem = 'Número do BI e Perfil são obrigatórios';
      return;
    }

    this.loading = true;
    this.mensagem = '';

    this.http.post(this.apiUrl, {
      numero_bi: this.numero_bi
    }).subscribe({
      next: (res: any) => {
        this.mensagem = 'Perfil criado com sucesso';
        this.loading = false;
        console.log('Resposta:', res);
      },
      error: (err) => {
        console.error(err);
        this.mensagem = err.error?.message || 'Erro ao criar utilizador';
        this.loading = false;
      }
    });
  }
}

export class Pessoa {
  id?: number;
  nome: string;
  idade: number;
  descricao: string;
  partido: string;
  abrevpartido: string;
  cor: string;
  foto: string | null;
  votos: number; // NOVO: contador de votos

  constructor() {
    this.nome = '';
    this.idade = 0;
    this.descricao = '';
    this.partido = '';
    this.abrevpartido = '';
    this.cor = '#0d59f2';
    this.foto = null;
    this.votos = 0; // inicializa com zero
  }
}

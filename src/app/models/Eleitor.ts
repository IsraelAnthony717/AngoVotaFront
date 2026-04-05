export class Eleitor {
  nome: string;
  tituloEleitor: string;
  zona: string;
  secao: string;
  cidade: string;
  votou: boolean;
  candidatoEscolhido?: number; // índice do candidato

  constructor() {
    this.nome = '';
    this.tituloEleitor = '';
    this.zona = '';
    this.secao = '';
    this.cidade = '';
    this.votou = false;
    this.candidatoEscolhido = undefined;
  }
}

export interface Eleitor {
  nomeCompleto: string;
  bi: string;
  provincia: string;
  municipio: string;
  mesaVoto: string;
  statusVoto: 'Votou' | 'Pendente';
  registradoEm: string;
}

export interface EleitorStats {
  totalRegistrados: number;
  totalVotou: number;
  participacao: number;
}

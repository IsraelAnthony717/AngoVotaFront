export interface Candidato {
  nome: string;
  status: string;
  partidoSigla: string;
  partidoNome: string;
  descricao: string;
  tags: string[];
  avatar: string; // Pode ser um URL ou uma inicial
}

export interface CandidatoStats {
  totalRegistrados: number;
  totalPartidos: number;
}

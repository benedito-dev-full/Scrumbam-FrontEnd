export interface Comment {
  chave: string;
  texto: string;
  autor: {
    chave: string;
    nome: string;
  };
  criadoEm: string;
}

export interface CreateCommentDto {
  texto: string;
}

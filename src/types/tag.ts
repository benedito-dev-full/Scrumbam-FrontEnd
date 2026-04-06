export interface Tag {
  chave: string;
  nome: string;
  cor: string | null;
}

export interface CreateTagDto {
  nome: string;
  cor?: string;
}

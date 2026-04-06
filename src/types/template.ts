export interface TemplateColumn {
  nome: string;
  codigo: string;
  ordem: number;
  wipLimit: number | null;
  cor: string | null;
}

export interface TemplateCategory {
  nome: string;
  cor: string;
}

export interface ProjectTemplate {
  id: string;
  nome: string;
  descricao: string;
  colunas: TemplateColumn[];
  categorias: TemplateCategory[];
}

export interface CreateFromTemplateDto {
  templateId: string;
  nome: string;
  descricao?: string;
}

export interface ProjectFromTemplate {
  chave: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  template: { id: string; nome: string };
  colunasCreated: number;
  tagsCreated: number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ProdutoModel {
  id?: number;
  nome: string;
  preco: number;
  quantidade: number;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Produto {
  private apiUrl = `${environment.apiUrl}/produtos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<ProdutoModel[]> {
    return this.http.get<ProdutoModel[]>(this.apiUrl);
  }

  pesquisar(nome: string): Observable<ProdutoModel[]> {
    return this.http.get<ProdutoModel[]>(this.apiUrl, { params: { nome } });
  }

  estoqueBaixo(limite: number): Observable<ProdutoModel[]> {
    return this.http.get<ProdutoModel[]>(`${this.apiUrl}/estoque-baixo`, { params: { limite } });
  }

  buscarPorId(id: number): Observable<ProdutoModel> {
    return this.http.get<ProdutoModel>(`${this.apiUrl}/${id}`);
  }

  criar(produto: ProdutoModel): Observable<ProdutoModel> {
    return this.http.post<ProdutoModel>(this.apiUrl, produto);
  }

  atualizar(id: number, produto: ProdutoModel): Observable<ProdutoModel> {
    return this.http.put<ProdutoModel>(`${this.apiUrl}/${id}`, produto);
  }

  ajustarEstoque(id: number, quantidade: number): Observable<ProdutoModel> {
    return this.http.patch<ProdutoModel>(`${this.apiUrl}/${id}/estoque`, { quantidade });
  }

  inativar(id: number): Observable<ProdutoModel> {
    return this.http.patch<ProdutoModel>(`${this.apiUrl}/${id}/inativar`, {});
  }

  ativar(id: number): Observable<ProdutoModel> {
    return this.http.patch<ProdutoModel>(`${this.apiUrl}/${id}/ativar`, {});
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

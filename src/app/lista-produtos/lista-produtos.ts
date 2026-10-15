import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Produto, ProdutoModel } from '../produto';

@Component({
  selector: 'app-lista-produtos',
  imports: [FormsModule],
  templateUrl: './lista-produtos.html',
  styleUrl: './lista-produtos.css',
})
export class ListaProdutos implements OnInit {
  private service = inject(Produto);

  produtos = signal<ProdutoModel[]>([]);
  carregando = signal(true);
  erro = signal('');

  novo: ProdutoModel = { nome: '', preco: 0, quantidade: 0 };

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service.listarTodos().subscribe({
      next: (dados) => {
        this.produtos.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível falar com a API. Tente de novo em alguns segundos.');
        this.carregando.set(false);
      },
    });
  }

  salvar(): void {
    this.service.criar(this.novo).subscribe({
      next: () => {
        this.novo = { nome: '', preco: 0, quantidade: 0 };
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível cadastrar o produto.'),
    });
  }

  excluir(id: number): void {
    if (!confirm('Excluir este produto?')) return;
    this.service.deletar(id).subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível excluir o produto.'),
    });
  }
}

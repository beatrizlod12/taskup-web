import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

  readonly limite = 5;

  produtos = signal<ProdutoModel[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');
  mensagem = signal('');
  busca = signal('');
  somenteBaixo = signal(false);
  editandoId = signal<number | null>(null);

  form: ProdutoModel = this.vazio();

  ativos = computed(() => this.produtos().filter((p) => p.ativo !== false));

  totalItens = computed(() => this.ativos().reduce((soma, p) => soma + p.quantidade, 0));

  valorEstoque = computed(() =>
    this.ativos().reduce((soma, p) => soma + p.preco * p.quantidade, 0),
  );

  qtdBaixo = computed(() => this.ativos().filter((p) => p.quantidade <= this.limite).length);

  ngOnInit(): void {
    this.carregar();
  }

  vazio(): ProdutoModel {
    return { nome: '', preco: 0, quantidade: 0 };
  }

  carregar(): void {
    this.erro.set('');
    const termo = this.busca().trim();

    const requisicao = this.somenteBaixo()
      ? this.service.estoqueBaixo(this.limite)
      : termo
        ? this.service.pesquisar(termo)
        : this.service.listarTodos();

    requisicao.subscribe({
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

  pesquisar(): void {
    this.somenteBaixo.set(false);
    this.carregar();
  }

  limparBusca(): void {
    this.busca.set('');
    this.somenteBaixo.set(false);
    this.carregar();
  }

  alternarBaixo(): void {
    this.somenteBaixo.set(!this.somenteBaixo());
    this.busca.set('');
    this.carregar();
  }

  salvar(): void {
    if (!this.form.nome.trim()) {
      this.erro.set('Informe o nome do produto.');
      return;
    }
    this.salvando.set(true);
    this.erro.set('');

    const id = this.editandoId();
    const requisicao =
      id === null ? this.service.criar(this.form) : this.service.atualizar(id, this.form);

    requisicao.subscribe({
      next: () => {
        this.avisar(id === null ? 'Produto cadastrado!' : 'Produto atualizado!');
        this.cancelar();
        this.salvando.set(false);
        this.carregar();
      },
      error: () => {
        this.erro.set('Não foi possível salvar o produto.');
        this.salvando.set(false);
      },
    });
  }

  editar(p: ProdutoModel): void {
    this.editandoId.set(p.id!);
    this.form = { nome: p.nome, preco: p.preco, quantidade: p.quantidade };
    this.erro.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form = this.vazio();
  }

  ajustar(p: ProdutoModel, quantidade: number): void {
    this.service.ajustarEstoque(p.id!, quantidade).subscribe({
      next: () => {
        this.avisar(quantidade > 0 ? 'Entrada registrada.' : 'Saída registrada.');
        this.carregar();
      },
      error: (e) => this.erro.set(e.error?.erro ?? 'Não foi possível ajustar o estoque.'),
    });
  }

  alternarAtivo(p: ProdutoModel): void {
    const requisicao =
      p.ativo === false ? this.service.ativar(p.id!) : this.service.inativar(p.id!);
    requisicao.subscribe({
      next: () => {
        this.avisar(p.ativo === false ? 'Produto reativado.' : 'Produto inativado.');
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível alterar o produto.'),
    });
  }

  excluir(p: ProdutoModel): void {
    if (!confirm(`Excluir "${p.nome}" definitivamente?`)) return;
    this.service.deletar(p.id!).subscribe({
      next: () => {
        if (this.editandoId() === p.id) this.cancelar();
        this.avisar('Produto excluído.');
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível excluir o produto.'),
    });
  }

  avisar(texto: string): void {
    this.mensagem.set(texto);
    setTimeout(() => this.mensagem.set(''), 3000);
  }

  moeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

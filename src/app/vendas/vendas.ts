import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  ativo?: boolean;
}
interface ItemVenda {
  nomeProduto: string;
  quantidade: number;
  subtotal: number;
}
interface Venda {
  id: number;
  dataHora: string;
  formaPagamento: string;
  statusPagamento: string;
  valorTotal: number;
  itens: ItemVenda[];
}

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css',
})
export class Vendas implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl.replace(/\/$/, ''); // tira a "/" do final, se tiver

  produtos = signal<Produto[]>([]);
  vendas = signal<Venda[]>([]);
  carrinho = signal<Record<number, number>>({}); // id do produto -> quantidade
  busca = signal('');
  formaPagamento = signal('PIX');
  mensagem = signal('');
  erro = signal(false);
  enviando = signal(false);

  // Lista filtrada pela pesquisa
  produtosFiltrados = computed(() => {
    const termo = this.busca().toLowerCase().trim();
    return this.produtos().filter((p) => p.nome.toLowerCase().includes(termo));
  });

  // Itens do pedido com subtotal
  itensPedido = computed(
    () =>
      Object.entries(this.carrinho())
        .map(([id, qtd]) => {
          const p = this.produtos().find((x) => x.id === +id);
          return p ? { produto: p, quantidade: qtd, subtotal: p.preco * qtd } : null;
        })
        .filter((i) => i !== null) as { produto: Produto; quantidade: number; subtotal: number }[],
  );

  total = computed(() => this.itensPedido().reduce((soma, i) => soma + i.subtotal, 0));

  ngOnInit() {
    this.carregarProdutos();
    this.carregarVendas();
  }

  // ---------- API ----------
  carregarProdutos() {
    this.http.get<Produto[]>(`${this.api}/produtos`).subscribe({
      next: (lista) => this.produtos.set(lista.filter((p) => p.ativo !== false)), // só ativos
      error: () => this.aviso('Sem conexão com a API.', true),
    });
  }

  carregarVendas() {
    this.http.get<Venda[]>(`${this.api}/vendas`).subscribe({
      next: (lista) => this.vendas.set(lista),
    });
  }

  // ---------- Pedido ----------
  noPedido(p: Produto) {
    return this.carrinho()[p.id] ?? 0;
  }
  disponivel(p: Produto) {
    return p.quantidade - this.noPedido(p);
  }

  adicionar(p: Produto) {
    if (p.quantidade <= 0) return this.aviso(`${p.nome} está sem estoque.`, true);
    if (this.disponivel(p) <= 0)
      return this.aviso(`Só há ${p.quantidade} de ${p.nome} em estoque.`, true);
    this.carrinho.update((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  }

  remover(p: Produto) {
    this.carrinho.update((c) => {
      const novo = { ...c };
      if (novo[p.id] > 1) novo[p.id]--;
      else delete novo[p.id];
      return novo;
    });
  }

  limpar() {
    this.carrinho.set({});
  }

  // ---------- Venda ----------
  finalizar() {
    if (this.itensPedido().length === 0) return this.aviso('Adicione pelo menos um produto.', true);

    const corpo = {
      formaPagamento: this.formaPagamento(),
      itens: this.itensPedido().map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
    };

    this.enviando.set(true);
    this.http.post<Venda>(`${this.api}/vendas`, corpo).subscribe({
      next: (v) => {
        this.enviando.set(false);
        this.limpar();
        this.aviso(`Venda nº ${v.id} criada — aguardando pagamento. Confirme no histórico.`);
        this.carregarVendas();
      },
      error: (e) => {
        this.enviando.set(false);
        this.aviso(this.msgErro(e), true);
      },
    });
  }

  confirmarPagamento(v: Venda) {
    this.http.patch<Venda>(`${this.api}/vendas/${v.id}/confirmar-pagamento`, {}).subscribe({
      next: () => {
        this.aviso(`✔ Pagamento da venda nº ${v.id} efetuado! Estoque atualizado.`);
        this.carregarProdutos(); // mostra o estoque já descontado
        this.carregarVendas();
      },
      error: (e) => this.aviso(this.msgErro(e), true),
    });
  }

  // ---------- Utilitários ----------
  brl(valor: number) {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  data(iso: string) {
    // "2026-10-20T19:50:00" -> "20/10 19:50"
    return iso ? `${iso.substring(8, 10)}/${iso.substring(5, 7)} ${iso.substring(11, 16)}` : '';
  }

  resumoItens(v: Venda) {
    return (v.itens ?? []).map((i) => `${i.quantidade}x ${i.nomeProduto}`).join(', ');
  }

  private msgErro(e: any) {
    return e?.error?.message ?? 'Erro ao falar com a API.';
  }

  private aviso(texto: string, erro = false) {
    this.mensagem.set(texto);
    this.erro.set(erro);
    setTimeout(() => this.mensagem.set(''), 4000);
  }
}

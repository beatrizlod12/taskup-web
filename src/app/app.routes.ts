import { Routes } from '@angular/router';
import { ListaProdutos } from './lista-produtos/lista-produtos';
import { Vendas } from './vendas/vendas';

export const routes: Routes = [
  { path: '', redirectTo: 'estoque', pathMatch: 'full' },
  { path: 'estoque', component: ListaProdutos },
  { path: 'vendas', component: Vendas },
];

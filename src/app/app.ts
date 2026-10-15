import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ListaProdutos } from './lista-produtos/lista-produtos';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ListaProdutos],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'taskup-web';
}

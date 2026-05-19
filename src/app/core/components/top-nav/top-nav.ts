import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss',
})
export class TopNav {}

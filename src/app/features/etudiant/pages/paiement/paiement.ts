import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { Bordereau } from '../../../../core/models/paiement.model';
import { PaiementService } from '../../../../core/services/paiement/paiement';

@Component({
  selector: 'app-etudiant-paiement',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './paiement.html',
  styleUrl: './paiement.scss',
})
export class EtudiantPaiementComponent implements OnInit {
  bordereaux     = signal<Bordereau[]>([]);
  showModal      = signal(false);
  isLoading      = signal(false);
  errorMessage   = signal('');
  successMessage = signal('');

  form = {
    numero_bordereau:  '',
    banque:            'CORIS BANK',
    montant:           100000 as 100000 | 150000,
    image_bordereau:   null as File | null,
  };

  constructor(private paiementService: PaiementService) {}

  ngOnInit(): void {
    this.chargerBordereaux();
  }

  chargerBordereaux(): void {
    this.paiementService.getAllBordereaux().subscribe((data) => this.bordereaux.set(data));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.image_bordereau = input.files?.[0] ?? null;
  }

  ouvrirModal(): void {
    this.showModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  fermerModal(): void {
    this.showModal.set(false);
    this.form = { numero_bordereau: '', banque: 'CORIS BANK', montant: 100000, image_bordereau: null };
  }

  soumettre(): void {
    if (!this.form.numero_bordereau.trim() || !this.form.image_bordereau) {
      this.errorMessage.set('Veuillez remplir tous les champs et joindre le scan du bordereau.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const fd = new FormData();
    fd.append('numero_bordereau',  this.form.numero_bordereau.trim());
    fd.append('banque',            this.form.banque);
    fd.append('montant',           String(this.form.montant));
    fd.append('image_bordereau',   this.form.image_bordereau);

    this.paiementService.soumettreBordereau(fd).subscribe({
      next: () => {
        this.successMessage.set('Bordereau soumis ! Le service recouvrement va vérifier votre paiement.');
        this.isLoading.set(false);
        this.chargerBordereaux();
        setTimeout(() => this.fermerModal(), 2200);
      },
      error: (err) => {
        const e = err?.error;
        this.errorMessage.set(e?.numero_bordereau?.[0] ?? e?.detail ?? 'Erreur lors de la soumission.');
        this.isLoading.set(false);
      },
    });
  }

  montantLabel(montant: number): string {
    return montant === 100000 ? '100 000 F (Licence)' : '150 000 F (Master)';
  }
}

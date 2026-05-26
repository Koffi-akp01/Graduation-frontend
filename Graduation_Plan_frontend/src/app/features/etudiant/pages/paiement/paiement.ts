import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { Bordereau } from '../../../../core/models/paiement.model';
import { PaiementService } from '../../../../core/services/paiement/paiement';

@Component({
  selector: 'app-etudiant-paiement',
  imports: [CommonModule, FormsModule, RouterLink, TopNav],
  templateUrl: './paiement.html',
  styleUrl: './paiement.scss',
})
export class EtudiantPaiementComponent implements OnInit {
  bordereaux = signal<Bordereau[]>([]);
  showModal = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  form = {
    numero_bordereau: '',
    banque: 'CORIS BANK',
    montant: 100000 as 100000 | 150000,
    image_bordereau: null as File | null,
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
    this.showModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  fermerModal(): void {
    this.showModal = false;
    this.form = { numero_bordereau: '', banque: 'CORIS BANK', montant: 100000, image_bordereau: null };
  }

  soumettre(): void {
    if (!this.form.numero_bordereau.trim() || !this.form.image_bordereau) {
      this.errorMessage = 'Veuillez remplir tous les champs et joindre le scan du bordereau.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const fd = new FormData();
    fd.append('numero_bordereau', this.form.numero_bordereau.trim());
    fd.append('banque', this.form.banque);
    fd.append('montant', String(this.form.montant));
    fd.append('image_bordereau', this.form.image_bordereau);

    this.paiementService.soumettreBordereau(fd).subscribe({
      next: () => {
        this.successMessage = 'Bordereau soumis avec succès ! Le service recouvrement va vérifier votre paiement.';
        this.isLoading = false;
        this.chargerBordereaux();
        setTimeout(() => this.fermerModal(), 2000);
      },
      error: (err) => {
        const e = err?.error;
        this.errorMessage = e?.numero_bordereau?.[0] ?? e?.detail ?? 'Erreur lors de la soumission.';
        this.isLoading = false;
      },
    });
  }

  montantLabel(montant: number): string {
    return montant === 100000 ? '100 000 F (Licence)' : '150 000 F (Master)';
  }
}

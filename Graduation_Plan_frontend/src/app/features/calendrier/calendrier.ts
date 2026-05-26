import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNav } from '../../core/components/top-nav/top-nav';
import { CalendrierService, EvenementCalendrier, EvenementForm } from '../../core/services/calendrier/calendrier';
import { AuthService } from '../../core/services/auth/auth';

const TYPES = [
  { value: '', label: 'Tous' },
  { value: 'DEPOT_MEMOIRE',      label: 'Dépôt mémoire' },
  { value: 'LIMITE_CORRECTIONS', label: 'Limite corrections' },
  { value: 'SOUTENANCE',         label: 'Soutenance' },
  { value: 'RATTRAPAGE',         label: 'Rattrapage' },
  { value: 'REUNION',            label: 'Réunion' },
  { value: 'AUTRE',              label: 'Autre' },
];

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './calendrier.html',
  styleUrls: ['./calendrier.scss'],
})
export class CalendrierComponent implements OnInit {
  evenements  = signal<EvenementCalendrier[]>([]);
  isLoading   = signal(false);
  errorMsg    = signal('');
  successMsg  = signal('');
  canWrite    = signal(false);
  showForm    = false;
  filterType  = '';
  types       = TYPES;

  form: EvenementForm = {
    titre: '', type_evenement: 'AUTRE', description: '',
    date_debut: '', date_fin: null, tout_la_journee: false,
    couleur: '#C8963E', soutenance: null,
  };

  constructor(
    private calendrierService: CalendrierService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    this.canWrite.set(['ADMIN_ACADEMIC', 'CHARGE_ORGANISATION', 'CHEF_SERVICE_EXAM'].includes(role || ''));
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.calendrierService.getEvenements(this.filterType || undefined).subscribe({
      next: (data) => { this.evenements.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  applyFilter(): void { this.charger(); }

  soumettre(): void {
    this.calendrierService.creer(this.form).subscribe({
      next: (evt) => {
        this.evenements.update(list => [...list, evt].sort(
          (a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
        ));
        this.successMsg.set('Événement ajouté.');
        this.showForm = false;
        this.form = { titre: '', type_evenement: 'AUTRE', description: '', date_debut: '', date_fin: null, tout_la_journee: false, couleur: '#C8963E', soutenance: null };
      },
      error: (err) => this.errorMsg.set(err?.error?.detail || 'Erreur.'),
    });
  }

  supprimer(id: number): void {
    if (!confirm('Supprimer cet événement ?')) return;
    this.calendrierService.supprimer(id).subscribe({
      next: () => { this.evenements.update(list => list.filter(e => e.id !== id)); this.successMsg.set('Supprimé.'); },
      error: () => this.errorMsg.set('Erreur lors de la suppression.'),
    });
  }

  typeLabel(val: string): string {
    return TYPES.find(t => t.value === val)?.label || val;
  }
}

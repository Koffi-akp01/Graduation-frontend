import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  EtudiantSansSoutenance,
  MembreJury,
  Salle,
  Soutenance,
  SoutenanceForm,
  StatsSession,
} from '../../../../core/models/soutenance.model';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';

export type OrgaVue = 'dashboard' | 'planifier' | 'soutenances';

@Component({
  selector: 'app-organisation-planif',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './organisation-planif.html',
  styleUrl: './organisation-planif.scss',
})
export class OrganisationPlanifComponent implements OnInit {
  vue = signal<OrgaVue>('dashboard');

  // ── Données ───────────────────────────────────────────────────────────────
  etudiantsSans = signal<EtudiantSansSoutenance[]>([]);
  soutenances   = signal<Soutenance[]>([]);
  directeurs    = signal<MembreJury[]>([]);
  presidents    = signal<MembreJury[]>([]);
  examinateurs  = signal<MembreJury[]>([]);
  salles        = signal<Salle[]>([]);
  stats         = signal<StatsSession | null>(null);

  // ── Formulaire ────────────────────────────────────────────────────────────
  form: SoutenanceForm = this.emptyForm();
  selectedEtudiant: EtudiantSansSoutenance | null = null;

  readonly SESSION_CHOICES = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Session ${i + 1}`,
  }));

  isLoading        = false;
  isProcessing     = signal(false);
  generationSuccess = signal(false);
  errorMsg         = '';
  successMsg       = '';

  constructor(private soutenanceService: SoutenanceService) {}

  ngOnInit(): void {
    this.chargerStats();
    this.chargerSoutenances();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  afficherVue(v: OrgaVue): void {
    this.vue.set(v);
    if (v === 'dashboard')    { this.chargerStats(); this.chargerSoutenances(); }
    if (v === 'planifier')    this.chargerPlanifier();
    if (v === 'soutenances')  this.chargerSoutenances();
  }

  // ── Chargements ───────────────────────────────────────────────────────────

  chargerStats(): void {
    this.soutenanceService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => this.stats.set(null),
    });
  }

  chargerSoutenances(): void {
    this.soutenanceService.getSoutenances().subscribe((data) => this.soutenances.set(data));
  }

  chargerPlanifier(): void {
    this.soutenanceService.getEtudiantsSansSoutenance().subscribe((data) => this.etudiantsSans.set(data));
    forkJoin({
      internes:    this.soutenanceService.getDirecteurs(),
      externes:    this.soutenanceService.getDirecteursExternes(),
      presidents:  this.soutenanceService.getPresidents(),
      examinateurs: this.soutenanceService.getExaminateurs(),
      salles:      this.soutenanceService.getSalles(),
    }).subscribe(({ internes, externes, presidents, examinateurs, salles }) => {
      this.directeurs.set([...internes, ...externes]);
      this.presidents.set(presidents);
      this.examinateurs.set(examinateurs);
      this.salles.set(salles);
    });
  }

  // ── Sélection d'un étudiant ───────────────────────────────────────────────

  selectionnerEtudiant(e: EtudiantSansSoutenance): void {
    if (!e.est_eligible) {
      alert(`${e.prenom} ${e.nom} n'est pas encore éligible (UE ou frais non validés).`);
      return;
    }
    this.selectedEtudiant = e;
    this.form = { ...this.emptyForm(), etudiant: e.etudiant_id, theme: e.theme_id };
    this.errorMsg  = '';
    this.successMsg = '';
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  planifierSoutenance(): void {
    const f = this.form;
    if (!f.directeur_memoire || !f.president || !f.examinateur || !f.salle || !f.date_soutenance) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.isLoading = true;
    this.errorMsg  = '';
    this.soutenanceService.creerSoutenance(f).subscribe({
      next: () => {
        this.isLoading  = false;
        this.successMsg = 'Soutenance planifiée avec succès !';
        this.selectedEtudiant = null;
        this.form = this.emptyForm();
        setTimeout(() => {
          this.successMsg = '';
          this.afficherVue('planifier');
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const e = err?.error;
        if (e?.blocage)           this.errorMsg = (e.blocage as string[]).join(' — ');
        else if (e?.non_field_errors) this.errorMsg = e.non_field_errors[0];
        else                      this.errorMsg = 'Erreur lors de la planification. Vérifiez les données.';
      },
    });
  }

  // ── Algorithme auto ───────────────────────────────────────────────────────

  lancerAlgorithme(): void {
    this.isProcessing.set(true);
    this.generationSuccess.set(false);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.generationSuccess.set(true);
      this.chargerSoutenances();
    }, 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  membreNom(m: MembreJury): string {
    return `${m.first_name} ${m.last_name}${m.is_doctor ? ' (Dr)' : ''}`;
  }

  private emptyForm(): SoutenanceForm {
    return {
      etudiant: 0, theme: 0, directeur_memoire: 0, president: 0,
      examinateur: 0, salle: 0, date_soutenance: '', session: '1', lien_meet: '',
    };
  }
}

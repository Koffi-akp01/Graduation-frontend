import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  EtudiantSansSoutenance, MembreJury, Salle,
  SoutenanceForm, StatsSession,
} from '../../../../core/models/soutenance.model';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';

type Vue = 'dashboard' | 'planifier' | 'auto';

@Component({
  selector: 'app-examen-planification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './examen-planification.html',
  styleUrl: './examen-planification.scss',
})
export class ExamenPlanificationComponent implements OnInit {

  vue = signal<Vue>('dashboard');

  // ── Données ───────────────────────────────────────────────────────────────
  etudiantsSans = signal<EtudiantSansSoutenance[]>([]);
  directeurs    = signal<MembreJury[]>([]);
  presidents    = signal<MembreJury[]>([]);
  examinateurs  = signal<MembreJury[]>([]);
  salles        = signal<Salle[]>([]);
  stats         = signal<StatsSession | null>(null);

  // ── Formulaire ────────────────────────────────────────────────────────────
  form: SoutenanceForm = this.emptyForm();
  selectedEtudiant: EtudiantSansSoutenance | null = null;

  readonly SESSION_CHOICES = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1), label: `Session ${i + 1}`,
  }));

  isLoading       = false;
  isProcessing    = signal(false);
  autoSuccess     = signal(false);
  errorMsg        = '';
  successMsg      = '';

  constructor(private soutenanceService: SoutenanceService) {}

  ngOnInit(): void {
    this.chargerStats();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  afficherVue(v: Vue): void {
    this.vue.set(v);
    this.errorMsg   = '';
    this.successMsg = '';
    if (v === 'planifier') this.chargerPlanifier();
    if (v === 'dashboard') this.chargerStats();
  }

  // ── Chargements ───────────────────────────────────────────────────────────

  chargerStats(): void {
    this.soutenanceService.getStats().subscribe({
      next:  s  => this.stats.set(s),
      error: () => this.stats.set(null),
    });
    this.soutenanceService.getEtudiantsSansSoutenance().subscribe(
      d => this.etudiantsSans.set(d),
    );
  }

  chargerPlanifier(): void {
    this.soutenanceService.getEtudiantsSansSoutenance().subscribe(
      d => this.etudiantsSans.set(d),
    );
    forkJoin({
      internes:     this.soutenanceService.getDirecteurs(),
      externes:     this.soutenanceService.getDirecteursExternes(),
      presidents:   this.soutenanceService.getPresidents(),
      examinateurs: this.soutenanceService.getExaminateurs(),
      salles:       this.soutenanceService.getSalles(),
    }).subscribe(({ internes, externes, presidents, examinateurs, salles }) => {
      this.directeurs.set([...internes, ...externes]);
      this.presidents.set(presidents);
      this.examinateurs.set(examinateurs);
      this.salles.set(salles);
    });
  }

  // ── Sélection étudiant ────────────────────────────────────────────────────

  selectionnerEtudiant(e: EtudiantSansSoutenance): void {
    if (!e.est_eligible) return;
    this.selectedEtudiant = e;
    this.form = { ...this.emptyForm(), etudiant: e.etudiant_id, theme: e.theme_id };
    this.errorMsg   = '';
    this.successMsg = '';
  }

  // ── Soumission manuelle ───────────────────────────────────────────────────

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
        this.isLoading        = false;
        this.successMsg       = '✅ Soutenance planifiée avec succès !';
        this.selectedEtudiant = null;
        this.form             = this.emptyForm();
        setTimeout(() => { this.successMsg = ''; this.afficherVue('planifier'); }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const e = err?.error;
        if (e?.blocage)              this.errorMsg = (e.blocage as string[]).join(' — ');
        else if (e?.non_field_errors) this.errorMsg = e.non_field_errors[0];
        else                         this.errorMsg = 'Erreur lors de la planification.';
      },
    });
  }

  // ── Planification automatique ─────────────────────────────────────────────

  lancerAuto(): void {
    this.isProcessing.set(true);
    this.autoSuccess.set(false);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.autoSuccess.set(true);
      this.chargerStats();
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

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { Evaluation, Soutenance } from '../../../../core/models/soutenance.model';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';

export type JuryVue = 'dashboard' | 'notation';

@Component({
  selector: 'app-jury-notation',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './jury-notation.html',
  styleUrl: './jury-notation.scss',
})
export class JuryNotationComponent implements OnInit {
  vue = signal<JuryVue>('dashboard');

  soutenances  = signal<Soutenance[]>([]);
  evaluations  = signal<Evaluation[]>([]);
  selected     = signal<Soutenance | null>(null);

  // Form fields
  notePresentation = 0;
  noteMaitrise     = 0;
  noteMemoire      = 0;
  noteReponses     = 0;
  remarques        = '';

  isLoading    = false;
  errorMsg     = '';
  successMsg   = '';

  constructor(private soutenanceService: SoutenanceService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    forkJoin({
      soutenances: this.soutenanceService.getSoutenances(),
      evaluations: this.soutenanceService.getEvaluations(),
    }).subscribe({
      next: ({ soutenances, evaluations }) => {
        this.soutenances.set(soutenances);
        this.evaluations.set(evaluations);
      },
      error: () => {},
    });
  }

  // ── Computed helpers ────────────────────────────────────────────────────

  get noteFinale(): string {
    const weighted =
      +this.noteMemoire      * 3 +
      +this.noteMaitrise     * 4 +
      +this.notePresentation * 3 +
      +this.noteReponses     * 3;
    return (weighted / 13).toFixed(2);
  }

  getEval(soutenanceId: number): Evaluation | undefined {
    return this.evaluations().find((e) => e.soutenance === soutenanceId);
  }

  statut(s: Soutenance): string {
    const e = this.getEval(s.id!);
    if (!e)                return 'Notes à saisir';
    if (e.est_signe_par_tous) return 'PV signé';
    return 'Notes enregistrées';
  }

  statutClass(s: Soutenance): string {
    const e = this.getEval(s.id!);
    if (!e)                return 'badge-warn';
    if (e.est_signe_par_tous) return 'badge-success';
    return 'badge-info';
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  ouvrirNotation(s: Soutenance): void {
    this.selected.set(s);
    const e = this.getEval(s.id!);
    if (e) {
      this.notePresentation = e.note_presentation;
      this.noteMaitrise     = e.note_maitrise;
      this.noteMemoire      = e.note_memoire;
      this.noteReponses     = e.note_reponses;
      this.remarques        = e.remarques_jury;
    } else {
      this.notePresentation = 0;
      this.noteMaitrise     = 0;
      this.noteMemoire      = 0;
      this.noteReponses     = 0;
      this.remarques        = '';
    }
    this.errorMsg   = '';
    this.successMsg = '';
    this.vue.set('notation');
  }

  retour(): void {
    this.vue.set('dashboard');
    this.selected.set(null);
  }

  // ── Enregistrement des notes ────────────────────────────────────────────

  enregistrerNotes(): void {
    const s = this.selected();
    if (!s) return;

    this.isLoading = true;
    this.errorMsg  = '';

    const payload: Partial<Evaluation> = {
      soutenance:         s.id!,
      note_presentation:  +this.notePresentation,
      note_maitrise:      +this.noteMaitrise,
      note_memoire:       +this.noteMemoire,
      note_reponses:      +this.noteReponses,
      remarques_jury:     this.remarques,
    };

    const existing = this.getEval(s.id!);
    const obs = existing
      ? this.soutenanceService.mettreAJourEvaluation(existing.id, payload)
      : this.soutenanceService.creerEvaluation(payload);

    obs.subscribe({
      next: (e) => {
        this.isLoading  = false;
        this.successMsg = 'Notes enregistrées avec succès !';
        const autres = this.evaluations().filter((ev) => ev.soutenance !== s.id!);
        this.evaluations.set([...autres, e]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg  = err?.error?.detail ?? 'Erreur lors de l\'enregistrement.';
      },
    });
  }

  // ── Validation / signature du PV (président uniquement) ─────────────────

  validerPV(): void {
    const s = this.selected();
    if (!s) return;
    const e = this.getEval(s.id!);
    if (!e) return;

    this.isLoading = true;
    this.errorMsg  = '';
    this.soutenanceService.validerEvaluation(e.id).subscribe({
      next: () => {
        this.isLoading  = false;
        this.successMsg = 'Évaluation validée — PV généré !';
        this.charger();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg  = err?.error?.detail ?? 'Erreur lors de la validation.';
      },
    });
  }

  mentionFor(noteFinale: number): string {
    if (noteFinale >= 16) return 'Très bien';
    if (noteFinale >= 14) return 'Bien';
    if (noteFinale >= 12) return 'Assez bien';
    if (noteFinale >= 10) return 'Passable';
    return 'Non admis';
  }
}

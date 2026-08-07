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

  // ── Formulaire planification manuelle ─────────────────────────────────────
  form: SoutenanceForm = this.emptyForm();
  selectedEtudiant: EtudiantSansSoutenance | null = null;

  readonly SESSION_CHOICES = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Session ${i + 1}`,
  }));

  isLoading  = false;
  errorMsg   = '';
  successMsg = '';

  readonly MATERIEL = [
    { key: 'projecteur', label: 'Vidéoprojecteur',            ico: '📽' },
    { key: 'hdmi',       label: 'Câble HDMI',                 ico: '🔌' },
    { key: 'tableau',    label: 'Tableau blanc / Marqueurs',   ico: '🖊' },
    { key: 'micro',      label: 'Microphone / Sonorisation',  ico: '🎤' },
    { key: 'pc',         label: 'PC / Ordinateur de salle',   ico: '💻' },
    { key: 'clim',       label: 'Climatisation',              ico: '❄' },
    { key: 'internet',   label: 'Accès internet',             ico: '🌐' },
    { key: 'chaises',    label: 'Chaises / Tables suffisantes', ico: '🪑' },
  ];

  materielCheck: Record<string, boolean> = {};
  materielNote = '';

  get materielPret(): boolean {
    return this.MATERIEL.every(m => this.materielCheck[m.key]);
  }

  resetMateriel(): void {
    this.materielCheck = {};
    this.materielNote  = '';
  }

  // ── Planification automatique ─────────────────────────────────────────────
  showAutoModal  = signal(false);
  isProcessing   = signal(false);
  autoResult     = signal<{ planifiees: number; non_planifiees: number; taux: number; message?: string } | null>(null);
  autoError      = signal('');

  autoForm = {
    session:         '7',
    creneauxRaw:     '',
    sallesAll:       true,
    presidentsAll:   true,
    examinateursAll: true,
  };

  ouvrirAutoModal(): void {
    this.autoForm = { session: '7', creneauxRaw: '', sallesAll: true, presidentsAll: true, examinateursAll: true };
    this.autoResult.set(null);
    this.autoError.set('');
    if (!this.salles().length)      this.soutenanceService.getSalles().subscribe(d => this.salles.set(d));
    if (!this.presidents().length)  this.soutenanceService.getPresidents().subscribe(d => this.presidents.set(d));
    if (!this.examinateurs().length) this.soutenanceService.getExaminateurs().subscribe(d => this.examinateurs.set(d));
    this.showAutoModal.set(true);
  }

  lancerAlgorithme(): void {
    const lines = this.autoForm.creneauxRaw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      this.autoError.set('Veuillez saisir au moins un créneau (format : AAAA-MM-JJTHH:MM:SS).');
      return;
    }
    if (!this.autoForm.session) {
      this.autoError.set('Veuillez indiquer la session.');
      return;
    }

    this.isProcessing.set(true);
    this.autoError.set('');
    this.autoResult.set(null);

    const payload: {
      creneaux: string[];
      session: string;
      salles_ids?: number[];
      presidents_ids?: number[];
      examinateurs_ids?: number[];
    } = {
      creneaux: lines,
      session:  this.autoForm.session,
    };

    if (!this.autoForm.sallesAll)
      payload.salles_ids = this.salles().map(s => s.id);
    if (!this.autoForm.presidentsAll)
      payload.presidents_ids = this.presidents().map(p => p.id);
    if (!this.autoForm.examinateursAll)
      payload.examinateurs_ids = this.examinateurs().map(e => e.id);

    this.soutenanceService.planificationAuto(payload).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        this.autoResult.set(res);
        this.chargerSoutenances();
        this.chargerStats();
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.autoError.set(err?.error?.detail ?? 'Erreur lors de la planification automatique.');
      },
    });
  }

  constructor(private soutenanceService: SoutenanceService) {}

  ngOnInit(): void {
    this.chargerStats();
    this.chargerSoutenances();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  afficherVue(v: OrgaVue): void {
    this.vue.set(v);
    if (v === 'dashboard')   { this.chargerStats(); this.chargerSoutenances(); }
    if (v === 'planifier')   this.chargerPlanifier();
    if (v === 'soutenances') this.chargerSoutenances();
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

  // ── Sélection d'un étudiant ───────────────────────────────────────────────

  selectionnerEtudiant(e: EtudiantSansSoutenance): void {
    if (!e.est_eligible) {
      alert(`${e.prenom} ${e.nom} n'est pas encore éligible (UE ou frais non validés).`);
      return;
    }
    this.selectedEtudiant = e;
    this.form = { ...this.emptyForm(), etudiant: e.etudiant_id, theme: e.theme_id };
    this.errorMsg   = '';
    this.successMsg = '';
    this.resetMateriel();
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
        if (e?.blocage)            this.errorMsg = (e.blocage as string[]).join(' — ');
        else if (e?.non_field_errors) this.errorMsg = e.non_field_errors[0];
        else                       this.errorMsg = 'Erreur lors de la planification. Vérifiez les données.';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  membreNom(m: MembreJury): string {
    return `${m.first_name} ${m.last_name}${m.is_doctor ? ' (Dr)' : ''}`;
  }

  statutBadge(s: Soutenance): string {
    return s.est_cloturee ? 'badge-success' : 'badge-info';
  }

  private emptyForm(): SoutenanceForm {
    return {
      etudiant: 0, theme: 0, directeur_memoire: 0, president: 0,
      examinateur: 0, salle: 0, date_soutenance: '', session: '1', lien_meet: '',
    };
  }
}

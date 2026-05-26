import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  Evaluation,
  EtudiantSansSoutenance,
  MembreJury,
  Salle,
  Soutenance,
  SoutenanceForm,
  StatsSession,
} from '../../../../core/models/soutenance.model';
import { Theme } from '../../../../core/models/theme.model';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';
import { ThemeService } from '../../../../core/services/theme/theme';
import { EtudiantListItem, StudentService } from '../../../../core/services/student.service';
import { ToastService } from '../../../../shared/services/toast';

interface EtudiantSimple { id: number; nom: string; prenom: string; matricule: string; filiere: string; }

export type DirectionVue = 'dashboard' | 'affecter' | 'jury' | 'resultats' | 'proposer_theme' | 'etudiants';

@Component({
  selector: 'app-direction-themes',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './direction-themes.html',
  styleUrl: './direction-themes.scss',
})
export class DirectionThemesComponent implements OnInit {
  // ── État de la vue ────────────────────────────────────────────────────────
  vue = signal<DirectionVue>('dashboard');

  // ── Données ───────────────────────────────────────────────────────────────
  themesEnAttente = signal<Theme[]>([]);
  soutenances = signal<Soutenance[]>([]);
  etudiantsSans = signal<EtudiantSansSoutenance[]>([]);
  directeurs = signal<MembreJury[]>([]);
  presidents = signal<MembreJury[]>([]);
  examinateurs = signal<MembreJury[]>([]);
  salles = signal<Salle[]>([]);
  evaluations = signal<Evaluation[]>([]);
  statsSession = signal<StatsSession | null>(null);

  // ── Modal planification soutenance ───────────────────────────────────────
  showModal = false;
  isLoading = false;
  errorMsg = '';
  successMsg = '';
  selectedEtudiant: EtudiantSansSoutenance | null = null;

  form: SoutenanceForm = this.emptyForm();

  // ── Modal nouvelle session ────────────────────────────────────────────────
  showSessionModal = false;
  sessionForm = { numero: '1', label: '', date_debut: '', date_fin: '' };

  readonly SESSION_CHOICES = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Session ${i + 1}`,
  }));

  // ── Liste étudiants ──────────────────────────────────────────────────────
  tousEtudiants          = signal<EtudiantListItem[]>([]);
  etudiantsLoading       = signal(false);
  etudiantsSearch        = signal('');
  etudiantsFiliereFilter = signal('');

  filteredTousEtudiants = computed(() => {
    const q = this.etudiantsSearch().toLowerCase();
    const f = this.etudiantsFiliereFilter();
    return this.tousEtudiants().filter((e) => {
      const matchQ = !q || `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q);
      const matchF = !f || e.filiere_code === f;
      return matchQ && matchF;
    });
  });

  // ── Proposer un thème ────────────────────────────────────────────────────
  etudiants = signal<EtudiantSimple[]>([]);
  themeForm = { etudiant_id: 0, titre: '', domaine: '', description: '' };
  isSavingTheme = false;
  themeMsg = '';
  themeMsgType: 'success' | 'error' = 'success';

  readonly domaines = [
    { value: 'GL',         label: 'Génie Logiciel' },
    { value: 'ASSR',       label: 'Réseaux & Sécurité' },
    { value: 'DATA',       label: 'Data Science' },
    { value: 'IA',         label: 'Intelligence Artificielle' },
    { value: 'BLOCKCHAIN', label: 'Blockchain & Web3' },
    { value: 'IOT',        label: 'Internet des Objets' },
    { value: 'MOBILE',     label: 'Développement Mobile' },
    { value: 'CLOUD',      label: 'Cloud Computing' },
    { value: 'CYBER',      label: 'Cybersécurité' },
    { value: 'SID',        label: "Systèmes d'Information" },
    { value: 'AUTRE',      label: 'Autre' },
  ];

  constructor(
    private themeService: ThemeService,
    private soutenanceService: SoutenanceService,
    private studentService: StudentService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.chargerThemes();
    this.chargerStatsSession();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  afficherVue(v: DirectionVue): void {
    this.vue.set(v);
    if (v === 'dashboard') { this.chargerThemes(); this.chargerStatsSession(); }
    if (v === 'affecter') this.chargerAffecter();
    if (v === 'jury') this.chargerSoutenances();
    if (v === 'resultats') this.chargerEvaluations();
    if (v === 'proposer_theme') this.chargerEtudiants();
    if (v === 'etudiants') this.chargerTousEtudiants();
  }

  actualiser(): void {
    this.afficherVue(this.vue());
  }

  // ── Chargements ───────────────────────────────────────────────────────────

  chargerThemes(): void {
    this.themeService.getAllThemes().subscribe((data) => {
      this.themesEnAttente.set(data.filter((t) => t.statut === 'PENDING'));
    });
  }

  chargerStatsSession(): void {
    this.soutenanceService.getStats().subscribe({
      next: (s) => this.statsSession.set(s),
      error: () => this.statsSession.set(null),
    });
  }

  chargerAffecter(): void {
    this.soutenanceService.getEtudiantsSansSoutenance().subscribe((data) => this.etudiantsSans.set(data));
    this.chargerSelectsFormulaire();
  }

  chargerSoutenances(): void {
    this.soutenanceService.getSoutenances().subscribe((data) => this.soutenances.set(data));
  }

  chargerEvaluations(): void {
    this.soutenanceService.getEvaluations().subscribe((data) => this.evaluations.set(data));
  }

  chargerEtudiants(): void {
    this.themeService.getStudents().subscribe({
      next: (data: EtudiantSimple[]) => this.etudiants.set(data),
      error: () => this.toast.error('Impossible de charger la liste des étudiants.'),
    });
  }

  chargerTousEtudiants(): void {
    this.etudiantsLoading.set(true);
    this.studentService.getAllEtudiants().subscribe({
      next: (data) => { this.tousEtudiants.set(data); this.etudiantsLoading.set(false); },
      error: () => this.etudiantsLoading.set(false),
    });
  }

  phaseLabel(phase: number): string {
    const map: Record<number, string> = {
      1: 'Sans thème', 2: 'Thème soumis', 3: 'Thème validé',
      4: 'Directeur assigné', 6: 'Mémoire déposé', 7: 'Mémoire validé',
    };
    return map[phase] ?? `Phase ${phase}`;
  }

  phaseBadge(phase: number): string {
    if (phase >= 7) return 'badge-success';
    if (phase >= 4) return 'badge-info';
    if (phase >= 3) return 'badge-pending';
    return 'badge-neutral';
  }

  soumettreTheme(): void {
    const f = this.themeForm;
    if (!f.etudiant_id || !f.titre.trim() || !f.domaine || !f.description.trim()) {
      this.themeMsg = 'Veuillez remplir tous les champs.';
      this.themeMsgType = 'error';
      return;
    }
    this.isSavingTheme = true;
    this.themeMsg = '';
    this.themeService.submitThemeForStudent(f.etudiant_id, {
      titre: f.titre, domaine: f.domaine, description: f.description,
    }).subscribe({
      next: () => {
        this.isSavingTheme = false;
        this.themeMsg = 'Thème proposé avec succès. L\'étudiant est notifié.';
        this.themeMsgType = 'success';
        this.themeForm = { etudiant_id: 0, titre: '', domaine: '', description: '' };
        this.chargerThemes();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.isSavingTheme = false;
        this.themeMsg = err?.error?.detail ?? 'Erreur lors de la soumission.';
        this.themeMsgType = 'error';
      },
    });
  }

  chargerSelectsFormulaire(): void {
    forkJoin({
      internes: this.soutenanceService.getDirecteurs(),
      externes: this.soutenanceService.getDirecteursExternes(),
      presidents: this.soutenanceService.getPresidents(),
      examinateurs: this.soutenanceService.getExaminateurs(),
      salles: this.soutenanceService.getSalles(),
    }).subscribe(({ internes, externes, presidents, examinateurs, salles }) => {
      this.directeurs.set([...internes, ...externes]);
      this.presidents.set(presidents);
      this.examinateurs.set(examinateurs);
      this.salles.set(salles);
    });
  }

  // ── Actions thèmes (tableau de bord) ─────────────────────────────────────

  validerTheme(id: number): void {
    this.themeService.updateTheme(id, { statut: 'VALIDATED' }).subscribe(() => this.chargerThemes());
  }

  demanderCorrection(id: number): void {
    const feedback = prompt('Quel est le motif de la correction ?');
    if (feedback) {
      this.themeService
        .updateTheme(id, { statut: 'REJECTED', remarques_examinateur: feedback })
        .subscribe(() => this.chargerThemes());
    }
  }

  // ── Modal : Planifier une soutenance (affecter directeur + jury) ──────────

  ouvrirModal(etudiant: EtudiantSansSoutenance): void {
    if (!etudiant.est_eligible) {
      alert(`${etudiant.prenom} ${etudiant.nom} n'est pas encore éligible (UE ou frais non validés).`);
      return;
    }
    this.selectedEtudiant = etudiant;
    this.form = { ...this.emptyForm(), etudiant: etudiant.etudiant_id, theme: etudiant.theme_id };
    this.showModal = true;
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.salles().length) this.chargerSelectsFormulaire();
  }

  fermerModal(): void {
    this.showModal = false;
    this.selectedEtudiant = null;
    this.form = this.emptyForm();
    this.errorMsg = '';
    this.successMsg = '';
  }

  soumettreSoutenance(): void {
    const f = this.form;
    if (!f.directeur_memoire || !f.president || !f.examinateur || !f.salle || !f.date_soutenance) {
      this.errorMsg = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.soutenanceService.creerSoutenance(f).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Soutenance planifiée avec succès !';
        setTimeout(() => {
          this.fermerModal();
          this.chargerAffecter();
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        const e = err?.error;
        if (e?.blocage) this.errorMsg = (e.blocage as string[]).join(' — ');
        else if (e?.non_field_errors) this.errorMsg = e.non_field_errors[0];
        else this.errorMsg = 'Erreur lors de la planification. Vérifiez les données.';
      },
    });
  }

  // ── Actions jury ──────────────────────────────────────────────────────────

  ouvrirModalJury(soutenance: Soutenance): void {
    this.selectedEtudiant = {
      etudiant_id: soutenance.etudiant,
      theme_id: soutenance.theme,
      nom: soutenance.etudiant_details ?? '',
      prenom: '',
      matricule: '',
      filiere: soutenance.filiere ?? '',
      titre_theme: '',
      est_eligible: true,
    };
    this.form = {
      etudiant: soutenance.etudiant,
      theme: soutenance.theme,
      directeur_memoire: soutenance.directeur_memoire,
      president: soutenance.president,
      examinateur: soutenance.examinateur,
      salle: soutenance.salle,
      date_soutenance: soutenance.date_soutenance,
      session: soutenance.session,
      lien_meet: soutenance.lien_meet ?? '',
    };
    this.showModal = true;
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.salles().length) this.chargerSelectsFormulaire();
  }

  mettreAJourJury(id: number): void {
    const f = this.form;
    if (!f.president || !f.examinateur || !f.directeur_memoire) {
      this.errorMsg = 'Veuillez renseigner tous les membres du jury.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';
    this.soutenanceService
      .mettreAJourSoutenance(id, {
        president: f.president,
        examinateur: f.examinateur,
        directeur_memoire: f.directeur_memoire,
        salle: f.salle,
        date_soutenance: f.date_soutenance,
        session: f.session,
        lien_meet: f.lien_meet || undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMsg = 'Jury mis à jour !';
          setTimeout(() => {
            this.fermerModal();
            this.chargerSoutenances();
          }, 1200);
        },
        error: () => {
          this.isLoading = false;
          this.errorMsg = 'Erreur lors de la mise à jour.';
        },
      });
  }

  // ── Valider résultats ─────────────────────────────────────────────────────

  cloturerSoutenance(id: number, etudiant: string): void {
    if (confirm(`Clôturer définitivement la soutenance de ${etudiant} ? Cette action est irréversible.`)) {
      this.soutenanceService.cloturerSoutenance(id).subscribe({
        next: () => this.chargerEvaluations(),
        error: (err) => alert(err?.error?.detail ?? 'Erreur lors de la clôture.'),
      });
    }
  }

  // ── Nouvelle session ──────────────────────────────────────────────────────

  ouvrirSessionModal(): void {
    this.showSessionModal = true;
    this.sessionForm = { numero: '1', label: '', date_debut: '', date_fin: '' };
  }

  fermerSessionModal(): void {
    this.showSessionModal = false;
  }

  confirmerNouvelleSession(): void {
    const { numero, label, date_debut, date_fin } = this.sessionForm;
    if (!date_debut || !date_fin) {
      alert('Veuillez saisir les dates de début et de fin de session.');
      return;
    }
    alert(
      `Session ${numero}${label ? ' — ' + label : ''} configurée du ${date_debut} au ${date_fin}.\n` +
        'Vous pouvez maintenant planifier les soutenances pour cette session.',
    );
    this.fermerSessionModal();
    this.afficherVue('affecter');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  membreNom(m: MembreJury): string {
    return `${m.first_name} ${m.last_name}${m.is_doctor ? ' (Dr)' : ''}`;
  }

  mentionClass(mention: string): string {
    if (mention === 'Très bien') return 'badge-success';
    if (mention === 'Bien' || mention === 'Assez bien') return 'badge-info';
    if (mention === 'Passable') return 'badge-warn';
    return 'badge-danger';
  }

  private emptyForm(): SoutenanceForm {
    return {
      etudiant: 0,
      theme: 0,
      directeur_memoire: 0,
      president: 0,
      examinateur: 0,
      salle: 0,
      date_soutenance: '',
      session: '1',
      lien_meet: '',
    };
  }
}

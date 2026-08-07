import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  DirecteurAvecEtudiants,
  DossierExamen, ExamenService,
  NotesEtudiant, SaisieNote, UeNote,
} from '../../../../core/services/examen/examen';
import { MembreJury } from '../../../../core/models/soutenance.model';
import { EtudiantListItem, StudentService } from '../../../../core/services/student.service';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';
import { Soutenance } from '../../../../core/models/soutenance.model';

type Tab = 'dossiers' | 'valides' | 'directeurs' | 'notes' | 'etudiants' | 'soutenances';


@Component({
  selector: 'app-examen-check',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav, DatePipe],
  templateUrl: './examen-check.html',
  styleUrl: './examen-check.scss',
})
export class ExamenCheckComponent implements OnInit {

  readonly filieres = [
    { code: 'GL',   label: 'Génie Logiciel' },
    { code: 'RSS',  label: 'Réseaux Systèmes Sécurité' },
    { code: 'DWM',  label: 'Développement Web & Mobile' },
    { code: 'CS',   label: 'Cybersécurité' },
    { code: 'WDIG', label: 'Web Design Infographie' },
  ];

  // ── Tab ──────────────────────────────────────────────────────────────
  activeTab = signal<Tab>('dossiers');

  // ── Dossiers tab ─────────────────────────────────────────────────────
  dossiers        = signal<DossierExamen[]>([]);
  searchTerm      = signal('');
  niveauFilter    = signal('');
  selectedDossier = signal<DossierExamen | null>(null);
  isLoading       = signal(false);
  errorMsg        = signal('');

  filteredDossiers = computed(() => {
    const q = this.searchTerm().toLowerCase();
    const n = this.niveauFilter();
    return this.dossiers().filter((d) => {
      const matchSearch =
        !q ||
        d.etudiant_nom.toLowerCase().includes(q) ||
        d.matricule.toLowerCase().includes(q);
      const matchNiveau = !n || d.niveau.includes(n);
      return matchSearch && matchNiveau;
    });
  });

  stats = computed(() => ({
    total:     this.dossiers().length,
    enAttente: this.dossiers().filter((d) => d.statut === 'PENDING').length,
    valides:   this.dossiers().filter((d) => d.statut === 'VALIDATED').length,
    bloques:   this.dossiers().filter((d) => d.statut === 'BLOCKED').length,
    rejetes:   this.dossiers().filter((d) => d.statut === 'REJECTED').length,
  }));

  // ── Année académique globale ──────────────────────────────────────────
  anneeAcademique = signal('2025-2026');

  // ── Notes tab ─────────────────────────────────────────────────────────
  notesEtudiantSearch = signal('');
  notesFiliereFilter  = signal('');
  selectedEtudiantId  = signal<number | null>(null);
  notesData           = signal<NotesEtudiant | null>(null);
  notesDraft          = signal<Record<number, string>>({});
  notesLoading        = signal(false);
  notesSuccess        = signal('');
  notesError          = signal('');

  filteredDossiersNotes = computed(() => {
    const q = this.notesEtudiantSearch().toLowerCase();
    const f = this.notesFiliereFilter();
    return this.dossiers().filter((d) => {
      const matchQ = !q || d.etudiant_nom.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
      const matchF = !f || d.filiere === f;
      return matchQ && matchF;
    });
  });

  notesBySemestre = computed(() => {
    const data = this.notesData();
    if (!data) return [];
    const map = new Map<number, UeNote[]>();
    for (const ue of data.ues) {
      if (!map.has(ue.semestre)) map.set(ue.semestre, []);
      map.get(ue.semestre)!.push(ue);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  });

  // ── Liste étudiants tab ───────────────────────────────────────────────
  etudiants              = signal<EtudiantListItem[]>([]);
  etudiantsLoading       = signal(false);
  etudiantsSearch        = signal('');
  etudiantsFiliereFilter = signal('');
  rattrapageFiliereFilter = signal('');

  filteredEtudiants = computed(() => {
    const q = this.etudiantsSearch().toLowerCase();
    const f = this.etudiantsFiliereFilter();
    return this.etudiants().filter((e) => {
      const matchQ = !q || `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q);
      const matchF = !f || e.filiere_code === f;
      return matchQ && matchF;
    });
  });

  etudiantsEligibles = computed(() =>
    this.filteredEtudiants().filter(e => e.eligible)
  );

  etudiantsRattrapage = computed(() => {
    const f = this.rattrapageFiliereFilter();
    return this.etudiants().filter(e => {
      const hasEchec = e.ue_validees < e.total_ue;
      const matchF   = !f || e.filiere_code === f;
      return hasEchec && matchF;
    });
  });

  // ── Onglet : documents validés ───────────────────────────────────────
  dossiersValides = computed(() => this.dossiers().filter(d => d.statut === 'VALIDATED'));

  statsValides = computed(() => {
    const v = this.dossiersValides();
    const avecExaminateur = v.filter(d => !!d.examinateur_assigne_id).length;
    return { avecExaminateur, sansExaminateur: v.length - avecExaminateur };
  });

  // ── Onglet : directeurs avec étudiants ───────────────────────────────
  directeurs             = signal<DirecteurAvecEtudiants[]>([]);
  directeursLoading      = signal(false);
  directeursSearch       = signal('');

  filteredDirecteurs = computed(() => {
    const q = this.directeursSearch().toLowerCase();
    if (!q) return this.directeurs();
    return this.directeurs().filter(d =>
      `${d.nom} ${d.prenom}`.toLowerCase().includes(q) ||
      d.etudiants.some(e => `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q))
    );
  });

  // ── Modal assignation examinateur ────────────────────────────────────
  showAssignModal       = signal(false);
  assignThemeId         = signal(0);
  assignThemeNom        = signal('');
  examinateurs          = signal<MembreJury[]>([]);
  selectedExaminateurId = signal<number | null>(null);
  isAssigning           = false;
  assignError           = signal('');

  // ── Validation directe depuis la table ───────────────────────────────
  isValidating     = signal<number | null>(null);
  validationMsg    = signal<{ id: number; ok: boolean; texte: string } | null>(null);

  // ── Modal blocage dossier ─────────────────────────────────────────────
  showBlocageModal    = signal(false);
  blocageDossierTmp   = signal<number>(0);
  blocageDossierNom   = signal('');
  blocageDossierRaisons = signal<string[]>([]);
  blocageMotif        = signal('');
  isBlocage           = false;
  isDeblocage         = signal<number | null>(null);

  // ── Modal rejet dossier (thème, DA workflow) ─────────────────────────
  showRejetModal   = signal(false);
  rejetDossierTmp  = signal<number>(0);
  rejetDossierNom  = signal('');
  rejetMotif       = signal('');
  isRejeting       = false;

  // ── Soutenances tab ──────────────────────────────────────────────────
  soutenances        = signal<Soutenance[]>([]);
  soutenancesLoading = signal(false);
  soutenancesSearch  = signal('');
  soutenancesDate    = signal('');


  filteredSoutenances = computed(() => {
    const q = this.soutenancesSearch().toLowerCase();
    const d = this.soutenancesDate();
    return this.soutenances()
      .filter(s => {
        const matchQ = !q ||
          (s.etudiant_details ?? '').toLowerCase().includes(q) ||
          (s.filiere ?? '').toLowerCase().includes(q) ||
          (s.president_nom ?? '').toLowerCase().includes(q) ||
          (s.examinateur_nom ?? '').toLowerCase().includes(q);
        const matchD = !d || s.date_soutenance.startsWith(d);
        return matchQ && matchD;
      })
      .sort((a, b) => a.date_soutenance.localeCompare(b.date_soutenance));
  });

  statsSoutenances = computed(() => {
    const all  = this.soutenances();
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    return {
      total:      all.length,
      cloturees:  all.filter(s => s.est_cloturee).length,
      aVenir:     all.filter(s => !s.est_cloturee && s.date_soutenance >= today).length,
      cetteS:     all.filter(s => s.date_soutenance >= today && s.date_soutenance <= weekEnd).length,
    };
  });

  constructor(
    private examenService: ExamenService,
    private studentService: StudentService,
    private soutenanceService: SoutenanceService,
  ) {}

  ngOnInit(): void {
    this.chargerDossiers();
    this.chargerEtudiants();
    this.chargerSoutenances();
    this.chargerDirecteurs();
    this.chargerExaminateurs();
  }

  chargerDirecteurs(): void {
    this.directeursLoading.set(true);
    this.examenService.getDirecteursAvecEtudiants().subscribe({
      next:  d => { this.directeurs.set(d); this.directeursLoading.set(false); },
      error: () => this.directeursLoading.set(false),
    });
  }

  chargerExaminateurs(): void {
    forkJoin({
      internes: this.soutenanceService.getDirecteurs(),
      externes: this.soutenanceService.getDirecteursExternes(),
    }).subscribe({
      next: ({ internes, externes }) => this.examinateurs.set([...internes, ...externes]),
      error: () => {},
    });
  }

  // ── Assignation examinateur ──────────────────────────────────────────

  ouvrirAssignModal(d: DossierExamen): void {
    this.assignThemeId.set(d.id);
    this.assignThemeNom.set(d.etudiant_nom);
    this.selectedExaminateurId.set(d.examinateur_assigne_id ?? null);
    this.assignError.set('');
    this.showAssignModal.set(true);
  }

  fermerAssignModal(): void {
    this.showAssignModal.set(false);
    this.assignThemeId.set(0);
    this.assignError.set('');
  }

  confirmerAssignation(): void {
    const examId = this.selectedExaminateurId();
    if (!examId) { this.assignError.set('Veuillez sélectionner un examinateur.'); return; }
    this.isAssigning = true;
    this.assignError.set('');
    this.examenService.assignerExaminateur(this.assignThemeId(), examId).subscribe({
      next: () => {
        this.isAssigning = false;
        this.fermerAssignModal();
        this.chargerDossiers();
      },
      error: err => {
        this.isAssigning = false;
        this.assignError.set(err?.error?.detail ?? 'Erreur lors de l\'assignation.');
      },
    });
  }

  chargerSoutenances(): void {
    this.soutenancesLoading.set(true);
    this.soutenanceService.getSoutenances().subscribe({
      next:  data => { this.soutenances.set(data); this.soutenancesLoading.set(false); },
      error: ()   => this.soutenancesLoading.set(false),
    });
  }

  chargerEtudiants(): void {
    this.etudiantsLoading.set(true);
    this.studentService.getAllEtudiants().subscribe({
      next: (data) => { this.etudiants.set(data); this.etudiantsLoading.set(false); },
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

  chargerDossiers(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.examenService.getDossiersExamen().subscribe({
      next: (data) => {
        this.dossiers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les dossiers.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Dossiers actions ─────────────────────────────────────────────────

  actionLabel(d: DossierExamen): string {
    if (d.paiement === 'NON_PAYE') return 'Bloquer';
    if (d.anti_ia === 'SUSPICION') return 'Rejeter';
    if (d.statut === 'VALIDATED')  return 'Validé';
    if (d.statut === 'REJECTED')   return 'Rejeté';
    return 'Vérifier';
  }

  doAction(d: DossierExamen): void {
    if (d.statut === 'VALIDATED' || d.statut === 'REJECTED') return;
    this.selectedDossier.set(d);
  }

  retourListe(): void {
    this.selectedDossier.set(null);
  }

  approuverDossier(id: number): void {
    this.examenService.updateStatutTheme(id, 'VALIDATED', 'Conforme aux attentes.').subscribe({
      next: () => {
        this.selectedDossier.set(null);
        this.chargerDossiers();
      },
      error: () => this.errorMsg.set('Erreur lors de la validation.'),
    });
  }

  // ── Blocage ──────────────────────────────────────────────────────────

  ouvrirBlocageModal(d: DossierExamen): void {
    this.blocageDossierTmp.set(d.id);
    this.blocageDossierNom.set(d.etudiant_nom);
    this.blocageDossierRaisons.set(this.raisonsBlockage(d));
    this.blocageMotif.set('');
    this.showBlocageModal.set(true);
  }

  fermerBlocageModal(): void {
    this.showBlocageModal.set(false);
    this.blocageDossierTmp.set(0);
    this.blocageMotif.set('');
    this.blocageDossierRaisons.set([]);
  }

  confirmerBlocage(): void {
    const motif = this.blocageMotif().trim();
    this.isBlocage = true;
    this.examenService.bloquerDossier(this.blocageDossierTmp(), motif).subscribe({
      next: () => {
        this.isBlocage = false;
        this.fermerBlocageModal();
        this.selectedDossier.set(null);
        const id = this.blocageDossierTmp();
        this.dossiers.update(list =>
          list.map(x => x.id === id ? { ...x, statut: 'BLOCKED' as const } : x)
        );
        this.validationMsg.set({ id, ok: false, texte: `Dossier de ${this.blocageDossierNom()} bloqué. L'étudiant et son directeur ont été notifiés.` });
        setTimeout(() => this.validationMsg.set(null), 6000);
        this.chargerDossiers();
      },
      error: () => {
        this.isBlocage = false;
        this.errorMsg.set('Erreur lors du blocage.');
      },
    });
  }

  debloquerDossier(d: DossierExamen): void {
    if (this.isDeblocage() !== null) return;
    this.isDeblocage.set(d.id);
    this.examenService.debloquerDossier(d.id).subscribe({
      next: () => {
        this.isDeblocage.set(null);
        this.dossiers.update(list =>
          list.map(x => x.id === d.id ? { ...x, statut: 'PENDING' as const } : x)
        );
        this.validationMsg.set({ id: d.id, ok: true, texte: `Dossier de ${d.etudiant_nom} débloqué — retour en vérification.` });
        setTimeout(() => this.validationMsg.set(null), 5000);
      },
      error: () => { this.isDeblocage.set(null); },
    });
  }

  // ── Rejet (workflow thème DA) ─────────────────────────────────────────

  ouvrirRejetModal(id: number, nom: string): void {
    this.rejetDossierTmp.set(id);
    this.rejetDossierNom.set(nom);
    this.rejetMotif.set('');
    this.showRejetModal.set(true);
  }

  fermerRejetModal(): void {
    this.showRejetModal.set(false);
    this.rejetDossierTmp.set(0);
    this.rejetMotif.set('');
  }

  confirmerRejet(): void {
    const motif = this.rejetMotif().trim();
    if (!motif) return;
    this.isRejeting = true;
    this.examenService.updateStatutTheme(this.rejetDossierTmp(), 'REJECTED', motif).subscribe({
      next: () => {
        this.isRejeting = false;
        this.fermerRejetModal();
        this.selectedDossier.set(null);
        this.chargerDossiers();
      },
      error: () => {
        this.isRejeting = false;
        this.errorMsg.set('Erreur lors du rejet.');
      },
    });
  }

  rejeterDossier(id: number): void {
    const d = this.selectedDossier();
    this.ouvrirRejetModal(id, d?.etudiant_nom ?? '');
  }

  raisonsBlockage(d: DossierExamen): string[] {
    const raisons: string[] = [];
    if (d.total_ue > 0 && d.ue_validees < d.total_ue)
      raisons.push(`UE incomplètes (${d.ue_validees}/${d.total_ue} validées)`);
    if (d.paiement === 'NON_PAYE') raisons.push('Frais de soutenance non réglés');
    if (d.anti_ia === 'SUSPICION') raisons.push('Mémoire suspecté d\'être généré par IA');
    if (d.score_plagiat > 25) raisons.push(`Taux de similarité trop élevé (${d.score_plagiat}% > 25%)`);
    return raisons;
  }

  isDossierBloque(d: DossierExamen): boolean {
    return this.raisonsBlockage(d).length > 0;
  }

  estConforme(d: DossierExamen): boolean {
    if (d.statut !== 'PENDING') return false;
    return (
      d.paiement === 'PAYE' &&
      d.anti_ia !== 'SUSPICION' &&
      d.score_plagiat <= 25 &&
      (d.total_ue === 0 || d.ue_validees >= d.total_ue)
    );
  }

  validerDossierDirect(d: DossierExamen): void {
    if (this.isValidating() !== null) return;
    this.isValidating.set(d.id);
    this.validationMsg.set(null);
    this.examenService.validerDossier(d.id).subscribe({
      next: () => {
        this.isValidating.set(null);
        this.validationMsg.set({ id: d.id, ok: true, texte: `Dossier de ${d.etudiant_nom} validé avec succès. L\'étudiant a été notifié.` });
        this.dossiers.update(list =>
          list.map(x => x.id === d.id ? { ...x, statut: 'VALIDATED' as const } : x)
        );
        setTimeout(() => this.validationMsg.set(null), 5000);
      },
      error: (err) => {
        this.isValidating.set(null);
        this.validationMsg.set({ id: d.id, ok: false, texte: err?.error?.detail ?? 'Erreur lors de la validation.' });
      },
    });
  }

  // ── Notes actions ────────────────────────────────────────────────────

  selectionnerEtudiant(dossier: DossierExamen): void {
    const etudiantId = dossier.etudiant_id;
    if (!etudiantId) return;
    this.selectedEtudiantId.set(etudiantId);
    this.notesData.set(null);
    this.notesDraft.set({});
    this.notesSuccess.set('');
    this.notesError.set('');
    this.notesLoading.set(true);
    this.examenService.getNotesEtudiant(etudiantId).subscribe({
      next: (data) => {
        this.notesData.set(data);
        const draft: Record<number, string> = {};
        for (const ue of data.ues) {
          draft[ue.ue_id] = ue.note !== null ? String(ue.note) : '';
        }
        this.notesDraft.set(draft);
        this.notesLoading.set(false);
      },
      error: () => {
        this.notesError.set("Impossible de charger les notes de cet étudiant.");
        this.notesLoading.set(false);
      },
    });
  }

  retourListeNotes(): void {
    this.selectedEtudiantId.set(null);
    this.notesData.set(null);
  }

  noteValue(ueId: number): string {
    return this.notesDraft()[ueId] ?? '';
  }

  setNote(ueId: number, val: string): void {
    this.notesDraft.update((d) => ({ ...d, [ueId]: val }));
  }

  statutNote(ueId: number): 'ok' | 'fail' | '' {
    const v = this.notesDraft()[ueId];
    if (v === '' || v === undefined) return '';
    const n = parseFloat(v);
    if (isNaN(n)) return '';
    return n >= 10 ? 'ok' : 'fail';
  }

  enregistrerEtNotifier(): void {
    const data   = this.notesData();
    const eid    = this.selectedEtudiantId();
    const annee  = this.anneeAcademique();
    const draft  = this.notesDraft();
    if (!data || !eid) return;

    const notes: SaisieNote[] = Object.entries(draft)
      .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
      .map(([id, v]) => ({ ue_id: Number(id), note: parseFloat(v) }));

    if (notes.length === 0) {
      this.notesError.set('Aucune note saisie.');
      return;
    }

    this.notesLoading.set(true);
    this.notesSuccess.set('');
    this.notesError.set('');

    this.examenService.saisirEtNotifier(eid, annee, notes).subscribe({
      next: (res) => {
        this.notesLoading.set(false);
        if (res.nb_echouees > 0) {
          this.notesSuccess.set(
            `Notes enregistrées — ${res.nb_echouees} UE(s) échouée(s). ` +
            `Relevé envoyé à l'étudiant. Service Recouvrement alerté pour préparer la facture.`,
          );
        } else {
          this.notesSuccess.set('Notes enregistrées — toutes les UE saisies sont validées. Relevé envoyé.');
        }
        this.examenService.getNotesEtudiant(eid).subscribe((d) => this.notesData.set(d));
      },
      error: () => {
        this.notesLoading.set(false);
        this.notesError.set("Erreur lors de l'enregistrement des notes.");
      },
    });
  }

  trackUeId(_: number, ue: UeNote): number { return ue.ue_id; }

  // ── Export CSV ───────────────────────────────────────────────────────

  telechargerListeEligibles(): void {
    const data = this.etudiantsEligibles();
    if (!data.length) return;
    const rows = data.map(e => ({
      Nom: e.nom, Prénom: e.prenom, Matricule: e.matricule,
      Filière: e.filiere_code,
      'UE validées': `${e.ue_validees}/${e.total_ue}`,
      Frais: e.has_paid_fees ? 'Payé' : 'Non payé',
      Éligible: 'Oui',
    }));
    this._downloadCSV(rows, `eligibles-${this.anneeAcademique()}.csv`);
  }

  telechargerListeRattrapages(): void {
    const data = this.etudiantsRattrapage();
    if (!data.length) return;
    const rows = data.map(e => ({
      Nom: e.nom, Prénom: e.prenom, Matricule: e.matricule,
      Filière: e.filiere_code,
      'UE validées': e.ue_validees,
      'Total UE': e.total_ue,
      'UE manquantes': e.total_ue - e.ue_validees,
    }));
    const f = this.rattrapageFiliereFilter();
    this._downloadCSV(rows, `rattrapages${f ? '-' + f : ''}-${this.anneeAcademique()}.csv`);
  }

  private _downloadCSV(rows: Record<string, unknown>[], filename: string): void {
    const sep     = ';';
    const headers = Object.keys(rows[0]).join(sep);
    const lines   = rows.map(r => Object.values(r).map(v => `"${v}"`).join(sep));
    const csv     = '﻿' + [headers, ...lines].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

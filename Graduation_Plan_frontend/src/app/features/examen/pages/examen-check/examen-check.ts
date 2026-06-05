import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  DossierExamen, ExamenService,
  NotesEtudiant, SaisieNote, UeNote,
} from '../../../../core/services/examen/examen';
import { EtudiantListItem, StudentService } from '../../../../core/services/student.service';
import { SoutenanceService } from '../../../../core/services/soutenance/soutenance';
import { Soutenance } from '../../../../core/models/soutenance.model';

type Tab = 'dossiers' | 'notes' | 'etudiants' | 'soutenances';


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

  rejeterDossier(id: number): void {
    const motif = prompt('Motif du rejet :') ?? '';
    if (!motif) return;
    this.examenService.updateStatutTheme(id, 'REJECTED', motif).subscribe({
      next: () => {
        this.selectedDossier.set(null);
        this.chargerDossiers();
      },
      error: () => this.errorMsg.set('Erreur lors du rejet.'),
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

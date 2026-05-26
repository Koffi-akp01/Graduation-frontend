import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  DossierExamen, ExamenService,
  NotesEtudiant, SaisieNote, UeNote,
} from '../../../../core/services/examen/examen';
import { EtudiantListItem, StudentService } from '../../../../core/services/student.service';

type Tab = 'dossiers' | 'notes' | 'etudiants';

@Component({
  selector: 'app-examen-check',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './examen-check.html',
  styleUrl: './examen-check.scss',
})
export class ExamenCheckComponent implements OnInit {
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

  // ── Notes tab ─────────────────────────────────────────────────────────
  notesEtudiantSearch  = signal('');
  selectedEtudiantId   = signal<number | null>(null);
  notesData            = signal<NotesEtudiant | null>(null);
  notesDraft           = signal<Record<number, string>>({});
  anneeAcademique      = signal('2025-2026');
  notesLoading         = signal(false);
  notesSuccess         = signal('');
  notesError           = signal('');

  filteredDossiersNotes = computed(() => {
    const q = this.notesEtudiantSearch().toLowerCase();
    return this.dossiers().filter(
      (d) => !q || d.etudiant_nom.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q),
    );
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
  etudiants          = signal<EtudiantListItem[]>([]);
  etudiantsLoading   = signal(false);
  etudiantsSearch    = signal('');
  etudiantsFiliereFilter = signal('');

  filteredEtudiants = computed(() => {
    const q = this.etudiantsSearch().toLowerCase();
    const f = this.etudiantsFiliereFilter();
    return this.etudiants().filter((e) => {
      const matchQ = !q || `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q);
      const matchF = !f || e.filiere_code === f;
      return matchQ && matchF;
    });
  });

  constructor(
    private examenService: ExamenService,
    private studentService: StudentService,
  ) {}

  ngOnInit(): void {
    this.chargerDossiers();
    this.chargerEtudiants();
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
}

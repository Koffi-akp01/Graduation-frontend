import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { EtudiantService } from '../../../../core/services/etudiant/etudiant';
import { EligibiliteStatus, EtudiantProfile } from '../../../../core/models/etudiant.model';

export interface DashboardStatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  /** Affiche une coche verte après la valeur (ex. frais payés). */
  showCheck?: boolean;
}

export type ChecklistItemState = 'done' | 'pending' | 'failed';

export interface ChecklistItem {
  label: string;
  state: ChecklistItemState;
}

export interface EligibilityProgress {
  done: number;
  total: number;
  percent: number;
}

export type MemoireStatusVariant = 'warning' | 'success' | 'neutral';

export interface MemoireDashboardInfo {
  titre: string;
  directeur: string;
  niveauLabel: string;
  version: string;
  statusLabel: string;
  statusVariant: MemoireStatusVariant;
  pagesCurrent: number;
  pagesTarget: number;
  commentBody: string;
}

export interface SoutenanceScheduleInfo {
  isPlanned: boolean;
  dateHeure: string;
  salle: string;
  presidentJury: string;
  examinateur: string;
  /** URL absolue du PDF de convocation, si disponible. */
  convocationUrl: string | null;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TopNav],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  currentStep = signal<number>(1);
  etudiantData = signal<EtudiantProfile | null>(null);
  statsCards = signal<DashboardStatCard[]>(this.defaultStatCards());
  checklistItems = signal<ChecklistItem[]>(this.defaultChecklist());
  eligibilityProgress = signal<EligibilityProgress>({ done: 0, total: 7, percent: 0 });
  memoireInfo = signal<MemoireDashboardInfo>(this.defaultMemoireInfo());
  soutenanceSchedule = signal<SoutenanceScheduleInfo>(this.defaultSoutenanceSchedule());

  /** Phases backend a partir desquelles chaque etape dossier (1–6) est consideree comme franchie. */
  private readonly dossierMilestonePhases = [3, 4, 6, 7, 10, 11];

  dossierSteps = [
    { id: 1, label: 'Thème validé' },
    { id: 2, label: 'Directeur affecté' },
    { id: 3, label: 'Mémoire déposé' },
    { id: 4, label: 'Validation mémoire' },
    { id: 5, label: 'Soutenance planifiée' },
    { id: 6, label: 'Résultats publiés' },
  ];

  constructor(private etudiantService: EtudiantService) {}

  /** Index 1–6 de l’etape dossier en cours, ou 0 si tout est termine (phase >= 11). */
  activeDossierStep(phase: number): number {
    const p = phase ?? 1;
    if (p >= 11) {
      return 0;
    }
    for (let i = 0; i < this.dossierMilestonePhases.length; i++) {
      if (p < this.dossierMilestonePhases[i]) {
        return i + 1;
      }
    }
    return 6;
  }

  dossierStepCompleted(phase: number, stepId: number): boolean {
    const idx = stepId - 1;
    return (phase ?? 1) >= this.dossierMilestonePhases[idx];
  }

  dossierStepActive(phase: number, stepId: number): boolean {
    const cur = this.activeDossierStep(phase);
    return cur !== 0 && cur === stepId;
  }

  dossierStepDisabled(phase: number, stepId: number): boolean {
    const cur = this.activeDossierStep(phase);
    return cur !== 0 && cur < stepId;
  }

  dossierLineActive(phase: number, afterStepId: number): boolean {
    return this.dossierStepCompleted(phase, afterStepId);
  }

  ngOnInit(): void {
    this.etudiantService
      .getProfile()
      .pipe(
        switchMap((data) =>
          this.etudiantService.getEligibilite().pipe(
            catchError(() => of(null)),
            map((elig) => ({ data, elig })),
          ),
        ),
      )
      .subscribe(({ data, elig }) => {
        this.etudiantData.set(data);
        this.currentStep.set(data.current_phase ?? 1);
        this.statsCards.set(this.buildStatCards(data, elig));
        const items = this.buildChecklist(data, elig);
        this.checklistItems.set(items);
        this.eligibilityProgress.set(this.computeEligibilityProgress(items));
        this.memoireInfo.set(this.buildMemoireInfo(data));
        this.soutenanceSchedule.set(this.buildSoutenanceSchedule(data));
      });
  }

  private defaultStatCards(): DashboardStatCard[] {
    return [
      { label: 'STATUT DOSSIER', value: 'En cours', sub: 'Chargement…', icon: '📁' },
      { label: 'UE VALIDÉES', value: '—/—', sub: '—', icon: '📚' },
      {
        label: 'FRAIS DE SOUTENANCE',
        value: '—',
        sub: '—',
        icon: '💳',
        showCheck: false,
      },
      { label: 'DÉLAI RESTANT', value: '—', sub: '—', icon: '⏳' },
    ];
  }

  private dossierStatFromPhase(phase: number): { value: string; sub: string } {
    if (phase >= 11) {
      return { value: 'Clôturé', sub: 'Dossier de soutenance terminé' };
    }
    if (phase >= 9) {
      return { value: 'En cours', sub: 'Soutenance planifiée ou réalisée' };
    }
    if (phase >= 6) {
      return { value: 'En cours', sub: 'Mémoire en attente de validation' };
    }
    if (phase >= 5) {
      return { value: 'En cours', sub: 'Mémoire déposé — validation en attente' };
    }
    if (phase >= 3) {
      return { value: 'En cours', sub: 'Rédaction sous direction du directeur' };
    }
    return { value: 'En cours', sub: 'Thème ou dossier en traitement' };
  }

  private buildStatCards(profile: EtudiantProfile, elig: EligibiliteStatus | null): DashboardStatCard[] {
    const phase = profile.current_phase ?? 1;
    const dossier = this.dossierStatFromPhase(phase);
    const year = new Date().getFullYear();
    const fraisOk = elig?.frais_payes === true;

    return [
      { label: 'STATUT DOSSIER', value: dossier.value, sub: dossier.sub, icon: '📁' },
      {
        label: 'UE VALIDÉES',
        value: '14/15',
        sub:
          elig == null
            ? 'Détail non disponible'
            : elig.ue_validees
              ? '1 UE en attente de note'
              : 'UE à compléter',
        icon: '📚',
      },
      {
        label: 'FRAIS DE SOUTENANCE',
        value: fraisOk ? 'Payé' : 'À régler',
        sub: fraisOk ? `Reçu N° REC-${year}-0418` : 'Paiement requis avant soutenance',
        icon: '💳',
        showCheck: fraisOk,
      },
      { label: 'DÉLAI RESTANT', value: '18j', sub: 'Avant clôture des dépôts', icon: '⏳' },
    ];
  }

  private defaultChecklist(): ChecklistItem[] {
    return [
      { label: 'Toutes les UE obligatoires validées', state: 'pending' },
      { label: 'Frais de soutenance payés', state: 'pending' },
      { label: 'Thème de mémoire validé', state: 'pending' },
      { label: 'Directeur de mémoire désigné', state: 'pending' },
      { label: 'Mémoire validé par le directeur', state: 'pending' },
      { label: '1 UE en attente (note non saisie)', state: 'pending' },
      { label: 'Vérification anti-plagiat / anti-IA', state: 'pending' },
    ];
  }

  private boolState(elig: EligibiliteStatus | null, ok: boolean | undefined): ChecklistItemState {
    if (elig == null) {
      return 'pending';
    }
    return ok ? 'done' : 'failed';
  }

  private buildChecklist(profile: EtudiantProfile, elig: EligibiliteStatus | null): ChecklistItem[] {
    const phase = profile.current_phase ?? 1;
    const ueOk = elig?.ue_validees === true;
    const themeOk = phase >= 3;
    const directeurOk = phase >= 4;
    const memoireState: ChecklistItemState =
      elig == null ? 'pending' : elig.memoire_valide ? 'done' : phase >= 5 ? 'pending' : 'pending';
    const notesUeState: ChecklistItemState =
      elig == null ? 'pending' : ueOk ? 'done' : 'failed';
    const antiPlagiatOk = phase >= 6;

    return [
      { label: 'Toutes les UE obligatoires validées', state: this.boolState(elig, elig?.ue_validees) },
      { label: 'Frais de soutenance payés', state: this.boolState(elig, elig?.frais_payes) },
      { label: 'Thème de mémoire validé', state: themeOk ? 'done' : 'pending' },
      { label: 'Directeur de mémoire désigné', state: directeurOk ? 'done' : 'pending' },
      { label: 'Mémoire validé par le directeur', state: memoireState },
      {
        label: ueOk ? 'Notes UE synchronisées' : '1 UE en attente (note non saisie)',
        state: notesUeState,
      },
      {
        label: 'Vérification anti-plagiat / anti-IA',
        state: antiPlagiatOk ? 'done' : 'pending',
      },
    ];
  }

  private computeEligibilityProgress(items: ChecklistItem[]): EligibilityProgress {
    const total = items.length;
    const done = items.filter((i) => i.state === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, percent };
  }

  private defaultMemoireInfo(): MemoireDashboardInfo {
    return {
      titre: "Système de détection d'intrusions basé sur le Machine Learning",
      directeur: 'Dr. Kofi Mensah',
      niveauLabel: 'Master 2',
      version: 'V.2.1',
      statusLabel: 'En révision',
      statusVariant: 'warning',
      pagesCurrent: 88,
      pagesTarget: 120,
      commentBody: 'Merci de revoir la section 4.2 — bibliographie incomplète.',
    };
  }

  private buildMemoireInfo(profile: EtudiantProfile): MemoireDashboardInfo {
    const phase = profile.current_phase ?? 1;
    const base = this.defaultMemoireInfo();
    let statusLabel = base.statusLabel;
    let statusVariant: MemoireStatusVariant = base.statusVariant;
    if (phase >= 6) {
      statusLabel = 'En validation';
      statusVariant = 'neutral';
    }
    if (phase >= 7) {
      statusLabel = 'Validé';
      statusVariant = 'success';
    }
    return {
      ...base,
      niveauLabel: profile.niveau?.trim() || base.niveauLabel,
      statusLabel,
      statusVariant,
    };
  }

  memoireProgressPercent(m: MemoireDashboardInfo): number {
    if (m.pagesTarget <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((m.pagesCurrent / m.pagesTarget) * 100));
  }

  private defaultSoutenanceSchedule(): SoutenanceScheduleInfo {
    return {
      isPlanned: false,
      dateHeure: '—',
      salle: '—',
      presidentJury: '—',
      examinateur: '—',
      convocationUrl: null,
    };
  }

  private buildSoutenanceSchedule(profile: EtudiantProfile): SoutenanceScheduleInfo {
    const phase = profile.current_phase ?? 1;
    if (phase < 9) {
      return {
        isPlanned: false,
        dateHeure: 'Non communiquée',
        salle: '—',
        presidentJury: '—',
        examinateur: '—',
        convocationUrl: null,
      };
    }
    return {
      isPlanned: true,
      dateHeure: '15 Juil. 2026 à 09:30',
      salle: 'Salle B204 (Bâtiment B — 2ème étage)',
      presidentJury: 'Pr. Jean Asante',
      examinateur: 'Dr. Afia Boateng',
      convocationUrl: null,
    };
  }

  downloadConvocation(): void {
    const url = this.soutenanceSchedule().convocationUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

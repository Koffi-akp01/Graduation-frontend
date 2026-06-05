import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { catchError, forkJoin, interval, of } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import { AffectationService, Affectation } from '../../../../core/services/affectation/affectation';
import { EtudiantService, MemoireInfo, SoutenanceInfo } from '../../../../core/services/etudiant/etudiant';
import { ThemeService } from '../../../../core/services/theme/theme';
import { SuiviService, SuiviMemoire } from '../../../../core/services/suivi/suivi';
import { Theme } from '../../../../core/models/theme.model';
import { EligibiliteStatus, EtudiantProfile } from '../../../../core/models/etudiant.model';

export interface DossierDisplayStep {
  id: string;
  label: string;
  isSuivi: boolean;
  completed: boolean;
  active: boolean;
  stepNumber?: number;
}

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
  imports: [RouterLink, RouterLinkActive, TopNav, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  currentStep = signal<number>(1);
  etudiantData = signal<EtudiantProfile | null>(null);
  statsCards = signal<DashboardStatCard[]>(this.defaultStatCards());
  checklistItems = signal<ChecklistItem[]>(this.defaultChecklist());
  eligibilityProgress = signal<EligibilityProgress>({ done: 0, total: 7, percent: 0 });
  memoireInfo = signal<MemoireDashboardInfo>({
    titre: '—', directeur: '—', niveauLabel: '—', version: '—',
    statusLabel: 'Chargement…', statusVariant: 'neutral',
    pagesCurrent: 0, pagesTarget: 120, commentBody: '',
  });
  soutenanceSchedule = signal<SoutenanceScheduleInfo>(this.defaultSoutenanceSchedule());


  loading = signal<boolean>(false);
  lastRefreshed = signal<string>('');

  suivi             = signal<SuiviMemoire | null>(null);
  suiviLoading      = signal(false);
  suiviAffectationId = signal<number | null>(null);

  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /** Nom affiché immédiatement depuis AuthService, mis à jour dès que le profil arrive. */
  displayPrenom = computed(() => {
    const profile = this.etudiantData();
    if (profile?.prenom) return profile.prenom;
    const u = this.authService.currentUser();
    if (u?.first_name) return u.first_name;
    return localStorage.getItem('user_first_name') ?? 'Étudiant';
  });

  displayNom = computed(() => {
    const profile = this.etudiantData();
    if (profile?.nom) return profile.nom;
    const u = this.authService.currentUser();
    return u?.last_name ?? localStorage.getItem('user_last_name') ?? '';
  });

  constructor(
    private etudiantService: EtudiantService,
    private themeService: ThemeService,
    private affectationService: AffectationService,
    private suiviService: SuiviService,
  ) {}

  /** Étapes dossier dynamiques : phases principales + étapes suivi mémoire intercalées. */
  get allDossierSteps(): DossierDisplayStep[] {
    const phase = this.currentStep();
    const s = this.suivi();
    const steps: DossierDisplayStep[] = [];
    let phaseNum = 0;

    const addPhase = (id: string, label: string, completed: boolean, active: boolean) => {
      phaseNum++;
      steps.push({ id, label, isSuivi: false, completed, active, stepNumber: phaseNum });
    };
    const addSuivi = (id: string, label: string, completed: boolean, active: boolean) => {
      steps.push({ id, label, isSuivi: true, completed, active });
    };

    addPhase("theme",     "Thème validé",      phase >= 3, phase >= 1 && phase < 3);
    addPhase("directeur", "Directeur affecté", phase >= 4, phase >= 3 && phase < 4);

    if (s) {
      for (const etape of s.etapes) {
        addSuivi(
          `suivi_${etape.id}`,
          etape.titre,
          etape.statut === "VALIDE",
          ["EN_COURS", "SOUMIS", "EN_REVISION"].includes(etape.statut),
        );
      }
    }

    // suiviComplete est false tant que le suivi n'est pas chargé ou pas terminé
    const suiviComplete = s !== null && (s.etapes.length === 0 || s.etapes.every(e => e.statut === "VALIDE"));
    addPhase("memoire_depose", "Mémoire déposé",       suiviComplete && phase >= 6,  s !== null && suiviComplete && phase >= 4 && phase < 6);
    addPhase("validation",     "Validation mémoire",   suiviComplete && phase >= 7,  suiviComplete && phase >= 6 && phase < 7);
    addPhase("soutenance",     "Soutenance planifiée",  suiviComplete && phase >= 10, suiviComplete && phase >= 7 && phase < 10);
    addPhase("resultats",      "Résultats publiés",     suiviComplete && phase >= 11, suiviComplete && phase >= 10 && phase < 11);

    return steps;
  }

  /** Vrai si l’étudiant peut déposer son mémoire (suivi chargé et toutes étapes validées). */
  get canDeposeMemoire(): boolean {
    const s = this.suivi();
    if (s === null) return false;
    if (s.etapes.length === 0) return true;
    return s.etapes.every(e => e.statut === "VALIDE");
  }

  charger(): void {
    this.loading.set(true);
    forkJoin({
      data:         this.etudiantService.getProfile(),
      elig:         this.etudiantService.getEligibilite().pipe(catchError(() => of(null))),
      memoire:      this.etudiantService.getMemoire().pipe(catchError(() => of(null))),
      soutenance:   this.etudiantService.getSoutenance().pipe(catchError(() => of(null))),
      theme:        this.themeService.getMyTheme().pipe(catchError(() => of(null))),
      affectations: this.affectationService.getAffectations().pipe(catchError(() => of([] as Affectation[]))),
    }).subscribe({
      next: ({ data, elig, memoire, soutenance, theme, affectations }) => {
        this.etudiantData.set(data);
        this.currentStep.set(data.current_phase ?? 1);
        this.statsCards.set(this.buildStatCards(data, elig));
        const items = this.buildChecklist(data, elig);
        this.checklistItems.set(items);
        this.eligibilityProgress.set(this.computeEligibilityProgress(items));
        this.memoireInfo.set(this.buildMemoireInfoFromApi(data, memoire, theme, affectations));
        this.soutenanceSchedule.set(this.buildSoutenanceFromApi(soutenance));
        const accepted = affectations.find(a => a.statut === 'ACCEPTE');
        if (accepted) { this.chargerSuivi(accepted.id); }
        this.lastRefreshed.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnInit(): void {
    this.charger();
    // Rafraîchissement automatique toutes les 30 secondes
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.charger());
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
    const fraisOk = elig?.frais_payes === true;

    // Calcul dynamique du délai avant la clôture des dépôts (22 août 2026)
    const cloture  = new Date('2026-08-22T00:00:00');
    const aujourdHui = new Date(); aujourdHui.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((cloture.getTime() - aujourdHui.getTime()) / 86_400_000);
    const delaiVal = daysLeft > 0 ? `${daysLeft}j` : 'Clôturé';
    const delaiSub = daysLeft > 0 ? 'Avant clôture des dépôts (22 août)' : 'Session de dépôts terminée';

    return [
      { label: 'STATUT DOSSIER', value: dossier.value, sub: dossier.sub, icon: '📁' },
      {
        label: 'UE VALIDÉES',
        value: `${profile.ue_validees_count ?? 0}/${profile.ue_total ?? 0}`,
        sub: elig == null
          ? 'Détail non disponible'
          : (profile.ue_validees_count ?? 0) >= (profile.ue_total ?? 1) && (profile.ue_total ?? 0) > 0
            ? 'Toutes les UE validées'
            : elig.ue_validees
              ? 'Presque complet'
              : 'UE à compléter',
        icon: '📚',
      },
      {
        label: 'FRAIS DE SOUTENANCE',
        value: fraisOk ? 'Payé' : 'À régler',
        sub: fraisOk ? 'Paiement confirmé par le recouvrement' : 'Paiement requis avant soutenance',
        icon: '💳',
        showCheck: fraisOk,
      },
      { label: 'DÉLAI RESTANT', value: delaiVal, sub: delaiSub, icon: '⏳' },
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
    // Utilise theme_valide de l'API d'éligibilité en priorité, puis phase >= 3 en fallback
    const themeOk = elig?.theme_valide === true || phase >= 3;
    const directeurOk = phase >= 4;
    const memoireState: ChecklistItemState =
      elig == null ? 'pending' : elig.memoire_valide ? 'done' : 'pending';
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

  private buildMemoireInfoFromApi(
    profile: EtudiantProfile,
    memoire: MemoireInfo | null,
    theme: Theme | null,
    affectations: Affectation[],
  ): MemoireDashboardInfo {
    const accepted    = affectations.find(a => a.statut === 'ACCEPTE');
    const directeurNom = accepted?.directeur_nom ?? 'Non assigné';
    const themeTitre   = theme?.titre ?? '—';
    const niveauLabel  = profile.niveau?.trim() || 'Licence 3';

    if (!memoire) {
      return {
        titre:         themeTitre,
        directeur:     directeurNom,
        niveauLabel,
        version:       '—',
        statusLabel:   'Non déposé',
        statusVariant: 'neutral',
        pagesCurrent:  0,
        pagesTarget:   120,
        commentBody:   '',
      };
    }

    const statusMap: Record<string, { label: string; variant: MemoireStatusVariant }> = {
      en_attente:  { label: 'En attente',  variant: 'neutral'  },
      en_revision: { label: 'En révision', variant: 'warning'  },
      valide:      { label: 'Validé',      variant: 'success'  },
      rejete:      { label: 'Rejeté',      variant: 'warning'  },
    };
    const statusInfo = statusMap[memoire.statut] ?? { label: memoire.statut, variant: 'neutral' as MemoireStatusVariant };

    return {
      titre:         themeTitre,
      directeur:     memoire.directeur  || directeurNom,
      niveauLabel:   niveauLabel        || memoire.niveau,
      version:       memoire.version    || 'V.1',
      statusLabel:   statusInfo.label,
      statusVariant: statusInfo.variant,
      pagesCurrent:  memoire.pages,
      pagesTarget:   memoire.pages_max,
      commentBody:   memoire.commentaire || '',
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

  private buildSoutenanceFromApi(soutenance: SoutenanceInfo | null): SoutenanceScheduleInfo {
    if (!soutenance) {
      return this.defaultSoutenanceSchedule();
    }
    const dateObj = new Date(soutenance.date);
    const dateHeure = isNaN(dateObj.getTime())
      ? soutenance.date
      : dateObj.toLocaleString('fr-FR', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
    return {
      isPlanned:     true,
      dateHeure,
      salle:         `${soutenance.salle} (${soutenance.batiment})`,
      presidentJury: soutenance.president,
      examinateur:   soutenance.examinateur,
      convocationUrl: null,
    };
  }

  downloadConvocation(): void {
    const url = this.soutenanceSchedule().convocationUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // ── Suivi mémoire ──────────────────────────────────────────────────────

  chargerSuivi(affectationId: number): void {
    this.suiviAffectationId.set(affectationId);
    this.suiviLoading.set(true);
    this.suiviService.getSuivi(affectationId).subscribe({
      next:  data => { this.suivi.set(data); this.suiviLoading.set(false); },
      error: ()   => this.suiviLoading.set(false),
    });
  }

  get nbEtapesValidees(): number {
    return this.suivi()?.etapes.filter(e => e.statut === 'VALIDE').length ?? 0;
  }

  suiviStatutClass(statut: string): string {
    const map: Record<string, string> = {
      VERROUILLE:  'etape-locked',
      EN_COURS:    'etape-active',
      SOUMIS:      'etape-soumis',
      EN_REVISION: 'etape-revision',
      VALIDE:      'etape-valide',
    };
    return map[statut] ?? '';
  }

  suiviStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      VERROUILLE:  '🔒 Verrouillé',
      EN_COURS:    '✏️ En cours',
      SOUMIS:      '📤 Soumis',
      EN_REVISION: '🔄 Correction demandée',
      VALIDE:      '✅ Validé',
    };
    return map[statut] ?? statut;
  }
}

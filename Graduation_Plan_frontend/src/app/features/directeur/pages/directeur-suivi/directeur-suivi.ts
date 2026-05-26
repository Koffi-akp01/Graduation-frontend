import { CommonModule }         from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule }          from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav }          from '../../../../core/components/top-nav/top-nav';
import { AuthService }     from '../../../../core/services/auth/auth';
import { EtudiantService } from '../../../../core/services/etudiant/etudiant';
import { ThemeService }    from '../../../../core/services/theme/theme';
import { ChatService, RendezVous } from '../../../../core/services/chat/chat';
import { ToastService }    from '../../../../shared/services/toast';
import { SuiviService, SuiviMemoire } from '../../../../core/services/suivi/suivi';

export interface EtudiantDirecteur {
  id: number;
  affectation_id: number;
  nom: string;
  prenom: string;
  matricule: string;
  filiere: string;
  theme_id: number | null;
  theme_titre: string;
  theme_statut: 'PENDING' | 'VALIDATED' | 'REJECTED' | null;
  memoire_depose: boolean;
  memoire_version: string | null;
  memoire_doc_id: number | null;
  memoire_url: string | null;
}

@Component({
  selector: 'app-directeur-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './directeur-suivi.html',
  styleUrls: ['./directeur-suivi.scss'],
})
export class DirecteurSuiviComponent implements OnInit {
  mesEtudiants = signal<EtudiantDirecteur[]>([]);
  rendezVous   = signal<RendezVous[]>([]);
  isLoading    = signal(false);
  successMsg   = signal('');
  errorMsg     = signal('');

  // Inline correction form
  correctionEnCours: { themeId: number; motif: string } | null = null;

  // Inline theme proposal form
  propositionEnCours: { etudiantId: number; titre: string; domaine: string; description: string } | null = null;
  isSavingTheme = false;

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

  prenom = signal('');
  nom    = signal('');

  // ── Suivi mémoire ──────────────────────────────────────────────────────
  suivi              = signal<SuiviMemoire | null>(null);
  suiviAffectationId = signal<number | null>(null);
  suiviLoading       = signal(false);
  suiviRemarques     = '';
  suiviRemarquesFor  = signal<number | null>(null);
  suiviInProgress    = signal<number | null>(null);

  constructor(
    private etudiantService: EtudiantService,
    private themeService: ThemeService,
    private chatService: ChatService,
    private authService: AuthService,
    private toast: ToastService,
    private suiviService: SuiviService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const u = this.authService.currentUser();
    this.prenom.set(u?.first_name ?? '');
    this.nom.set(u?.last_name ?? '');
    this.charger();
    const openId = this.route.snapshot.paramMap.get('openId')
                ?? this.route.snapshot.queryParamMap.get('open');
    if (openId) {
      this.ouvrirSuivi(+openId);
    }
  }

  charger(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.etudiantService.getEtudiantsByDirecteur().subscribe({
      next: data => { this.mesEtudiants.set(data); this.isLoading.set(false); },
      error: ()   => { this.errorMsg.set('Impossible de charger la liste des étudiants.'); this.isLoading.set(false); },
    });
    this.chatService.getPlanning().subscribe({
      next: rdvs => this.rendezVous.set(rdvs),
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  get initiales(): string {
    const p = this.prenom();
    const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'DM';
  }

  get nbEtudiants(): number { return this.mesEtudiants().length; }

  get nbMemoiresDeposes(): number {
    return this.mesEtudiants().filter(e => e.memoire_depose).length;
  }

  get nbRdvAConfirmer(): number {
    return this.rendezVous().filter(r => r.statut === 'PROPOSE').length;
  }

  get nbRdvProchains(): number {
    const now = new Date().toISOString();
    const limit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return this.rendezVous().filter(
      r => r.statut === 'CONFIRME' && r.date_heure > now && r.date_heure < limit
    ).length;
  }

  rdvAConfirmer(): RendezVous[] {
    return this.rendezVous().filter(r => r.statut === 'PROPOSE');
  }

  rdvProchains(): RendezVous[] {
    const now = new Date().toISOString();
    return this.rendezVous()
      .filter(r => r.statut === 'CONFIRME' && r.date_heure > now)
      .slice(0, 5);
  }

  // ── Thème ──────────────────────────────────────────────────────────────

  valider(themeId: number): void {
    if (!confirm('Confirmer la validation du thème ?')) return;
    this.themeService.updateTheme(themeId, { statut: 'VALIDATED' }).subscribe({
      next: () => { this.successMsg.set('Thème validé. L\'étudiant est notifié.'); this.charger(); },
      error: () => this.errorMsg.set('Erreur lors de la validation.'),
    });
  }

  ouvrirFormCorrection(themeId: number): void {
    this.correctionEnCours = { themeId, motif: '' };
  }

  annulerCorrection(): void {
    this.correctionEnCours = null;
  }

  envoyerCorrection(): void {
    if (!this.correctionEnCours?.motif.trim()) {
      this.errorMsg.set('Le motif est obligatoire.');
      return;
    }
    this.themeService.updateTheme(this.correctionEnCours.themeId, {
      statut: 'REJECTED',
      remarques_examinateur: this.correctionEnCours.motif,
    }).subscribe({
      next: () => {
        this.successMsg.set('Correction demandée. L\'étudiant et la direction sont notifiés.');
        this.correctionEnCours = null;
        this.charger();
      },
      error: () => this.errorMsg.set('Erreur lors de la demande de correction.'),
    });
  }

  // ── Proposition de thème ──────────────────────────────────────────────

  ouvrirFormProposition(etudiantId: number): void {
    this.propositionEnCours = { etudiantId, titre: '', domaine: '', description: '' };
    this.correctionEnCours = null;
  }

  annulerProposition(): void {
    this.propositionEnCours = null;
  }

  envoyerProposition(): void {
    const p = this.propositionEnCours;
    if (!p) return;
    if (!p.titre.trim() || !p.domaine || !p.description.trim()) {
      this.errorMsg.set('Titre, domaine et description sont obligatoires.');
      return;
    }
    this.isSavingTheme = true;
    this.themeService.submitThemeForStudent(p.etudiantId, {
      titre: p.titre, domaine: p.domaine, description: p.description,
    }).subscribe({
      next: () => {
        this.isSavingTheme = false;
        this.propositionEnCours = null;
        this.toast.success('Thème proposé. L\'étudiant est notifié.');
        this.charger();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.isSavingTheme = false;
        this.errorMsg.set(err?.error?.detail ?? 'Erreur lors de la proposition du thème.');
      },
    });
  }

  // ── Rendez-vous ────────────────────────────────────────────────────────

  confirmerRdv(id: number): void {
    this.chatService.deciderRendezVous(id, 'CONFIRME').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous confirmé. L\'étudiant est notifié.');
      },
      error: () => this.errorMsg.set('Erreur.'),
    });
  }

  annulerRdv(id: number): void {
    this.chatService.deciderRendezVous(id, 'ANNULE').subscribe({
      next: rdv => {
        this.rendezVous.update(list => list.map(r => r.id === id ? rdv : r));
        this.successMsg.set('Rendez-vous annulé.');
      },
      error: () => this.errorMsg.set('Erreur.'),
    });
  }

  // ── Suivi mémoire ──────────────────────────────────────────────────────

  toggleSuivi(affectationId: number): void {
    if (this.suiviAffectationId() === affectationId) {
      this.fermerSuivi();
    } else {
      this.ouvrirSuivi(affectationId);
    }
  }

  ouvrirSuivi(affectationId: number): void {
    this.suiviAffectationId.set(affectationId);
    this.suiviLoading.set(true);
    this.suivi.set(null);
    this.suiviService.getSuivi(affectationId).subscribe({
      next: (data) => { this.suivi.set(data); this.suiviLoading.set(false); },
      error: ()    => { this.toast.error('Impossible de charger le suivi.'); this.suiviLoading.set(false); },
    });
  }

  fermerSuivi(): void {
    this.suiviAffectationId.set(null);
    this.suivi.set(null);
    this.suiviRemarquesFor.set(null);
  }

  ouvrirDoc(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  ouvrirRemarques(etapeId: number): void {
    this.suiviRemarquesFor.set(etapeId);
    this.suiviRemarques = '';
  }

  envoyerCorrectionSuivi(etapeId: number): void {
    if (!this.suiviRemarques.trim()) { this.toast.error('Les remarques sont obligatoires.'); return; }
    const affId = this.suiviAffectationId();
    if (!affId) return;
    this.suiviInProgress.set(etapeId);
    this.suiviService.demanderCorrection(affId, etapeId, this.suiviRemarques).subscribe({
      next: () => {
        this.toast.success('Corrections envoyées. L\'étudiant est notifié.');
        this.suiviRemarquesFor.set(null);
        this.suiviInProgress.set(null);
        this.ouvrirSuivi(affId);
      },
      error: () => { this.toast.error('Erreur.'); this.suiviInProgress.set(null); },
    });
  }

  validerEtape(etapeId: number): void {
    const affId = this.suiviAffectationId();
    if (!affId) return;
    this.suiviInProgress.set(etapeId);
    this.suiviService.valider(affId, etapeId).subscribe({
      next: (res) => {
        const msg = res.prochaine_debloquee
          ? `Étape validée ! Prochaine étape déverrouillée : ${res.prochaine_debloquee}`
          : '✅ Toutes les étapes sont validées !';
        this.toast.success(msg);
        this.suiviInProgress.set(null);
        this.ouvrirSuivi(affId);
      },
      error: () => { this.toast.error('Erreur lors de la validation.'); this.suiviInProgress.set(null); },
    });
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
      EN_REVISION: '🔄 En révision',
      VALIDE:      '✅ Validé',
    };
    return map[statut] ?? statut;
  }

  get nbEtapesValidees(): number {
    return this.suivi()?.etapes.filter(e => e.statut === 'VALIDE').length ?? 0;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  themeBadge(statut: string | null): string {
    const map: Record<string, string> = {
      VALIDATED: 'badge-success',
      REJECTED:  'badge-danger',
      PENDING:   'badge-warn',
    };
    return map[statut ?? ''] ?? 'badge-warn';
  }

  themeLabel(statut: string | null): string {
    const map: Record<string, string> = {
      VALIDATED: 'Validé', REJECTED: 'Rejeté', PENDING: 'En attente',
    };
    return map[statut ?? ''] ?? '—';
  }
}

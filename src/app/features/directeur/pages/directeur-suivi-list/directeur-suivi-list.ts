import { Component, OnInit, signal } from '@angular/core';
import { DatePipe }                  from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { TopNav }        from '../../../../core/components/top-nav/top-nav';
import { AuthService }   from '../../../../core/services/auth/auth';
import { ToastService }  from '../../../../shared/services/toast';
import { SuiviService, SuiviEtudiant } from '../../../../core/services/suivi/suivi';
import { AffectationService, Affectation } from '../../../../core/services/affectation/affectation';

@Component({
  selector: 'app-directeur-suivi-list',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TopNav, FormsModule, DatePipe],
  templateUrl: './directeur-suivi-list.html',
  styleUrls: ['./directeur-suivi-list.scss'],
})
export class DirecteurSuiviListComponent implements OnInit {
  etudiants           = signal<SuiviEtudiant[]>([]);
  demandesEnAttente   = signal<Affectation[]>([]);
  isLoading           = signal(true);

  // Étudiant dont le suivi est déplié
  openId       = signal<number | null>(null);

  // Remarques de correction textuelles
  remarquesFor = signal<number | null>(null);
  remarques    = '';
  inProgress   = signal<number | null>(null);

  // Aperçu PDF inline : {affId, etapeId}
  apercuAffId   = signal<number | null>(null);
  apercuEtapeId = signal<number | null>(null);
  apercuUrl     = signal<SafeResourceUrl | null>(null);
  apercuLoading = signal(false);

  // Dépôt de correction par le directeur
  correctionFor = signal<number | null>(null);   // etape.id
  correctionAffId = 0;
  correctionInProgress = signal<number | null>(null);

  prenom = signal('');
  nom    = signal('');

  constructor(
    private suiviService: SuiviService,
    private affectationService: AffectationService,
    private authService: AuthService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const u = this.authService.currentUser();
    this.prenom.set(u?.first_name ?? '');
    this.nom.set(u?.last_name ?? '');
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.suiviService.getSuiviList().subscribe({
      next:  data => { this.etudiants.set(data); this.isLoading.set(false); },
      error: ()   => { this.toast.error('Impossible de charger le suivi.'); this.isLoading.set(false); },
    });
    this.affectationService.getAffectations().subscribe({
      next: data => this.demandesEnAttente.set(data.filter(a => a.statut === 'EN_ATTENTE')),
      error: () => {},
    });
  }

  toggle(affId: number): void {
    if (this.openId() === affId) {
      this.openId.set(null);
      this.fermerApercu();
    } else {
      this.openId.set(affId);
      this.fermerApercu();
    }
    this.remarquesFor.set(null);
    this.correctionFor.set(null);
  }

  get initiales(): string {
    const p = this.prenom(); const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'DM';
  }

  progress(e: SuiviEtudiant): number {
    return e.nb_etapes ? Math.round((e.nb_validees / e.nb_etapes) * 100) : 0;
  }

  statutClass(statut: string): string {
    return ({ VERROUILLE: 'etape-locked', EN_COURS: 'etape-active',
              SOUMIS: 'etape-soumis', EN_REVISION: 'etape-revision',
              VALIDE: 'etape-valide' } as Record<string,string>)[statut] ?? '';
  }

  statutLabel(statut: string): string {
    return ({ VERROUILLE: '🔒 Verrouillé', EN_COURS: '✏️ En cours',
              SOUMIS: '📤 Soumis', EN_REVISION: '🔄 Correction demandée',
              VALIDE: '✅ Validé' } as Record<string,string>)[statut] ?? statut;
  }

  // ── Aperçu PDF inline ────────────────────────────────────────────────

  ouvrirApercu(affId: number, etapeId: number): void {
    if (this.apercuAffId() === affId && this.apercuEtapeId() === etapeId) {
      this.fermerApercu();
      return;
    }
    this.apercuAffId.set(affId);
    this.apercuEtapeId.set(etapeId);
    this.apercuUrl.set(null);
    this.apercuLoading.set(true);
    this.suiviService.getApercuPdf(affId, etapeId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.apercuUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.apercuLoading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger le document.');
        this.apercuLoading.set(false);
        this.apercuAffId.set(null);
        this.apercuEtapeId.set(null);
      },
    });
  }

  fermerApercu(): void {
    this.apercuAffId.set(null);
    this.apercuEtapeId.set(null);
    this.apercuUrl.set(null);
  }

  telechargerWord(affId: number, etapeId: number): void {
    const url = this.suiviService.getTelechargerWordUrl(affId, etapeId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ── Dépôt correction directeur ───────────────────────────────────────

  ouvrirDepotCorrection(affId: number, etapeId: number): void {
    this.correctionFor.set(etapeId);
    this.correctionAffId = affId;
  }

  annulerDepotCorrection(): void {
    this.correctionFor.set(null);
  }

  onCorrectionChange(event: Event, affId: number, etapeId: number): void {
    const fichier = (event.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    this.correctionInProgress.set(etapeId);
    this.correctionFor.set(null);
    this.suiviService.deposerCorrection(affId, etapeId, fichier).subscribe({
      next: () => {
        this.toast.success('Document corrigé déposé. L\'étudiant est notifié.');
        this.correctionInProgress.set(null);
        this.charger();
      },
      error: () => {
        this.toast.error('Erreur lors du dépôt.');
        this.correctionInProgress.set(null);
      },
    });
  }

  // ── Correction textuelle + validation ────────────────────────────────

  ouvrirRemarques(etapeId: number): void {
    this.remarquesFor.set(this.remarquesFor() === etapeId ? null : etapeId);
    this.remarques = '';
  }

  envoyerCorrection(affId: number, etapeId: number): void {
    if (!this.remarques.trim()) { this.toast.error('Les remarques sont obligatoires.'); return; }
    this.inProgress.set(etapeId);
    this.suiviService.demanderCorrection(affId, etapeId, this.remarques).subscribe({
      next: () => {
        this.toast.success('Correction envoyée. L\'étudiant est notifié.');
        this.remarquesFor.set(null);
        this.inProgress.set(null);
        this.charger();
      },
      error: () => { this.toast.error('Erreur.'); this.inProgress.set(null); },
    });
  }

  validerEtape(affId: number, etapeId: number): void {
    this.inProgress.set(etapeId);
    this.suiviService.valider(affId, etapeId).subscribe({
      next: res => {
        const msg = res.prochaine_debloquee
          ? `Étape validée ! Prochaine : ${res.prochaine_debloquee}`
          : 'Toutes les étapes sont validées !';
        this.toast.success(msg);
        this.inProgress.set(null);
        this.charger();
      },
      error: () => { this.toast.error('Erreur lors de la validation.'); this.inProgress.set(null); },
    });
  }

  resetEtape(affId: number, etapeId: number): void {
    this.inProgress.set(etapeId);
    this.suiviService.resetEtape(affId, etapeId).subscribe({
      next: () => {
        this.toast.success('Étape réinitialisée — l\'étudiant peut soumettre à nouveau.');
        this.inProgress.set(null);
        this.charger();
      },
      error: () => { this.toast.error('Erreur lors de la réinitialisation.'); this.inProgress.set(null); },
    });
  }

  nbSoumisTotal(): number {
    return this.etudiants().reduce((s, e) => s + e.nb_soumises, 0);
  }
}

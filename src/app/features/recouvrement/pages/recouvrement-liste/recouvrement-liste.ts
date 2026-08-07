import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import {
  AlerteImpaye, Bordereau, StatsPaiement,
  EtudiantScolarite, TarifScolarite,
  PaiementScolarite, EngagementPaiement,
  NouveauPaiementForm, NouvelEngagementForm,
} from '../../../../core/models/paiement.model';
import { PaiementService } from '../../../../core/services/paiement/paiement';
import { RattrapageService, Rattrapage } from '../../../../core/services/rattrapage/rattrapage';

export type RecouvrementVue = 'bordereaux' | 'rattrapages' | 'scolarite' | 'alertes' | 'rapport';

@Component({
  selector: 'app-recouvrement-liste',
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './recouvrement-liste.html',
  styleUrl: './recouvrement-liste.scss',
})
export class RecouvrementListeComponent implements OnInit {
  vue        = signal<RecouvrementVue>('bordereaux');
  bordereaux = signal<Bordereau[]>([]);
  alertes    = signal<AlerteImpaye[]>([]);
  stats      = signal<StatsPaiement | null>(null);

  // ── Rattrapages ───────────────────────────────────────────────────────
  rattrapages        = signal<Rattrapage[]>([]);
  rattrapagesLoading = signal(false);
  rattrapageInProg   = signal<number | null>(null);
  successMsg         = signal('');
  errorMsg           = signal('');

  // ── Scolarité ─────────────────────────────────────────────────────────
  tarifs              = signal<TarifScolarite[]>([]);
  etudiantsScol       = signal<EtudiantScolarite[]>([]);
  scolLoading         = signal(false);
  scolSearch          = signal('');
  scolFiltreStatut    = signal<'tous' | 'en_retard' | 'engagement'>('tous');
  anneeAcademique     = signal('2025-2026');

  // Détail étudiant sélectionné
  scolEtudiantSelId   = signal<number | null>(null);
  scolPaiements       = signal<PaiementScolarite[]>([]);
  scolEngagements     = signal<EngagementPaiement[]>([]);

  // Formulaire versement
  showPaiementForm    = signal(false);
  paiementForm: NouveauPaiementForm = this.emptyPaiementForm();
  paiementInProg      = signal(false);

  // Formulaire engagement
  showEngagementForm  = signal(false);
  engagementForm: NouvelEngagementForm = this.emptyEngagementForm();
  engagementInProg    = signal(false);

  etudiantsScolFiltered = computed(() => {
    const q = this.scolSearch().toLowerCase();
    const f = this.scolFiltreStatut();
    return this.etudiantsScol().filter(e => {
      const matchQ = !q || `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q);
      const matchF = f === 'tous'
        ? true
        : f === 'en_retard' ? !e.en_regle
        : e.a_engagement;
      return matchQ && matchF;
    });
  });

  // ── Computed ──────────────────────────────────────────────────────────
  totalEncaisse  = computed(() =>
    this.bordereaux().filter(b => b.est_valide).reduce((s, b) => s + b.montant, 0));
  totalEnAttente = computed(() =>
    this.bordereaux().filter(b => !b.est_valide).reduce((s, b) => s + b.montant, 0));
  bordereauValides = computed(() => this.bordereaux().filter(b => b.est_valide));

  aValiderRattrapage = computed(() =>
    this.rattrapages().filter(r => r.statut === 'PAIEMENT_SOUMIS' && !r.valide_par_recouvrement));
  historiqueRattrapage = computed(() =>
    this.rattrapages().filter(r => r.valide_par_recouvrement));

  constructor(
    private paiementService: PaiementService,
    private rattrapageService: RattrapageService,
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.paiementService.getAllBordereaux().subscribe(d => this.bordereaux.set(d));
    this.paiementService.getStats().subscribe(s => this.stats.set(s));
    this.paiementService.getAlertes().subscribe(a => this.alertes.set(a));
    this.chargerRattrapages();
  }

  chargerRattrapages(): void {
    this.rattrapagesLoading.set(true);
    this.rattrapageService.getRattrapages().subscribe({
      next:  d => { this.rattrapages.set(d); this.rattrapagesLoading.set(false); },
      error: () => this.rattrapagesLoading.set(false),
    });
  }

  afficherVue(v: RecouvrementVue): void {
    this.vue.set(v);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.scolEtudiantSelId.set(null);
    this.fermerForms();
    if (v === 'rattrapages') this.chargerRattrapages();
    if (v === 'scolarite')   this.chargerScolarite();
  }

  // ── Valider bordereau soutenance ──────────────────────────────────────
  confirmerPaiement(id: number): void {
    if (!confirm('Confirmez la réception des fonds ?\nLe Service Examen sera automatiquement notifié.')) return;
    this.successMsg.set('');
    this.errorMsg.set('');
    this.paiementService.validerBordereau(id).subscribe({
      next: () => {
        this.successMsg.set('✅ Bordereau validé. Le Service Examen a été notifié de vérifier l\'éligibilité de l\'étudiant pour la soutenance.');
        this.chargerDonnees();
      },
      error: () => this.errorMsg.set('Erreur lors de la validation.'),
    });
  }

  // ── Helpers formulaires ───────────────────────────────────────────────
  private emptyPaiementForm(): NouveauPaiementForm {
    return { etudiant_id: 0, montant: 0, type_paiement: 'PARTIEL', mode_paiement: 'ESPECES', reference: '', annee_academique: '2025-2026', remarques: '' };
  }
  private emptyEngagementForm(): NouvelEngagementForm {
    return { etudiant_id: 0, montant_total: 0, frequence: 'MENSUEL', date_debut: '', date_fin_prevue: '', annee_academique: '2025-2026', notes: '' };
  }

  // ── Scolarité — chargements ────────────────────────────────────────────
  chargerScolarite(): void {
    this.scolLoading.set(true);
    this.paiementService.getTarifs().subscribe(t => this.tarifs.set(t));
    this.paiementService.getEtudiantsScolarite(this.anneeAcademique()).subscribe({
      next:  d => { this.etudiantsScol.set(d); this.scolLoading.set(false); },
      error: () => this.scolLoading.set(false),
    });
  }

  selectionnerEtudiantScol(id: number): void {
    this.scolEtudiantSelId.set(this.scolEtudiantSelId() === id ? null : id);
    if (this.scolEtudiantSelId() === id) {
      this.paiementService.getPaiementsScolarite(id).subscribe(d => this.scolPaiements.set(d));
      this.paiementService.getEngagements(id).subscribe(d => this.scolEngagements.set(d));
      this.paiementForm = { ...this.emptyPaiementForm(), etudiant_id: id, annee_academique: this.anneeAcademique() };
      this.engagementForm = { ...this.emptyEngagementForm(), etudiant_id: id, annee_academique: this.anneeAcademique() };
    }
  }

  ouvrirPaiementForm(): void  { this.showPaiementForm.set(true);  this.showEngagementForm.set(false); }
  ouvrirEngagementForm(): void { this.showEngagementForm.set(true); this.showPaiementForm.set(false); }
  fermerForms(): void { this.showPaiementForm.set(false); this.showEngagementForm.set(false); }

  soumettrePaiement(): void {
    if (!this.paiementForm.montant || this.paiementForm.montant <= 0) {
      this.errorMsg.set('Montant invalide.'); return;
    }
    this.paiementInProg.set(true);
    this.paiementService.enregistrerPaiement(this.paiementForm).subscribe({
      next: () => {
        this.successMsg.set('✅ Versement enregistré. L\'étudiant a été notifié.');
        this.paiementInProg.set(false);
        this.fermerForms();
        const id = this.scolEtudiantSelId()!;
        this.paiementService.getPaiementsScolarite(id).subscribe(d => this.scolPaiements.set(d));
        this.chargerScolarite();
      },
      error: () => { this.errorMsg.set('Erreur lors de l\'enregistrement.'); this.paiementInProg.set(false); },
    });
  }

  soumettreEngagement(): void {
    if (!this.engagementForm.montant_total || !this.engagementForm.date_debut) {
      this.errorMsg.set('Montant et date de début obligatoires.'); return;
    }
    this.engagementInProg.set(true);
    this.paiementService.creerEngagement(this.engagementForm).subscribe({
      next: () => {
        this.successMsg.set('✅ Engagement de paiement créé. L\'étudiant a été notifié.');
        this.engagementInProg.set(false);
        this.fermerForms();
        const id = this.scolEtudiantSelId()!;
        this.paiementService.getEngagements(id).subscribe(d => this.scolEngagements.set(d));
        this.chargerScolarite();
      },
      error: () => { this.errorMsg.set('Erreur lors de la création.'); this.engagementInProg.set(false); },
    });
  }

  mettreAJourStatutEngagement(engId: number, statut: string): void {
    this.paiementService.mettreAJourEngagement(engId, { statut } as Partial<EngagementPaiement>).subscribe({
      next: () => {
        this.successMsg.set('Statut mis à jour.');
        const id = this.scolEtudiantSelId()!;
        this.paiementService.getEngagements(id).subscribe(d => this.scolEngagements.set(d));
        this.chargerScolarite();
      },
    });
  }

  tarifLabel(annee: string): TarifScolarite | undefined {
    return this.tarifs().find(t => t.annee === annee);
  }

  statutEngagementClass(statut: string): string {
    return ({ ACTIF: 'badge-info', HONORE: 'badge-success', EN_RETARD: 'badge-danger', ROMPU: 'badge-neutral' } as Record<string,string>)[statut] ?? '';
  }

  // ── Valider paiement rattrapage ───────────────────────────────────────
  validerPaiementRattrapage(r: Rattrapage): void {
    if (!confirm(`Valider le paiement de ${r.etudiant_nom} pour ${r.ue_code} ?\nLe Service Examen sera automatiquement notifié d'autoriser ce rattrapage.`)) return;
    this.rattrapageInProg.set(r.id);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.rattrapageService.validerPaiement(r.id).subscribe({
      next: () => {
        this.successMsg.set(`✅ Paiement validé — ${r.etudiant_nom} / ${r.ue_code}. Service Examen notifié d'autoriser le rattrapage.`);
        this.rattrapageInProg.set(null);
        this.chargerRattrapages();
      },
      error: () => { this.errorMsg.set('Erreur lors de la validation.'); this.rattrapageInProg.set(null); },
    });
  }
}

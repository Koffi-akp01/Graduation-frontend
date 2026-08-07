import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import {
  DocumentService,
  ArchiveDossier,
  EtudiantDisponible,
  SignatureRole,
} from '../../../../core/services/document';

const ROLE_LABELS: Record<SignatureRole, string> = {
  PRESIDENT: 'Président du jury',
  EXAMINATEUR: 'Membre du jury (examinateur)',
  DIRECTEUR: 'Directeur de mémoire',
  DIRECTEUR_ACADEMIQUE: 'Directeur académique (visa)',
};

const ARCHIVE_ROLES = ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC', 'SYSADMIN'];

@Component({
  selector: 'app-archive-dossier',
  imports: [CommonModule, FormsModule, TopNav],
  templateUrl: './archive-dossier.html',
  styleUrl: './archive-dossier.scss',
})
export class ArchiveDossierComponent implements OnInit {
  private svc  = inject(DocumentService);
  private auth = inject(AuthService);

  canManage = computed(() => {
    const role = this.auth.currentUser()?.role ?? localStorage.getItem('user_role') ?? '';
    return ARCHIVE_ROLES.includes(role);
  });

  archives      = signal<ArchiveDossier[]>([]);
  etudiants     = signal<EtudiantDisponible[]>([]);
  loading       = signal(true);
  error         = signal('');
  filtreStatut  = signal<string>('');

  // Panneau création
  showCreer     = signal(false);
  creerForm     = { etudiant_id: '', note_finale: '', mention: '', commentaire: '' };
  creerLoading  = false;
  creerError    = '';
  pvFile: File | null = null;

  // Panneau signature / évaluation
  activeArch    = signal<ArchiveDossier | null>(null);
  sigForm       = {
    note_finale: '', mention: '', commentaire: '',
    specialite: '', promotion: '', ville_soutenance: 'Lomé',
    president_grade: '', president_etablissement: '',
    examinateur_grade: '', examinateur_etablissement: '',
    membre2_nom: '', membre2_grade: '', membre2_etablissement: '',
    directeur_grade: '', directeur_etablissement: '',
    digne_memoire: '' as '' | 'true' | 'false',
    niveau_scientifique: '',
    rapport_scientifique: '',
    decision_jury: '',
  };
  sigLoading    = false;
  sigError      = '';
  newPvFile: File | null = null;

  readonly NIVEAUX_SCIENTIFIQUES = [
    { value: 'EXCEPTIONNEL', label: 'Exceptionnel' },
    { value: 'TRES_BON',     label: 'Très bon' },
    { value: 'BON',          label: 'Bon' },
    { value: 'SATISFAISANT', label: 'Satisfaisant' },
  ];

  // Signature numérique (code de vérification par mot de passe)
  readonly ROLE_LABELS = ROLE_LABELS;
  signingRole  = signal<SignatureRole | null>(null);
  signPassword = '';
  signLoading  = signal(false);
  signError    = signal('');

  // Validation Service Examen + enregistrement au registre
  numeroRegistreManuel = '';
  validerLoading = signal(false);
  validerError   = signal('');

  readonly MENTIONS = ['Passable', 'Assez bien', 'Bien', 'Très bien', 'Non admis'];

  statsArchives = computed(() => {
    const all = this.archives();
    return {
      total:        all.length,
      enAttente:    all.filter(a => a.statut === 'EN_ATTENTE').length,
      pvPartiel:    all.filter(a => a.statut === 'PV_PARTIEL').length,
      enValidation: all.filter(a => a.statut === 'EN_VALIDATION').length,
      archives:     all.filter(a => a.statut === 'ARCHIVE').length,
      moyFinale:  all.filter(a => a.note_finale !== null).length
        ? (all.reduce((s, a) => s + (a.note_finale ?? 0), 0) / all.filter(a => a.note_finale !== null).length).toFixed(2)
        : null,
    };
  });

  ngOnInit(): void {
    this.reload();
    if (this.canManage()) {
      this.svc.getEtudiantsSansArchive().subscribe({
        next: (e) => this.etudiants.set(e),
        error: () => {},
      });
    }
  }

  reload(): void {
    this.loading.set(true);
    this.svc.getArchives(this.filtreStatut() || undefined).subscribe({
      next:  (a) => { this.archives.set(a); this.loading.set(false); },
      error: ()  => { this.error.set('Impossible de charger les archives.'); this.loading.set(false); },
    });
  }

  // ── Création ──────────────────────────────────────────────────────────
  onPvFile(evt: Event): void {
    const f = (evt.target as HTMLInputElement).files?.[0];
    this.pvFile = f ?? null;
  }

  submitCreer(): void {
    if (!this.creerForm.etudiant_id) { this.creerError = 'Sélectionnez un étudiant.'; return; }
    this.creerLoading = true;
    this.creerError   = '';

    const fd = new FormData();
    fd.append('etudiant_id',  this.creerForm.etudiant_id);
    fd.append('note_finale',  this.creerForm.note_finale);
    fd.append('mention',      this.creerForm.mention);
    fd.append('commentaire',  this.creerForm.commentaire);
    if (this.pvFile) fd.append('pv_fichier', this.pvFile);

    this.svc.creerArchive(fd).subscribe({
      next: (arch) => {
        this.creerLoading = false;
        this.showCreer.set(false);
        this.creerForm = { etudiant_id: '', note_finale: '', mention: '', commentaire: '' };
        this.pvFile = null;
        this.archives.update((a) => [arch, ...a]);
        this.etudiants.update((e) => e.filter((x) => String(x.id) !== this.creerForm.etudiant_id));
      },
      error: (err) => {
        this.creerError   = err?.error?.detail ?? 'Erreur lors de la création.';
        this.creerLoading = false;
      },
    });
  }

  // ── Signature / évaluation ───────────────────────────────────────────
  ouvrirSig(arch: ArchiveDossier): void {
    this.activeArch.set(arch);
    const j = arch.jury_details;
    this.sigForm = {
      note_finale:          arch.note_finale !== null ? String(arch.note_finale) : '',
      mention:              arch.mention,
      commentaire:          arch.commentaire ?? '',
      specialite:           arch.specialite,
      promotion:            arch.promotion,
      ville_soutenance:     arch.ville_soutenance || 'Lomé',
      president_grade:          j.president.grade,
      president_etablissement:  j.president.etablissement,
      examinateur_grade:        j.examinateur.grade,
      examinateur_etablissement:j.examinateur.etablissement,
      membre2_nom:               j.membre2.nom,
      membre2_grade:             j.membre2.grade,
      membre2_etablissement:     j.membre2.etablissement,
      directeur_grade:           j.directeur.grade,
      directeur_etablissement:   j.directeur.etablissement,
      digne_memoire: arch.digne_memoire === null ? '' : (arch.digne_memoire ? 'true' : 'false'),
      niveau_scientifique:  arch.niveau_scientifique,
      rapport_scientifique: arch.rapport_scientifique,
      decision_jury:         arch.decision_jury,
    };
    this.sigError    = '';
    this.newPvFile   = null;
    this.signingRole.set(null);
    this.signError.set('');
  }

  onNewPvFile(evt: Event): void {
    this.newPvFile = (evt.target as HTMLInputElement).files?.[0] ?? null;
  }

  submitSig(): void {
    const arch = this.activeArch();
    if (!arch) return;
    this.sigLoading = true;
    this.sigError   = '';

    const fd = new FormData();
    const f = this.sigForm;
    fd.append('note_finale',  f.note_finale);
    fd.append('mention',      f.mention);
    fd.append('commentaire',  f.commentaire);
    fd.append('specialite',   f.specialite);
    fd.append('promotion',    f.promotion);
    fd.append('ville_soutenance', f.ville_soutenance);
    fd.append('president_grade',            f.president_grade);
    fd.append('president_etablissement',    f.president_etablissement);
    fd.append('examinateur_grade',          f.examinateur_grade);
    fd.append('examinateur_etablissement',  f.examinateur_etablissement);
    fd.append('membre2_nom',                f.membre2_nom);
    fd.append('membre2_grade',              f.membre2_grade);
    fd.append('membre2_etablissement',      f.membre2_etablissement);
    fd.append('directeur_grade',            f.directeur_grade);
    fd.append('directeur_etablissement',    f.directeur_etablissement);
    fd.append('digne_memoire',   f.digne_memoire);
    fd.append('niveau_scientifique',  f.niveau_scientifique);
    fd.append('rapport_scientifique', f.rapport_scientifique);
    fd.append('decision_jury',        f.decision_jury);
    if (this.newPvFile) fd.append('pv_fichier', this.newPvFile);

    this.svc.signerPV(arch.id, fd).subscribe({
      next: (updated) => {
        this.sigLoading = false;
        this.activeArch.set(updated);
        this.archives.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      },
      error: (err) => {
        this.sigError   = err?.error?.detail ?? 'Erreur lors de la mise à jour.';
        this.sigLoading = false;
      },
    });
  }

  // ── Signature numérique (code de vérification par mot de passe) ──────
  ouvrirSignature(role: SignatureRole): void {
    this.signingRole.set(role);
    this.signPassword = '';
    this.signError.set('');
  }

  annulerSignature(): void {
    this.signingRole.set(null);
    this.signPassword = '';
    this.signError.set('');
  }

  confirmerSignature(): void {
    const arch = this.activeArch();
    const role = this.signingRole();
    if (!arch || !role) return;
    if (!this.signPassword) { this.signError.set('Mot de passe requis.'); return; }

    this.signLoading.set(true);
    this.signError.set('');
    this.svc.signerNumerique(arch.id, role, this.signPassword).subscribe({
      next: (updated) => {
        this.signLoading.set(false);
        this.signingRole.set(null);
        this.signPassword = '';
        this.activeArch.set(updated);
        this.archives.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      },
      error: (err) => {
        this.signLoading.set(false);
        this.signError.set(err?.error?.detail ?? 'Erreur lors de la signature.');
      },
    });
  }

  // ── Validation Service Examen + enregistrement au registre ───────────
  validerExamen(arch: ArchiveDossier): void {
    this.validerLoading.set(true);
    this.validerError.set('');
    this.svc.validerServiceExamen(arch.id, this.numeroRegistreManuel).subscribe({
      next: (updated) => {
        this.validerLoading.set(false);
        this.numeroRegistreManuel = '';
        this.activeArch.set(updated);
        this.archives.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      },
      error: (err) => {
        this.validerLoading.set(false);
        this.validerError.set(err?.error?.detail ?? 'Erreur lors de la validation.');
      },
    });
  }

  // ── Génération PV — reproduction fidèle du formulaire officiel « Rapport
  //    de soutenance » IPNET (2 pages), avec les codes de signature
  //    électronique imprimés là où on signerait à la main. ────────────────
  telechargerPV(arch: ArchiveDossier): void {
    const s = arch.soutenance_info;
    const nomEtudiant = `${arch.etudiant.prenom} ${arch.etudiant.nom.toUpperCase()}`;
    const isMaster = arch.etudiant.filiere.toUpperCase().includes('MASTER');
    const niveauLabel = isMaster ? 'MASTER' : 'LICENCE PROFESSIONNELLE';
    const j = arch.jury_details;

    const box = (checked: boolean) => checked ? '☒' : '☐';

    const juryRow = (role: string, nom: string, grade: string, etab: string) => `
      <tr>
        <td class="jury-role">${role}</td>
        <td>${nom || ''}</td>
        <td>${grade || ''}</td>
        <td>${etab || ''}</td>
      </tr>`;

    const sigInfo = (role: string) => arch.signatures.find(sig => sig.role === role);
    const sigStamp = (role: string) => {
      const sig = sigInfo(role);
      if (!sig || !sig.signe) return '';
      const date = new Date(sig.date_signature!).toLocaleDateString('fr-FR');
      return `<div class="sig-stamp">Signé électroniquement par ${sig.signataire} le ${date} — code ${sig.code_verification}</div>`;
    };

    const decisionHtml = arch.decision_jury === 'ACCEPTE'
      ? `accepte <span class="strike">(rejette)</span>`
      : arch.decision_jury === 'REJETE'
      ? `<span class="strike">accepte</span> (rejette)`
      : `accepte (rejette)`;

    const dateSoutenance = s?.date ? s.date.split(' à ')[0] : new Date().toLocaleDateString('fr-FR');
    const visaSignataire = sigInfo('DIRECTEUR_ACADEMIQUE')?.signataire || 'Alou P. BATANA';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de soutenance — ${arch.code_archive}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; }
    .page { padding: 40px 55px; }
    .page + .page { page-break-before: always; }
    h1 { text-align:center; font-size: 12pt; font-weight:700; margin-bottom: 26px; }
    .field { margin-bottom: 12px; }
    .field .val { border-bottom: 1px solid #000; padding: 0 4px 2px; }
    .field-blank { border-bottom: 1px solid #000; height: 16px; margin-bottom: 12px; }
    .spec-promo { margin-top: 8px; }
    .spec-promo .field { margin-bottom: 10px; }
    .spec-promo .val { display:inline-block; min-width: 260px; }
    h2 { text-align:center; font-size: 11pt; font-weight:700; margin: 22px 0 12px; }
    table.jury { width:100%; border-collapse: collapse; margin-bottom: 22px; }
    table.jury th, table.jury td { border:1px solid #000; padding:9px 10px; font-size:10.5pt; text-align:left; height: 34px; }
    table.jury th { font-weight:700; text-align:center; }
    .jury-role { font-weight:700; width:170px; }
    .eval-row { display:flex; gap: 30px; margin-top: 6px; }
    .eval-left { flex: 1.4; }
    .eval-title { font-weight:700; margin-bottom: 14px; }
    .eval-q { margin-bottom: 14px; line-height:1.5; }
    .eval-opts { display:flex; gap:24px; margin-top:4px; flex-wrap:wrap; }
    .note-box { flex: 1; border:1px solid #000; padding:12px 16px; align-self:flex-start; }
    .note-box .titre { font-weight:700; margin-bottom:26px; }
    .rapport-lines { margin: 18px 0; }
    .rapport-line { border-bottom:1px dotted #000; min-height: 24px; padding: 2px 0; font-size:10.5pt; }
    .decision { margin: 14px 0 6px; line-height:1.6; }
    .strike { text-decoration: line-through; }
    .footnote { font-size:9pt; font-style:italic; margin-bottom: 30px; }
    .fait { text-align:right; margin-bottom: 34px; }
    .sig-grid2 { display:flex; gap: 40px; margin-bottom: 40px; }
    .sig-col { flex:1; }
    .sig-col .sig-title { font-weight:700; margin-bottom: 34px; }
    .sig-stamp { font-size:8.5pt; color:#333; font-family: monospace; margin-top: 4px; }
    .visa { text-align:center; margin-top: 20px; }
    .visa .titre { text-decoration: underline; font-weight:700; margin-bottom: 30px; }
    .visa .nom { text-decoration: underline; font-weight:700; }
    .registre-footer { margin-top: 34px; padding-top: 10px; border-top: 1px solid #000; font-size: 9pt; text-align:center; }
    @media print { .page { padding: 10mm 14mm; } @page { margin: 12mm; } }
  </style>
</head>
<body>

  <!-- ══ PAGE 1 ══ -->
  <div class="page">
    <h1>RAPPORT DE SOUTENANCE - ${niveauLabel}</h1>

    <div class="field">Nom et Prénom du Candidat : <span class="val">${nomEtudiant}</span></div>
    <div class="field">Titre du Mémoire : <span class="val">${s?.titre_theme ?? ''}</span></div>
    <div class="field-blank"></div>
    <div class="field-blank"></div>

    <div class="spec-promo">
      <div class="field">Spécialité : <span class="val">${arch.specialite || arch.etudiant.filiere}</span></div>
      <div class="field">Promotion : <span class="val">${arch.promotion}</span></div>
    </div>

    <h2>Jury de soutenance</h2>
    <table class="jury">
      <thead>
        <tr><th></th><th>Nom et Prénoms</th><th>Grade</th><th>Établissement d'appartenance</th></tr>
      </thead>
      <tbody>
        ${juryRow('Président', s?.president ?? '', j.president.grade, j.president.etablissement)}
        ${juryRow('Membre du Jury', s?.examinateur ?? '', j.examinateur.grade, j.examinateur.etablissement)}
        ${juryRow('Membre du Jury', j.membre2.nom, j.membre2.grade, j.membre2.etablissement)}
        ${juryRow('Directeur de Mémoire', s?.directeur ?? '', j.directeur.grade, j.directeur.etablissement)}
      </tbody>
    </table>

    <div class="eval-row">
      <div class="eval-left">
        <div class="eval-title">Evaluation générale :</div>
        <div class="eval-q">
          1. Ce rapport est-il à votre avis digne d'un mémoire ?
          <div class="eval-opts">
            <span>Oui ${box(arch.digne_memoire === true)}</span>
            <span>Non ${box(arch.digne_memoire === false)}</span>
          </div>
        </div>
        <div class="eval-q">
          2. Dans l'affirmation le travail présenté est-il d'un niveau scientifique :
          <div class="eval-opts">
            <span>Exceptionnel ${box(arch.niveau_scientifique === 'EXCEPTIONNEL')}</span>
            <span>Très bon ${box(arch.niveau_scientifique === 'TRES_BON')}</span>
            <span>Bon ${box(arch.niveau_scientifique === 'BON')}</span>
            <span>Satisfaisant ${box(arch.niveau_scientifique === 'SATISFAISANT')}</span>
          </div>
        </div>
      </div>
      <div class="note-box">
        <div class="titre">Rapport Scientifique du Jury</div>
        <div>Note sur 20 : ${arch.note_finale !== null ? arch.note_finale : ''}</div>
      </div>
    </div>
  </div>

  <!-- ══ PAGE 2 ══ -->
  <div class="page">
    <div class="eval-title">S.V.P. Rédigez lisiblement votre rapport</div>

    <div class="rapport-lines">
      ${(arch.rapport_scientifique || '').split('\n').concat(Array(12).fill('')).slice(0, Math.max(12, (arch.rapport_scientifique || '').split('\n').length))
        .map(line => `<div class="rapport-line">${line}</div>`).join('')}
    </div>

    <div class="decision">
      En conséquence le jury ${decisionHtml}<sup>1</sup> le mémoire pour l'obtention de la ${niveauLabel} de
      IPNET INSTITUTE OF TECHNOLOGY.
    </div>
    <div class="footnote"><sup>1</sup> Barrer la mention inutile</div>

    <div class="fait">Fait à ${arch.ville_soutenance || 'Lomé'}, le ${dateSoutenance}</div>

    <div class="sig-grid2">
      <div class="sig-col">
        <div class="sig-title">Nom et signature du Président du Jury</div>
        <div>${s?.president ?? ''}</div>
        ${sigStamp('PRESIDENT')}
      </div>
      <div class="sig-col">
        <div class="sig-title">Noms et signature des membres du Jury</div>
        <div>${s?.examinateur ?? ''}</div>
        ${sigStamp('EXAMINATEUR')}
        ${j.membre2.nom ? `<div style="margin-top:8px">${j.membre2.nom}</div>` : ''}
      </div>
    </div>

    <div class="visa">
      <div class="titre">Visa du Directeur Académique</div>
      <div class="nom">${visaSignataire}</div>
      ${sigStamp('DIRECTEUR_ACADEMIQUE')}
    </div>

    ${arch.valide_service_examen ? `
    <div class="registre-footer">
      Validé par le Service Examen (${arch.valide_par_examen ?? ''}) et enregistré sous le n° <strong>${arch.numero_registre}</strong>
      le ${arch.date_enregistrement ? new Date(arch.date_enregistrement).toLocaleDateString('fr-FR') : ''}
      ${arch.numero_registre_manuel ? ` — Registre papier n° ${arch.numero_registre_manuel}` : ''}
    </div>` : ''}
  </div>

</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank', 'width=900,height=750');
    if (win) {
      win.onload = () => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      };
    }
  }

  // ── Téléchargement authentifié ────────────────────────────────────────
  telechargerDoc(url: string | null | undefined, nomFichier: string): void {
    if (!url) return;
    this.svc.telechargerFichier(url, nomFichier);
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  statutClass(statut: string): string {
    if (statut === 'ARCHIVE')       return 'badge-archive';
    if (statut === 'EN_VALIDATION') return 'badge-validation';
    if (statut === 'PV_PARTIEL')    return 'badge-partiel';
    return 'badge-attente';
  }

  sigClass(signed: boolean): string { return signed ? 'sig-ok' : 'sig-non'; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

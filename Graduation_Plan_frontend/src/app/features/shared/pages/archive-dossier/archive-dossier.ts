import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import {
  DocumentService,
  ArchiveDossier,
  EtudiantDisponible,
} from '../../../../core/services/document';

const ARCHIVE_ROLES = ['CHEF_SERVICE_EXAM', 'ADMIN_ACADEMIC'];

@Component({
  selector: 'app-archive-dossier',
  imports: [CommonModule, FormsModule, RouterLink, TopNav],
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

  // Panneau signature
  activeArch    = signal<ArchiveDossier | null>(null);
  sigForm       = { pv_signe_president: false, pv_signe_examinateur: false, pv_signe_directeur: false,
                    note_finale: '', mention: '', commentaire: '' };
  sigLoading    = false;
  sigError      = '';
  newPvFile: File | null = null;

  readonly MENTIONS = ['Passable', 'Assez bien', 'Bien', 'Très bien', 'Non admis'];

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

  // ── Signature ─────────────────────────────────────────────────────────
  ouvrirSig(arch: ArchiveDossier): void {
    this.activeArch.set(arch);
    this.sigForm = {
      pv_signe_president:   arch.pv.signe_president,
      pv_signe_examinateur: arch.pv.signe_examinateur,
      pv_signe_directeur:   arch.pv.signe_directeur,
      note_finale:          arch.note_finale !== null ? String(arch.note_finale) : '',
      mention:              arch.mention,
      commentaire:          arch.commentaire ?? '',
    };
    this.sigError   = '';
    this.newPvFile  = null;
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
    fd.append('pv_signe_president',   String(this.sigForm.pv_signe_president));
    fd.append('pv_signe_examinateur', String(this.sigForm.pv_signe_examinateur));
    fd.append('pv_signe_directeur',   String(this.sigForm.pv_signe_directeur));
    fd.append('note_finale',          this.sigForm.note_finale);
    fd.append('mention',              this.sigForm.mention);
    fd.append('commentaire',          this.sigForm.commentaire);
    if (this.newPvFile) fd.append('pv_fichier', this.newPvFile);

    this.svc.signerPV(arch.id, fd).subscribe({
      next: (updated) => {
        this.sigLoading = false;
        this.activeArch.set(null);
        this.archives.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      },
      error: (err) => {
        this.sigError   = err?.error?.detail ?? 'Erreur lors de la mise à jour.';
        this.sigLoading = false;
      },
    });
  }

  // ── Génération PV PDF ─────────────────────────────────────────────────
  telechargerPV(arch: ArchiveDossier): void {
    const s = arch.soutenance_info;
    const nomEtudiant = `${arch.etudiant.prenom} ${arch.etudiant.nom.toUpperCase()}`;

    const rowHtml = (label: string, value: string) =>
      `<div class="row"><span class="label">${label}</span><span class="value">${value}</span></div>`;

    const sigBlock = (role: string, nom: string, signe: boolean) => `
      <div class="sig-block">
        <div class="sig-role">${role}</div>
        <div class="sig-name">${nom || '—'}</div>
        <div class="sig-line"></div>
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>PV de Soutenance — ${arch.code_archive}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #111; padding: 36px 48px; }
    .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #000; }
    .institution { font-size: 10pt; text-transform: uppercase; letter-spacing: 2px; color: #444; margin-bottom: 8px; }
    .pv-title { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin: 10px 0; }
    .code { font-size: 11pt; border: 1px solid #888; display: inline-block; padding: 3px 14px; border-radius: 4px; color: #555; }
    .section { margin: 18px 0; }
    .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; margin: 5px 0; }
    .label { width: 200px; font-weight: 600; color: #555; font-size: 11pt; flex-shrink: 0; }
    .value { flex: 1; font-size: 11pt; }
    .value-titre { font-style: italic; font-weight: 600; font-size: 12pt; }
    .value-note { font-weight: bold; font-size: 14pt; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 40px; margin-top: 14px; }
    .sig-block { text-align: center; }
    .sig-role { font-size: 9pt; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
    .sig-name { font-size: 11pt; margin-bottom: 22px; }
    .sig-line { border-bottom: 1px solid #000; height: 36px; margin: 0 12px; }
    .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 9pt; color: #888; text-align: center; }
    @media print { body { padding: 10px; } @page { margin: 18mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="institution">IPNET — Institut de Formation en Technologies</div>
    <div class="pv-title">Procès-Verbal de Soutenance</div>
    <div class="code">${arch.code_archive}</div>
  </div>

  <div class="section">
    <div class="section-title">Étudiant</div>
    ${rowHtml('Nom & Prénom', nomEtudiant)}
    ${rowHtml('Matricule', arch.etudiant.matricule)}
    ${rowHtml('Filière', arch.etudiant.filiere)}
  </div>

  ${s ? `
  <div class="section">
    <div class="section-title">Mémoire</div>
    <div class="row"><span class="label">Titre</span><span class="value value-titre">${s.titre_theme}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Composition du jury</div>
    ${rowHtml('Président du jury', s.president)}
    ${rowHtml('Examinateur', s.examinateur)}
    ${rowHtml('Directeur de mémoire', s.directeur)}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Résultats</div>
    ${s ? rowHtml('Date de soutenance', s.date) : ''}
    ${s?.salle ? rowHtml('Salle', s.salle) : ''}
    ${arch.note_finale !== null ? `<div class="row"><span class="label">Note finale</span><span class="value value-note">${arch.note_finale}/20</span></div>` : ''}
    ${arch.mention ? rowHtml('Mention', arch.mention) : ''}
  </div>

  <div class="section">
    <div class="section-title">Signatures</div>
    <div class="sig-grid">
      ${sigBlock('Président du jury', s?.president ?? '', arch.pv.signe_president)}
      ${sigBlock('Examinateur', s?.examinateur ?? '', arch.pv.signe_examinateur)}
      ${sigBlock('Directeur de mémoire', s?.directeur ?? '', arch.pv.signe_directeur)}
      ${sigBlock("L'Étudiant(e)", nomEtudiant, true)}
    </div>
  </div>

  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
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
    if (statut === 'ARCHIVE')    return 'badge-archive';
    if (statut === 'PV_PARTIEL') return 'badge-partiel';
    return 'badge-attente';
  }

  sigClass(signed: boolean): string { return signed ? 'sig-ok' : 'sig-non'; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

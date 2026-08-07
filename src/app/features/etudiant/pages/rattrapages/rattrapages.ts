import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav }      from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import { RattrapageService, Rattrapage } from '../../../../core/services/rattrapage/rattrapage';

@Component({
  selector: 'app-etudiant-rattrapages',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './rattrapages.html',
  styleUrls: ['./rattrapages.scss'],
})
export class EtudiantRattrapagesComponent implements OnInit {
  rattrapages  = signal<Rattrapage[]>([]);
  isLoading    = signal(true);
  successMsg   = signal('');
  errorMsg     = signal('');
  uploadFor    = signal<number | null>(null);
  inProgress   = signal<number | null>(null);

  prenom = signal('');
  nom    = signal('');

  constructor(
    private rattrapageService: RattrapageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const u = this.authService.currentUser();
    this.prenom.set(u?.first_name ?? '');
    this.nom.set(u?.last_name ?? '');
    this.charger();
  }

  charger(): void {
    this.isLoading.set(true);
    this.rattrapageService.getRattrapages().subscribe({
      next:  data => { this.rattrapages.set(data); this.isLoading.set(false); },
      error: ()   => { this.errorMsg.set('Chargement impossible.'); this.isLoading.set(false); },
    });
  }

  get initiales(): string {
    const p = this.prenom(); const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'ET';
  }

  factures(): Rattrapage[] {
    return this.rattrapages().filter(r => r.facture_envoyee);
  }

  aRegler(): Rattrapage[] {
    return this.rattrapages().filter(r => r.facture_envoyee && r.statut === 'EN_ATTENTE_PAIEMENT');
  }

  totalDu(): number {
    return this.aRegler().reduce((s, r) => s + r.frais, 0);
  }

  totalFactures(): number {
    return this.factures().reduce((s, r) => s + r.frais, 0);
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE_PAIEMENT: '⏳ À régler',
      PAIEMENT_SOUMIS:     '📤 Paiement soumis',
      AUTORISE:            '✅ Autorisé',
      PROGRAMME:           '📅 Programmé',
      PASSE:               '🎓 Passé',
      ANNULE:              '❌ Annulé',
    };
    return map[s] ?? s;
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE_PAIEMENT: 'badge-warn',
      PAIEMENT_SOUMIS:     'badge-info',
      AUTORISE:            'badge-success',
      PROGRAMME:           'badge-neutral',
      PASSE:               'badge-success',
      ANNULE:              'badge-danger',
    };
    return map[s] ?? 'badge-neutral';
  }

  // ── Upload preuve ─────────────────────────────────────────────────────

  ouvrirUpload(id: number): void  { this.uploadFor.set(id); }
  annulerUpload(): void           { this.uploadFor.set(null); }

  onFichierChange(event: Event, rattrapageId: number): void {
    const fichier = (event.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    this.inProgress.set(rattrapageId);
    this.uploadFor.set(null);
    this.rattrapageService.soumettrePreuve(rattrapageId, fichier).subscribe({
      next: () => {
        this.successMsg.set('Preuve de paiement soumise. Le service recouvrement va valider.');
        this.inProgress.set(null);
        this.charger();
      },
      error: () => { this.errorMsg.set('Erreur lors de l\'envoi.'); this.inProgress.set(null); },
    });
  }

  // ── Téléchargement facture proforma ───────────────────────────────────

  telechargerFacture(): void {
    const lignes = this.factures();
    if (!lignes.length) return;

    const today   = new Date().toLocaleDateString('fr-FR');
    const year    = new Date().getFullYear();
    const ref     = `FAC-RATT-${year}-${String(lignes[0].id).padStart(4, '0')}`;
    const nom     = `${this.prenom()} ${this.nom()}`.trim() || lignes[0].etudiant_nom;
    const total   = lignes.reduce((s, r) => s + r.frais, 0);

    const rows = lignes.map(r => `
      <tr>
        <td>[${r.ue_code}] ${r.ue_libelle}</td>
        <td class="center">${r.ue_credits}</td>
        <td class="center">${r.ue_est_informatique ? 'Informatique' : 'Non-inform.'}</td>
        <td class="right">${r.ue_tarif.toLocaleString('fr-FR')} FCFA</td>
        <td class="right bold">${r.frais.toLocaleString('fr-FR')} FCFA</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture Proforma ${ref}</title>
  <style>
    *  { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start;
              border-bottom: 3px solid #0F2237; padding-bottom: 20px; margin-bottom: 28px; }
    .school { font-size: 20px; font-weight: bold; color: #0F2237; }
    .school-sub { font-size: 12px; color: #666; margin-top: 3px; }
    .doc-title h1 { font-size: 22px; font-weight: 900; color: #C8963E; text-align: right; }
    .doc-title .ref { font-size: 11px; color: #666; text-align: right; margin-top: 4px; }
    .info-row { display: flex; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #F7F5F0; border-radius: 6px; padding: 12px 16px; flex: 1; }
    .info-box .lbl { font-size: 10px; font-weight: bold; color: #718096;
                     text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .info-box .val { font-size: 14px; font-weight: 700; color: #0F2237; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0F2237; color: #fff; padding: 10px 12px; font-size: 11px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #E2DDD4; }
    tr:nth-child(even) td { background: #FAF8F3; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .total-row td { font-weight: bold; font-size: 14px; background: #FDF3E0 !important;
                    border-top: 2px solid #0F2237; color: #0F2237; }
    .notice { background: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 6px;
              padding: 12px 16px; color: #2B6CB0; font-size: 12px; margin-top: 8px; line-height: 1.6; }
    .footer { margin-top: 32px; border-top: 1px solid #E2DDD4; padding-top: 12px;
              font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school">ÉCOLE SUPÉRIEURE PENUEL</div>
      <div class="school-sub">Service de Recouvrement · BP 0000 · Cotonou</div>
    </div>
    <div class="doc-title">
      <h1>FACTURE PROFORMA</h1>
      <div class="ref">Réf. ${ref} &nbsp;·&nbsp; Date : ${today}</div>
    </div>
  </div>

  <div class="info-row">
    <div class="info-box">
      <div class="lbl">Destinataire</div>
      <div class="val">${nom}</div>
    </div>
    <div class="info-box">
      <div class="lbl">Objet</div>
      <div class="val">Frais de rattrapage — Session ${year}</div>
    </div>
    <div class="info-box">
      <div class="lbl">Total à payer</div>
      <div class="val" style="color:#C8963E">${total.toLocaleString('fr-FR')} FCFA</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Unité d'enseignement</th>
        <th class="center">Crédits</th>
        <th class="center">Type</th>
        <th class="right">Tarif / crédit</th>
        <th class="right">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="4">TOTAL À PAYER</td>
        <td class="right">${total.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    </tbody>
  </table>

  <div class="notice">
    ⚠️&nbsp; Cette facture proforma est valable pour la session en cours.<br>
    Veuillez vous acquitter du montant ci-dessus auprès du Service de Recouvrement,
    puis soumettre votre <strong>preuve de paiement</strong> via votre espace étudiant.
  </div>

  <div class="footer">Document généré le ${today} · PENUEL Graduation Plan &mdash; Usage interne</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
  }
}

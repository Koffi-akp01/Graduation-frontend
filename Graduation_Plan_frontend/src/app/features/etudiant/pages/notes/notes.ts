import { Component, OnInit, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import { StudentService, ReleveNotes, AnneeNotes } from '../../../../core/services/student.service';

@Component({
  selector: 'app-etudiant-notes',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TopNav, UpperCasePipe],
  templateUrl: './notes.html',
  styleUrls: ['./notes.scss'],
})
export class EtudiantNotesComponent implements OnInit {
  releve    = signal<ReleveNotes | null>(null);
  isLoading = signal(true);
  errorMsg  = signal('');
  prenom    = signal('');
  nom       = signal('');

  constructor(
    private studentService: StudentService,
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
    this.errorMsg.set('');
    this.studentService.getMesNotes().subscribe({
      next:  data => { this.releve.set(data);  this.isLoading.set(false); },
      error: ()   => { this.errorMsg.set('Impossible de charger le relevé de notes.'); this.isLoading.set(false); },
    });
  }

  get initiales(): string {
    const p = this.prenom(); const n = this.nom();
    return ((p ? p[0] : '') + (n ? n[0] : '')) || 'ET';
  }

  statutLabel(statut: string): string {
    return ({ VALIDE: 'Validé', ECHOUE: 'Échoué', RATTRAPAGE: 'Rattrapage' } as Record<string,string>)[statut] ?? statut;
  }

  statutClass(statut: string): string {
    return ({ VALIDE: 'badge-valide', ECHOUE: 'badge-echoue', RATTRAPAGE: 'badge-rattrapage' } as Record<string,string>)[statut] ?? '';
  }

  noteLabel(note: number | null): string {
    return note !== null ? `${note.toFixed(2)}/20` : '—';
  }

  telechargerPDF(): void {
    const r = this.releve();
    if (!r) return;

    const lignesHtml = (notes: AnneeNotes['notes']) => notes.map(n => {
      const statutColor = n.statut === 'VALIDE' ? '#065F46' : n.statut === 'ECHOUE' ? '#9B2226' : '#7B4F00';
      const statutBg    = n.statut === 'VALIDE' ? '#D1FAE5' : n.statut === 'ECHOUE' ? '#FFE8E8' : '#FFF3CD';
      return `<tr>
        <td>${n.ue_code}</td>
        <td>${n.ue_libelle}</td>
        <td style="text-align:center;font-weight:700">${n.note !== null ? n.note.toFixed(2) + '/20' : '—'}</td>
        <td style="text-align:center">
          <span style="background:${statutBg};color:${statutColor};padding:2px 10px;border-radius:99px;font-size:10pt;font-weight:700">${this.statutLabel(n.statut)}</span>
        </td>
      </tr>`;
    }).join('');

    const blocsAnnees = r.annees.map(a => `
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:13pt;font-weight:800;color:#0F2237">Année ${a.annee}</span>
          <span style="font-size:10pt;color:#718096">${a.nb_validees}/${a.nb_total} UE validée(s)</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11pt">
          <thead>
            <tr style="background:#0F2237;color:#fff">
              <th style="padding:8px 10px;text-align:left">Code UE</th>
              <th style="padding:8px 10px;text-align:left">Unité d'enseignement</th>
              <th style="padding:8px 10px;text-align:center;width:100px">Note</th>
              <th style="padding:8px 10px;text-align:center;width:120px">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${lignesHtml(a.notes)}
          </tbody>
        </table>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Relevé de notes — ${r.etudiant.matricule}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:12pt; color:#111; padding:36px 48px; }
    tr:nth-child(even) td { background:#F9FAFB; }
    td { padding: 7px 10px; border-bottom: 1px solid #E5E7EB; }
    .footer { margin-top:40px; border-top:1px solid #ccc; padding-top:14px; display:flex; justify-content:flex-end; }
    .sig-block { text-align:center; width:220px; }
    .sig-role { font-size:9pt; text-transform:uppercase; letter-spacing:1px; color:#555; margin-bottom:4px; }
    .sig-name { font-size:10pt; margin-bottom:20px; }
    .sig-line { border-bottom:1px solid #000; height:30px; }
    @media print { body { padding:10px; } @page { margin:18mm; } }
  </style>
</head>
<body>
  <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #0F2237;margin-bottom:24px">
    <div style="font-size:9pt;text-transform:uppercase;letter-spacing:2px;color:#718096;margin-bottom:6px">
      IPNET — Institut de Formation en Technologies
    </div>
    <div style="font-size:18pt;font-weight:800;color:#0F2237;text-transform:uppercase;letter-spacing:2px;margin:8px 0">
      RELEVÉ DE NOTES
    </div>
    <div style="font-size:10pt;color:#555">Document officiel — Service des Examens</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:24px;font-size:11pt">
    <div><span style="color:#718096;font-weight:600">Nom & Prénom :</span> ${r.etudiant.prenom} ${r.etudiant.nom.toUpperCase()}</div>
    <div><span style="color:#718096;font-weight:600">Matricule :</span> ${r.etudiant.matricule}</div>
    <div><span style="color:#718096;font-weight:600">Filière :</span> ${r.etudiant.filiere}</div>
    <div><span style="color:#718096;font-weight:600">Date d'édition :</span> ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</div>
  </div>

  <div style="border-top:1px solid #E5E7EB;margin-bottom:24px"></div>

  ${blocsAnnees}

  <div class="footer">
    <div class="sig-block">
      <div class="sig-role">Chef du Service des Examens</div>
      <div class="sig-name"></div>
      <div class="sig-line"></div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank', 'width=920,height=750');
    if (win) {
      win.onload = () => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      };
    }
  }
}

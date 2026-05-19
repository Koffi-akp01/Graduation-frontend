import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared-module';
import { ToastService } from '../../shared/services/toast';

interface Soutenance {
  id: number;
  etudiant: string;
  niveau: string;
  titre: string;
  date: Date;
  salle: string;
  statut: 'en_attente' | 'notes_saisies' | 'pv_signe';
  notes?: Notes;
}

interface Notes {
  qualite: number;
  maitrise: number;
  reponses: number;
  innovation: number;
}

@Component({
  selector: 'app-jury',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="jury-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-avatar">
          <div class="avatar-circle">PJ</div>
          <div>
            <div class="avatar-name">Pr. Jean Asante</div>
            <div class="avatar-role">Président du Jury</div>
          </div>
        </div>

        <div class="sidebar-section">SOUTENANCES</div>
        <a class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Tableau de bord</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Mes soutenances</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📝</span>
          <span class="nav-label">Saisir les notes</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📄</span>
          <span class="nav-label">Procès-verbaux</span>
        </a>

        <div class="sidebar-section">DISPONIBILITÉS</div>
        <a class="nav-item">
          <span class="nav-icon">🔔</span>
          <span class="nav-label">Mes indisponibilités</span>
        </a>
      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <div>
            <div class="page-title">Pr. Jean Asante</div>
            <div class="page-subtitle">Président du jury — 4 soutenances ce mois</div>
          </div>
          <button class="btn btn-secondary" (click)="gererIndisponibilites()">📅 Mes indisponibilités</button>
        </div>

        <!-- Cartes statistiques -->
        <div class="stats-grid">
          <app-stat-card label="Soutenances assignées" value="4" icon="🎓" color="#2B6CB0" sub="Session Juillet 2025"></app-stat-card>
          <app-stat-card label="Notes à saisir" value="1" icon="📝" color="#C8963E" sub="En attente"></app-stat-card>
          <app-stat-card label="PV signés" value="3" icon="✍" color="#276749" sub="Archivés"></app-stat-card>
          <app-stat-card label="PV en attente" value="1" icon="⏳" color="#9B2226" sub="Signature requise"></app-stat-card>
        </div>

        <!-- Formulaire de saisie des notes -->
        <div class="card" *ngIf="soutenanceSelectionnee">
          <div class="card-header">
            <span class="card-title">📝 Saisie des notes — {{ soutenanceSelectionnee.etudiant }}</span>
            <app-badge [text]="soutenanceSelectionnee.statut === 'en_attente' ? 'En attente de saisie' : 'Notes saisies'" 
                       [variant]="soutenanceSelectionnee.statut === 'en_attente' ? 'warning' : 'success'"></app-badge>
          </div>
          <div class="card-body">
            <!-- Infos étudiant -->
            <div class="info-etudiant">
              <div class="info-label">ÉTUDIANT</div>
              <div class="info-value">{{ soutenanceSelectionnee.etudiant }}</div>
              <div class="info-sub">{{ soutenanceSelectionnee.niveau }} — {{ soutenanceSelectionnee.titre }}</div>
            </div>

            <!-- Tableau des notes -->
            <div class="table-wrapper">
              <table class="notes-table">
                <thead>
                  <tr class="table-header">
                    <th>CRITÈRE D'ÉVALUATION</th>
                    <th>COEFFICIENT</th>
                    <th>NOTE /20</th>
                    <th>NOTE PONDÉRÉE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="critere">Qualité rédactionnelle du mémoire</td>
                    <td class="coeff">3</td>
                    <td><input type="number" class="note-input" [(ngModel)]="notes.qualite" min="0" max="20" step="0.5" (input)="calculerMoyenne()"></td>
                    <td class="ponderee">{{ notes.qualite * 3 }}</td>
                   </tr>
                  <tr>
                    <td class="critere">Maîtrise du sujet (présentation orale)</td>
                    <td class="coeff">4</td>
                    <td><input type="number" class="note-input" [(ngModel)]="notes.maitrise" min="0" max="20" step="0.5" (input)="calculerMoyenne()"></td>
                    <td class="ponderee">{{ notes.maitrise * 4 }}</td>
                   </tr>
                  <tr>
                    <td class="critere">Réponses aux questions du jury</td>
                    <td class="coeff">3</td>
                    <td><input type="number" class="note-input" [(ngModel)]="notes.reponses" min="0" max="20" step="0.5" (input)="calculerMoyenne()"></td>
                    <td class="ponderee">{{ notes.reponses * 3 }}</td>
                   </tr>
                  <tr>
                    <td class="critere">Innovation et contribution</td>
                    <td class="coeff">2</td>
                    <td><input type="number" class="note-input" [(ngModel)]="notes.innovation" min="0" max="20" step="0.5" (input)="calculerMoyenne()"></td>
                    <td class="ponderee">{{ notes.innovation * 2 }}</td>
                   </tr>
                  <tr class="moyenne-row">
                    <td colspan="2"><strong>MOYENNE FINALE (/20)</strong></td>
                    <td colspan="2"><strong class="moyenne-valeur">{{ moyenneFinale }} — <span class="mention">{{ mention }}</span></strong></td>
                   </tr>
                </tbody>
              </table>
            </div>

            <!-- Mention -->
            <div class="form-group">
              <label class="input-label">Mention attribuée</label>
              <select class="input" [(ngModel)]="mentionSelectionnee" (change)="onMentionChange()">
                <option value="Passable (10–12)">Passable (10–12)</option>
                <option value="Assez Bien (12–14)">Assez Bien (12–14)</option>
                <option value="Bien (14–16)" selected>Bien (14–16)</option>
                <option value="Très Bien (16–18)">Très Bien (16–18)</option>
                <option value="Félicitations (18–20)">Félicitations (18–20)</option>
              </select>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="annuler()">Annuler</button>
              <button class="btn btn-gold" (click)="genererPV()">📄 Générer le PV</button>
              <button class="btn btn-primary" (click)="signerSoumettre()">✍ Signer & Soumettre</button>
            </div>
          </div>
        </div>

        <!-- Liste des soutenances assignées -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Mes soutenances assignées</span>
          </div>
          <div class="table-wrapper">
            <table class="soutenances-table">
              <thead>
                <tr class="table-header">
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Étudiant</th>
                  <th>Salle</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of soutenances()">
                  <td>{{ s.date | date:'dd/MM/yyyy' }}</td>
                  <td>{{ s.date | date:'HH:mm' }}</td>
                  <td><strong>{{ s.etudiant }}</strong><br><span class="niveau">{{ s.niveau }}</span></td>
                  <td>{{ s.salle }}</td>
                  <td><app-badge [text]="getStatutTexte(s.statut)" [variant]="getStatutVariant(s.statut)"></app-badge></td>
                  <td>
                    <button class="btn-saisir" (click)="selectionnerSoutenance(s)">Saisir notes</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .jury-layout {
      display: flex;
      min-height: 100vh;
      background: #F7F5F0;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #E2DDD4;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-avatar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid #E2DDD4;
      background: #FAF8F3;
    }
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #2D6A4F;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
    }
    .avatar-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F2237;
    }
    .avatar-role {
      font-size: 11px;
      color: #718096;
      margin-top: 2px;
    }
    .sidebar-section {
      padding: 20px 20px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      font-size: 13px;
      color: #4A5568;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      text-decoration: none;
    }
    .nav-item:hover {
      background: #FAF8F3;
      color: #1A3C5E;
    }
    .nav-item.active {
      background: #FDF3E0;
      color: #C8963E;
      border-left-color: #C8963E;
      font-weight: 600;
    }
    .nav-icon {
      font-size: 18px;
      width: 24px;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      flex: 1;
      padding: 32px 40px;
      overflow-y: auto;
    }

    /* En-tête */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 800;
      color: #1A3C5E;
      margin-bottom: 8px;
    }
    .page-subtitle {
      font-size: 13px;
      color: #718096;
    }
    .btn-secondary {
      background: white;
      color: #4A5568;
      border: 1px solid #E2DDD4;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #FAF8F3;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 1000px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
    }

    /* Cartes */
    .card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2DDD4;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #1A3C5E;
    }
    .card-body {
      padding: 24px;
    }

    /* Info étudiant */
    .info-etudiant {
      background: #FAF8F3;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .info-label {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 700;
      color: #1A3C5E;
    }
    .info-sub {
      font-size: 13px;
      color: #718096;
      margin-top: 4px;
    }

    /* Tableau des notes */
    .table-wrapper {
      overflow-x: auto;
    }
    .notes-table, .soutenances-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table-header th {
      background: #F9F8F5;
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      border-bottom: 1px solid #E2DDD4;
    }
    .notes-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #E2DDD4;
      vertical-align: middle;
    }
    .critere {
      font-weight: 600;
      color: #2D3748;
    }
    .coeff {
      text-align: center;
      width: 80px;
    }
    .note-input {
      width: 70px;
      padding: 6px 8px;
      text-align: center;
      font-family: 'DM Mono', monospace;
      border: 1px solid #E2DDD4;
      border-radius: 6px;
    }
    .ponderee {
      font-family: 'DM Mono', monospace;
      font-weight: 700;
      color: #1A3C5E;
    }
    .moyenne-row {
      background: #FDF3E0;
    }
    .moyenne-row td {
      padding: 16px;
    }
    .moyenne-valeur {
      font-size: 18px;
      font-family: 'DM Mono', monospace;
      color: #1A3C5E;
    }
    .mention {
      color: #276749;
    }

    /* Formulaire */
    .form-group {
      margin-top: 20px;
    }
    .input-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #2D3748;
      margin-bottom: 6px;
    }
    .input {
      width: 100%;
      max-width: 300px;
      padding: 10px 14px;
      border: 1px solid #E2DDD4;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .btn-gold {
      background: #C8963E;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-gold:hover {
      background: #B07F30;
    }
    .btn-primary {
      background: #1A3C5E;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover {
      background: #2B6CB0;
    }

    /* Tableau des soutenances */
    .soutenances-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #E2DDD4;
      vertical-align: middle;
    }
    .niveau {
      font-size: 11px;
      color: #718096;
    }
    .btn-saisir {
      background: #1A3C5E;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-saisir:hover {
      background: #2B6CB0;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 20px; }
    }
  `]
})
export class JuryComponent {
  private toast = inject(ToastService);

  soutenances = signal<Soutenance[]>([
    {
      id: 1,
      etudiant: 'Ama Koffi',
      niveau: 'Master 2 Informatique',
      titre: 'Système de détection d\'intrusions basé sur le Machine Learning',
      date: new Date(2025, 6, 15, 9, 30),
      salle: 'Salle B204',
      statut: 'en_attente'
    },
    {
      id: 2,
      etudiant: 'Kofi Asante',
      niveau: 'Master 2 Informatique',
      titre: 'Blockchain & sécurité des données',
      date: new Date(2025, 6, 14, 14, 0),
      salle: 'Salle B204',
      statut: 'pv_signe'
    },
    {
      id: 3,
      etudiant: 'Yaw Boateng',
      niveau: 'Master 1 Gestion',
      titre: 'Finance islamique et PME',
      date: new Date(2025, 6, 21, 10, 0),
      salle: 'Salle A101',
      statut: 'notes_saisies'
    }
  ]);

  soutenanceSelectionnee: Soutenance | null = null;
  notes: Notes = { qualite: 16, maitrise: 15, reponses: 14, innovation: 17 };
  moyenneFinale: string = '15.3';
  mention: string = 'Bien';
  mentionSelectionnee: string = 'Bien (14–16)';

  getStatutTexte(statut: string): string {
    switch(statut) {
      case 'en_attente': return 'En attente';
      case 'notes_saisies': return 'Notes saisies';
      case 'pv_signe': return 'PV signé';
      default: return 'Inconnu';
    }
  }

  getStatutVariant(statut: string): 'warning' | 'success' | 'neutral' {
    switch(statut) {
      case 'en_attente': return 'warning';
      case 'notes_saisies': return 'success';
      case 'pv_signe': return 'success';
      default: return 'neutral';
    }
  }

  selectionnerSoutenance(s: Soutenance) {
    this.soutenanceSelectionnee = s;
    // Réinitialiser les notes par défaut
    this.notes = { qualite: 16, maitrise: 15, reponses: 14, innovation: 17 };
    this.calculerMoyenne();
  }

  calculerMoyenne() {
    const totalPondere = (this.notes.qualite * 3) + (this.notes.maitrise * 4) + (this.notes.reponses * 3) + (this.notes.innovation * 2);
    const coeffs = 3 + 4 + 3 + 2;
    const moyenne = totalPondere / coeffs;
    this.moyenneFinale = moyenne.toFixed(1);
    
    if (moyenne >= 18) this.mention = 'Félicitations';
    else if (moyenne >= 16) this.mention = 'Très bien';
    else if (moyenne >= 14) this.mention = 'Bien';
    else if (moyenne >= 12) this.mention = 'Assez bien';
    else if (moyenne >= 10) this.mention = 'Passable';
    else this.mention = 'Non admis';
  }

  onMentionChange() {
    // Permet à l'utilisateur de modifier manuellement la mention si besoin
  }

  annuler() {
    this.soutenanceSelectionnee = null;
  }

  genererPV() {
    this.toast.success('Procès-verbal généré avec succès');
  }

  signerSoumettre() {
    this.toast.success('Évaluation signée et soumise avec succès');
    if (this.soutenanceSelectionnee) {
      this.soutenanceSelectionnee.statut = 'pv_signe';
      this.soutenanceSelectionnee = null;
    }
  }

  gererIndisponibilites() {
    this.toast.info('Gestion des indisponibilités (à implémenter)');
  }
}
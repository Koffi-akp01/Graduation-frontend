import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { ToastService } from '../../../shared/services/toast.service';

interface JuryRow {
  id: number;
  etudiant: string;
  niveau: string;
  directeur: string;
  president: string;
  examinateur: string;
  regleDoctorat: string;
  regleStatus: 'success' | 'warning' | 'info';
  statut: string;
  statutVariant: 'success' | 'warning' | 'neutral';
}

interface CalendrierEvent {
  date: number;
  nom: string;
  heure: string;
  couleur?: string;
}

@Component({
  selector: 'app-direction',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="direction-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-avatar">
          <div class="avatar-circle">DA</div>
          <div>
            <div class="avatar-name">Direction Académique</div>
            <div class="avatar-role">Administration</div>
          </div>
        </div>

        <div class="sidebar-section">GESTION</div>
        <a class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Tableau de bord</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">👨‍🏫</span>
          <span class="nav-label">Affecter directeurs</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">⚖️</span>
          <span class="nav-label">Constituer les jurys</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">✅</span>
          <span class="nav-label">Valider les résultats</span>
        </a>

        <div class="sidebar-section">SESSIONS</div>
        <a class="nav-item">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Calendrier mensuel</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Statistiques</span>
        </a>
      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <div>
            <div class="page-title">Direction Académique</div>
            <div class="page-subtitle">Session de soutenance — Juillet 2025</div>
          </div>
          <button class="btn btn-primary" (click)="nouvelleSession()">➕ Nouvelle session</button>
        </div>

        <!-- Cartes statistiques -->
        <div class="stats-grid">
          <app-stat-card label="Soutenances planifiées" value="34" icon="🎓" color="#2B6CB0" sub="Session Juillet 2025"></app-stat-card>
          <app-stat-card label="Jurys à constituer" value="8" icon="⚖️" color="#C8963E" sub="En attente d'affectation"></app-stat-card>
          <app-stat-card label="Directeurs affectés" value="51" icon="👨‍🏫" color="#276749" sub="Encadrements actifs"></app-stat-card>
          <app-stat-card label="Résultats à valider" value="12" icon="📝" color="#9B2226" sub="PV en attente de signature"></app-stat-card>
        </div>

        <!-- Tableau constitution des jurys -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚖️ Constitution des jurys</span>
            <button class="btn btn-primary btn-sm" (click)="constituerJury()">+ Constituer un jury</button>
          </div>
          <div class="table-wrapper">
            <table class="jury-table">
              <thead>
                <tr class="table-header">
                  <th>Étudiant</th>
                  <th>Niveau</th>
                  <th>Directeur mémoire</th>
                  <th>Président jury</th>
                  <th>Examinateur</th>
                  <th>Règle Doctorat</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let j of jurys()">
                  <td><strong>{{ j.etudiant }}</strong><div class="matricule">{{ getMatricule(j.etudiant) }}</div></td>
                  <td>{{ j.niveau }}</td>
                  <td>{{ j.directeur }}</td>
                  <td>{{ j.president || '—' }}</td>
                  <td>{{ j.examinateur || '—' }}</td>
                  <td><app-badge [text]="j.regleDoctorat" [variant]="j.regleStatus"></app-badge></td>
                  <td><app-badge [text]="j.statut" [variant]="j.statutVariant"></app-badge></td>
                  <td><button class="btn-edit" (click)="modifierJury(j)">✏️ Modifier</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Calendrier mensuel -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📅 Calendrier mensuel — Juillet 2025</span>
          </div>
          <div class="calendar-wrapper">
            <div class="calendar-grid">
              <div class="cal-header">Lun</div>
              <div class="cal-header">Mar</div>
              <div class="cal-header">Mer</div>
              <div class="cal-header">Jeu</div>
              <div class="cal-header">Ven</div>
              <div class="cal-header">Sam</div>
              <div class="cal-header">Dim</div>
              
              <!-- Jours vides début juillet (1er jour = mardi) -->
              <div class="cal-day empty"></div>
              <div class="cal-day"><div class="day-num">1</div></div>
              <div class="cal-day"><div class="day-num">2</div></div>
              <div class="cal-day"><div class="day-num">3</div></div>
              <div class="cal-day"><div class="day-num">4</div></div>
              <div class="cal-day"><div class="day-num">5</div></div>
              
              <!-- Semaine 2 -->
              <div class="cal-day"><div class="day-num">7</div></div>
              <div class="cal-day"><div class="day-num">8</div></div>
              <div class="cal-day"><div class="day-num">9</div></div>
              <div class="cal-day"><div class="day-num">10</div></div>
              <div class="cal-day"><div class="day-num">11</div></div>
              <div class="cal-day"><div class="day-num">12</div></div>
              <div class="cal-day"><div class="day-num">13</div></div>
              
              <!-- Semaine 3 -->
              <div class="cal-day has-event">
                <div class="day-num">14</div>
                <div class="cal-event">A. Koffi 09h30</div>
                <div class="cal-event gold">K. Asante 14h00</div>
              </div>
              <div class="cal-day has-event">
                <div class="day-num">15</div>
                <div class="cal-event">Y. Boateng 10h00</div>
              </div>
              <div class="cal-day"><div class="day-num">16</div></div>
              <div class="cal-day"><div class="day-num">17</div></div>
              <div class="cal-day"><div class="day-num">18</div></div>
              <div class="cal-day"><div class="day-num">19</div></div>
              <div class="cal-day"><div class="day-num">20</div></div>
              
              <!-- Semaine 4 -->
              <div class="cal-day has-event">
                <div class="day-num">21</div>
                <div class="cal-event green">A. Mensah 09h00</div>
              </div>
              <div class="cal-day"><div class="day-num">22</div></div>
              <div class="cal-day"><div class="day-num">23</div></div>
              <div class="cal-day"><div class="day-num">24</div></div>
              <div class="cal-day"><div class="day-num">25</div></div>
              <div class="cal-day"><div class="day-num">26</div></div>
              <div class="cal-day"><div class="day-num">27</div></div>
              
              <!-- Semaine 5 -->
              <div class="cal-day"><div class="day-num">28</div></div>
              <div class="cal-day"><div class="day-num">29</div></div>
              <div class="cal-day"><div class="day-num">30</div></div>
              <div class="cal-day"><div class="day-num">31</div></div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal de modification jury -->
    <div class="modal-overlay" *ngIf="jurySelectionne" (click)="fermerModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>✏️ Modifier le jury — {{ jurySelectionne.etudiant }}</h3>
          <button class="modal-close" (click)="fermerModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="input-label">Président du jury</label>
            <select class="input" [(ngModel)]="jurySelectionne.president">
              <option value="">— Sélectionner —</option>
              <option value="Pr. Jean Asante">Pr. Jean Asante</option>
              <option value="Pr. Marie Konan">Pr. Marie Konan</option>
              <option value="Pr. Jacques Koffi">Pr. Jacques Koffi</option>
            </select>
          </div>
          <div class="form-group">
            <label class="input-label">Examinateur</label>
            <select class="input" [(ngModel)]="jurySelectionne.examinateur">
              <option value="">— Sélectionner —</option>
              <option value="Dr. Afia Boateng">Dr. Afia Boateng</option>
              <option value="Dr. Esi Quaye">Dr. Esi Quaye</option>
              <option value="Dr. Kofi Mensah">Dr. Kofi Mensah</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="fermerModal()">Annuler</button>
            <button class="btn btn-primary" (click)="sauvegarderJury()">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .direction-layout {
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
      background: #1A3C5E;
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
    .btn-sm {
      padding: 6px 14px;
      font-size: 12px;
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
      flex-wrap: wrap;
      gap: 12px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #1A3C5E;
    }

    /* Tableau jury */
    .table-wrapper {
      overflow-x: auto;
    }
    .jury-table {
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
    .jury-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #E2DDD4;
      vertical-align: middle;
    }
    .matricule {
      font-size: 11px;
      color: #718096;
      margin-top: 2px;
    }
    .btn-edit {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #718096;
    }
    .btn-edit:hover {
      color: #C8963E;
    }

    /* Calendrier */
    .calendar-wrapper {
      padding: 20px;
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }
    .cal-header {
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      text-align: center;
      padding: 8px;
    }
    .cal-day {
      background: #F9F8F5;
      border-radius: 8px;
      padding: 8px;
      min-height: 80px;
    }
    .cal-day.empty {
      background: transparent;
    }
    .day-num {
      font-size: 12px;
      font-weight: 600;
      color: #718096;
      margin-bottom: 6px;
    }
    .cal-day.has-event {
      background: white;
      border: 1px solid #E2DDD4;
    }
    .cal-event {
      background: #1A3C5E;
      color: white;
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 10px;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cal-event.gold {
      background: #C8963E;
    }
    .cal-event.green {
      background: #276749;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-container {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1A3C5E;
      margin: 0;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #718096;
    }
    .modal-body {
      padding: 24px;
    }
    .form-group {
      margin-bottom: 16px;
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
      padding: 10px 14px;
      border: 1px solid #E2DDD4;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .btn-secondary {
      background: white;
      color: #4A5568;
      border: 1px solid #E2DDD4;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 20px; }
      .calendar-grid { gap: 4px; }
      .cal-day { min-height: 60px; padding: 4px; }
      .cal-event { font-size: 8px; white-space: normal; }
    }
  `]
})
export class DirectionComponent {
  private toast = inject(ToastService);

  jurys = signal<JuryRow[]>([
    {
      id: 1,
      etudiant: 'Ama Koffi',
      niveau: 'Master 2',
      directeur: 'Dr. Kofi Mensah',
      president: 'Pr. Jean Asante',
      examinateur: 'Dr. Afia Boateng',
      regleDoctorat: '2 Docteurs ✓',
      regleStatus: 'success',
      statut: 'Complet',
      statutVariant: 'success'
    },
    {
      id: 2,
      etudiant: 'Kofi Asante',
      niveau: 'Master 2',
      directeur: 'Dr. Yaw Darko',
      president: '',
      examinateur: 'Dr. Esi Quaye',
      regleDoctorat: '1/2 Docteurs',
      regleStatus: 'warning',
      statut: 'Incomplet',
      statutVariant: 'warning'
    },
    {
      id: 3,
      etudiant: 'Abena Adjei',
      niveau: 'Licence 3',
      directeur: 'M. Kwesi Adu',
      president: 'Dr. Ama Sarpong',
      examinateur: 'M. Fiifi Osei',
      regleDoctorat: 'N/A (Licence)',
      regleStatus: 'info',
      statut: 'Complet',
      statutVariant: 'success'
    }
  ]);

  jurySelectionne: JuryRow | null = null;

  getMatricule(etudiant: string): string {
    const map: Record<string, string> = {
      'Ama Koffi': 'M2-INFO-2025',
      'Kofi Asante': 'M2-INFO-2025',
      'Abena Adjei': 'L3-MATH-2025'
    };
    return map[etudiant] || 'N/A';
  }

  nouvelleSession() {
    this.toast.info('Création d\'une nouvelle session (simulé)');
  }

  constituerJury() {
    this.toast.info('Formulaire de constitution de jury (simulé)');
  }

  modifierJury(jury: JuryRow) {
    this.jurySelectionne = { ...jury };
  }

  sauvegarderJury() {
    if (this.jurySelectionne) {
      const index = this.jurys().findIndex(j => j.id === this.jurySelectionne!.id);
      if (index !== -1) {
        const newJurys = [...this.jurys()];
        newJurys[index] = this.jurySelectionne;
        this.jurys.set(newJurys);
        this.toast.success('Jury modifié avec succès');
      }
      this.fermerModal();
    }
  }

  fermerModal() {
    this.jurySelectionne = null;
  }
}
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface DemoRole {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
}

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent {
  mobileNavOpen = false;
  demoOpen = false;
  activeDemo = 'etudiant';

  roles: DemoRole[] = [
    { id: 'etudiant',      icon: '🎓', label: 'Étudiant',            subtitle: 'Tableau de bord personnel' },
    { id: 'direction',     icon: '🏛', label: 'Direction académique', subtitle: 'Validation thèmes & jurys' },
    { id: 'directeur',     icon: '📘', label: 'Directeur de mémoire', subtitle: 'Suivi étudiants encadrés' },
    { id: 'jury',          icon: '⚖',  label: 'Jury / Président',     subtitle: 'Notation & procès-verbal' },
    { id: 'organisation',  icon: '🗓', label: 'Organisation',         subtitle: 'Planification soutenances' },
    { id: 'recouvrement',  icon: '💰', label: 'Recouvrement',         subtitle: 'Suivi des paiements' },
    { id: 'admin',         icon: '⚙',  label: 'Administrateur',       subtitle: 'Système — accès total' },
  ];

  toggleMobileNav(): void { this.mobileNavOpen = !this.mobileNavOpen; }
  closeMobileNav(): void  { this.mobileNavOpen = false; }
  openDemo(): void        { this.demoOpen = true; document.body.style.overflow = 'hidden'; }
  closeDemo(): void       { this.demoOpen = false; document.body.style.overflow = ''; }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.demoOpen) this.closeDemo(); }
}

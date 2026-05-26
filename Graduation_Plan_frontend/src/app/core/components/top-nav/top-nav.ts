import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth/auth';
import { NotificationBellComponent } from '../notification-bell/notification-bell';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss',
})
export class TopNav {
  private auth = inject(AuthService);

  role = computed(() => this.auth.currentUser()?.role ?? localStorage.getItem('user_role') ?? '');

  loggedIn = computed(() => !!this.auth.currentUser() || !!localStorage.getItem('access_token'));

  displayName = computed(() => {
    const u = this.auth.currentUser();
    const genre  = u?.genre  ?? localStorage.getItem('user_genre')      ?? '';
    const fn     = u?.first_name ?? localStorage.getItem('user_first_name') ?? '';
    const ln     = u?.last_name  ?? localStorage.getItem('user_last_name')  ?? '';
    const name   = `${fn} ${ln}`.trim();
    if (!name) return '';
    const civility = genre === 'F' ? 'Mme' : 'Mr';
    return `${civility} ${ln || name}`.trim();
  });

  isStudent      = computed(() => ['STUDENT', 'ETUDIANT', 'etudiant'].includes(this.role()));
  isDirection    = computed(() => ['ADMIN_ACADEMIC', 'DIRECTION', 'direction'].includes(this.role()));
  isExamen       = computed(() => ['CHEF_SERVICE_EXAM', 'examen'].includes(this.role()));
  isDirecteur    = computed(() => ['INTERNAL_TRAINER', 'EXTERNAL_TRAINER', 'directeur'].includes(this.role()));
  isJury         = computed(() => ['EXAMINER', 'PRESIDENT_JURY', 'jury'].includes(this.role()));
  isOrganisation = computed(() => ['CHARGE_ORGANISATION', 'organisation'].includes(this.role()));
  isRecouvrement = computed(() => ['SERVICE_RECOUVREMENT', 'recouvrement'].includes(this.role()));
  isAdmin        = computed(() => ['ADMIN', 'admin'].includes(this.role()));

  logout() { this.auth.logout(); }
}

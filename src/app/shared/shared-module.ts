import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from './components/badge/badge';
import { StatCardComponent } from './components/stat-card/stat-card';
import { AlertComponent } from './components/alert/alert';
import { ToastComponent } from './components/toast/toast';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer';

const COMPONENTS = [
  BadgeComponent,
  StatCardComponent,
  AlertComponent,
  ToastComponent,
  LoadingSpinnerComponent,
  PdfViewerComponent,
];

@NgModule({
  imports: [CommonModule, ...COMPONENTS],
  exports: COMPONENTS,
})
export class SharedModule {}
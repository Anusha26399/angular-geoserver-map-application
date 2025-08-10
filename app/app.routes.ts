// app.routes.ts
import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard';
import { DatastoreComponent } from './datastore/datastore';
import { LayerComponent } from './layer/layer';
import { HeaderComponent } from './header/header';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'datastore', component: DatastoreComponent },
  { path: 'header', component: HeaderComponent },
  { path: 'layers', component: LayerComponent }
];

// sidebar.component.ts
import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerComponent } from '../layer/layer';
import { DatastoreComponent } from '../datastore/datastore';
import { UploadComponent } from '../upload/upload';
import { DashboardComponent } from '../dashboard/dashboard';

interface Workspace {
  name: string;
  description?: string;
}

interface DataStore {
  name: string;
  description?: string;
  type?: string;
}

interface FeatureType {
  name: string;
  title?: string;
  description?: string;
}

interface ActiveLayer {
  id: string;
  name: string;
  workspace: string;
}

interface NewWorkspace {
  name: string;
  description: string;
}

interface NewDatastore {
  name: string;
  description: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema: string;
}

interface DashboardStats {
  workspacesCount: number;
  datastoresCount: number;
  activeLayersCount: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LayerComponent, DatastoreComponent, UploadComponent, DashboardComponent],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  @Input() isPanelOpen: boolean = false;
  @Input() workspaces: Workspace[] = [];
  @Input() datastores: DataStore[] = [];
  @Input() availableLayers: FeatureType[] = [];
  @Input() activeLayers: ActiveLayer[] = [];
  @Input() selectedWorkspace: string = '';
  @Input() selectedDatastore: string = '';

  @Output() panelToggled = new EventEmitter<void>();
  @Output() tabChanged = new EventEmitter<string>();
  @Output() workspaceChanged = new EventEmitter<string>();
  @Output() datastoreChanged = new EventEmitter<string>();
  @Output() layerToggled = new EventEmitter<FeatureType>();
  @Output() activeLayerRemoved = new EventEmitter<ActiveLayer>();
  @Output() datastoreCreated = new EventEmitter<NewDatastore>();
  @Output() fileUploaded = new EventEmitter<File>();
  @Output() dataRefreshed = new EventEmitter<void>();

  @ViewChild(UploadComponent) uploadComponent!: UploadComponent;

  selectedTab = 'layers';

  onTogglePanel(): void {
    this.panelToggled.emit();
  }

  setTab(tab: string): void {
    this.selectedTab = tab;
    this.tabChanged.emit(tab);
  }

  onWorkspaceChanged(workspace: string): void {
    this.workspaceChanged.emit(workspace);
  }

  onDatastoreChanged(datastore: string): void {
    this.datastoreChanged.emit(datastore);
  }

  onLayerToggled(layer: FeatureType): void {
    this.layerToggled.emit(layer);
  }

  onActiveLayerRemoved(layer: ActiveLayer): void {
    this.activeLayerRemoved.emit(layer);
  }

  onDatastoreCreated(datastore: NewDatastore): void {
    this.datastoreCreated.emit(datastore);
  }

  onFileUploaded(file: File): void {
    this.fileUploaded.emit(file);
  }

  onDataRefreshed(): void {
    this.dataRefreshed.emit();
  }

  get dashboardStats(): DashboardStats {
    return {
      workspacesCount: this.workspaces.length,
      datastoresCount: this.datastores.length,
      activeLayersCount: this.activeLayers.length
    };
  }

  // Method to update upload component state
  updateUploadState(state: any): void {
    if (this.uploadComponent) {
      this.uploadComponent.updateUploadState(state);
    }
  }

  // Method to clear upload component state
  clearUpload(): void {
    if (this.uploadComponent) {
      this.uploadComponent.clearUpload();
    }
  }
}
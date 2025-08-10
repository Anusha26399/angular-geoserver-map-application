// layer.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-layer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './layer.html',
  styleUrls: ['./layer.css']
})
export class LayerComponent {
  @Input() workspaces: Workspace[] = [];
  @Input() datastores: DataStore[] = [];
  @Input() availableLayers: FeatureType[] = [];
  @Input() activeLayers: ActiveLayer[] = [];
  @Input() selectedWorkspace: string = '';
  @Input() selectedDatastore: string = '';

  @Output() workspaceChanged = new EventEmitter<string>();
  @Output() datastoreChanged = new EventEmitter<string>();
  @Output() layerToggled = new EventEmitter<FeatureType>();
  @Output() activeLayerRemoved = new EventEmitter<ActiveLayer>();

  onWorkspaceChange(): void {
    this.workspaceChanged.emit(this.selectedWorkspace);
  }

  onDatastoreChange(): void {
    this.datastoreChanged.emit(this.selectedDatastore);
  }

  onToggleLayer(layer: FeatureType): void {
    this.layerToggled.emit(layer);
  }

  onRemoveActiveLayer(layer: ActiveLayer): void {
    this.activeLayerRemoved.emit(layer);
  }

  isLayerActive(layer: FeatureType): boolean {
    const layerId = `${this.selectedWorkspace}:${layer.name}`;
    return this.activeLayers.some(activeLayer => activeLayer.id === layerId);
  }
}
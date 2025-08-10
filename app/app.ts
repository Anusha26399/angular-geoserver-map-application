// app.component.ts - Fixed version
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeoServerService } from './geoserver.service';
import { HeaderComponent } from './header/header';
import { SidebarComponent } from './sidebar/sidebar';
import { MapComponent } from './map/map';

interface Workspace { name: string; description?: string; }
interface DataStore { name: string; description?: string; type?: string; }
interface FeatureType { name: string; title?: string; description?: string; }
interface ActiveLayer { id: string; name: string; workspace: string; }
interface NewWorkspace { name: string; description: string; }
interface NewDatastore {
  name: string; description: string;
  host: string; port: string; database: string;
  username: string; password: string; schema: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, MapComponent]
})
export class AppComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebarComponent!: SidebarComponent;
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // State properties
  isPanelOpen = false;
  selectedTab = 'layers';
  workspaces: Workspace[] = [];
  datastores: DataStore[] = [];
  availableLayers: FeatureType[] = [];
  activeLayers: ActiveLayer[] = [];
  selectedWorkspace = '';
  selectedDatastore = '';

  // Upload state
  isUploading = false;
  uploadProgress = 0;
  uploadMessage = '';

  geoServerUrl = 'http://192.168.20.69:8080/geoserver';

  constructor(private geoServerService: GeoServerService) { }

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  onTogglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;

    // Refresh map size and control positions after panel animation
    setTimeout(() => {
      if (this.mapComponent) {
        this.mapComponent.refreshMapSize();
      }
    }, 350); // Wait for CSS transition to complete
  }

  onWorkspaceChanged(workspace: string): void {
    this.selectedWorkspace = workspace;
    this.selectedDatastore = '';
    this.datastores = [];
    this.availableLayers = [];
    if (workspace) {
      this.loadDatastores();
    }
  }

  onCreateWorkspace(newWorkspace: NewWorkspace): void {
    this.geoServerService.createWorkspace(newWorkspace).subscribe({
      next: () => {
        this.loadWorkspaces();
        alert('Workspace created successfully!');
      },
      error: err => {
        console.error('Workspace create error:', err);
        alert('Failed to create workspace: ' + err.message);
      }
    });
  }

  // Sidebar event handlers
  onTabChanged(tab: string): void {
    this.selectedTab = tab;
  }

  onDatastoreChanged(datastore: string): void {
    this.selectedDatastore = datastore;
    this.availableLayers = [];
    if (datastore) {
      this.loadLayers();
    }
  }

  onLayerToggled(layer: FeatureType): void {
    const layerId = `${this.selectedWorkspace}:${layer.name}`;
    const existingIndex = this.activeLayers.findIndex(l => l.id === layerId);

    if (existingIndex >= 0) {
      this.activeLayers.splice(existingIndex, 1);
      this.activeLayers = [...this.activeLayers]; // Important to trigger change detection
    } else {
      this.activeLayers.push({
        id: layerId,
        name: layer.name,
        workspace: this.selectedWorkspace
      });
      this.activeLayers = [...this.activeLayers]; // Important to trigger change detection

      // Zoom to the layer when toggled on
      this.geoServerService.getLayerBoundingBox(this.selectedWorkspace, this.selectedDatastore, layer.name).subscribe({
        next: (res) => {
          try {
            const bbox = res.featureType?.nativeBoundingBox;
            if (bbox) {
              const centerLon = (bbox.minx + bbox.maxx) / 2;
              const centerLat = (bbox.miny + bbox.maxy) / 2;
              this.mapComponent.setCenter(centerLon, centerLat, 9);
            }
          } catch (e) {
            console.error('Error parsing bounding box:', e);
          }
        },
        error: (err) => {
          console.error('Error fetching bounding box:', err);
        }
      });
    }
  }

  onActiveLayerRemoved(layer: ActiveLayer): void {
    const index = this.activeLayers.findIndex(l => l.id === layer.id);
    if (index >= 0) {
      this.activeLayers.splice(index, 1);
    }
    this.activeLayers = [...this.activeLayers]; // Important to trigger change detection
  }

  onDatastoreCreated(newDatastore: NewDatastore): void {
    this.geoServerService.createPostGISDatastore(this.selectedWorkspace, newDatastore).subscribe({
      next: () => {
        this.loadDatastores();
        alert('Datastore created successfully!');
      },
      error: err => {
        console.error('Datastore create error:', err);
        alert('Failed to create datastore: ' + err.message);
      }
    });
  }

  onFileUploaded(file: File): void {
    if (!this.selectedWorkspace || !this.selectedDatastore) {
      alert('Please select a workspace and datastore');
      return;
    }

    this.updateUploadState({
      isUploading: true,
      uploadProgress: 0,
      uploadMessage: 'Uploading...'
    });

    // Use the correct method name from your service
    this.geoServerService.uploadToDatabase(file, this.selectedWorkspace, this.selectedDatastore).subscribe({
      next: event => {
        if (event.type === 'progress') {
          this.updateUploadState({
            uploadProgress: event.progress || 0,
            uploadMessage: `Uploading... ${event.progress || 0}%`
          });
        } else if (event.type === 'response') {
          const layerName = file.name.replace('.zip', '').replace('.shp', '');

          // Since backend upload already publishes, skip frontend publishLayer call
          const newLayer = {
            id: `${this.selectedWorkspace}:${layerName}`,
            name: layerName,
            workspace: this.selectedWorkspace
          };
          this.activeLayers = [...this.activeLayers, newLayer];

          this.updateUploadState({
            uploadProgress: 100,
            uploadMessage: 'Upload completed and layer published!',
            isUploading: false
          });

          // Immediately update activeLayers to show the new layer without reload
          this.activeLayers = [...this.activeLayers, newLayer];

          // Fetch bounding box and zoom to layer
          this.geoServerService.getLayerBoundingBox(this.selectedWorkspace, this.selectedDatastore, layerName).subscribe({
            next: (res) => {
              try {
                const bbox = res.featureType?.nativeBoundingBox;
                if (bbox) {
                  const centerLon = (bbox.minx + bbox.maxx) / 2;
                  const centerLat = (bbox.miny + bbox.maxy) / 2;
                  this.mapComponent.setCenter(centerLon, centerLat, 9);
                }
              } catch (e) {
                console.error('Error parsing bounding box:', e);
              }
            },
            error: (err) => {
              console.error('Error fetching bounding box:', err);
            }
          });

          setTimeout(() => {
            this.loadLayers();
            this.clearUpload();
          }, 2000);
        }
      },
      error: err => {
        console.error('Upload error:', err);
        this.updateUploadState({
          uploadMessage: 'Upload failed: ' + err.message,
          isUploading: false,
          uploadProgress: 0
        });
      }
    });
  }

  onDataRefreshed(): void {
    this.loadWorkspaces();
  }

  // Upload state management methods
  private updateUploadState(state: { isUploading?: boolean; uploadProgress?: number; uploadMessage?: string }): void {
    if (state.isUploading !== undefined) this.isUploading = state.isUploading;
    if (state.uploadProgress !== undefined) this.uploadProgress = state.uploadProgress;
    if (state.uploadMessage !== undefined) this.uploadMessage = state.uploadMessage;

    // If you have a sidebar component with these methods, call them
    if (this.sidebarComponent && typeof this.sidebarComponent.updateUploadState === 'function') {
      this.sidebarComponent.updateUploadState(state);
    }
  }

  private clearUpload(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadMessage = '';

    // If you have a sidebar component with this method, call it
    if (this.sidebarComponent && typeof this.sidebarComponent.clearUpload === 'function') {
      this.sidebarComponent.clearUpload();
    }
  }

  // Data loading methods
  private loadWorkspaces(): void {
    this.geoServerService.getWorkspaces().subscribe({
      next: res => {
        const ws = res?.workspaces?.workspace || [];
        this.workspaces = Array.isArray(ws) ? ws : [ws];
        console.log('Loaded workspaces:', this.workspaces);
      },
      error: err => {
        console.error('Workspace load error:', err);
        this.workspaces = [];
      }
    });
  }

  private loadDatastores(): void {
    this.geoServerService.getDatastores(this.selectedWorkspace).subscribe({
      next: res => {
        const ds = res?.dataStores?.dataStore || [];
        this.datastores = Array.isArray(ds) ? ds : [ds];
        console.log('Loaded datastores:', this.datastores);
      },
      error: err => {
        console.error('Datastores load error:', err);
        this.datastores = [];
      }
    });
  }

  private loadLayers(): void {
    this.geoServerService.getLayers(this.selectedWorkspace, this.selectedDatastore).subscribe({
      next: res => {
        const ft = res?.featureTypes?.featureType || [];
        this.availableLayers = Array.isArray(ft) ? ft : [ft];
        console.log('Loaded layers:', this.availableLayers);
      },
      error: err => {
        console.error('Layers load error:', err);
        this.availableLayers = [];
      }
    });
  }
}
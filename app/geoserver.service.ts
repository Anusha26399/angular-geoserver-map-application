import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

interface WorkspaceResponse {
  workspaces?: {
    workspace: any[];
  };
}

interface DataStoreResponse {
  dataStores?: {
    dataStore: any[];
  };
}

interface FeatureTypeResponse {
  featureTypes?: {
    featureType: any[];
  };
}

interface UploadEvent {
  type: 'progress' | 'response' | 'other';
  progress?: number;
  body?: any;
  event?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GeoServerService {
  private readonly baseUrl = 'http://192.168.20.69:8080/geoserver';

  private readonly authHeader = new HttpHeaders({
    'Authorization': 'Basic ' + btoa('admin:geoserver'),
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  getWorkspaces(): Observable<WorkspaceResponse> {
    return this.http.get<WorkspaceResponse>(`${this.baseUrl}/rest/workspaces.json`, {
      headers: this.authHeader
    }).pipe(
      catchError(this.handleError)
    );
  }

  createWorkspace(workspace: { name: string; description?: string }): Observable<any> {
    const payload = {
      workspace: {
        name: workspace.name
      }
    };

    return this.http.post(
      `${this.baseUrl}/rest/workspaces.json`,
      payload,
      {
        headers: this.authHeader,
        responseType: 'text'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getDatastores(workspace: string): Observable<DataStoreResponse> {
    return this.http.get<DataStoreResponse>(
      `${this.baseUrl}/rest/workspaces/${encodeURIComponent(workspace)}/datastores.json`,
      { headers: this.authHeader }
    ).pipe(
      catchError(this.handleError)
    );
  }

  createPostGISDatastore(workspace: string, datastore: any): Observable<any> {
    const payload = {
      dataStore: {
        name: datastore.name,
        description: datastore.description,
        type: 'PostGIS',
        enabled: true,
        connectionParameters: {
          entry: [
            { '@key': 'host', '$': datastore.host },
            { '@key': 'port', '$': datastore.port },
            { '@key': 'database', '$': datastore.database },
            { '@key': 'user', '$': datastore.username },
            { '@key': 'passwd', '$': datastore.password },
            { '@key': 'schema', '$': datastore.schema || 'public' },
            { '@key': 'dbtype', '$': 'postgis' },
            { '@key': 'Connection timeout', '$': '20' },
            { '@key': 'validate connections', '$': 'true' },
            { '@key': 'preparedStatements', '$': 'false' },
            { '@key': 'Loose bbox', '$': 'true' },
            { '@key': 'Estimated extends', '$': 'false' }
          ]
        }
      }
    };

    return this.http.post(
      `${this.baseUrl}/rest/workspaces/${encodeURIComponent(workspace)}/datastores.json`,
      payload,
      {
        headers: this.authHeader,
        responseType: 'text'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getLayers(workspace: string, datastore: string): Observable<FeatureTypeResponse> {
    return this.http.get<FeatureTypeResponse>(
      `${this.baseUrl}/rest/workspaces/${encodeURIComponent(workspace)}/datastores/${encodeURIComponent(datastore)}/featuretypes.json`,
      { headers: this.authHeader }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getLayerBoundingBox(workspace: string, datastore: string, layerName: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/rest/workspaces/${encodeURIComponent(workspace)}/datastores/${encodeURIComponent(datastore)}/featuretypes/${encodeURIComponent(layerName)}.json`,
      { headers: this.authHeader }
    ).pipe(
      catchError(this.handleError)
    );
  }

  uploadToDatabase(file: File, workspace: string, datastore: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace', workspace);
    formData.append('datastore', datastore);

    console.log('Uploading file:', file.name, 'to workspace:', workspace, 'datastore:', datastore);

    return this.http.post('http://192.168.20.69:3000/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>): UploadEvent => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return { type: 'progress', progress };
            }
            return { type: 'progress', progress: 0 };
          case HttpEventType.Response:
            return { type: 'response', body: event.body };
          default:
            return { type: 'other', event };
        }
      }),
      catchError(this.handleError)
    );
  }

  // Improved publishLayer method with better payload structure
  publishLayer(workspace: string, datastore: string, layerName: string): Observable<any> {
    const payload = {
      featureType: {
        name: layerName,
        nativeName: layerName, // This should match the table name in PostGIS
        title: layerName,
        abstract: layerName,
        enabled: true,
        srs: 'EPSG:4326',
        nativeCRS: 'EPSG:4326',
        projectionPolicy: 'FORCE_DECLARED'
      }
    };

    return this.http.post(
      `${this.baseUrl}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes.json`,
      payload,
      {
        headers: this.authHeader,
        responseType: 'text'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Method to check if layer exists in PostGIS
  checkLayerInPostGIS(workspace: string, datastore: string, layerName: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes/${layerName}.json`,
      { headers: this.authHeader }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Method to get available feature types from PostGIS datastore
  getAvailableFeatureTypes(workspace: string, datastore: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes.json?list=available`,
      { headers: this.authHeader }
    ).pipe(
      catchError(this.handleError)
    );
  }

  createWMSLayer(workspace: string, layerName: string): TileLayer<TileWMS> {
    return new TileLayer({
      source: new TileWMS({
        url: `${this.baseUrl}/wms`,
        params: {
          'LAYERS': `${workspace}:${layerName}`,
          'TILED': true,
          'FORMAT': 'image/png',
          'TRANSPARENT': true,
          'VERSION': '1.1.0'
        },
        serverType: 'geoserver'
      })
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let errorDetails = '';

    console.error('Full HTTP Error:', error);

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Try to extract more details from the response
      if (error.error && typeof error.error === 'string') {
        errorDetails = error.error;
      } else if (error.error && error.error.message) {
        errorDetails = error.error.message;
      } else if (error.error && error.error.error) {
        errorDetails = error.error.error;
      } else if (error.error && error.error.details) {
        errorDetails = error.error.details;
      }

      // Handle specific error codes
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Check GeoServer credentials.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found. Check GeoServer URL and resource names.';
      } else if (error.status === 409) {
        errorMessage = 'Resource already exists or conflict occurred.';
      } else if (error.status === 400) {
        errorMessage = 'Bad request. Upload or configuration failed.';
        if (errorDetails) {
          errorMessage += `\n\nDetails: ${errorDetails}`;
        }
      } else if (error.status === 500) {
        errorMessage = 'Internal server error.';
        if (errorDetails) {
          errorMessage += `\n\nDetails: ${errorDetails}`;
        }
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Check if the backend server is running on http://192.168.20.69:3000';
      }
    }

    console.error('GeoServer Service Error:', errorMessage);
    console.error('Error details:', errorDetails);
    
    return throwError(() => new Error(errorMessage));
  }
}
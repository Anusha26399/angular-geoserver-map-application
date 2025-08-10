const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// GeoServer configuration
const GEOSERVER_URL = 'http:localhost/geoserver';
const GEOSERVER_AUTH = Buffer.from('admin:geoserver').toString('base64');

router.post('/', upload.single('file'), async (req, res) => {
  console.log('Upload request received');
  console.log('Body:', req.body);
  console.log('File:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { workspace, datastore } = req.body;
  
  if (!workspace || !datastore) {
    return res.status(400).json({ error: 'Workspace and datastore are required' });
  }

  const zipFilePath = req.file.path;
  const extractDir = `${zipFilePath}_extracted`;

  try {
    // Step 1: Create extraction directory
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    // Step 2: Extract the zip file
    console.log('Extracting zip file...');
    await new Promise((resolve, reject) => {
      exec(`unzip -o "${zipFilePath}" -d "${extractDir}"`, (err, stdout, stderr) => {
        if (err) {
          console.error('Unzip error:', err);
          console.error('Unzip stderr:', stderr);
          reject(new Error(`Failed to extract zip file: ${err.message}`));
        } else {
          console.log('Unzip successful:', stdout);
          resolve(stdout);
        }
      });
    });

    // Step 3: Find the shapefile
    console.log('Looking for shapefile...');
    const files = fs.readdirSync(extractDir);
    console.log('Extracted files:', files);
    
    const shpFile = files.find(f => f.endsWith('.shp'));
    
    if (!shpFile) {
      return res.status(400).json({ 
        error: 'No .shp file found in the archive',
        extractedFiles: files 
      });
    }

    const shpPath = path.join(extractDir, shpFile);
    let layerName = path.basename(shpFile, '.shp');
    
    // Clean layer name to make it PostgreSQL/GeoServer friendly
    layerName = layerName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&'); // Prefix with underscore if starts with number

    console.log('Processing layer:', layerName);

    // Step 4: Check if required shp files exist
    const requiredExtensions = ['.shp', '.shx', '.dbf'];
    const baseName = path.basename(shpFile, '.shp');
    
    for (const ext of requiredExtensions) {
      const requiredFile = path.join(extractDir, baseName + ext);
      if (!fs.existsSync(requiredFile)) {
        return res.status(400).json({ 
          error: `Missing required shapefile component: ${baseName}${ext}` 
        });
      }
    }

    // Step 5: Import to PostgreSQL using ogr2ogr
    console.log('Importing to PostGIS...');
    const ogrCommand = `ogr2ogr -f "PostgreSQL" PG:"host=hostname user=username dbname=Dbname password=password" "${shpPath}" -nln "${layerName}" -overwrite -lco GEOMETRY_NAME=geom -lco FID=gid -t_srs EPSG:4326`;

    console.log('Executing ogr2ogr command:', ogrCommand);
    
    await new Promise((resolve, reject) => {
      exec(ogrCommand, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('ogr2ogr error:', error);
          console.error('ogr2ogr stderr:', stderr);
          reject(new Error(`Failed to import to PostGIS: ${error.message}. Details: ${stderr}`));
        } else {
          console.log('ogr2ogr success:', stdout);
          if (stderr) console.log('ogr2ogr stderr (non-error):', stderr);
          resolve(stdout);
        }
      });
    });

    // Step 6: Verify the table was created in PostGIS
    console.log('Verifying table creation in PostGIS...');
    try {
      await verifyTableInPostGIS(layerName);
      console.log('Table verified in PostGIS');
    } catch (verifyError) {
      console.error('Table verification failed:', verifyError);
      throw new Error(`Table was not created in PostGIS: ${verifyError.message}`);
    }

    // Step 7: Publish layer in GeoServer
    console.log('Publishing layer in GeoServer...');
    await publishLayer(workspace, datastore, layerName);

    // Step 8: Cleanup
    cleanup(zipFilePath, extractDir);

    console.log('Upload and publish completed successfully');
    res.json({ 
      message: 'Upload and publish completed successfully', 
      layerName: layerName 
    });

  } catch (error) {
    console.error('Upload process error:', error);
    cleanup(zipFilePath, extractDir);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

async function verifyTableInPostGIS(tableName) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: 'hostname',
    user: 'dbusername',
    database: 'Dbname',
    password: 'Dbpassword',
    port:port,
  });

  try {
    const query = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query, [tableName]);
    
    if (result.rows.length === 0) {
      throw new Error(`Table '${tableName}' not found in database`);
    }
    
    console.log(`Table '${tableName}' columns:`, result.rows);
    
    // Check if geometry column exists
    const hasGeometry = result.rows.some(row => 
      row.column_name === 'geom' || row.data_type === 'USER-DEFINED'
    );
    
    if (!hasGeometry) {
      console.warn(`No geometry column found in table '${tableName}'`);
    }
    
    return result.rows;
  } finally {
    await pool.end();
  }
}

async function publishLayer(workspace, datastore, layerName) {
  console.log(`Publishing layer: ${layerName} in workspace: ${workspace}, datastore: ${datastore}`);
  
  const url = `${GEOSERVER_URL}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes.json`;
  
  // First, let's check if the layer already exists
  try {
    const checkUrl = `${GEOSERVER_URL}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes/${layerName}.json`;
    const checkResponse = await axios.get(checkUrl, {
      headers: {
        'Authorization': `Basic ${GEOSERVER_AUTH}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (checkResponse.status === 200) {
      console.log('Layer already exists, updating...');
      // If layer exists, we could update it or just return success
      return { message: 'Layer already exists' };
    }
  } catch (checkError) {
    // Layer doesn't exist, continue with creation
    if (checkError.response?.status !== 404) {
      console.error('Error checking existing layer:', checkError.message);
    }
  }
  
  const payload = {
    featureType: {
      name: layerName,
      nativeName: layerName, // This should match the table name in PostGIS
      title: layerName.charAt(0).toUpperCase() + layerName.slice(1),
      abstract: `Feature type for ${layerName}`,
      enabled: true,
      srs: 'EPSG:4326',
      nativeCRS: 'EPSG:4326',
      projectionPolicy: 'FORCE_DECLARED'
    }
  };

  console.log('Publishing with payload:', JSON.stringify(payload, null, 2));
  console.log('Publishing to URL:', url);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Basic ${GEOSERVER_AUTH}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Layer published successfully:', response.status);
    return response.data;
  } catch (error) {
    console.error('Publish error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: url,
      payload: JSON.stringify(payload, null, 2)
    });
    
    // More specific error messages
    if (error.response?.status === 400) {
      throw new Error(`GeoServer rejected the layer configuration. Check if the table '${layerName}' exists in PostGIS and has the correct structure.`);
    } else if (error.response?.status === 404) {
      throw new Error(`Workspace '${workspace}' or datastore '${datastore}' not found in GeoServer.`);
    } else if (error.response?.status === 409) {
      console.warn(`Layer '${layerName}' already exists in GeoServer. Treating as success.`);
      // Treat 409 conflict as success since layer exists
      return { message: 'Layer already exists' };
    }
    
    throw new Error(`Failed to publish layer: ${error.response?.status} - ${error.response?.statusText || error.message}`);
  }
}

function cleanup(zipPath, extractDir) {
  try {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      console.log('Deleted zip file:', zipPath);
    }
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      console.log('Deleted extraction directory:', extractDir);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = router;

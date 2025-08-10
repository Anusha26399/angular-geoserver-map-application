# 🌍 Angular GeoServer Map Application

🚀 **A modern web mapping application** built with **Angular** and **OpenLayers**, designed to visualize spatial data served from **GeoServer** using WMS/WFS protocols.

---

## 📜 Purpose
This project was created to:
- 🗺️ Demonstrate integration between **Angular** frontend and **GeoServer** backend
- 📡 Fetch & display **WMS/WFS layers** in a dynamic web map
- 🎯 Serve as a starting point for custom geospatial dashboards
- 🔍 Enable developers to extend with custom tools like search, filtering, and querying

---

## ✨ Features
- 📍 **Display WMS layers** from GeoServer
- 🔄 **Toggle layer visibility** at runtime
- 🖱️ Map interactions: pan, zoom
- 🛠️ Modular **Angular + OpenLayers** integration
- 🧩 Easy configuration via `environment.ts`
- 🎨 Custom styling for layers (extendable)

---

## 🏗️ Tech Stack
| Technology     | Purpose |
|----------------|---------|
| **Angular**    | Frontend framework |
| **TypeScript** | Strong typing & structure |
| **OpenLayers** | Web mapping & WMS/WFS rendering |
| **GeoServer**  | Geospatial data server |
| **HTML/CSS**   | UI & styling |

---

## 📂 Project Structure
```plaintext
angular-geoserver-map-application/
│
├── README.md                  # 📘 Project documentation
├── package.json               # 📦 Project dependencies & scripts
├── angular.json               # ⚙️ Angular workspace configuration
├── tsconfig.json              # 🛠️ TypeScript compiler options
├── .gitignore                 # 🚫 Ignored files/folders
│
└── src/
    ├── index.html              # 🌐 Main HTML entry point
    ├── main.ts                 # 🚀 Angular bootstrap
    ├── styles.css              # 🎨 Global styles
    │
    ├── environments/
    │   ├── environment.ts      # ⚙️ Dev configuration (GeoServer URL, workspace, layer)
    │   └── environment.prod.ts # ⚙️ Prod configuration
    │
    └── app/
        ├── app.module.ts       # 📦 Root Angular module
        ├── app.component.ts    # 🧩 Root component logic
        ├── app.component.html  # 🧩 Root component template
        ├── app.component.css   # 🧩 Root component styles
        │
        ├── services/
        │   └── map.service.ts  # 🗺️ GeoServer/OpenLayers helper
        │
        └── components/
            └── map/
                ├── map.component.ts   # 🗺️ Map logic with OpenLayers
                ├── map.component.html # 🗺️ Map container + UI
                └── map.component.css  # 🎨 Map styling

# Project Structure

```
WarOfRights-LogAnalyzer/
├── index.html                          # Main HTML entry point
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite configuration
├── README.md                           # Project documentation
├── SETUP.md                            # Setup instructions
├── .gitignore                          # Git ignore rules
│
├── src/
│   ├── main.js                         # Application entry point
│   ├── App.vue                         # Root component
│   │
│   ├── components/                     # Vue components
│   │   ├── FileUploader.vue           # File upload component
│   │   ├── WarningsPanel.vue          # Warnings display
│   │   ├── TimeSlider.vue             # Time range slider
│   │   ├── FilterInput.vue            # Search/filter input
│   │   ├── KpiCard.vue                # Total respawns KPI
│   │   ├── RespawnsTimelineChart.vue  # Line chart
│   │   ├── TopRegimentsChart.vue      # Horizontal bar chart
│   │   ├── TopPlayersChart.vue        # Horizontal bar chart
│   │   └── RegimentTimelineChart.vue  # Multi-line chart
│   │
│   ├── stores/
│   │   └── logStore.js                # Pinia state management
│   │
│   ├── workers/
│   │   └── log-parser.worker.js       # Web Worker for parsing
│   │
│   └── config/
│       └── parsing-config.json        # Parsing configuration
│
└── Example log files (*.log)          # Sample data files
```

## Key Files

### Configuration
- **vite.config.js**: Vite build configuration with Vuetify plugin
- **parsing-config.json**: Regiment extraction patterns and settings

### State Management
- **logStore.js**: Pinia store managing all application state
  - Raw events and rounds data
  - Filtered data based on time range and search
  - Computed getters for charts
  - Actions for parsing, caching, and export

### Web Worker
- **log-parser.worker.js**: Parses log files in background thread
  - Extracts respawn events
  - Detects rounds (explicit, map-bounded, pseudo)
  - Identifies regiments using pattern matching
  - Reports progress during parsing

### Components
All components are self-contained Vue 3 SFCs (Single File Components):
- Use Composition API with `<script setup>`
- Integrate with Pinia store via `useLogStore()`
- Charts use vue-echarts with ECharts

## Data Flow

1. User uploads log file → FileUploader.vue
2. File sent to Web Worker → log-parser.worker.js
3. Parsed data stored in Pinia → logStore.js
4. Data cached to LocalStorage
5. Components reactively update via computed getters
6. Time slider and filter update store state
7. Charts re-render based on filtered data

## Technologies

- **Vue 3**: Progressive JavaScript framework
- **Vuetify 3**: Material Design component library
- **Pinia**: State management
- **ECharts**: Charting library
- **Vite**: Build tool and dev server
- **Comlink**: Web Worker communication
- **LocalStorage**: Client-side caching

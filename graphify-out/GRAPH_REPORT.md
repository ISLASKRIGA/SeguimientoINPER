# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~40,165 words - fits in a single context window. You may not need a graph.

## Summary
- 74 nodes · 146 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- OCR & UI Core
- SFT Clinical Protocol
- Image Processing Pipeline
- Drug Catalog & Inference
- Text Normalization
- Dispensing & Data Layer
- Mock Patient Fixtures
- Database Schema

## God Nodes (most connected - your core abstractions)
1. `parsePrescriptionText()` - 10 edges
2. `inferFixedFormatMedicines()` - 8 edges
3. `recognizePrescription()` - 7 edges
4. `showRecipeSelector()` - 7 edges
5. `processSurtimiento()` - 6 edges
6. `handleOCRUpload()` - 6 edges
7. `mergeMockOcrDataIfNeeded()` - 6 edges
8. `mergeFixedFormatMedicines()` - 6 edges
9. `SFT Patient Form (Formato Paciente)` - 6 edges
10. `fetchRecetas()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Expediente SFT Avanzado View (3-tab Clinical Interview)` --semantically_similar_to--> `SFT Patient Form (Formato Paciente)`  [INFERRED] [semantically similar]
  index.html → graphify-out/converted/Formato pacientwas_db09bf26.md
- `Expediente SFT Avanzado View (3-tab Clinical Interview)` --semantically_similar_to--> `Plan de Actuación Farmacoterapéutico`  [INFERRED] [semantically similar]
  index.html → graphify-out/converted/Formato pacientwas_db09bf26.md
- `Seguimiento SFT View (Patient Clinical Notes)` --semantically_similar_to--> `Adherencia al Tratamiento (Control de Días 0-31)`  [INFERRED] [semantically similar]
  index.html → graphify-out/converted/Formato pacientwas_db09bf26.md
- `Expediente SFT Avanzado View (3-tab Clinical Interview)` --conceptually_related_to--> `NES Evaluation (Necesidad, Efectividad, Seguridad)`  [EXTRACTED]
  index.html → graphify-out/converted/Formato pacientwas_db09bf26.md
- `Expediente SFT Avanzado View (3-tab Clinical Interview)` --conceptually_related_to--> `RNM (Resultado Negativo Asociado a la Medicación)`  [EXTRACTED]
  index.html → graphify-out/converted/Formato pacientwas_db09bf26.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SFT Clinical Assessment Workflow (NES/PRM/RNM/Plan)** — graphify_out_converted_formato_pacientwas_db09bf26_nes_evaluation, graphify_out_converted_formato_pacientwas_db09bf26_prm, graphify_out_converted_formato_pacientwas_db09bf26_rnm, graphify_out_converted_formato_pacientwas_db09bf26_plan_actuacion, graphify_out_converted_formato_pacientwas_db09bf26_hoja_intervencion [EXTRACTED 1.00]
- **SIGEFAR App Main Views** — index_dashboard_view, index_receta_view, index_sft_view, index_entrevista_view, index_surtimiento_modal [EXTRACTED 1.00]

## Communities (8 total, 1 thin omitted)

### Community 0 - "OCR & UI Core"
Cohesion: 0.18
Nodes (15): addEmptyMedRow(), applyOcrData(), closeOcrModal(), createEmptyOcrResult(), db, dbClient, escapeHtml(), formatHour() (+7 more)

### Community 1 - "SFT Clinical Protocol"
Cohesion: 0.20
Nodes (15): Adherencia al Tratamiento (Control de Días 0-31), Método DADER (Seguimiento Farmacoterapéutico), Hoja de Intervención Farmacéutica, NES Evaluation (Necesidad, Efectividad, Seguridad), Plan de Actuación Farmacoterapéutico, PRM (Problemas Relacionados con Medicamentos), RNM (Resultado Negativo Asociado a la Medicación), SFT Patient Form (Formato Paciente) (+7 more)

### Community 2 - "Image Processing Pipeline"
Cohesion: 0.31
Nodes (9): canvasToDataURL(), cropImageRegionForOCR(), getOcrOptions(), loadImage(), preprocessImageForOCR(), recognizePrescription(), recognizePrescriptionRegions(), recognizeRegionText() (+1 more)

### Community 3 - "Drug Catalog & Inference"
Cohesion: 0.36
Nodes (8): catalogEntryForClave(), FIXED_FORMAT_MED_CATALOG, inferDoseNearText(), inferDurationNearText(), inferFixedFormatMedicines(), inferFrequencyNearText(), mergeFixedFormatMedicines(), simplifyOcrText()

### Community 4 - "Text Normalization"
Cohesion: 0.29
Nodes (8): cleanOcrText(), cleanPersonName(), compactOcrDigits(), normalizeClave(), normalizeDrugName(), normalizeOcrForParsing(), normalizeOcrNumber(), parsePrescriptionText()

### Community 5 - "Dispensing & Data Layer"
Cohesion: 0.48
Nodes (7): closeModal(), fetchRecetas(), loadLocalDB(), processSurtimiento(), renderTable(), switchTab(), updateStats()

### Community 6 - "Mock Patient Fixtures"
Cohesion: 0.48
Nodes (7): getItzel1Mock(), getItzel2Mock(), getLeticiaMock(), getRosalba1Mock(), getRosalba2Mock(), mergeMockOcrDataIfNeeded(), showRecipeSelector()

## Knowledge Gaps
- **8 isolated node(s):** `dbClient`, `db`, `mockSFTData`, `recetas`, `Hoja de Intervención Farmacéutica` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `dbClient`, `db`, `mockSFTData` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
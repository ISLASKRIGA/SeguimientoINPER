const supabaseUrl = 'https://plnzmmkgabggydakytsn.supabase.co';
const supabaseKey = 'sb_publishable_Y1coOJQ0nH1EhPsUeZr87g_KdLUywT1';
const dbClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let db = {
    recetas: []
};

// Fetch data from Supabase
async function fetchRecetas() {
    try {
        const { data, error } = await dbClient
            .from('recetas')
            .select('*')
            .order('fecha', { ascending: false });
            
        if (error) throw error;
        
        db.recetas = data.map(r => ({
            id: r.id,
            folio: r.folio,
            expediente: r.expediente,
            paciente: r.paciente,
            medico: r.medico,
            estado: r.estado,
            fecha: r.fecha,
            medicamentos: r.medicamentos,
            tieneAlerta: r.tiene_alerta,
            alertaMsg: r.alerta_msg
        }));
        
        // Cache to localStorage
        localStorage.setItem('recetas_cache', JSON.stringify(db.recetas));
        
        renderTable();
        updateStats();
    } catch (err) {
        console.error('Error fetching from Supabase, loading local database:', err);
        loadLocalDB();
    }
}

function loadLocalDB() {
    const cached = localStorage.getItem('recetas_cache');
    if (cached) {
        try {
            db.recetas = JSON.parse(cached);
        } catch (e) {
            console.error('Failed to parse cached recipes:', e);
            db.recetas = [];
        }
    }
    
    if (!db.recetas || db.recetas.length === 0) {
        // Fallback default recipe if no cache exists
        db.recetas = [
            {
                id: 1,
                folio: "2026-02986660",
                expediente: "113996010",
                paciente: "JUANA VALDEZ LOPEZ",
                medico: "DR. CESAR GUILLERMO CAMACHO LIZCANO",
                estado: "Surtido",
                fecha: new Date().toISOString(),
                medicamentos: [
                    { nombre: "ESTRÓGENOS CONJUGADOS Crema Vaginal", clave: "010.000.1506.00", lote: "SE14344A", caducidad: "MAY-27", diasCobertura: 90, fechaFinCobertura: new Date().toISOString(), originalStr: "ESTRÓGENOS CONJUGADOS Crema Vaginal [Clave: 010.000.1506.00] [Lote: SE14344A] [Cad: MAY-27]" }
                ],
                tieneAlerta: false,
                alertaMsg: null
            }
        ];
        localStorage.setItem('recetas_cache', JSON.stringify(db.recetas));
    }
    renderTable();
    updateStats();
}

// Initial fetch
fetchRecetas();

// UI Navigation
window.setAndSearchSFT = function(exp) {
    document.getElementById('search-sft').value = exp;
    window.loadPatientSFT(); 
};

function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tabId}`).classList.add('active');
    
    if(tabId === 'dashboard') {
        renderTable();
    } else if(tabId === 'pacientes') {
        // Auto-load Elvira's mock profile by default for the demo
        const currentExp = document.getElementById('sft-paciente-exp').innerText;
        if (!currentExp || currentExp === "INP-XXXX") {
            setAndSearchSFT('138403010');
        }
    }
}

// Attach nav clicks
document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        if(el.dataset.tab && document.getElementById(`view-${el.dataset.tab}`)) {
            switchTab(el.dataset.tab);
        }
    });
});

// Render Dashboard Table
function renderTable() {
    const tbody = document.querySelector('#dashboard-table tbody');
    tbody.innerHTML = '';
    
    // Sort logic (newest first)
    const sorted = [...db.recetas].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    sorted.forEach(r => {
        // Build Status Tag
        let statusClass = r.estado.toLowerCase().replace(' ', '-');
        if(statusClass === 'surtido') statusClass = 'surtido';
        else if(statusClass === 'pendiente') statusClass = 'pendiente';
        else statusClass = 'observada';

        let alertHTML = '-';
        if(r.tieneAlerta) {
            alertHTML = `<span style="color:var(--warning)" title="${r.alertaMsg}"><i class="ph-fill ph-warning-circle"></i> Alerta</span>`;
        }

        let actionBtn = '';
        if(r.estado === 'Pendiente' || r.estado === 'Observada') {
            actionBtn = `<button class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;" onclick="openSurtimientoModal('${r.id}')">Atender</button>`;
        } else {
            actionBtn = `<button class="btn btn-outline" style="padding: 8px 16px; font-size: 14px;" onclick="openDetalleModal('${r.id}')"><i class="ph-bold ph-eye"></i> Ver</button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.folio}</strong></td>
            <td>${r.expediente}</td>
            <td>${r.paciente}</td>
            <td>${r.medico}</td>
            <td><span class="status-tag ${statusClass}">${r.estado}</span></td>
            <td>${alertHTML}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Add Medication Row
document.getElementById('btn-add-med').addEventListener('click', () => {
    const list = document.getElementById('prescription-list');
    const firstItem = list.querySelector('.prescription-item');
    const clone = firstItem.cloneNode(true);
    // clean inputs
    clone.querySelectorAll('input').forEach(input => input.value = '');
    // add remove listener
    clone.querySelector('.btn-icon.danger').addEventListener('click', function() {
        if(list.children.length > 1) {
            clone.remove();
        }
    });
    list.appendChild(clone);
});

// Receta Form Submission & ALERT LOGIC
document.getElementById('receta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const folio = document.getElementById('folio').value.trim();
    const exp = document.getElementById('expediente').value.trim().toUpperCase();
    const paciente = document.getElementById('paciente').value.trim();
    const medico = document.getElementById('medico').value.trim();

    // --- ANTI-DUPLICADOS: verificar folio único ---
    const folioExistente = db.recetas.find(r => r.folio.trim().toUpperCase() === folio.toUpperCase());
    if (folioExistente) {
        showAlert(`El folio "${folio}" ya existe en el sistema. Verifique el número de receta.`, 'red');
        return;
    }
    
    // Gather meds
    const medItems = document.querySelectorAll('.prescription-item');
    const medicamentosObj = Array.from(medItems).map(item => {
        const nombre = (item.querySelector('.med-name')?.value || '').trim();
        const dosis = parseInt(item.querySelector('.med-dosis')?.value) || 1;
        const freqVal = item.querySelector('.med-freq')?.value || '24h';
        const cantidad = parseInt(item.querySelector('.med-cantidad')?.value) || 1;
        
        let freqNum = 1;
        if (freqVal === '12h') freqNum = 2;
        if (freqVal === '8h') freqNum = 3;
        if (freqVal === '6h') freqNum = 4;
        if (freqVal === '48h') freqNum = 0.5;
        if (freqVal === '72h') freqNum = 0.3333;

        const diasCobertura = Math.floor(cantidad / (dosis * freqNum)) || 1;
        
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + diasCobertura);

        const clave = (item.querySelector('.med-clave')?.value || '').trim();
        const lote = (item.querySelector('.med-lote')?.value || '').trim();
        const caducidad = (item.querySelector('.med-caducidad')?.value || '').trim();

        return {
            nombre,
            clave,
            lote,
            caducidad,
            diasCobertura,
            fechaFinCobertura: fechaFin.toISOString(),
            originalStr: `${nombre} ${clave ? `[Clave: ${clave}]` : ''} ${lote ? `[Lote: ${lote}]` : ''} ${caducidad ? `[Cad: ${caducidad}]` : ''}`.trim()
        };
    }).filter(m => m.nombre !== '');

    if(medicamentosObj.length === 0) {
        showAlert('Agregue al menos un medicamento válido y sus cantidades', 'yellow');
        return;
    }

    // --- ALERTS ENGINE MVP ---
    // Check if this patient already has this medication active/surtido recently
    let hasRedAlert = false;
    let hasYellowAlert = false;
    let conflictMsg = '';

    for (const r of db.recetas) {
        if (r.expediente.toUpperCase() === exp) {
            // Support both old string array and new object array for prevMeds
            const prevMeds = r.medicamentos.map(m => {
                if (typeof m === 'string') return { nombre: m.toLowerCase(), fechaFinCobertura: null };
                return { nombre: m.nombre.toLowerCase(), fechaFinCobertura: m.fechaFinCobertura };
            });
            
            for (const newMed of medicamentosObj) {
                const match = prevMeds.find(pm => pm.nombre === newMed.nombre.toLowerCase());
                if (match) {
                    if (r.estado === 'Surtido') {
                        if (match.fechaFinCobertura) {
                            const finDate = new Date(match.fechaFinCobertura);
                            if (new Date() <= finDate) {
                                hasRedAlert = true;
                                const diasRestantes = Math.ceil((finDate - new Date()) / (1000 * 60 * 60 * 24));
                                conflictMsg = `El paciente tiene ${newMed.nombre} cubierto por ${diasRestantes} días más (Surtido en Folio: ${r.folio}).`;
                            }
                        } else {
                            hasRedAlert = true;
                            conflictMsg = `El medicamento ${newMed.nombre} ya fue surtido recientemente para este paciente (Folio: ${r.folio}).`;
                        }
                    } else if (r.estado === 'Pendiente') {
                        hasYellowAlert = true;
                        conflictMsg = `Existe una prescripción activa (${r.folio}) de ${newMed.nombre} sin surtir para este paciente.`;
                    }
                }
            }
        }
    }

    if (hasRedAlert) {
        showAlert('Alerta Roja: Medicamento Aún Vigente. ' + conflictMsg, 'red');
        return; // Prevent saving
    }

    if (hasYellowAlert) {
        showAlert('Alerta Amarilla: Posible Sobreabasto. ' + conflictMsg, 'yellow');
        // We will allow saving but label it
    }

    // Save record to Supabase
    const newRecord = {
        folio: folio,
        expediente: exp,
        paciente: paciente,
        medico: medico,
        estado: "Pendiente",
        medicamentos: medicamentosObj,
        tiene_alerta: hasYellowAlert,
        alerta_msg: conflictMsg || null
    };

    try {
        const { error } = await dbClient.from('recetas').insert([newRecord]);
        if (error) throw error;

        if(!hasYellowAlert) {
            showAlert('Receta generada y validada con éxito.', 'green');
        }

        // Reset UI
        document.getElementById('receta-form').reset();
        fetchRecetas(); // Reload from DB
        switchTab('dashboard');
    } catch (err) {
        console.error('Error saving to Supabase, falling back to local storage:', err);
        
        // Add to local database
        const localRecord = {
            id: Date.now(), // Unique local ID
            folio: newRecord.folio,
            expediente: newRecord.expediente,
            paciente: newRecord.paciente,
            medico: newRecord.medico,
            estado: newRecord.estado,
            fecha: new Date().toISOString(),
            medicamentos: newRecord.medicamentos,
            tieneAlerta: newRecord.tiene_alerta,
            alertaMsg: newRecord.alerta_msg
        };
        
        db.recetas.unshift(localRecord);
        localStorage.setItem('recetas_cache', JSON.stringify(db.recetas));
        
        showAlert('Guardado localmente. La base de datos externa no está disponible.', 'yellow');

        // Reset UI
        document.getElementById('receta-form').reset();
        renderTable();
        updateStats();
        switchTab('dashboard');
    }
});

// Toast Alertas
function showAlert(message, type) {
    const container = document.getElementById('alerts-container');
    const alertEl = document.createElement('div');
    
    let icon = 'ph-info';
    let title = 'Información';
    let colorClass = '';

    if(type === 'red') { icon = 'ph-bold ph-warning-octagon'; title = '¡Cuidado!'; colorClass = 'alert-red'; }
    if(type === 'yellow') { icon = 'ph-bold ph-warning'; title = 'Atención'; colorClass = 'alert-yellow'; }
    if(type === 'green') { icon = 'ph-bold ph-check-circle'; title = '¡Genial!'; colorClass = 'alert-green'; }

    alertEl.className = `app-alert ${colorClass}`;
    alertEl.innerHTML = `
        <div class="alert-icon"><i class="${icon}"></i></div>
        <div class="alert-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(alertEl);

    // remove after 5 secs
    setTimeout(() => {
        alertEl.style.opacity = '0';
        alertEl.style.transform = 'translateX(120%)';
        setTimeout(() => alertEl.remove(), 300);
    }, 6000);
}

// Modal Logic
let currentSurtimientoId = null;

function openSurtimientoModal(id) {
    currentSurtimientoId = id;
    const r = db.recetas.find(x => x.id == id);
    if(!r) return;

    const detailsHTML = `
        <div class="info-row"><span class="info-label">Expediente:</span> <span class="info-val">${r.expediente}</span></div>
        <div class="info-row"><span class="info-label">Folio:</span> <span class="info-val">${r.folio}</span></div>
        <div class="info-row"><span class="info-label">Paciente:</span> <span class="info-val">${r.paciente}</span></div>
        <hr style="margin: 15px 0; border:0; border-top:1px solid var(--border);">
        <h4 style="margin-bottom:10px;">Prescripción a entregar:</h4>
        <ul style="padding-left:15px; color:var(--primary); font-weight:500;">
            ${r.medicamentos.map(m => `<li>${typeof m === 'string' ? m : m.originalStr || m.nombre}</li>`).join('')}
        </ul>
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;
    // Show action buttons and notes (it's an active recipe)
    document.querySelector('#surtimiento-modal .modal-footer').style.display = '';
    document.querySelector('#surtimiento-modal [id="surtimiento-notas"]').closest('div').style.display = '';
    document.getElementById('surtimiento-modal').classList.add('active');
}

function openDetalleModal(id) {
    const r = db.recetas.find(x => x.id == id);
    if (!r) return;

    const fecha = new Date(r.fecha).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const estadoColor = r.estado === 'Surtido' ? 'var(--green)' : r.estado === 'Observada' ? 'var(--orange)' : 'var(--blue)';

    const detailsHTML = `
        <div class="info-row"><span class="info-label">Folio:</span> <span class="info-val">${r.folio}</span></div>
        <div class="info-row"><span class="info-label">Expediente:</span> <span class="info-val">${r.expediente}</span></div>
        <div class="info-row"><span class="info-label">Paciente:</span> <span class="info-val">${r.paciente}</span></div>
        <div class="info-row"><span class="info-label">Médico:</span> <span class="info-val">${r.medico}</span></div>
        <div class="info-row"><span class="info-label">Fecha:</span> <span class="info-val">${fecha}</span></div>
        <div class="info-row"><span class="info-label">Estado:</span> <span class="info-val" style="color:${estadoColor}; font-weight:800;">${r.estado}</span></div>
        <hr style="margin: 15px 0; border:0; border-top:1px solid var(--border);">
        <h4 style="margin-bottom:10px;">Medicamentos:</h4>
        <ul style="padding-left:15px; color:var(--primary); font-weight:500;">
            ${r.medicamentos.map(m => `<li>${typeof m === 'string' ? m : m.originalStr || m.nombre}</li>`).join('')}
        </ul>
        ${r.alerta_msg ? `<div style="margin-top:12px; padding:10px; background:#fff8e1; border-radius:8px; border-left:3px solid var(--orange); font-size:13px;"><b>Observaciones:</b> ${r.alerta_msg}</div>` : ''}
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;
    document.getElementById('surtimiento-modal').querySelector('h2').innerText = 'Detalle de Receta';
    // Hide action buttons in view mode
    document.querySelector('#surtimiento-modal .modal-footer').style.display = 'none';
    document.querySelector('#surtimiento-modal [id="surtimiento-notas"]').closest('div').style.display = 'none';
    document.getElementById('surtimiento-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('surtimiento-modal').classList.remove('active');
    const notasEl = document.getElementById('surtimiento-notas');
    if (notasEl) notasEl.value = '';
    // Restore modal to default state for next open
    document.getElementById('surtimiento-modal').querySelector('h2').innerText = 'Surtimiento';
    document.querySelector('#surtimiento-modal .modal-footer').style.display = '';
    const notasWrap = document.querySelector('#surtimiento-modal [id="surtimiento-notas"]');
    if (notasWrap) notasWrap.closest('div').style.display = '';
    currentSurtimientoId = null;
}

async function processSurtimiento(type) {
    if(!currentSurtimientoId) return;
    
    let r = db.recetas.find(x => x.id == currentSurtimientoId);
    if(r) {
        const notas = document.getElementById('surtimiento-notas')?.value.trim() || '';
        let estado = '';
        let tiene_alerta = false;
        let alerta_msg = '';
        
        if(type === 'parcial') {
            estado = 'Observada';
            tiene_alerta = true;
            alerta_msg = notas || "Surtimiento parcial. Faltan unidades.";
        } else {
            estado = 'Surtido';
            tiene_alerta = false;
            alerta_msg = notas || null;
        }

        try {
            const { error } = await dbClient
                .from('recetas')
                .update({
                    estado: estado,
                    tiene_alerta: tiene_alerta,
                    alerta_msg: alerta_msg
                })
                .eq('id', currentSurtimientoId);
                
            if (error) throw error;
            
            if(type === 'parcial') showAlert('Surtimiento parcial registrado.', 'yellow');
            else showAlert('Surtimiento completo registrado exitosamente.', 'green');
            
            closeModal();
            fetchRecetas(); // Reload data from DB
        } catch (err) {
            console.error('Error updating Supabase, falling back to local update:', err);
            
            // Update locally
            r.estado = estado;
            r.tieneAlerta = tiene_alerta;
            r.alertaMsg = alerta_msg;
            
            localStorage.setItem('recetas_cache', JSON.stringify(db.recetas));
            
            if(type === 'parcial') showAlert('Surtimiento parcial registrado localmente.', 'yellow');
            else showAlert('Surtimiento completo registrado localmente.', 'green');
            
            closeModal();
            renderTable();
            updateStats();
        }
    }
}

let surtimientoChart = null;

function updateStats() {
    const surtidas  = db.recetas.filter(r => r.estado === 'Surtido').length;
    const parciales = db.recetas.filter(r => r.estado === 'Observada').length;
    const pendientes = db.recetas.filter(r => r.estado === 'Pendiente').length;
    const total = db.recetas.length;

    // Update KPI cards
    const elSurt = document.getElementById('kpi-surtidas');
    const elParc = document.getElementById('kpi-parciales');
    const elPend = document.getElementById('kpi-pendientes');
    const elTot  = document.getElementById('kpi-total');
    if (elSurt) elSurt.innerText = surtidas;
    if (elParc) elParc.innerText = parciales;
    if (elPend) elPend.innerText = pendientes;
    if (elTot)  elTot.innerText  = total;

    // Update / create bar chart
    const canvas = document.getElementById('chartSurtimiento');
    if (!canvas) return;
    if (surtimientoChart) surtimientoChart.destroy();
    surtimientoChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Surtidas', 'Parciales', 'Pendientes'],
            datasets: [{
                data: [surtidas, parciales, pendientes],
                backgroundColor: ['#4ade80', '#fb923c', '#60a5fa'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// Initial initialization
document.addEventListener('DOMContentLoaded', () => {
    // Enable delete for initial row
    const initialDeleteBtn = document.querySelector('.btn-icon.danger');
    if (initialDeleteBtn) {
        initialDeleteBtn.addEventListener('click', function(e) {
            // Can't delete the only one
            const list = document.getElementById('prescription-list');
            if(list.children.length > 1) {
                e.currentTarget.parentElement.remove();
            }
        });
    }

    renderTable();
    updateStats();

    // OCR Scanner Upload Listener
    const ocrUpload = document.getElementById('ocr-upload');
    if (ocrUpload) {
        ocrUpload.addEventListener('change', handleOCRUpload);
    }
});

// Mock OCR Prescription Parsing Simulation
function handleOCRUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const loader = document.getElementById('ocr-loader');
    const stepText = document.getElementById('ocr-step-text');
    
    if (loader) {
        loader.classList.add('active');
        if (stepText) stepText.innerText = "Optimizando imagen de receta...";
    }

    // Step 1: Detect/Preprocess
    setTimeout(() => {
        if (stepText) stepText.innerText = "Analizando texto con Inteligencia Artificial...";
        
        // Step 2: OCR Parsing
        setTimeout(() => {
            if (stepText) stepText.innerText = "Estructurando paciente, folio y medicamentos...";
            
            // Step 3: Extract Structure
            setTimeout(() => {
                // Populate Form Fields based on the uploaded prescription (Juana Valdez Lopez)
                const expEl = document.getElementById('expediente');
                const pacEl = document.getElementById('paciente');
                const folEl = document.getElementById('folio');
                const medEl = document.getElementById('medico');
                const serEl = document.getElementById('servicio');

                if (expEl) expEl.value = "113996010";
                if (pacEl) pacEl.value = "JUANA VALDEZ LOPEZ";
                if (folEl) folEl.value = "2026-02986660";
                if (medEl) medEl.value = "DR. CESAR GUILLERMO CAMACHO LIZCANO";
                if (serEl) serEl.value = "COORDINACION DE FARMACIA HOSPITALARIA";

                // Setup Prescription item list
                const list = document.getElementById('prescription-list');
                if (list) {
                    // Remove all prescription rows except the first one
                    while (list.children.length > 1) {
                        list.lastElementChild.remove();
                    }
                    
                    const firstItem = list.querySelector('.prescription-item');
                    if (firstItem) {
                        const nameInput = firstItem.querySelector('.med-name');
                        const claveInput = firstItem.querySelector('.med-clave');
                        const loteInput = firstItem.querySelector('.med-lote');
                        const caducidadInput = firstItem.querySelector('.med-caducidad');
                        const dosisInput = firstItem.querySelector('.med-dosis');
                        const freqSelect = firstItem.querySelector('.med-freq');
                        const cantInput = firstItem.querySelector('.med-cantidad');

                        if (nameInput) nameInput.value = "ESTRÓGENOS CONJUGADOS Crema Vaginal";
                        if (claveInput) claveInput.value = "010.000.1506.00";
                        if (loteInput) loteInput.value = "SE14344A";
                        if (caducidadInput) caducidadInput.value = "MAY-27";
                        if (dosisInput) dosisInput.value = "1";
                        if (freqSelect) freqSelect.value = "72h";
                        if (cantInput) cantInput.value = "1";
                    }
                }

                if (loader) loader.classList.remove('active');
                showAlert('Receta de JUANA VALDEZ LOPEZ digitalizada con éxito.', 'green');
                
                // Reset input file so user can re-trigger uploading same image if needed
                ocrUpload.value = '';
            }, 1000);
        }, 1000);
    }, 1000);
}

// SFT Inner Tabs Logic
document.querySelectorAll('#sft-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#sft-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sft-tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        btn.classList.add('active');
        const targetId = 'sft-tab-' + btn.dataset.sft;
        const targetContent = document.getElementById(targetId);
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
    });
});

// SFT Logic & Data
const mockSFTData = {
    "INP-2024-101": {
        nombre: "María Luisa Pérez",
        meds: [
            { nombre: "Paracetamol 500mg", prescrito: "Hoy", notas: "Dosis c/8h por 3 días" }
        ],
        notas: [
            { title: "Alta hospitalaria próxima", meta: "Dra. Gomez | Hoy", desc: "Se instruyó sobre uso de analgésicos en casa. Adherencia prometida del 100%.", color: "blue" }
        ],
        mapa: []
    },
    // New mock patient based on Elvira Martinez Gonzalez (from user's image)
    "138403010": {
        nombre: "Elvira Martinez Gonzalez",
        meds: [
            { nombre: "Cefalexina 500mg", prescrito: "Hoy", notas: "1 tableta c/8h vía oral" },
            { nombre: "Ondasetron 8mg", prescrito: "Hoy", notas: "1 tableta c/8h vía oral" },
            { nombre: "Ketoprofeno 100mg", prescrito: "Hoy", notas: "1 tableta c/12h vía oral" },
            { nombre: "Paracetamol 500mg", prescrito: "Hoy", notas: "1 tableta c/8h vía oral" },
            { nombre: "Plantago (Fibra)", prescrito: "Hoy", notas: "1 cucharada c/24h" },
            { nombre: "Esomeprazol 40mg", prescrito: "Hoy", notas: "1 tableta c/24h vía oral" }
        ],
        notas: [
            { title: "Educación al paciente completada", meta: "Farmacia Hospitalaria | Hoy", desc: "Se entregó Mapa Horario impreso y digital. Paciente comprende indicaciones.", color: "green" }
        ],
        mapa: [
            {
                idFase: "manana",
                titulo: "Día / Mañana",
                icon: "ph-sun",
                color: "manana", // maps to CSS class
                tomas: [
                    { hora: "07:00", med: "Cefalexina", dosis: "1 tableta 500mg vía oral", term: "28 abril", rec: "" },
                    { hora: "08:00", med: "Ondasetron", dosis: "1 tableta 8mg vía oral", term: "29 abril", rec: "Para náuseas" },
                    { hora: "10:00", med: "Ketoprofeno", dosis: "1 tableta 100mg vía oral", term: "27 abril", rec: "Solo en caso de dolor" },
                    { hora: "11:00", med: "Paracetamol", dosis: "1 tableta de 500mg", term: "27 abril", rec: "Para el dolor" },
                    { hora: "12:00", med: "Plantago (Fibra)", dosis: "1 cucharada en 1/4 de agua", term: "25 abril", rec: "" }
                ]
            },
            {
                idFase: "tarde",
                titulo: "Tarde",
                icon: "ph-cloud-sun",
                color: "tarde",
                tomas: [
                    { hora: "14:00", med: "Esomeprazol vía oral", dosis: "1 tableta 40 mg", term: "22 junio", rec: "1 diario (Omeprazol)" },
                    { hora: "16:00", med: "Cefalexina", dosis: "Tomar dosis", term: "28 abril", rec: "" },
                    { hora: "16:00", med: "Ondasetron", dosis: "Tomar dosis", term: "29 abril", rec: "Para náuseas" }
                ]
            },
            {
                idFase: "noche",
                titulo: "Noche",
                icon: "ph-moon",
                color: "noche",
                tomas: [
                    { hora: "19:00", med: "Paracetamol", dosis: "Tomar dosis", term: "29 abril", rec: "" },
                    { hora: "22:00", med: "Ketoprofeno", dosis: "Tomar dosis", term: "27 abril", rec: "Solo en caso de dolor" },
                    { hora: "24:00", med: "Cefalexina", dosis: "Tomar dosis", term: "28 abril", rec: "" },
                    { hora: "24:00", med: "Ondasetron", dosis: "Tomar dosis", term: "29 abril", rec: "Para náuseas" },
                    { hora: "03:00", med: "Paracetamol", dosis: "Tomar dosis", term: "28 abril", rec: "" }
                ]
            }
        ]
    }
};

window.loadPatientSFT = function() {
    const term = document.getElementById('search-sft').value.trim().toUpperCase();
    if(!term) {
        showAlert('Ingrese un expediente válido', 'yellow');
        return;
    }

    const data = mockSFTData[term];
    if(data) {
        document.getElementById('sft-paciente-nombre').innerText = data.nombre;
        document.getElementById('sft-paciente-exp').innerText = term;
        
        // Load active treatments
        const medsHtml = data.meds.map(m => `
            <div class="med-item">
                <div class="med-info">
                    <h4>${m.nombre}</h4>
                    <p>${m.notas}</p>
                </div>
                <div class="status-tag surtido">${m.prescrito}</div>
            </div>
        `).join('');
        document.getElementById('sft-active-meds').innerHTML = medsHtml || '<p style="padding: 20px;">Sin tratamiento activo</p>';

        // Load timeline
        const notesHtml = data.notas.map(n => `
            <div class="timeline-item">
                <div class="tl-dot ${n.color}"></div>
                <div class="tl-content">
                    <h4>${n.title}</h4>
                    <p class="tl-meta">${n.meta}</p>
                    <p class="tl-desc">${n.desc}</p>
                </div>
            </div>
        `).join('');
        document.getElementById('sft-timeline').innerHTML = notesHtml || '<p style="padding: 20px;">Sin intervenciones registradas</p>';
        
        // Load Mapa Horario
        const mapaContainer = document.getElementById('sft-mapa-horario');
        if (data.mapa && data.mapa.length > 0) {
            let mapaHtml = '';
            data.mapa.forEach(fase => {
                let tomasHtml = fase.tomas.map(t => {
                    let recHTML = t.rec ? `<span class="badge-recomendacion"><i class="ph-bold ph-info"></i> ${t.rec}</span>` : '';
                    return `
                        <div class="fase-row">
                            <div class="fase-time">${t.hora}</div>
                            <div class="fase-details">
                                <h4>${t.med}</h4>
                                <p>${t.dosis} • Limite: ${t.term}</p>
                                ${recHTML}
                            </div>
                        </div>
                    `;
                }).join('');

                mapaHtml += `
                    <div class="fase-card">
                        <div class="fase-header ${fase.color}">
                            <i class="ph-fill ${fase.icon}"></i>
                            <span>${fase.titulo}</span>
                        </div>
                        <div class="fase-body">
                            ${tomasHtml}
                        </div>
                    </div>
                `;
            });
            mapaContainer.innerHTML = mapaHtml;
        } else {
            mapaContainer.innerHTML = '<div class="empty-state"><i class="ph-duotone ph-calendar-x"></i><p>Mapa horario no disponible</p></div>';
        }

        showAlert('Expediente clínico cargado exitosamente', 'green');
    } else {
        showAlert('No se encontró expediente farmacoterapéutico', 'red');
        document.getElementById('sft-active-meds').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Paciente no encontrado</div>';
        document.getElementById('sft-timeline').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Paciente no encontrado</div>';
        document.getElementById('sft-mapa-horario').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Paciente no encontrado</div>';
    }
}

// Entrevista Sub Tabs Logic
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#entrevista-tabs .e-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#entrevista-tabs .e-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.entrevista-subtab').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            btn.classList.add('active');
            const targetId = 'e-tab-' + btn.dataset.etab;
            const targetContent = document.getElementById(targetId);
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
        });
    });
});

// Render Advanced SFT Analytics
document.addEventListener('DOMContentLoaded', () => {
    // PRM Doughnut Chart
    const ctxPRM = document.getElementById('chartPRM');
    if (ctxPRM) {
        new Chart(ctxPRM, {
            type: 'doughnut',
            data: {
                labels: ['Necesidad', 'Efectividad', 'Seguridad'],
                datasets: [{
                    data: [35, 45, 20],
                    backgroundColor: ['#ff9600', '#1cb0f6', '#ff4b4b'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: 'bold' } } }
                }
            }
        });
    }

    // Servicios Bar Chart
    const ctxServicios = document.getElementById('chartServicios');
    if (ctxServicios) {
        new Chart(ctxServicios, {
            type: 'bar',
            data: {
                labels: ['Med Int', 'Gineco', 'Cirugía', 'UCI', 'Urgencias'],
                datasets: [{
                    label: 'SFT Creados',
                    data: [42, 35, 28, 22, 15],
                    backgroundColor: '#1cb0f6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Surtimiento Bar Chart
    const ctxSurtimiento = document.getElementById('chartSurtimiento');
    if (ctxSurtimiento) {
        new Chart(ctxSurtimiento, {
            type: 'bar',
            data: {
                labels: ['Surtidos', 'No Surtidos (Sin Alt.)', 'Con Alternativa'],
                datasets: [{
                    label: 'Medicamentos',
                    data: [850, 30, 120],
                    backgroundColor: ['#58cc02', '#ff4b4b', '#1cb0f6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});

// Mock Database
let db = {
    recetas: [
        {
            id: 1,
            folio: "R-98432",
            expediente: "INP-2024-101",
            paciente: "María Luisa Pérez",
            medico: "Dr. Sánchez",
            estado: "Pendiente",
            fecha: new Date().toISOString(),
            medicamentos: ["Paracetamol 500mg"],
            tieneAlerta: false
        },
        {
            id: 2,
            folio: "R-98431",
            expediente: "INP-2023-899",
            paciente: "Ana Gómez Flores",
            medico: "Dra. Elena M.",
            estado: "Surtido",
            fecha: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            medicamentos: ["Ácido Fólico 5mg", "Hierro"],
            tieneAlerta: false
        },
        {
            id: 3,
            folio: "R-98430",
            expediente: "INP-2024-005",
            paciente: "Valeria Domínguez",
            medico: "Dr. López",
            estado: "Observada",
            fecha: new Date(Date.now() - 172800000).toISOString(),
            medicamentos: ["Metformina 850mg"],
            tieneAlerta: true,
            alertaMsg: "Surtimiento parcial, falta 1 caja."
        }
    ]
};

// UI Navigation
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tabId}`).classList.add('active');
    
    if(tabId === 'dashboard') {
        renderTable();
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
    const sorted = [...db.recetas].sort((a,b) => b.id - a.id);

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
            actionBtn = `<button class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;" onclick="openSurtimientoModal(${r.id})">Atender</button>`;
        } else {
            actionBtn = `<button class="btn btn-outline" style="padding: 8px; border-radius: 50%;"><i class="ph-bold ph-eye"></i></button>`;
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
document.getElementById('receta-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const folio = document.getElementById('folio').value;
    const exp = document.getElementById('expediente').value.trim().toUpperCase();
    const medico = document.getElementById('medico').value;
    
    // Gather meds
    const medInputs = document.querySelectorAll('.med-name');
    const medNames = Array.from(medInputs).map(inp => inp.value.trim().toLowerCase());

    if(medNames.length === 0 || medNames[0] === '') {
        showAlert('Agregue al menos un medicamento válido', 'yellow');
        return;
    }

    // --- ALERTS ENGINE MVP ---
    // Check if this patient already has this medication active/surtido recently
    let hasRedAlert = false;
    let hasYellowAlert = false;
    let conflictMsg = '';

    for (const r of db.recetas) {
        if (r.expediente.toUpperCase() === exp) {
            // Check meds
            const prevMeds = r.medicamentos.map(m => m.toLowerCase());
            const intersection = medNames.filter(m => prevMeds.includes(m));
            
            if (intersection.length > 0) {
                if (r.estado === 'Surtido') {
                    hasRedAlert = true;
                    // Format names properly
                    const conflictName = intersection[0].charAt(0).toUpperCase() + intersection[0].slice(1);
                    conflictMsg = `El medicamento ${conflictName} ya fue surtido recientemente para este paciente (Folio: ${r.folio}).`;
                } else if (r.estado === 'Pendiente') {
                    hasYellowAlert = true;
                    const conflictName = intersection[0].charAt(0).toUpperCase() + intersection[0].slice(1);
                    conflictMsg = `Existe una prescripción activa (${r.folio}) de ${conflictName} sin surtir para este paciente.`;
                }
            }
        }
    }

    if (hasRedAlert) {
        showAlert('Alerta Roja: Surtimiento Duplicado. ' + conflictMsg, 'red');
        return; // Prevent saving
    }

    if (hasYellowAlert) {
        showAlert('Alerta Amarilla: Posible Sobreabasto. ' + conflictMsg, 'yellow');
        // We will allow saving but label it
    }

    // Save record
    const newRecord = {
        id: db.recetas.length + 1,
        folio: folio,
        expediente: exp,
        paciente: "Paciente Recuperado", // Mocked
        medico: medico,
        estado: "Pendiente",
        fecha: new Date().toISOString(),
        medicamentos: Array.from(medInputs).map(inp => inp.value),
        tieneAlerta: hasYellowAlert,
        alertaMsg: conflictMsg
    };

    db.recetas.push(newRecord);

    if(!hasYellowAlert) {
        showAlert('Receta generada y validada con éxito.', 'green');
    }

    // Reset UI
    document.getElementById('receta-form').reset();
    switchTab('dashboard');
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
    const r = db.recetas.find(x => x.id === id);
    if(!r) return;

    const detailsHTML = `
        <div class="info-row"><span class="info-label">Expediente:</span> <span class="info-val">${r.expediente}</span></div>
        <div class="info-row"><span class="info-label">Folio:</span> <span class="info-val">${r.folio}</span></div>
        <div class="info-row"><span class="info-label">Paciente:</span> <span class="info-val">${r.paciente}</span></div>
        <hr style="margin: 15px 0; border:0; border-top:1px solid var(--border);">
        <h4 style="margin-bottom:10px;">Prescripción a entregar:</h4>
        <ul style="padding-left:15px; color:var(--primary); font-weight:500;">
            ${r.medicamentos.map(m => `<li>${m}</li>`).join('')}
        </ul>
    `;
    document.getElementById('modal-details').innerHTML = detailsHTML;
    document.getElementById('surtimiento-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('surtimiento-modal').classList.remove('active');
    currentSurtimientoId = null;
}

function processSurtimiento(type) {
    if(!currentSurtimientoId) return;
    
    let r = db.recetas.find(x => x.id === currentSurtimientoId);
    if(r) {
        if(type === 'parcial') {
            r.estado = 'Observada';
            r.tieneAlerta = true;
            r.alertaMsg = "Surtimiento parcial. Faltan unidades.";
            showAlert('Surtimiento parcial registrado.', 'yellow');
        } else {
            r.estado = 'Surtido';
            r.tieneAlerta = false;
            showAlert('Surtimiento completo registrado exitosamente.', 'green');
        }
    }
    
    closeModal();
    renderTable();
    updateStats();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todays = db.recetas.filter(r => r.fecha.startsWith(today)).length;
    const surtidas = db.recetas.filter(r => r.estado === 'Surtido').length;
    const pendientes = db.recetas.filter(r => r.estado === 'Pendiente').length;
    
    // Just a visual mock update for stat values
    const statValues = document.querySelectorAll('.stat-value');
    if(statValues.length >= 3) {
        statValues[0].innerText = 124 + db.recetas.length; // Fake total increment
        statValues[1].innerText = surtidas + 97; // Arbitrary offset for demo
        statValues[2].innerText = pendientes;
    }
}

// Initial initialization
document.addEventListener('DOMContentLoaded', () => {
    // Enable delete for initial row
    document.querySelector('.btn-icon.danger').addEventListener('click', function(e) {
        // Can't delete the only one
        const list = document.getElementById('prescription-list');
        if(list.children.length > 1) {
            e.currentTarget.parentElement.remove();
        }
    });

    renderTable();
    updateStats();
});

// SFT Logic
const mockSFTData = {
    "INP-2024-101": {
        nombre: "María Luisa Pérez",
        meds: [
            { nombre: "Paracetamol 500mg", prescrito: "Hoy", notas: "Dosis c/8h por 3 días" }
        ],
        notas: [
            { title: "Alta hospitalaria próxima", meta: "Dra. Gomez | Hoy", desc: "Se instruyó sobre uso de analgésicos en casa. Adherencia prometida del 100%.", color: "blue" }
        ]
    },
    "INP-2023-899": {
        nombre: "Ana Gómez Flores",
        meds: [
            { nombre: "Ácido Fólico 5mg", prescrito: "Ayer", notas: "1 tableta c/24h" },
            { nombre: "Sulfato Ferroso 300mg", prescrito: "Ayer", notas: "1 tableta c/12h" }
        ],
        notas: [
            { title: "Intervención: Conciliación Positiva", meta: "Farm. Carlos R. | Ayer", desc: "Se validó la adherencia al Ácido Fólico. Paciente reporta leve acidez, se sugirió cambiar horario de ingesta.", color: "green" },
            { title: "PRM Detectado: Interacción Moderada", meta: "Sistema | Ayer", desc: "Precaución por coadministración de Hierro. Indicar separar dosis 2 horas de lácteos.", color: "yellow" }
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
        
        showAlert('Expediente clínico cargado exitosamente', 'green');
    } else {
        showAlert('No se encontró expediente farmacoterapéutico', 'red');
        document.getElementById('sft-active-meds').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Paciente no encontrado</div>';
        document.getElementById('sft-timeline').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Paciente no encontrado</div>';
    }
}

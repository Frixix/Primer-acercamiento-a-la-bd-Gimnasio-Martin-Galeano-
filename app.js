/**
 * Prototipo Base de Datos Documental - Gimnasio Martin Galeano
 */

// 1. Datos iniciales precargados (demostración)
const initialDocuments = [
  {
    id: "DOC-MG-001",
    title: "Planeación Curricular Integrada de Ciencias y Tecnología",
    folder: "planeaciones",
    grade: "Primaria",
    period: "1° Periodo",
    author: "Profe Robinson / Área Académica",
    url: "https://drive.google.com",
    notes: "Malla ajustada con estándares de competencias ciudadanas y TIC."
  },
  {
    id: "DOC-MG-002",
    title: "Planilla Consolidada de Evaluaciones y Rendimiento",
    folder: "calificaciones",
    grade: "Secundaria",
    period: "1° Periodo",
    author: "Coordinación Académica",
    url: "#",
    notes: "Consolidado de calificaciones del corte de periodo bimestral."
  },
  {
    id: "DOC-MG-003",
    title: "Seguimiento y Actas de Convivencia Escolar",
    folder: "observador",
    grade: "General",
    period: "Anual / Permanente",
    author: "Orientación / Docentes de Grado",
    url: "#",
    notes: "Actas de diálogo reflexivo y compromisos pedagógicos con padres."
  },
  {
    id: "DOC-MG-004",
    title: "Proyecto Educativo Institucional (PEI) 2026 - Actualizado",
    folder: "pei",
    grade: "General",
    period: "Anual / Permanente",
    author: "Rectoría & Comité Pedagógico",
    url: "#",
    notes: "Marco legal, enfoque metodológico y proyección directiva."
  }
];

// 2. Manejo de LocalStorage para persistencia de la BD
let documents = JSON.parse(localStorage.getItem('galeano_db_docs')) || initialDocuments;

function saveDocuments() {
  localStorage.setItem('galeano_db_docs', JSON.stringify(documents));
  renderApp();
}

// 3. Estado de la interfaz
let currentFolder = "all";
let currentSearch = "";
let currentGrade = "";
let currentView = "cards"; // 'cards' o 'table'

// 4. Elementos del DOM
const documentsContainer = document.getElementById("documentsContainer");
const tableContainer = document.getElementById("tableContainer");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const currentPathText = document.getElementById("currentPathText");
const searchInput = document.getElementById("searchInput");
const gradeFilter = document.getElementById("gradeFilter");
const modalDoc = document.getElementById("modalDoc");
const docForm = document.getElementById("docForm");

// Botones y switches
const btnOpenModal = document.getElementById("btnOpenModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const viewCardsBtn = document.getElementById("viewCards");
const viewTableBtn = document.getElementById("viewTable");
const folderButtons = document.querySelectorAll(".folder-btn");

// 5. Inicialización de eventos
function setupEventListeners() {
  // Cambio de carpetas
  folderButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      folderButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFolder = btn.dataset.folder;
      
      const folderNames = {
        all: "/root/todos",
        planeaciones: "/root/Planeaciones_Mallas",
        calificaciones: "/root/Planillas_Boletines",
        observador: "/root/Observador_Actas",
        pei: "/root/Institucional_PEI"
      };
      currentPathText.textContent = folderNames[currentFolder] || "/root";
      renderApp();
    });
  });

  // Búsqueda y Filtro
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderApp();
  });

  gradeFilter.addEventListener("change", (e) => {
    currentGrade = e.target.value;
    renderApp();
  });

  // Cambiar vista (Tarjetas / Tabla)
  viewCardsBtn.addEventListener("click", () => {
    currentView = "cards";
    viewCardsBtn.classList.add("active");
    viewTableBtn.classList.remove("active");
    documentsContainer.classList.remove("hidden");
    tableContainer.classList.add("hidden");
  });

  viewTableBtn.addEventListener("click", () => {
    currentView = "table";
    viewTableBtn.classList.add("active");
    viewCardsBtn.classList.remove("active");
    documentsContainer.classList.add("hidden");
    tableContainer.classList.remove("hidden");
  });

  // Modal
  btnOpenModal.addEventListener("click", () => modalDoc.classList.add("show"));
  btnCloseModal.addEventListener("click", () => modalDoc.classList.remove("show"));
  btnCancelModal.addEventListener("click", () => modalDoc.classList.remove("show"));

  // Cerrar al dar click fuera
  modalDoc.addEventListener("click", (e) => {
    if (e.target === modalDoc) modalDoc.classList.remove("show");
  });

  // Formulario nuevo documento
  docForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newDoc = {
      id: "DOC-MG-" + String(documents.length + 1).padStart(3, '0'),
      title: document.getElementById("docTitle").value,
      folder: document.getElementById("docFolder").value,
      grade: document.getElementById("docGrade").value,
      period: document.getElementById("docPeriod").value,
      author: document.getElementById("docAuthor").value,
      url: document.getElementById("docUrl").value || "#",
      notes: document.getElementById("docNotes").value || "Sin observaciones adicionales."
    };

    documents.unshift(newDoc);
    saveDocuments();
    docForm.reset();
    modalDoc.classList.remove("show");
  });
}

// 6. Eliminar Registro
window.deleteDoc = function(id) {
  if (confirm(`¿Deseas eliminar este registro de la base de datos (${id})?`)) {
    documents = documents.filter(doc => doc.id !== id);
    saveDocuments();
  }
};

// 7. Filtrado
function getFilteredDocuments() {
  return documents.filter(doc => {
    const matchesFolder = currentFolder === "all" || doc.folder === currentFolder;
    const matchesGrade = !currentGrade || doc.grade === currentGrade;
    const matchesSearch = !currentSearch || 
      doc.title.toLowerCase().includes(currentSearch) ||
      doc.author.toLowerCase().includes(currentSearch) ||
      doc.id.toLowerCase().includes(currentSearch);

    return matchesFolder && matchesGrade && matchesSearch;
  });
}

// 8. Renderizado
function renderApp() {
  updateCounts();
  const filtered = getFilteredDocuments();

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    documentsContainer.innerHTML = "";
    tableBody.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");

  // Render Vista Tarjetas
  documentsContainer.innerHTML = filtered.map(doc => `
    <article class="doc-card">
      <div class="doc-card-header">
        <span class="doc-tag">${formatFolder(doc.folder)}</span>
        <span class="doc-id-pill">${doc.id}</span>
      </div>

      <h4 class="doc-card-title">${escapeHTML(doc.title)}</h4>

      <div class="doc-meta">
        <div class="doc-meta-item">
          <i class="ph ph-user"></i>
          <span>${escapeHTML(doc.author)}</span>
        </div>
        <div class="doc-meta-item">
          <i class="ph ph-chalkboard-teacher"></i>
          <span>${doc.grade} • ${doc.period}</span>
        </div>
        ${doc.notes ? `
          <div class="doc-meta-item" style="margin-top: 4px; font-style: italic;">
            <i class="ph ph-note"></i>
            <span>${escapeHTML(doc.notes)}</span>
          </div>
        ` : ''}
      </div>

      <div class="doc-card-footer">
        <a href="${doc.url !== '#' ? doc.url : 'javascript:void(0)'}" target="${doc.url !== '#' ? '_blank' : '_self'}" class="btn-link-action">
          <i class="ph-bold ph-arrow-square-out"></i> Abrir Enlace
        </a>
        <button class="btn-icon" onclick="deleteDoc('${doc.id}')" title="Eliminar registro">
          <i class="ph-bold ph-trash"></i>
        </button>
      </div>
    </article>
  `).join('');

  // Render Vista Tabla
  tableBody.innerHTML = filtered.map(doc => `
    <tr>
      <td><code>${doc.id}</code></td>
      <td><strong>${escapeHTML(doc.title)}</strong></td>
      <td><span class="doc-tag">${formatFolder(doc.folder)}</span></td>
      <td>${doc.grade}</td>
      <td>${doc.period}</td>
      <td>${escapeHTML(doc.author)}</td>
      <td>
        <button class="btn-icon" onclick="deleteDoc('${doc.id}')" title="Eliminar">
          <i class="ph-bold ph-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// 9. Actualización de Contadores en la barra lateral
function updateCounts() {
  document.getElementById("count-all").textContent = documents.length;
  document.getElementById("count-planeaciones").textContent = documents.filter(d => d.folder === 'planeaciones').length;
  document.getElementById("count-calificaciones").textContent = documents.filter(d => d.folder === 'calificaciones').length;
  document.getElementById("count-observador").textContent = documents.filter(d => d.folder === 'observador').length;
  document.getElementById("count-pei").textContent = documents.filter(d => d.folder === 'pei').length;
}

// Auxiliares
function formatFolder(key) {
  const map = {
    planeaciones: "Planeación / Malla",
    calificaciones: "Planilla Evaluativa",
    observador: "Observador / Acta",
    pei: "Institucional / PEI"
  };
  return map[key] || key;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Inicializar la app
setupEventListeners();
renderApp();
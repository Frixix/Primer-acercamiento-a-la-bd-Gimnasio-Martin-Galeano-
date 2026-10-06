/**
 * Prototipo Base de Datos Documental - Gimnasio Martin Galeano
 * Especializado para: Básica Primaria con Subida de Archivos
 */

// 1. Datos iniciales precargados enfocados en Primaria
const initialDocuments = [
  {
    id: "MG-PRI-001",
    title: "Malla y Planeación de Matemáticas y Geometría",
    folder: "planeaciones",
    grade: "Tercero (3°)",
    period: "1° Periodo",
    author: "Profe Robinson / Docente de Primaria",
    fileName: "Planeacion_Matematicas_3_P1.pdf",
    fileSize: "1.2 MB",
    fileData: null, // Si es null, usa descarga demostrativa
    notes: "Operaciones básicas, resolución de problemas y pensamiento espacial."
  },
  {
    id: "MG-PRI-002",
    title: "Planilla de Calificaciones y Logros Bimestrales",
    folder: "calificaciones",
    grade: "Segundo (2°)",
    period: "1° Periodo",
    author: "Docente Titular de Grado",
    fileName: "Planilla_Notas_2_2026.xlsx",
    fileSize: "840 KB",
    fileData: null,
    notes: "Evaluación formativa y seguimiento de lectura comprensiva."
  },
  {
    id: "MG-PRI-003",
    title: "Acta de Diálogo Pedagógico y Convivencia",
    folder: "observador",
    grade: "Primero (1°)",
    period: "Anual / Permanente",
    author: "Orientación & Docente de Aula",
    fileName: "Acta_Convivencia_1_Galeano.docx",
    fileSize: "320 KB",
    fileData: null,
    notes: "Compromisos adquiridos con padres de familia sobre adaptación escolar."
  },
  {
    id: "MG-PRI-004",
    title: "Taller Didáctico: Comprensión Lectora y Escritura Creativa",
    folder: "talleres",
    grade: "Cuarto (4°)",
    period: "2° Periodo",
    author: "Profe Primaria",
    fileName: "Guia_Taller_Lectura_4.pdf",
    fileSize: "2.1 MB",
    fileData: null,
    notes: "Guías impresas para el fortalecimiento de la producción textual."
  }
];

// 2. Manejo de LocalStorage
let documents = JSON.parse(localStorage.getItem('galeano_db_primaria')) || initialDocuments;

function saveDocuments() {
  localStorage.setItem('galeano_db_primaria', JSON.stringify(documents));
  renderApp();
}

// 3. Estado de la interfaz y archivo temporal en subida
let currentFolder = "all";
let currentSearch = "";
let currentGrade = "";
let currentView = "cards";

let uploadedFileMeta = null; // Almacenará: { name, size, base64 }

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

// Subida de archivos
const fileInput = document.getElementById("fileInput");
const dropText = document.getElementById("dropText");
const fileSelectedBadge = document.getElementById("fileSelectedBadge");
const selectedFileName = document.getElementById("selectedFileName");
const btnRemoveFile = document.getElementById("btnRemoveFile");

// Botones y Navegación
const btnOpenModal = document.getElementById("btnOpenModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const viewCardsBtn = document.getElementById("viewCards");
const viewTableBtn = document.getElementById("viewTable");
const folderButtons = document.querySelectorAll(".folder-btn");

// 5. Inicialización de eventos
function setupEventListeners() {
  // Cambio de carpetas temáticas
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
        talleres: "/root/Guias_Talleres"
      };
      currentPathText.textContent = folderNames[currentFolder] || "/root";
      renderApp();
    });
  });

  // Búsqueda y Filtro por grado de primaria
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderApp();
  });

  gradeFilter.addEventListener("change", (e) => {
    currentGrade = e.target.value;
    renderApp();
  });

  // Vistas (Tarjetas vs Tabla BD)
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

  // Apertura y cierre de modal
  btnOpenModal.addEventListener("click", () => {
    resetFileInput();
    modalDoc.classList.add("show");
  });
  btnCloseModal.addEventListener("click", () => modalDoc.classList.remove("show"));
  btnCancelModal.addEventListener("click", () => modalDoc.classList.remove("show"));

  modalDoc.addEventListener("click", (e) => {
    if (e.target === modalDoc) modalDoc.classList.remove("show");
  });

  // Captura y lectura del archivo al seleccionarlo
  fileInput.addEventListener("change", handleFileSelection);
  btnRemoveFile.addEventListener("click", resetFileInput);

  // Formulario para guardar registro
  docForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!uploadedFileMeta) {
      alert("Por favor selecciona un archivo para adjuntar al registro.");
      return;
    }

    const newDoc = {
      id: "MG-PRI-" + String(documents.length + 1).padStart(3, '0'),
      title: document.getElementById("docTitle").value,
      folder: document.getElementById("docFolder").value,
      grade: document.getElementById("docGrade").value,
      period: document.getElementById("docPeriod").value,
      author: document.getElementById("docAuthor").value,
      fileName: uploadedFileMeta.name,
      fileSize: uploadedFileMeta.size,
      fileData: uploadedFileMeta.base64,
      notes: document.getElementById("docNotes").value || "Sin observaciones adicionales."
    };

    documents.unshift(newDoc);
    saveDocuments();
    docForm.reset();
    resetFileInput();
    modalDoc.classList.remove("show");
  });
}

// 6. Manejo de lectura del archivo subido
function handleFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Límite de 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert("El archivo excede el tamaño máximo permitido de 5MB.");
    resetFileInput();
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedFileMeta = {
      name: file.name,
      size: formatBytes(file.size),
      base64: event.target.result
    };

    selectedFileName.textContent = `${file.name} (${uploadedFileMeta.size})`;
    fileSelectedBadge.classList.remove("hidden");
    dropText.textContent = "Archivo listo para guardar";
  };

  reader.readAsDataURL(file);
}

function resetFileInput() {
  fileInput.value = "";
  uploadedFileMeta = null;
  fileSelectedBadge.classList.add("hidden");
  dropText.textContent = "Haz clic para seleccionar o arrastra tu archivo aquí";
}

// 7. Descargar o abrir archivo
window.downloadDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  if (doc.fileData) {
    // Si tiene archivo real en Base64, lo descarga directamente
    const a = document.createElement("a");
    a.href = doc.fileData;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // Documento de demostración
    alert(`Descargando archivo demostrativo institucional:\n"${doc.fileName}" (${doc.fileSize}) asignado al grado ${doc.grade}.`);
  }
};

// 8. Eliminar Registro
window.deleteDoc = function(id) {
  if (confirm(`¿Deseas eliminar este registro de la base de datos (${id})?`)) {
    documents = documents.filter(doc => doc.id !== id);
    saveDocuments();
  }
};

// 9. Filtrado
function getFilteredDocuments() {
  return documents.filter(doc => {
    const matchesFolder = currentFolder === "all" || doc.folder === currentFolder;
    const matchesGrade = !currentGrade || doc.grade === currentGrade;
    const matchesSearch = !currentSearch || 
      doc.title.toLowerCase().includes(currentSearch) ||
      doc.author.toLowerCase().includes(currentSearch) ||
      doc.fileName.toLowerCase().includes(currentSearch) ||
      doc.id.toLowerCase().includes(currentSearch);

    return matchesFolder && matchesGrade && matchesSearch;
  });
}

// 10. Renderizado Principal
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
          <span><strong>${doc.grade}</strong> • ${doc.period}</span>
        </div>
        
        <!-- Archivo Adjunto -->
        <div class="file-attachment-badge">
          <i class="ph-bold ph-paperclip"></i>
          <span>${escapeHTML(doc.fileName)} <small>(${doc.fileSize})</small></span>
        </div>

        ${doc.notes ? `
          <div class="doc-meta-item" style="margin-top: 4px; font-style: italic;">
            <i class="ph ph-note"></i>
            <span>${escapeHTML(doc.notes)}</span>
          </div>
        ` : ''}
      </div>

      <div class="doc-card-footer">
        <button onclick="downloadDoc('${doc.id}')" class="btn-download-action">
          <i class="ph-bold ph-download-simple"></i> Descargar / Ver
        </button>
        <button class="btn-icon" onclick="deleteDoc('${doc.id}')" title="Eliminar registro">
          <i class="ph-bold ph-trash"></i>
        </button>
      </div>
    </article>
  `).join('');

  // Render Vista Tabla BD
  tableBody.innerHTML = filtered.map(doc => `
    <tr>
      <td><code>${doc.id}</code></td>
      <td><strong>${escapeHTML(doc.title)}</strong></td>
      <td><span class="doc-tag">${formatFolder(doc.folder)}</span></td>
      <td><strong>${doc.grade}</strong></td>
      <td>${doc.period}</td>
      <td>${escapeHTML(doc.author)}</td>
      <td>
        <span style="font-size:0.75rem; color:#475569;">
          <i class="ph-bold ph-file-text"></i> ${escapeHTML(doc.fileName)}
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="downloadDoc('${doc.id}')" title="Descargar archivo">
          <i class="ph-bold ph-download-simple"></i>
        </button>
        <button class="btn-icon" onclick="deleteDoc('${doc.id}')" title="Eliminar">
          <i class="ph-bold ph-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// 11. Actualización de Contadores en la barra lateral
function updateCounts() {
  document.getElementById("count-all").textContent = documents.length;
  document.getElementById("count-planeaciones").textContent = documents.filter(d => d.folder === 'planeaciones').length;
  document.getElementById("count-calificaciones").textContent = documents.filter(d => d.folder === 'calificaciones').length;
  document.getElementById("count-observador").textContent = documents.filter(d => d.folder === 'observador').length;
  document.getElementById("count-talleres").textContent = documents.filter(d => d.folder === 'talleres').length;
}

// Auxiliares
function formatFolder(key) {
  const map = {
    planeaciones: "Planeaciones & Mallas",
    calificaciones: "Planilla Evaluativa",
    observador: "Observador & Actas",
    talleres: "Guías & Talleres"
  };
  return map[key] || key;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Arrancar aplicación
setupEventListeners();
renderApp();
/**
 * Prototipo BD Gimnasio Martin Galeano
 * Roles, Filtro por Docente, Grado y Materia
 */

// 1. Usuarios del sistema
const USERS = {
  admin: { name: "Administrador (Tú)", role: "admin", label: "Administrador General", initial: "A" },
  claudia: { name: "Claudia (Rectora)", role: "rectora", label: "Rectora Institucional", initial: "C" },
  jessica: { name: "Jessica", role: "docente", label: "Docente de Primaria", initial: "J" },
  yuri: { name: "Yuri", role: "docente", label: "Docente de Primaria", initial: "Y" },
  elcy: { name: "Elcy", role: "docente", label: "Docente de Primaria", initial: "E" }
};

let currentUser = null;

// 2. Base de datos inicial de prueba con docentes y asignaturas
const initialDocuments = [
  {
    id: "MG-PRI-001",
    title: "Planeación Curricular: Fracciones y Resolución de Problemas",
    folder: "planeaciones",
    grade: "Tercero (3°)",
    subject: "Matemáticas",
    teacher: "Jessica",
    period: "1° Periodo",
    fileName: "Planeacion_Matematicas_3_Jessica.pdf",
    fileSize: "1.4 MB",
    fileData: null,
    notes: "Desarrollo del pensamiento numérico y trabajo colaborativo."
  },
  {
    id: "MG-PRI-002",
    title: "Directriz y Plan de Fortalecimiento Institucional 2026",
    folder: "planeaciones",
    grade: "Primaria General",
    subject: "Institucional / Dirección",
    teacher: "Claudia (Rectora)",
    period: "Anual / Permanente",
    fileName: "Directriz_Pedagogica_Rectora.pdf",
    fileSize: "2.5 MB",
    fileData: null,
    notes: "Aprobación de cronograma académico y metas de calidad."
  },
  {
    id: "MG-PRI-003",
    title: "Guía Didáctica: Ecosistemas y Biodiversidad Local",
    folder: "talleres",
    grade: "Cuarto (4°)",
    subject: "Ciencias Naturales",
    teacher: "Yuri",
    period: "2° Periodo",
    fileName: "Taller_Ciencias_4_Yuri.docx",
    fileSize: "680 KB",
    fileData: null,
    notes: "Guías con actividades prácticas para laboratorio escolar."
  },
  {
    id: "MG-PRI-004",
    title: "Planilla de Seguimiento y Lectoescritura",
    folder: "calificaciones",
    grade: "Primero (1°)",
    subject: "Lengua Castellana",
    teacher: "Elcy",
    period: "1° Periodo",
    fileName: "Planilla_Espanol_1_Elcy.xlsx",
    fileSize: "512 KB",
    fileData: null,
    notes: "Valoración formativa de trazo y comprensión de fonemas."
  },
  {
    id: "MG-PRI-005",
    title: "Observador del Estudiante y Actas de Convivencia",
    folder: "observador",
    grade: "Segundo (2°)",
    subject: "Ética y Valores",
    teacher: "Yuri",
    period: "1° Periodo",
    fileName: "Actas_Convivencia_2_Yuri.pdf",
    fileSize: "390 KB",
    fileData: null,
    notes: "Seguimiento pedagógico y acuerdos con padres de familia."
  }
];

let documents = JSON.parse(localStorage.getItem('galeano_db_primaria_v2')) || initialDocuments;

function saveDocuments() {
  localStorage.setItem('galeano_db_primaria_v2', JSON.stringify(documents));
  renderApp();
}

// 3. Estados de Filtros
let currentTeacherFilter = "all";
let currentFolderFilter = "all";
let currentGradeFilter = "";
let currentSubjectFilter = "";
let currentSearch = "";
let currentView = "cards";
let uploadedFileMeta = null;

// 4. Elementos del DOM
const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm");
const loginUserSelect = document.getElementById("loginUserSelect");
const btnLogout = document.getElementById("btnLogout");

const navUserName = document.getElementById("navUserName");
const navUserRole = document.getElementById("navUserRole");
const navAvatar = document.getElementById("navAvatar");
const roleDescription = document.getElementById("roleDescription");

const documentsContainer = document.getElementById("documentsContainer");
const tableContainer = document.getElementById("tableContainer");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const currentPathText = document.getElementById("currentPathText");

const searchInput = document.getElementById("searchInput");
const gradeFilter = document.getElementById("gradeFilter");
const subjectFilter = document.getElementById("subjectFilter");

const modalDoc = document.getElementById("modalDoc");
const docForm = document.getElementById("docForm");
const btnOpenModal = document.getElementById("btnOpenModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const fileInput = document.getElementById("fileInput");
const dropText = document.getElementById("dropText");
const fileSelectedBadge = document.getElementById("fileSelectedBadge");
const selectedFileName = document.getElementById("selectedFileName");
const btnRemoveFile = document.getElementById("btnRemoveFile");

const editDocId = document.getElementById("editDocId");
const modalTitle = document.getElementById("modalTitle");

const viewCardsBtn = document.getElementById("viewCards");
const viewTableBtn = document.getElementById("viewTable");

// 5. Inicialización de Sesión
function initAuth() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userKey = loginUserSelect.value;
    if (!userKey || !USERS[userKey]) return;

    currentUser = USERS[userKey];
    loginScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");

    updateUserProfileUI();
    renderApp();
  });

  btnLogout.addEventListener("click", () => {
    currentUser = null;
    appContainer.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    loginForm.reset();
  });
}

function updateUserProfileUI() {
  navUserName.textContent = currentUser.name;
  navUserRole.textContent = currentUser.label;
  navAvatar.textContent = currentUser.initial;

  if (currentUser.role === "admin" || currentUser.role === "rectora") {
    roleDescription.innerHTML = `<strong>Acceso Total:</strong> Puedes consultar, editar y eliminar cualquier documento de todas las profesoras.`;
  } else {
    roleDescription.innerHTML = `<strong>Acceso Docente:</strong> Puedes subir archivos y editar tus registros. La eliminación requiere autorización de Rectoría/Admin.`;
  }

  // Preseleccionar docente en el formulario modal si es profesora
  const teacherSelect = document.getElementById("docTeacher");
  if (currentUser.role === "docente") {
    teacherSelect.value = currentUser.name;
  }
}

// 6. Configurar Eventos
function setupEvents() {
  // Filtro por Docente en Sidebar
  document.querySelectorAll(".teacher-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".teacher-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTeacherFilter = btn.dataset.teacher;
      updatePathBreadcrumb();
      renderApp();
    });
  });

  // Filtro por Carpeta en Sidebar
  document.querySelectorAll(".folder-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".folder-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFolderFilter = btn.dataset.folder;
      updatePathBreadcrumb();
      renderApp();
    });
  });

  // Filtros dinámicos
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderApp();
  });

  gradeFilter.addEventListener("change", (e) => {
    currentGradeFilter = e.target.value;
    renderApp();
  });

  subjectFilter.addEventListener("change", (e) => {
    currentSubjectFilter = e.target.value;
    renderApp();
  });

  // Alternar vista
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
  btnOpenModal.addEventListener("click", () => openModalForCreate());
  btnCloseModal.addEventListener("click", closeModal);
  btnCancelModal.addEventListener("click", closeModal);
  modalDoc.addEventListener("click", (e) => {
    if (e.target === modalDoc) closeModal();
  });

  // Archivo
  fileInput.addEventListener("change", handleFileSelect);
  btnRemoveFile.addEventListener("click", resetFileInput);

  // Guardar / Editar Documento
  docForm.addEventListener("submit", handleFormSubmit);
}

function updatePathBreadcrumb() {
  const teacherText = currentTeacherFilter === "all" ? "Todos los docentes" : `Docente: ${currentTeacherFilter}`;
  const folderText = currentFolderFilter === "all" ? "Todas las carpetas" : `Categoría: ${currentFolderFilter}`;
  currentPathText.textContent = `${teacherText} • ${folderText}`;
}

// 7. Manejo del Modal para Crear o Editar
function openModalForCreate() {
  editDocId.value = "";
  modalTitle.textContent = "Subir Documento a la BD";
  docForm.reset();
  resetFileInput();

  if (currentUser.role === "docente") {
    document.getElementById("docTeacher").value = currentUser.name;
  }

  modalDoc.classList.add("show");
}

window.editDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  // Validación de permisos
  if (currentUser.role === "docente" && doc.teacher !== currentUser.name) {
    alert("Como docente solo tienes permisos para editar tus propios documentos.");
    return;
  }

  editDocId.value = doc.id;
  modalTitle.textContent = `Editar Registro (${doc.id})`;

  document.getElementById("docTitle").value = doc.title;
  document.getElementById("docTeacher").value = doc.teacher;
  document.getElementById("docGrade").value = doc.grade;
  document.getElementById("docSubject").value = doc.subject;
  document.getElementById("docFolder").value = doc.folder;
  document.getElementById("docPeriod").value = doc.period;
  document.getElementById("docNotes").value = doc.notes || "";

  uploadedFileMeta = {
    name: doc.fileName,
    size: doc.fileSize,
    base64: doc.fileData
  };

  selectedFileName.textContent = `${doc.fileName} (${doc.fileSize})`;
  fileSelectedBadge.classList.remove("hidden");
  dropText.textContent = "Archivo actual conservado (haz clic para cambiarlo)";

  modalDoc.classList.add("show");
};

function closeModal() {
  modalDoc.classList.remove("show");
  docForm.reset();
  resetFileInput();
}

// 8. Manejo de Archivos
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

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
    dropText.textContent = "Archivo cargado correctamente";
  };
  reader.readAsDataURL(file);
}

function resetFileInput() {
  fileInput.value = "";
  uploadedFileMeta = null;
  fileSelectedBadge.classList.add("hidden");
  dropText.textContent = "Clic o arrastra el archivo aquí";
}

function handleFormSubmit(e) {
  e.preventDefault();

  const isEditing = Boolean(editDocId.value);

  if (!uploadedFileMeta && !isEditing) {
    alert("Por favor adjunta un archivo para completar el registro.");
    return;
  }

  if (isEditing) {
    const docIndex = documents.findIndex(d => d.id === editDocId.value);
    if (docIndex !== -1) {
      documents[docIndex].title = document.getElementById("docTitle").value;
      documents[docIndex].teacher = document.getElementById("docTeacher").value;
      documents[docIndex].grade = document.getElementById("docGrade").value;
      documents[docIndex].subject = document.getElementById("docSubject").value;
      documents[docIndex].folder = document.getElementById("docFolder").value;
      documents[docIndex].period = document.getElementById("docPeriod").value;
      documents[docIndex].notes = document.getElementById("docNotes").value;
      
      if (uploadedFileMeta) {
        documents[docIndex].fileName = uploadedFileMeta.name;
        documents[docIndex].fileSize = uploadedFileMeta.size;
        documents[docIndex].fileData = uploadedFileMeta.base64;
      }
    }
  } else {
    const newDoc = {
      id: "MG-PRI-" + String(documents.length + 1).padStart(3, '0'),
      title: document.getElementById("docTitle").value,
      teacher: document.getElementById("docTeacher").value,
      grade: document.getElementById("docGrade").value,
      subject: document.getElementById("docSubject").value,
      folder: document.getElementById("docFolder").value,
      period: document.getElementById("docPeriod").value,
      fileName: uploadedFileMeta.name,
      fileSize: uploadedFileMeta.size,
      fileData: uploadedFileMeta.base64,
      notes: document.getElementById("docNotes").value || "Sin observaciones."
    };
    documents.unshift(newDoc);
  }

  saveDocuments();
  closeModal();
}

// 9. Eliminar Registro (Solo Administrador y Rectora)
window.deleteDoc = function(id) {
  if (currentUser.role === "docente") {
    alert("Acción restringida: Como docente no tienes permisos de eliminación. Solo la Rectora (Claudia) o el Administrador pueden suprimir registros.");
    return;
  }

  if (confirm(`¿Confirmas la eliminación del documento con ID ${id}? Esta acción no se puede deshacer.`)) {
    documents = documents.filter(d => d.id !== id);
    saveDocuments();
  }
};

// 10. Descargar archivo
window.downloadDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  if (doc.fileData) {
    const a = document.createElement("a");
    a.href = doc.fileData;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert(`Descargando documento de prueba institucional:\n"${doc.fileName}" (${doc.fileSize}) subido por la docente ${doc.teacher}.`);
  }
};

// 11. Filtrado Cruzado
function getFilteredDocuments() {
  return documents.filter(doc => {
    const matchesTeacher = currentTeacherFilter === "all" || doc.teacher === currentTeacherFilter;
    const matchesFolder = currentFolderFilter === "all" || doc.folder === currentFolderFilter;
    const matchesGrade = !currentGradeFilter || doc.grade === currentGradeFilter;
    const matchesSubject = !currentSubjectFilter || doc.subject === currentSubjectFilter;
    
    const matchesSearch = !currentSearch ||
      doc.title.toLowerCase().includes(currentSearch) ||
      doc.teacher.toLowerCase().includes(currentSearch) ||
      doc.subject.toLowerCase().includes(currentSearch) ||
      doc.fileName.toLowerCase().includes(currentSearch) ||
      doc.id.toLowerCase().includes(currentSearch);

    return matchesTeacher && matchesFolder && matchesGrade && matchesSubject && matchesSearch;
  });
}

// 12. Renderizado
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

  // Render Tarjetas
  documentsContainer.innerHTML = filtered.map(doc => {
    const canDelete = currentUser.role === "admin" || currentUser.role === "rectora";
    const canEdit = currentUser.role === "admin" || currentUser.role === "rectora" || doc.teacher === currentUser.name;

    return `
      <article class="doc-card">
        <div class="doc-card-header">
          <div class="badges-group">
            <span class="doc-tag">${formatFolder(doc.folder)}</span>
            <span class="doc-subject-tag">${escapeHTML(doc.subject)}</span>
          </div>
          <code style="font-size:0.65rem; color:#64748b;">${doc.id}</code>
        </div>

        <h4 class="doc-card-title">${escapeHTML(doc.title)}</h4>

        <div class="doc-meta">
          <div class="doc-meta-item">
            <i class="ph-bold ph-user"></i>
            <span><strong>Docente:</strong> ${escapeHTML(doc.teacher)}</span>
          </div>
          <div class="doc-meta-item">
            <i class="ph-bold ph-chalkboard-teacher"></i>
            <span>${doc.grade} • ${doc.period}</span>
          </div>
          <div class="file-attachment-badge">
            <i class="ph-bold ph-paperclip"></i>
            <span>${escapeHTML(doc.fileName)} <small>(${doc.fileSize})</small></span>
          </div>
          ${doc.notes ? `
            <div class="doc-meta-item" style="margin-top: 4px; font-style: italic;">
              <i class="ph-bold ph-note"></i>
              <span>${escapeHTML(doc.notes)}</span>
            </div>
          ` : ''}
        </div>

        <div class="doc-card-footer">
          <button onclick="downloadDoc('${doc.id}')" class="btn-download-action">
            <i class="ph-bold ph-download-simple"></i> Descargar
          </button>
          
          <div class="action-buttons">
            ${canEdit ? `
              <button class="btn-icon" onclick="editDoc('${doc.id}')" title="Editar registro">
                <i class="ph-bold ph-pencil-simple"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn-icon btn-icon-danger" onclick="deleteDoc('${doc.id}')" title="Eliminar registro">
                <i class="ph-bold ph-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Render Tabla BD
  tableBody.innerHTML = filtered.map(doc => {
    const canDelete = currentUser.role === "admin" || currentUser.role === "rectora";
    const canEdit = currentUser.role === "admin" || currentUser.role === "rectora" || doc.teacher === currentUser.name;

    return `
      <tr>
        <td><code>${doc.id}</code></td>
        <td><strong>${escapeHTML(doc.title)}</strong></td>
        <td><i class="ph ph-user"></i> ${escapeHTML(doc.teacher)}</td>
        <td>${doc.grade}</td>
        <td><span class="doc-subject-tag">${escapeHTML(doc.subject)}</span></td>
        <td><span class="doc-tag">${formatFolder(doc.folder)}</span></td>
        <td><small>${escapeHTML(doc.fileName)}</small></td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="downloadDoc('${doc.id}')" title="Descargar">
              <i class="ph-bold ph-download-simple"></i>
            </button>
            ${canEdit ? `
              <button class="btn-icon" onclick="editDoc('${doc.id}')" title="Editar">
                <i class="ph-bold ph-pencil-simple"></i>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn-icon btn-icon-danger" onclick="deleteDoc('${doc.id}')" title="Eliminar">
                <i class="ph-bold ph-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 13. Actualización de Contadores por Profesora
function updateCounts() {
  document.getElementById("count-all-teachers").textContent = documents.length;
  document.getElementById("count-jessica").textContent = documents.filter(d => d.teacher === "Jessica").length;
  document.getElementById("count-claudia").textContent = documents.filter(d => d.teacher === "Claudia (Rectora)").length;
  document.getElementById("count-yuri").textContent = documents.filter(d => d.teacher === "Yuri").length;
  document.getElementById("count-elcy").textContent = documents.filter(d => d.teacher === "Elcy").length;
}

// Auxiliares
function formatFolder(key) {
  const map = {
    planeaciones: "Planeaciones",
    calificaciones: "Planillas",
    talleres: "Guías/Talleres",
    observador: "Observador"
  };
  return map[key] || key;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Iniciar aplicación
initAuth();
setupEvents();
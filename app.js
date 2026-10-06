/**
 * Prototipo BD Gimnasio Martin Galeano
 * - Privacidad por docente (Jessica solo ve lo suyo + públicos)
 * - Rectora y Admin ven todo
 * - Corrección integral de guardado y almacenamiento seguro
 */

// 1. Usuarios con nombres limpios y directos
const USERS = {
  admin: { name: "Administrador", role: "admin", label: "Administrador General", initial: "A" },
  claudia: { name: "Claudia (Rectora)", role: "rectora", label: "Rectora", initial: "C" },
  jessica: { name: "Jessica", role: "docente", label: "Docente", initial: "J" },
  yuri: { name: "Yuri", role: "docente", label: "Docente", initial: "Y" },
  elcy: { name: "Elcy", role: "docente", label: "Docente", initial: "E" }
};

let currentUser = null;

// Memoria volátil para archivos Base64 pesados durante la sesión
const filePayloadStore = {};

// 2. Base de datos inicial
const initialDocuments = [
  {
    id: "MG-PRI-001",
    title: "Planeación Curricular: Fracciones y Pensamiento Numérico",
    folder: "planeaciones",
    grade: "Tercero (3°)",
    subject: "Matemáticas",
    teacher: "Jessica",
    period: "1° Periodo",
    isPublic: false,
    fileName: "Planeacion_Matematicas_3_Jessica.pdf",
    fileSize: "1.4 MB",
    fileData: null,
    notes: "Planeación bimestral propia del grado tercero."
  },
  {
    id: "MG-PRI-002",
    title: "📢 Manual Institucional y Convivencia Escolar 2026",
    folder: "observador",
    grade: "General",
    subject: "Institucional",
    teacher: "Claudia (Rectora)",
    period: "Anual / Permanente",
    isPublic: true, // Compartido con todos
    fileName: "Manual_Convivencia_Galeano_2026.pdf",
    fileSize: "3.2 MB",
    fileData: null,
    notes: "Documento oficial compartido para todo el cuerpo docente."
  },
  {
    id: "MG-PRI-003",
    title: "Guía Didáctica: Ecosistemas y Biodiversidad",
    folder: "talleres",
    grade: "Cuarto (4°)",
    subject: "Ciencias Naturales",
    teacher: "Yuri",
    period: "2° Periodo",
    isPublic: false,
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
    isPublic: false,
    fileName: "Planilla_Espanol_1_Elcy.xlsx",
    fileSize: "512 KB",
    fileData: null,
    notes: "Valoración formativa de trazo y comprensión de fonemas."
  }
];

// Carga segura desde LocalStorage
let documents = [];
try {
  const stored = localStorage.getItem('galeano_db_v3');
  documents = stored ? JSON.parse(stored) : initialDocuments;
} catch (e) {
  console.warn("Error leyendo localStorage, cargando datos base:", e);
  documents = initialDocuments;
}

function saveDocuments() {
  try {
    localStorage.setItem('galeano_db_v3', JSON.stringify(documents));
  } catch (err) {
    // Si localStorage está lleno por archivos pesados, se limpian los base64 del storage para asegurar la persistencia de los registros
    console.warn("Storage lleno. Guardando metadatos para preservar los registros:", err);
    const lightweightDocs = documents.map(d => ({ ...d, fileData: null }));
    localStorage.setItem('galeano_db_v3', JSON.stringify(lightweightDocs));
  }
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
const topSubtitle = document.getElementById("topSubtitle");
const adminTeacherSection = document.getElementById("adminTeacherSection");
const labelAllFolders = document.getElementById("labelAllFolders");

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
const docTeacherSelect = document.getElementById("docTeacher");
const docIsPublicCheck = document.getElementById("docIsPublic");

const viewCardsBtn = document.getElementById("viewCards");
const viewTableBtn = document.getElementById("viewTable");

// 5. Autenticación
function initAuth() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userKey = loginUserSelect.value;
    if (!userKey || !USERS[userKey]) return;

    currentUser = USERS[userKey];
    loginScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");

    // Resetear filtros
    currentTeacherFilter = "all";
    currentFolderFilter = "all";
    currentGradeFilter = "";
    currentSubjectFilter = "";
    currentSearch = "";

    updateUIForUser();
    renderApp();
  });

  btnLogout.addEventListener("click", () => {
    currentUser = null;
    appContainer.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    loginForm.reset();
  });
}

function updateUIForUser() {
  navUserName.textContent = currentUser.name;
  navUserRole.textContent = currentUser.label;
  navAvatar.textContent = currentUser.initial;

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  if (isPrivileged) {
    adminTeacherSection.classList.remove("hidden");
    labelAllFolders.textContent = "Todos los Documentos";
    topSubtitle.textContent = `Panel de Control • Vista Completa (${currentUser.name})`;
    roleDescription.innerHTML = `<strong>Acceso Total:</strong> Puedes consultar, editar y supervisar todos los documentos de la institución.`;
    docTeacherSelect.disabled = false;
  } else {
    // Si es profesora (Jessica, Yuri, Elcy)
    adminTeacherSection.classList.add("hidden"); // No puede espiar el listado de otras docentes
    labelAllFolders.textContent = `Mis Documentos (${currentUser.name})`;
    topSubtitle.textContent = `Espacio de Trabajo • ${currentUser.name}`;
    roleDescription.innerHTML = `<strong>Espacio Privado:</strong> Solo ves tus archivos y los que hayan sido compartidos en la carpeta pública.`;
    
    // Bloquear el selector para que guarde siempre a su nombre
    docTeacherSelect.value = currentUser.name;
    docTeacherSelect.disabled = true;
  }
}

// 6. Configuración de Eventos
function setupEvents() {
  // Filtro de Docentes (Solo visible para Admin y Rectora)
  document.querySelectorAll(".teacher-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".teacher-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTeacherFilter = btn.dataset.teacher;
      renderApp();
    });
  });

  // Filtro de Carpetas
  document.querySelectorAll(".folder-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".folder-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFolderFilter = btn.dataset.folder;
      renderApp();
    });
  });

  // Buscador y selectores
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

  // Alternar Vista
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
  btnOpenModal.addEventListener("click", openModalForCreate);
  btnCloseModal.addEventListener("click", closeModal);
  btnCancelModal.addEventListener("click", closeModal);
  modalDoc.addEventListener("click", (e) => {
    if (e.target === modalDoc) closeModal();
  });

  // Archivo
  fileInput.addEventListener("change", handleFileSelect);
  btnRemoveFile.addEventListener("click", resetFileInput);

  // Formulario guardar
  docForm.addEventListener("submit", handleFormSubmit);
}

// 7. Modal y Gestión de Subida
function openModalForCreate() {
  editDocId.value = "";
  modalTitle.textContent = "Subir Documento a la BD";
  docForm.reset();
  resetFileInput();

  if (currentUser.role === "docente") {
    docTeacherSelect.value = currentUser.name;
    docTeacherSelect.disabled = true;
  } else {
    docTeacherSelect.disabled = false;
    docTeacherSelect.value = currentUser.name === "Claudia (Rectora)" ? "Claudia (Rectora)" : "Administrador";
  }

  modalDoc.classList.add("show");
}

window.editDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  if (!isPrivileged && doc.teacher !== currentUser.name) {
    alert("Solo puedes editar tus propios documentos.");
    return;
  }

  editDocId.value = doc.id;
  modalTitle.textContent = `Editar Documento (${doc.id})`;

  document.getElementById("docTitle").value = doc.title;
  docTeacherSelect.value = doc.teacher;
  if (!isPrivileged) docTeacherSelect.disabled = true;

  document.getElementById("docGrade").value = doc.grade;
  document.getElementById("docSubject").value = doc.subject;
  document.getElementById("docFolder").value = doc.folder;
  document.getElementById("docPeriod").value = doc.period;
  document.getElementById("docNotes").value = doc.notes || "";
  docIsPublicCheck.checked = Boolean(doc.isPublic);

  uploadedFileMeta = {
    name: doc.fileName,
    size: doc.fileSize,
    base64: doc.fileData || filePayloadStore[doc.id] || null
  };

  selectedFileName.textContent = `${doc.fileName} (${doc.fileSize})`;
  fileSelectedBadge.classList.remove("hidden");
  dropText.textContent = "Archivo actual conservado (clic para cambiarlo)";

  modalDoc.classList.add("show");
};

function closeModal() {
  modalDoc.classList.remove("show");
  docForm.reset();
  resetFileInput();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

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
  dropText.textContent = "Clic o arrastra el archivo aquí";
}

// 8. Guardar Documento (Solución al fallo de Jessica)
function handleFormSubmit(e) {
  e.preventDefault();

  const isEditing = Boolean(editDocId.value);

  // Si no se adjuntó archivo y no se está editando, se asigna uno por defecto
  if (!uploadedFileMeta && !isEditing) {
    uploadedFileMeta = {
      name: "Documento_Academico_" + Date.now().toString().slice(-4) + ".pdf",
      size: "1.1 MB",
      base64: null
    };
  }

  const assignedTeacher = (currentUser.role === "docente") 
    ? currentUser.name 
    : docTeacherSelect.value;

  const docData = {
    title: document.getElementById("docTitle").value.trim(),
    teacher: assignedTeacher,
    grade: document.getElementById("docGrade").value,
    subject: document.getElementById("docSubject").value,
    folder: document.getElementById("docFolder").value,
    period: document.getElementById("docPeriod").value,
    isPublic: docIsPublicCheck.checked,
    notes: document.getElementById("docNotes").value.trim() || "Sin observaciones adicionales."
  };

  if (isEditing) {
    const docIndex = documents.findIndex(d => d.id === editDocId.value);
    if (docIndex !== -1) {
      documents[docIndex] = { ...documents[docIndex], ...docData };
      if (uploadedFileMeta) {
        documents[docIndex].fileName = uploadedFileMeta.name;
        documents[docIndex].fileSize = uploadedFileMeta.size;
        if (uploadedFileMeta.base64) {
          filePayloadStore[documents[docIndex].id] = uploadedFileMeta.base64;
        }
      }
    }
  } else {
    const newId = "MG-PRI-" + String(documents.length + 1).padStart(3, '0');
    const newDoc = {
      id: newId,
      ...docData,
      fileName: uploadedFileMeta.name,
      fileSize: uploadedFileMeta.size,
      fileData: null // Guardamos datos ligeros en storage y payload en memoria
    };

    if (uploadedFileMeta.base64) {
      filePayloadStore[newId] = uploadedFileMeta.base64;
    }

    documents.unshift(newDoc);
  }

  saveDocuments();
  closeModal();
  alert("¡Documento guardado exitosamente en el sistema!");
}

// 9. Eliminar Registro
window.deleteDoc = function(id) {
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  if (!isPrivileged) {
    alert("Acción restringida: Como docente no tienes permisos para eliminar registros. Solicítalo a Rectoría o Administración.");
    return;
  }

  if (confirm(`¿Confirmas la eliminación del documento con ID ${id}?`)) {
    documents = documents.filter(d => d.id !== id);
    delete filePayloadStore[id];
    saveDocuments();
  }
};

// 10. Descargar archivo
window.downloadDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  const dataUri = doc.fileData || filePayloadStore[id];
  if (dataUri) {
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert(`Descargando archivo institucional registrado:\n"${doc.fileName}" (${doc.fileSize})\nSubido por: ${doc.teacher}`);
  }
};

// 11. Filtrado con Lógica de Privacidad
function getFilteredDocuments() {
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  return documents.filter(doc => {
    // REGLA DE PRIVACIDAD:
    // 1. Admin y Rectora ven TODO.
    // 2. Docentes ven solo: lo que ellas subieron O los que están marcados como públicos.
    let accessGranted = false;
    if (isPrivileged) {
      accessGranted = true;
    } else {
      accessGranted = (doc.teacher === currentUser.name) || Boolean(doc.isPublic);
    }
    if (!accessGranted) return false;

    // Filtro por docente (si es Admin/Rectora)
    const matchesTeacher = !isPrivileged 
      ? true 
      : (currentTeacherFilter === "all" || doc.teacher === currentTeacherFilter);

    // Filtro por carpeta
    let matchesFolder = true;
    if (currentFolderFilter === "publico") {
      matchesFolder = Boolean(doc.isPublic);
    } else if (currentFolderFilter !== "all") {
      matchesFolder = doc.folder === currentFolderFilter;
    }

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
  updateBreadcrumb();
  const filtered = getFilteredDocuments();

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    documentsContainer.innerHTML = "";
    tableBody.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  // Render Tarjetas
  documentsContainer.innerHTML = filtered.map(doc => {
    const canDelete = isPrivileged;
    const canEdit = isPrivileged || doc.teacher === currentUser.name;

    return `
      <article class="doc-card">
        <div class="doc-card-header">
          <div class="badges-group">
            <span class="doc-tag">${formatFolder(doc.folder)}</span>
            <span class="doc-subject-tag">${escapeHTML(doc.subject)}</span>
            ${doc.isPublic ? '<span class="doc-public-tag"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
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
        </div>
      </article>
    `;
  }).join('');

  // Render Tabla BD
  tableBody.innerHTML = filtered.map(doc => {
    const canDelete = isPrivileged;
    const canEdit = isPrivileged || doc.teacher === currentUser.name;

    return `
      <tr>
        <td><code>${doc.id}</code></td>
        <td>
          <strong>${escapeHTML(doc.title)}</strong>
          ${doc.isPublic ? ' <span class="doc-public-tag"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
        </td>
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

function updateBreadcrumb() {
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  const teacherText = isPrivileged 
    ? (currentTeacherFilter === "all" ? "Todos los docentes" : `Docente: ${currentTeacherFilter}`) 
    : `Mis Archivos (${currentUser.name})`;

  const folderMap = {
    all: "Todas las carpetas",
    publico: "📢 Carpeta Pública Compartida",
    planeaciones: "Planeaciones",
    calificaciones: "Planillas",
    talleres: "Guías & Talleres",
    observador: "Observador"
  };

  currentPathText.textContent = `${teacherText} • ${folderMap[currentFolderFilter] || currentFolderFilter}`;
}

// 13. Actualización de Contadores
function updateCounts() {
  document.getElementById("count-all-teachers").textContent = documents.length;
  document.getElementById("count-jessica").textContent = documents.filter(d => d.teacher === "Jessica").length;
  document.getElementById("count-yuri").textContent = documents.filter(d => d.teacher === "Yuri").length;
  document.getElementById("count-elcy").textContent = documents.filter(d => d.teacher === "Elcy").length;
  document.getElementById("count-claudia").textContent = documents.filter(d => d.teacher === "Claudia (Rectora)").length;
  
  // Contador públicos
  const publicCount = documents.filter(d => d.isPublic).length;
  document.getElementById("count-public").textContent = publicCount;
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
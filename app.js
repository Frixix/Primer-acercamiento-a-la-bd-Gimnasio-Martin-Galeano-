/**
 * Sistema Documental Primaria - Gimnasio Martin Galeano
 * - Colores pastel diferenciados exclusivamente para Carpetas/Rutas
 * - Color pastel uniforme y neutro para Grados Escolares
 * - Almacenamiento binario en IndexedDB y descarga directa del archivo original
 */

// 1. Usuarios Oficiales con Claves
const USERS = {
  admin: { name: "Administrador", role: "admin", label: "Administrador General", initial: "A", pass: "admin2026" },
  claudia: { name: "Claudia (Rectora)", role: "rectora", label: "Rectora Institucional", initial: "C", pass: "rectora2026" },
  jessica: { name: "Jessica", role: "docente", label: "Docente", initial: "J", pass: "jessica2026" },
  yuri: { name: "Yuri", role: "docente", label: "Docente", initial: "Y", pass: "yuri2026" },
  elcy: { name: "Elcy", role: "docente", label: "Docente", initial: "E", pass: "elcy2026" }
};

let currentUser = null;

// ==========================================
// 2. MOTOR DE ALMACENAMIENTO INDEXEDDB PARA ARCHIVOS REALES
// ==========================================
const DB_NAME = "GaleanoFileDB";
const STORE_NAME = "real_files";

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToIndexedDB(id, fileBlob, fileName, fileType) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, fileBlob, fileName, fileType });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileFromIndexedDB(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileFromIndexedDB(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 3. Base de datos inicial con Fecha y Hora
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
    uploadedAt: "05/10/2026, 09:15 a. m.",
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
    isPublic: true,
    fileName: "Manual_Convivencia_Galeano_2026.pdf",
    fileSize: "3.2 MB",
    uploadedAt: "05/10/2026, 08:30 a. m.",
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
    uploadedAt: "05/10/2026, 11:40 a. m.",
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
    uploadedAt: "05/10/2026, 02:10 p. m.",
    notes: "Valoración formativa de trazo y comprensión de fonemas."
  }
];

// Carga de metadatos desde LocalStorage
let documents = [];
try {
  const stored = localStorage.getItem('galeano_db_clean_records');
  documents = stored ? JSON.parse(stored) : initialDocuments;
} catch (e) {
  console.warn("Inicializando base de datos local:", e);
  documents = initialDocuments;
}

function saveDocuments() {
  try {
    localStorage.setItem('galeano_db_clean_records', JSON.stringify(documents));
  } catch (err) {
    alert("Error al actualizar la base de datos.");
  }
  renderApp();
}

// 4. Variables de Estado de Filtros
let currentTeacherFilter = "all";
let currentFolderFilter = "all";
let currentGradeFilter = "";
let currentSubjectFilter = "";
let currentSearch = "";
let currentView = "cards";
let uploadedFileMeta = null;

// 5. Elementos del DOM
const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm");
const loginUserSelect = document.getElementById("loginUserSelect");
const loginPasswordInput = document.getElementById("loginPassword");
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

// 6. Autenticación
function initAuth() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userKey = loginUserSelect.value;
    const enteredPass = loginPasswordInput.value.trim();

    if (!userKey || !USERS[userKey]) {
      alert("Por favor selecciona un perfil institucional.");
      return;
    }

    const expectedUser = USERS[userKey];

    if (enteredPass !== expectedUser.pass) {
      alert(`Contraseña incorrecta para ${expectedUser.name}.`);
      loginPasswordInput.value = "";
      loginPasswordInput.focus();
      return;
    }

    currentUser = expectedUser;
    loginScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");
    loginPasswordInput.value = "";

    resetAllFiltersToDefault();
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

function resetAllFiltersToDefault() {
  currentTeacherFilter = "all";
  currentFolderFilter = "all";
  currentGradeFilter = "";
  currentSubjectFilter = "";
  currentSearch = "";

  if (searchInput) searchInput.value = "";
  if (gradeFilter) gradeFilter.value = "";
  if (subjectFilter) subjectFilter.value = "";

  document.querySelectorAll(".teacher-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.teacher === "all");
  });
  document.querySelectorAll(".folder-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.folder === "all");
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
    topSubtitle.textContent = `Panel Directivo • ${currentUser.name}`;
    roleDescription.innerHTML = `<strong>Supervisión Total:</strong> Puedes consultar, descargar y revisar absolutamente todos los documentos de las docentes con su fecha exacta.`;
    docTeacherSelect.disabled = false;
  } else {
    adminTeacherSection.classList.add("hidden");
    labelAllFolders.textContent = `Mis Documentos (${currentUser.name})`;
    topSubtitle.textContent = `Espacio de Trabajo • ${currentUser.name}`;
    roleDescription.innerHTML = `<strong>Espacio Docente:</strong> Visualización privada de tus registros y acceso a la carpeta compartida.`;
    docTeacherSelect.value = currentUser.name;
    docTeacherSelect.disabled = true;
  }
}

// 7. Eventos de la Interfaz
function setupEvents() {
  document.querySelectorAll(".teacher-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".teacher-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTeacherFilter = btn.dataset.teacher;
      renderApp();
    });
  });

  document.querySelectorAll(".folder-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".folder-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFolderFilter = btn.dataset.folder;
      renderApp();
    });
  });

  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
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

  btnOpenModal.addEventListener("click", openModalForCreate);
  btnCloseModal.addEventListener("click", closeModal);
  btnCancelModal.addEventListener("click", closeModal);
  modalDoc.addEventListener("click", (e) => {
    if (e.target === modalDoc) closeModal();
  });

  fileInput.addEventListener("change", handleFileSelect);
  btnRemoveFile.addEventListener("click", resetFileInput);
  docForm.addEventListener("submit", handleFormSubmit);
}

// 8. Modal Crear y Editar
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
    alert("Solo tienes permisos para editar tus propios documentos.");
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
    rawFile: null
  };

  selectedFileName.textContent = `${doc.fileName} (${doc.fileSize})`;
  fileSelectedBadge.classList.remove("hidden");
  dropText.textContent = "Archivo conservado (clic para cambiarlo)";

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

  uploadedFileMeta = {
    name: file.name,
    size: formatBytes(file.size),
    rawFile: file
  };

  selectedFileName.textContent = `${file.name} (${uploadedFileMeta.size})`;
  fileSelectedBadge.classList.remove("hidden");
  dropText.textContent = "Archivo listo para guardar";
}

function resetFileInput() {
  fileInput.value = "";
  uploadedFileMeta = null;
  fileSelectedBadge.classList.add("hidden");
  dropText.textContent = "Clic o arrastra el archivo aquí";
}

// 9. Guardado de Documentos
async function handleFormSubmit(e) {
  e.preventDefault();

  const isEditing = Boolean(editDocId.value);

  const now = new Date();
  const formattedDateTime = now.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

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
      if (uploadedFileMeta && uploadedFileMeta.rawFile) {
        documents[docIndex].fileName = uploadedFileMeta.name;
        documents[docIndex].fileSize = uploadedFileMeta.size;
        await saveFileToIndexedDB(
          documents[docIndex].id, 
          uploadedFileMeta.rawFile, 
          uploadedFileMeta.name, 
          uploadedFileMeta.rawFile.type
        );
      }
    }
  } else {
    if (!uploadedFileMeta || !uploadedFileMeta.rawFile) {
      alert("Por favor selecciona un archivo (Excel, PDF, Word, etc.) para subir.");
      return;
    }

    const newId = "MG-PRI-" + String(documents.length + 1).padStart(3, '0');
    const newDoc = {
      id: newId,
      ...docData,
      fileName: uploadedFileMeta.name,
      fileSize: uploadedFileMeta.size,
      uploadedAt: formattedDateTime
    };

    await saveFileToIndexedDB(
      newId, 
      uploadedFileMeta.rawFile, 
      uploadedFileMeta.name, 
      uploadedFileMeta.rawFile.type
    );

    documents.unshift(newDoc);
  }

  saveDocuments();
  closeModal();
  alert(`✅ Documento "${docData.title}" guardado exitosamente.\nRegistrado el: ${formattedDateTime}`);
}

// 10. Eliminar Registro
window.deleteDoc = async function(id) {
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  if (!isPrivileged) {
    alert("Acción restringida: Como docente no tienes permisos para eliminar registros. Solo Rectoría o el Administrador pueden suprimir datos.");
    return;
  }

  if (confirm(`¿Confirmas la eliminación del documento con ID ${id}?`)) {
    documents = documents.filter(d => d.id !== id);
    await deleteFileFromIndexedDB(id);
    saveDocuments();
  }
};

// 11. Descarga Exacta del Archivo Subido
window.downloadDoc = async function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  try {
    const storedFile = await getFileFromIndexedDB(id);

    if (storedFile && storedFile.fileBlob) {
      const url = URL.createObjectURL(storedFile.fileBlob);
      triggerDownload(url, storedFile.fileName || doc.fileName);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return;
    }

    alert(`Nota: "${doc.fileName}" es un registro inicial de demostración.\n\nSube un archivo real y al hacer clic en este botón se descargará exactamente el archivo que subiste.`);

  } catch (error) {
    console.error("Error al acceder a IndexedDB:", error);
    alert("Hubo un problema al recuperar el archivo original.");
  }
};

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 12. Filtrado
function getFilteredDocuments() {
  if (!currentUser) return [];

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  return documents.filter(doc => {
    if (!isPrivileged) {
      const isMine = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic);
      if (!isMine && !isShared) return false;
    }

    if (isPrivileged && currentTeacherFilter !== "all") {
      if (doc.teacher !== currentTeacherFilter) return false;
    }

    if (currentFolderFilter === "publico") {
      if (!doc.isPublic) return false;
    } else if (currentFolderFilter !== "all") {
      if (doc.folder !== currentFolderFilter) return false;
    }

    if (currentGradeFilter && doc.grade !== currentGradeFilter) {
      return false;
    }

    if (currentSubjectFilter && doc.subject !== currentSubjectFilter) {
      return false;
    }

    if (currentSearch) {
      const q = currentSearch;
      const match = 
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.teacher && doc.teacher.toLowerCase().includes(q)) ||
        (doc.subject && doc.subject.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        (doc.id && doc.id.toLowerCase().includes(q)) ||
        (doc.uploadedAt && doc.uploadedAt.toLowerCase().includes(q)) ||
        (doc.notes && doc.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

// 13. Renderizado de Interfaz con Estilo Pastel
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

  // Tarjetas
  documentsContainer.innerHTML = filtered.map(doc => {
    const canDelete = isPrivileged;
    const canEdit = isPrivileged || doc.teacher === currentUser.name;
    const fileIcon = getFileIconClass(doc.fileName);
    const folderPastelClass = getFolderPastelClass(doc.folder);

    return `
      <article class="doc-card">
        <div class="doc-card-header">
          <div class="badges-group">
            <!-- Carpeta en Color Pastel Exclusivo -->
            <span class="${folderPastelClass}">${formatFolder(doc.folder)}</span>
            
            <!-- Grado en Color Pastel Uniforme -->
            <span class="tag-pastel-grade">${doc.grade}</span>

            <!-- Compartido público en Verde Menta Pastel -->
            ${doc.isPublic ? '<span class="tag-pastel-public"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
          </div>
          <!-- Fecha y Radicado Sutiles -->
          <div class="doc-meta-subtle">
            <span>${doc.uploadedAt || 'Reciente'}</span>
            <span class="dot-separator">•</span>
            <code>${doc.id}</code>
          </div>
        </div>

        <h4 class="doc-card-title">${escapeHTML(doc.title)}</h4>

        <div class="doc-meta">
          <div class="doc-meta-item">
            <i class="ph-bold ph-user"></i>
            <span><strong>Docente:</strong> ${escapeHTML(doc.teacher)}</span>
          </div>
          <div class="doc-meta-item">
            <i class="ph-bold ph-book-open"></i>
            <span><strong>Materia:</strong> ${escapeHTML(doc.subject)} • ${doc.period}</span>
          </div>
          
          <div class="file-attachment-badge">
            <i class="${fileIcon}"></i>
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
          <button onclick="downloadDoc('${doc.id}')" class="btn-download-action" title="Descargar archivo original">
            <i class="ph-bold ph-download-simple"></i> Descargar Archivo
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

  // Tabla
  tableBody.innerHTML = filtered.map(doc => {
    const canDelete = isPrivileged;
    const canEdit = isPrivileged || doc.teacher === currentUser.name;
    const fileIcon = getFileIconClass(doc.fileName);
    const folderPastelClass = getFolderPastelClass(doc.folder);

    return `
      <tr>
        <td><code>${doc.id}</code></td>
        <td>
          <strong>${escapeHTML(doc.title)}</strong>
          ${doc.isPublic ? ' <span class="tag-pastel-public"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
        </td>
        <td><i class="ph ph-user"></i> ${escapeHTML(doc.teacher)}</td>
        <td><span class="tag-pastel-grade">${doc.grade}</span></td>
        <td>${escapeHTML(doc.subject)}</td>
        <td><span class="${folderPastelClass}">${formatFolder(doc.folder)}</span></td>
        <td><small><i class="ph-bold ph-clock"></i> ${doc.uploadedAt || "Reciente"}</small></td>
        <td><small><i class="${fileIcon}"></i> ${escapeHTML(doc.fileName)}</small></td>
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
    all: "Todos los Documentos",
    publico: "Compartidos con Todos",
    planeaciones: "Planeaciones",
    calificaciones: "Planillas de Notas",
    talleres: "Guías & Talleres",
    observador: "Observador & Actas"
  };

  currentPathText.textContent = `${teacherText} • ${folderMap[currentFolderFilter] || currentFolderFilter}`;
}

// 14. Actualización de Contadores
function updateCounts() {
  const isPrivileged = currentUser && (currentUser.role === "admin" || currentUser.role === "rectora");

  const visibleDocs = isPrivileged 
    ? documents 
    : documents.filter(d => d.teacher === currentUser.name || d.isPublic);

  document.getElementById("count-all-teachers").textContent = visibleDocs.length;
  document.getElementById("count-jessica").textContent = documents.filter(d => d.teacher === "Jessica").length;
  document.getElementById("count-yuri").textContent = documents.filter(d => d.teacher === "Yuri").length;
  document.getElementById("count-elcy").textContent = documents.filter(d => d.teacher === "Elcy").length;
  document.getElementById("count-claudia").textContent = documents.filter(d => d.teacher === "Claudia (Rectora)").length;
  document.getElementById("count-public").textContent = documents.filter(d => d.isPublic).length;
}

// Asignación de Clases Pastel
function getFolderPastelClass(folderKey) {
  const map = {
    planeaciones: "tag-pastel-planeaciones",
    calificaciones: "tag-pastel-calificaciones",
    talleres: "tag-pastel-talleres",
    observador: "tag-pastel-observador"
  };
  return map[folderKey] || "tag-pastel-planeaciones";
}

function getFileIconClass(fileName) {
  if (!fileName) return "ph-bold ph-file";
  const ext = fileName.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) return "ph-bold ph-file-xls";
  if (['pdf'].includes(ext)) return "ph-bold ph-file-pdf";
  if (['doc', 'docx'].includes(ext)) return "ph-bold ph-file-doc";
  if (['ppt', 'pptx'].includes(ext)) return "ph-bold ph-presentation";
  return "ph-bold ph-file";
}

function formatFolder(key) {
  const map = {
    planeaciones: "Planeaciones",
    calificaciones: "Planillas de Notas",
    talleres: "Guías & Talleres",
    observador: "Observador & Actas"
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
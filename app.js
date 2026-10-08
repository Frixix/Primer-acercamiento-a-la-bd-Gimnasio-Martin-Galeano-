/**
 * Sistema Documental Primaria - Gimnasio Martin Galeano
 * - Usuario especial: Inducción Profesoras (Tour interactivo guiado)
 * - Spotlight animado paso a paso con explicaciones pedagógicas
 * - Bóveda de Rectoría protegida con clave: boveda2026
 * - Límites: 15 MB docentes / 2 GB rectoría
 */

// 1. Usuarios Oficiales con cuenta de Inducción
const USERS = {
  induccion: { 
    name: "Inducción Profesoras", 
    role: "induccion", 
    label: "Módulo de Capacitación Docente", 
    initial: "✨", 
    pass: "induccion2026",
    maxUploadBytes: 15 * 1024 * 1024,
    maxUploadLabel: "15 MB"
  },
  admin: { 
    name: "Administrador", 
    role: "admin", 
    label: "Administrador General", 
    initial: "A", 
    pass: "admin2026",
    maxUploadBytes: 2 * 1024 * 1024 * 1024,
    maxUploadLabel: "2 GB"
  },
  claudia: { 
    name: "Claudia (Rectora)", 
    role: "rectora", 
    label: "Rectora Institucional", 
    initial: "C", 
    pass: "rectora2026",
    maxUploadBytes: 2 * 1024 * 1024 * 1024,
    maxUploadLabel: "2 GB"
  },
  jessica: { 
    name: "Jessica", 
    role: "docente", 
    label: "Docente", 
    initial: "J", 
    pass: "jessica2026",
    maxUploadBytes: 15 * 1024 * 1024,
    maxUploadLabel: "15 MB"
  },
  yuri: { 
    name: "Yuri", 
    role: "docente", 
    label: "Docente", 
    initial: "Y", 
    pass: "yuri2026",
    maxUploadBytes: 15 * 1024 * 1024,
    maxUploadLabel: "15 MB"
  },
  elcy: { 
    name: "Elcy", 
    role: "docente", 
    label: "Docente", 
    initial: "E", 
    pass: "elcy2026",
    maxUploadBytes: 15 * 1024 * 1024,
    maxUploadLabel: "15 MB"
  }
};

const BOVEDA_PASSWORD = "boveda2026";
const SYSTEM_STORAGE_CAPACITY_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

let currentUser = null;
let isBovedaUnlocked = false;

// Registro de lecturas estilo WhatsApp
let readReceipts = JSON.parse(localStorage.getItem('galeano_read_receipts_v1')) || {};
function saveReadReceipts() {
  localStorage.setItem('galeano_read_receipts_v1', JSON.stringify(readReceipts));
}

// 2. Almacenamiento en IndexedDB
const DB_NAME = "GaleanoTieredDB";
const STORE_NAME = "documents_payload";

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

async function saveFileToDB(id, blobData, originalName, mimeType, isCompressed) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, blobData, originalName, mimeType, isCompressed });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileFromDB(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileFromDB(id) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 3. Base de datos inicial
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
    compressedSize: "420 KB",
    rawBytes: 1.4 * 1024 * 1024,
    ratio: "70%",
    isCompressed: true,
    uploadedAt: "05/10/2026, 09:15 a. m.",
    notes: "Planeación bimestral propia del grado tercero."
  },
  {
    id: "MG-PRI-002",
    title: "📢 Circular N° 01: Inicio de Bimestre y Directrices Institucionales",
    folder: "institucional",
    grade: "General",
    subject: "Institucional",
    teacher: "Claudia (Rectora)",
    period: "Anual / Permanente",
    isPublic: true,
    fileName: "Circular_01_Directrices_2026.pdf",
    fileSize: "1.8 MB",
    compressedSize: "510 KB",
    rawBytes: 1.8 * 1024 * 1024,
    ratio: "72%",
    isCompressed: true,
    uploadedAt: "06/10/2026, 08:30 a. m.",
    notes: "Estimado cuerpo docente: Se socializan los horarios de entrega de planeaciones pedagógicas, fechas de cortes de notas y pautas de acompañamiento en aula para el primer bimestre."
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
    compressedSize: "190 KB",
    rawBytes: 680 * 1024,
    ratio: "72%",
    isCompressed: true,
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
    compressedSize: "135 KB",
    rawBytes: 512 * 1024,
    ratio: "74%",
    isCompressed: true,
    uploadedAt: "05/10/2026, 02:10 p. m.",
    notes: "Valoración formativa de trazo y comprensión de fonemas."
  },
  {
    id: "MG-BOV-001",
    title: "Acta Ordinaria N° 01 - Consejo Directivo 2026",
    folder: "boveda",
    grade: "Directivo",
    subject: "Directiva",
    teacher: "Claudia (Rectora)",
    period: "Anual / Permanente",
    isPublic: false,
    bovedaYear: "2026",
    bovedaSubfolder: "consejo",
    fileName: "Acta_Consejo_Directivo_01_2026.pdf",
    fileSize: "2.4 MB",
    compressedSize: "720 KB",
    rawBytes: 2.4 * 1024 * 1024,
    ratio: "70%",
    isCompressed: true,
    uploadedAt: "06/10/2026, 09:00 a. m.",
    notes: "Aprobación del presupuesto operativo y plan de gestión institucional de Básica Primaria."
  }
];

let documents = [];
try {
  const stored = localStorage.getItem('galeano_db_clean_records_v8');
  documents = stored ? JSON.parse(stored) : initialDocuments;
} catch (e) {
  console.warn("Inicializando base de datos local:", e);
  documents = initialDocuments;
}

function saveDocuments() {
  try {
    localStorage.setItem('galeano_db_clean_records_v8', JSON.stringify(documents));
  } catch (err) {
    alert("Error al actualizar la base de datos.");
  }
  renderApp();
}

// 4. Variables de Estado
let currentTeacherFilter = "all";
let currentFolderFilter = "all";
let currentGradeFilter = "";
let currentSubjectFilter = "";
let currentSearch = "";
let currentView = "cards";
let currentBovedaYear = "all";
let currentBovedaSubfolder = "all";
let processedUploadData = null;
let currentPreviewDocId = null;

// 5. Configuración de Pasos del Tour de Inducción
const TOUR_STEPS = [
  {
    targetId: null, // Centro de pantalla
    title: "¡Bienvenida al Sistema Documental!",
    desc: "Este espacio fue diseñado para organizar de forma sencilla y privada el trabajo de Básica Primaria del Gimnasio Martin Galeano. Vamos a ver en 4 pasos cómo funciona.",
    icon: "ph-bold ph-hand-waving",
    action: () => {}
  },
  {
    targetId: "sidebarFoldersSection",
    title: "Tus Carpetas y Circulares",
    desc: "En este menú lateral encuentras tus planeaciones, planillas y talleres. Además, en 'Institucional & Circulares' recibirás avisos de Rectoría con un globo rojo como en WhatsApp.",
    icon: "ph-bold ph-folders",
    action: () => {
      document.getElementById("mainSidebar").classList.remove("mobile-open");
    }
  },
  {
    targetId: "generalFiltersBar",
    title: "Filtros y Búsqueda Rápida",
    desc: "Puedes filtrar tus documentos al instante por Materia (Matemáticas, Lenguaje...), por Grado (1° a 5°) o escribiendo directamente en la barra de búsqueda.",
    icon: "ph-bold ph-magnifying-glass",
    action: () => {}
  },
  {
    targetId: "btnOpenModal",
    title: "Subir Documento Comprimido",
    desc: "Al pulsar aquí podrás subir tus archivos (PDF, Excel, Word). El sistema los comprime automáticamente para ahorrar memoria y te permite compartirlos o dejarlos privados.",
    icon: "ph-bold ph-cloud-arrow-up",
    action: () => {}
  },
  {
    targetId: "documentsContainer",
    title: "Visualizar y Descargar",
    desc: "En cada tarjeta encontrarás el botón 'Ver' para leer la circular en pantalla y 'Descargar' para obtener el archivo original en tu computador en cualquier momento.",
    icon: "ph-bold ph-file-arrow-down",
    action: () => {}
  }
];

let currentTourStepIndex = 0;

// 6. Elementos del DOM
const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm");
const loginUserSelect = document.getElementById("loginUserSelect");
const loginPasswordInput = document.getElementById("loginPassword");
const btnLogout = document.getElementById("btnLogout");

const navUserName = document.getElementById("navUserName");
const navUserRole = document.getElementById("navUserRole");
const navAvatar = document.getElementById("navAvatar");
const topSubtitle = document.getElementById("topSubtitle");
const adminTeacherSection = document.getElementById("adminTeacherSection");
const labelAllFolders = document.getElementById("labelAllFolders");

const storageProgressBar = document.getElementById("storageProgressBar");
const storageUsedText = document.getElementById("storageUsedText");
const storageFreeText = document.getElementById("storageFreeText");
const fileQuotaHint = document.getElementById("fileQuotaHint");
const quotaSummaryDesc = document.getElementById("quotaSummaryDesc");

const bellBadge = document.getElementById("bellBadge");
const sidebarInstitucionalBadge = document.getElementById("sidebarInstitucionalBadge");
const navNotificationBell = document.getElementById("navNotificationBell");

const btnBovedaFolder = document.getElementById("btnBovedaFolder");
const modalBovedaAuth = document.getElementById("modalBovedaAuth");
const bovedaAuthForm = document.getElementById("bovedaAuthForm");
const bovedaPasswordInput = document.getElementById("bovedaPassword");
const btnCloseBovedaAuth = document.getElementById("btnCloseBovedaAuth");
const btnCancelBovedaAuth = document.getElementById("btnCancelBovedaAuth");

const bovedaControlsSection = document.getElementById("bovedaControlsSection");
const generalFiltersBar = document.getElementById("generalFiltersBar");
const bovedaYearFilter = document.getElementById("bovedaYearFilter");
const bovedaSubfolderFilter = document.getElementById("bovedaSubfolderFilter");

const mainSidebar = document.getElementById("mainSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnCloseSidebar = document.getElementById("btnCloseSidebar");

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
const compressionStats = document.getElementById("compressionStats");
const btnRemoveFile = document.getElementById("btnRemoveFile");

const editDocId = document.getElementById("editDocId");
const modalTitle = document.getElementById("modalTitle");
const docTeacherSelect = document.getElementById("docTeacher");
const docFolderSelect = document.getElementById("docFolder");
const docIsPublicCheck = document.getElementById("docIsPublic");
const optionBovedaModal = document.getElementById("optionBovedaModal");
const bovedaFormFields = document.getElementById("bovedaFormFields");
const docBovedaYear = document.getElementById("docBovedaYear");
const docBovedaSubfolder = document.getElementById("docBovedaSubfolder");
const containerIsPublicCheck = document.getElementById("containerIsPublicCheck");

const viewCardsBtn = document.getElementById("viewCards");
const viewTableBtn = document.getElementById("viewTable");

// Modal Ver Documento
const modalViewDoc = document.getElementById("modalViewDoc");
const btnCloseViewModal = document.getElementById("btnCloseViewModal");
const btnDoneView = document.getElementById("btnDoneView");
const btnDownloadFromView = document.getElementById("btnDownloadFromView");
const viewDocTitle = document.getElementById("viewDocTitle");
const viewDocMetaSubtitle = document.getElementById("viewDocMetaSubtitle");
const viewDocBody = document.getElementById("viewDocBody");

// Elementos de Inducción
const tourBackdrop = document.getElementById("tourBackdrop");
const tourBox = document.getElementById("tourBox");
const tourStepBadge = document.getElementById("tourStepBadge");
const tourIcon = document.getElementById("tourIcon");
const tourTitle = document.getElementById("tourTitle");
const tourDesc = document.getElementById("tourDesc");
const btnTourPrev = document.getElementById("btnTourPrev");
const btnTourNext = document.getElementById("btnTourNext");
const btnTourSkip = document.getElementById("btnTourSkip");
const btnFloatingReplayTour = document.getElementById("btnFloatingReplayTour");

// 7. Autenticación
function initAuth() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userKey = loginUserSelect.value;
    const enteredPass = loginPasswordInput.value.trim();

    if (!userKey || !USERS[userKey]) {
      alert("Por favor selecciona un usuario institucional.");
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
    isBovedaUnlocked = false;
    loginScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");
    loginPasswordInput.value = "";

    resetAllFiltersToDefault();
    updateUIForUser();
    renderApp();

    // Si es el usuario de Inducción, iniciamos automáticamente el Tour
    if (currentUser.role === "induccion") {
      setTimeout(() => {
        startTour();
      }, 400);
    } else {
      endTour();
    }
  });

  btnLogout.addEventListener("click", () => {
    currentUser = null;
    isBovedaUnlocked = false;
    endTour();
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
  currentBovedaYear = "all";
  currentBovedaSubfolder = "all";

  if (searchInput) searchInput.value = "";
  if (gradeFilter) gradeFilter.value = "";
  if (subjectFilter) subjectFilter.value = "";
  if (bovedaYearFilter) bovedaYearFilter.value = "all";
  if (bovedaSubfolderFilter) bovedaSubfolderFilter.value = "all";

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

  fileQuotaHint.textContent = `Límite autorizado para tu cuenta: hasta ${currentUser.maxUploadLabel} por archivo.`;

  if (isPrivileged) {
    adminTeacherSection.classList.remove("hidden");
    btnBovedaFolder.classList.remove("hidden");
    optionBovedaModal.classList.remove("hidden");
    labelAllFolders.textContent = "Todos los Documentos";
    topSubtitle.textContent = `Panel Directivo • ${currentUser.name}`;
    docTeacherSelect.disabled = false;
    quotaSummaryDesc.innerHTML = `Límite por subida: <strong>2 GB</strong> (Rectoría / Admin).`;
    btnFloatingReplayTour.classList.add("hidden");
  } else if (currentUser.role === "induccion") {
    adminTeacherSection.classList.add("hidden");
    btnBovedaFolder.classList.add("hidden");
    optionBovedaModal.classList.add("hidden");
    labelAllFolders.textContent = `Mis Documentos de Inducción`;
    topSubtitle.textContent = `Paso a Paso • Capacitación Docente`;
    docTeacherSelect.value = "Jessica";
    docTeacherSelect.disabled = true;
    quotaSummaryDesc.innerHTML = `Límite por subida docente: <strong>15 MB</strong> por archivo.`;
    btnFloatingReplayTour.classList.remove("hidden");
  } else {
    adminTeacherSection.classList.add("hidden");
    btnBovedaFolder.classList.add("hidden");
    optionBovedaModal.classList.add("hidden");
    labelAllFolders.textContent = `Mis Documentos (${currentUser.name})`;
    topSubtitle.textContent = `Espacio de Trabajo • ${currentUser.name}`;
    docTeacherSelect.value = currentUser.name;
    docTeacherSelect.disabled = true;
    quotaSummaryDesc.innerHTML = `Límite por subida docente: <strong>15 MB</strong> por archivo.`;
    btnFloatingReplayTour.classList.add("hidden");
  }

  updateStorageMeter();
}

// 8. Medidor de Almacenamiento
function updateStorageMeter() {
  let totalBytesUsed = 0;
  documents.forEach(doc => {
    totalBytesUsed += (doc.rawBytes || 1024 * 1024);
  });

  const percentUsed = Math.min(100, (totalBytesUsed / SYSTEM_STORAGE_CAPACITY_BYTES) * 100);
  const bytesFree = Math.max(0, SYSTEM_STORAGE_CAPACITY_BYTES - totalBytesUsed);

  storageProgressBar.style.width = `${Math.max(2, percentUsed)}%`;
  storageUsedText.textContent = `${formatBytes(totalBytesUsed)} usados`;
  storageFreeText.textContent = `${formatBytes(bytesFree)} libres de 2 GB`;
}

// 9. LÓGICA DEL TOUR DE INDUCCIÓN
function startTour() {
  currentTourStepIndex = 0;
  tourBackdrop.classList.remove("hidden");
  tourBox.classList.remove("hidden");
  renderTourStep();
}

function renderTourStep() {
  // Limpiar resaltados previos
  document.querySelectorAll(".tour-highlighted-target").forEach(el => {
    el.classList.remove("tour-highlighted-target");
  });

  const step = TOUR_STEPS[currentTourStepIndex];
  step.action();

  tourStepBadge.textContent = `Paso ${currentTourStepIndex + 1} de ${TOUR_STEPS.length}`;
  tourIcon.innerHTML = `<i class="${step.icon}"></i>`;
  tourTitle.textContent = step.title;
  tourDesc.textContent = step.desc;

  // Botón anterior
  if (currentTourStepIndex === 0) {
    btnTourPrev.classList.add("hidden");
  } else {
    btnTourPrev.classList.remove("hidden");
  }

  // Botón siguiente o finalizar
  if (currentTourStepIndex === TOUR_STEPS.length - 1) {
    btnTourNext.innerHTML = `¡Entendido! <i class="ph-bold ph-check"></i>`;
  } else {
    btnTourNext.innerHTML = `Siguiente <i class="ph-bold ph-arrow-right"></i>`;
  }

  // Posicionar cuadro del tour cerca del elemento resaltado
  if (step.targetId) {
    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      targetEl.classList.add("tour-highlighted-target");
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const rect = targetEl.getBoundingClientRect();
      const isMobile = window.innerWidth <= 900;

      if (!isMobile) {
        // En escritorio: ubicar al lado o debajo según espacio
        if (rect.right + 440 < window.innerWidth) {
          tourBox.style.top = `${Math.max(20, Math.min(window.innerHeight - 320, rect.top))}px`;
          tourBox.style.left = `${rect.right + 20}px`;
          tourBox.style.transform = 'none';
        } else {
          tourBox.style.top = `${Math.max(20, Math.min(window.innerHeight - 320, rect.bottom + 15))}px`;
          tourBox.style.left = `${Math.max(20, rect.left)}px`;
          tourBox.style.transform = 'none';
        }
      } else {
        // En móvil: centrado en pantalla inferior
        tourBox.style.top = 'auto';
        tourBox.style.bottom = '20px';
        tourBox.style.left = '50%';
        tourBox.style.transform = 'translateX(-50%)';
      }
    }
  } else {
    // Centro de la pantalla para el paso 1
    tourBox.style.top = '50%';
    tourBox.style.left = '50%';
    tourBox.style.transform = 'translate(-50%, -50%)';
    tourBox.style.bottom = 'auto';
  }
}

function nextTourStep() {
  if (currentTourStepIndex < TOUR_STEPS.length - 1) {
    currentTourStepIndex++;
    renderTourStep();
  } else {
    endTour();
  }
}

function prevTourStep() {
  if (currentTourStepIndex > 0) {
    currentTourStepIndex--;
    renderTourStep();
  }
}

function endTour() {
  document.querySelectorAll(".tour-highlighted-target").forEach(el => {
    el.classList.remove("tour-highlighted-target");
  });
  tourBackdrop.classList.add("hidden");
  tourBox.classList.add("hidden");
}

// 10. Eventos de la Aplicación
function setupEvents() {
  btnToggleSidebar.addEventListener("click", () => {
    mainSidebar.classList.add("mobile-open");
    sidebarOverlay.classList.remove("hidden");
  });

  function closeMobileSidebar() {
    mainSidebar.classList.remove("mobile-open");
    sidebarOverlay.classList.add("hidden");
  }

  btnCloseSidebar.addEventListener("click", closeMobileSidebar);
  sidebarOverlay.addEventListener("click", closeMobileSidebar);

  navNotificationBell.addEventListener("click", () => {
    const btnInst = document.querySelector(".folder-btn[data-folder='institucional']");
    if (btnInst) btnInst.click();
  });

  // Eventos de botones del Tour
  btnTourNext.addEventListener("click", nextTourStep);
  btnTourPrev.addEventListener("click", prevTourStep);
  btnTourSkip.addEventListener("click", endTour);
  btnFloatingReplayTour.addEventListener("click", startTour);

  document.querySelectorAll(".teacher-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".teacher-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTeacherFilter = btn.dataset.teacher;
      closeMobileSidebar();
      renderApp();
    });
  });

  document.querySelectorAll(".folder-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const folderKey = btn.dataset.folder;

      if (folderKey === "boveda" && !isBovedaUnlocked) {
        openBovedaAuthModal();
        return;
      }

      activateFolderSelection(btn, folderKey);
      closeMobileSidebar();
    });
  });

  function activateFolderSelection(btn, folderKey) {
    document.querySelectorAll(".folder-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFolderFilter = folderKey;

    if (folderKey === "boveda") {
      bovedaControlsSection.classList.remove("hidden");
    } else {
      bovedaControlsSection.classList.add("hidden");
    }

    renderApp();
  }

  // Bóveda
  function openBovedaAuthModal() {
    bovedaPasswordInput.value = "";
    modalBovedaAuth.classList.add("show");
    bovedaPasswordInput.focus();
  }

  function closeBovedaAuthModal() {
    modalBovedaAuth.classList.remove("show");
  }

  btnCloseBovedaAuth.addEventListener("click", closeBovedaAuthModal);
  btnCancelBovedaAuth.addEventListener("click", closeBovedaAuthModal);
  modalBovedaAuth.addEventListener("click", (e) => {
    if (e.target === modalBovedaAuth) closeBovedaAuthModal();
  });

  bovedaAuthForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (bovedaPasswordInput.value.trim() === BOVEDA_PASSWORD) {
      isBovedaUnlocked = true;
      closeBovedaAuthModal();
      activateFolderSelection(btnBovedaFolder, "boveda");
    } else {
      alert("❌ Clave de seguridad incorrecta. Acceso a la bóveda denegado.");
      bovedaPasswordInput.value = "";
      bovedaPasswordInput.focus();
    }
  });

  bovedaYearFilter.addEventListener("change", (e) => {
    currentBovedaYear = e.target.value;
    renderApp();
  });

  bovedaSubfolderFilter.addEventListener("change", (e) => {
    currentBovedaSubfolder = e.target.value;
    renderApp();
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

  docFolderSelect.addEventListener("change", (e) => {
    handleFolderChangeInModal(e.target.value);
  });

  fileInput.addEventListener("change", handleFileCompressAndSelect);
  btnRemoveFile.addEventListener("click", resetFileInput);
  docForm.addEventListener("submit", handleFormSubmit);

  btnCloseViewModal.addEventListener("click", closeViewModal);
  btnDoneView.addEventListener("click", closeViewModal);
  btnDownloadFromView.addEventListener("click", () => {
    if (currentPreviewDocId) downloadDoc(currentPreviewDocId);
  });
  modalViewDoc.addEventListener("click", (e) => {
    if (e.target === modalViewDoc) closeViewModal();
  });
}

function handleFolderChangeInModal(folderVal) {
  if (folderVal === "boveda") {
    bovedaFormFields.classList.remove("hidden");
    containerIsPublicCheck.classList.add("hidden");
    docIsPublicCheck.checked = false;
    document.getElementById("docGrade").value = "Directivo";
    document.getElementById("docSubject").value = "Directiva";
  } else {
    bovedaFormFields.classList.add("hidden");
    containerIsPublicCheck.classList.remove("hidden");
  }
}

// 11. Compresión y Subida
async function handleFileCompressAndSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > currentUser.maxUploadBytes) {
    if (currentUser.role === "docente" || currentUser.role === "induccion") {
      alert(`⚠️ Archivo demasiado pesado (${formatBytes(file.size)}).\n\nComo docente tu límite por documento es de 15 MB.`);
    } else {
      alert(`⚠️ Archivo excede el límite de 2 GB (${formatBytes(file.size)}).`);
    }
    resetFileInput();
    return;
  }

  dropText.textContent = "Procesando archivo...";

  try {
    const origSize = file.size;

    if (origSize <= 120 * 1024 * 1024) {
      dropText.textContent = "Comprimiendo archivo al máximo...";
      
      const zip = new JSZip();
      zip.file(file.name, file, {
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const compSize = zipBlob.size;
      const savingsPercent = Math.max(0, Math.round(((origSize - compSize) / origSize) * 100));

      processedUploadData = {
        blobToStore: zipBlob,
        originalName: file.name,
        rawBytes: origSize,
        fileSize: formatBytes(origSize),
        compressedSize: formatBytes(compSize),
        ratio: `${savingsPercent}%`,
        isCompressed: true,
        mimeType: file.type || "application/octet-stream"
      };

      selectedFileName.textContent = `${file.name}`;
      compressionStats.textContent = `Optimizado: ${processedUploadData.fileSize} ➔ ${processedUploadData.compressedSize} (Ahorro del ${processedUploadData.ratio})`;
    } else {
      processedUploadData = {
        blobToStore: file,
        originalName: file.name,
        rawBytes: origSize,
        fileSize: formatBytes(origSize),
        compressedSize: formatBytes(origSize),
        ratio: null,
        isCompressed: false,
        mimeType: file.type || "application/octet-stream"
      };

      selectedFileName.textContent = `${file.name}`;
      compressionStats.textContent = `Archivo masivo verificado: ${processedUploadData.fileSize} (Almacenamiento directo)`;
    }

    fileSelectedBadge.classList.remove("hidden");
    dropText.textContent = "¡Archivo validado y listo!";

  } catch (error) {
    console.error("Error procesando archivo:", error);
    alert("Hubo un problema al procesar el archivo.");
    resetFileInput();
  }
}

function resetFileInput() {
  fileInput.value = "";
  processedUploadData = null;
  fileSelectedBadge.classList.add("hidden");
  dropText.textContent = "Clic o arrastra el archivo aquí";
}

// 12. Modal Crear y Editar
function openModalForCreate() {
  editDocId.value = "";
  modalTitle.textContent = "Subir Documento";
  docForm.reset();
  resetFileInput();

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  if (isPrivileged) {
    docTeacherSelect.disabled = false;
    docTeacherSelect.value = currentUser.name === "Claudia (Rectora)" ? "Claudia (Rectora)" : "Administrador";
    
    if (currentFolderFilter === "boveda") {
      docFolderSelect.value = "boveda";
      handleFolderChangeInModal("boveda");
    } else {
      docFolderSelect.value = "institucional";
      handleFolderChangeInModal("institucional");
    }
  } else {
    docTeacherSelect.value = currentUser.role === "induccion" ? "Jessica" : currentUser.name;
    docTeacherSelect.disabled = true;
    docFolderSelect.value = "planeaciones";
    handleFolderChangeInModal("planeaciones");
  }

  modalDoc.classList.add("show");
}

window.editDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  const teacherName = currentUser.role === "induccion" ? "Jessica" : currentUser.name;

  if (!isPrivileged && doc.teacher !== teacherName) {
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
  docFolderSelect.value = doc.folder;
  handleFolderChangeInModal(doc.folder);

  if (doc.folder === "boveda") {
    docBovedaYear.value = doc.bovedaYear || "2026";
    docBovedaSubfolder.value = doc.bovedaSubfolder || "consejo";
  }

  document.getElementById("docPeriod").value = doc.period;
  document.getElementById("docNotes").value = doc.notes || "";
  docIsPublicCheck.checked = Boolean(doc.isPublic);

  processedUploadData = null;
  selectedFileName.textContent = `${doc.fileName}`;
  compressionStats.textContent = `Tamaño registrado: ${doc.compressedSize || doc.fileSize}`;
  fileSelectedBadge.classList.remove("hidden");
  dropText.textContent = "Archivo conservado (clic para cambiarlo)";

  modalDoc.classList.add("show");
};

function closeModal() {
  modalDoc.classList.remove("show");
  docForm.reset();
  resetFileInput();
}

// 13. Guardar en Base de Datos
async function handleFormSubmit(e) {
  e.preventDefault();

  const isEditing = Boolean(editDocId.value);
  const selectedFolder = docFolderSelect.value;

  const now = new Date();
  const formattedDateTime = now.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  let assignedTeacher = docTeacherSelect.value;
  if (currentUser.role === "induccion") {
    assignedTeacher = "Jessica (Demostración)";
  } else if (currentUser.role === "docente") {
    assignedTeacher = currentUser.name;
  }

  const docData = {
    title: document.getElementById("docTitle").value.trim(),
    teacher: assignedTeacher,
    grade: document.getElementById("docGrade").value,
    subject: document.getElementById("docSubject").value,
    folder: selectedFolder,
    period: document.getElementById("docPeriod").value,
    isPublic: selectedFolder === "boveda" ? false : docIsPublicCheck.checked,
    notes: document.getElementById("docNotes").value.trim() || "Sin observaciones adicionales."
  };

  if (selectedFolder === "boveda") {
    docData.bovedaYear = docBovedaYear.value;
    docData.bovedaSubfolder = docBovedaSubfolder.value;
  }

  if (isEditing) {
    const docIndex = documents.findIndex(d => d.id === editDocId.value);
    if (docIndex !== -1) {
      documents[docIndex] = { ...documents[docIndex], ...docData };
      if (processedUploadData) {
        documents[docIndex].fileName = processedUploadData.originalName;
        documents[docIndex].fileSize = processedUploadData.fileSize;
        documents[docIndex].compressedSize = processedUploadData.compressedSize;
        documents[docIndex].ratio = processedUploadData.ratio;
        documents[docIndex].rawBytes = processedUploadData.rawBytes;
        documents[docIndex].isCompressed = processedUploadData.isCompressed;

        await saveFileToDB(
          documents[docIndex].id,
          processedUploadData.blobToStore,
          processedUploadData.originalName,
          processedUploadData.mimeType,
          processedUploadData.isCompressed
        );
      }
    }
  } else {
    if (!processedUploadData) {
      alert("Por favor selecciona un archivo para subir.");
      return;
    }

    const prefix = selectedFolder === "boveda" ? "MG-BOV-" : "MG-PRI-";
    const newId = prefix + String(documents.length + 1).padStart(3, '0');
    
    const newDoc = {
      id: newId,
      ...docData,
      fileName: processedUploadData.originalName,
      fileSize: processedUploadData.fileSize,
      compressedSize: processedUploadData.compressedSize,
      rawBytes: processedUploadData.rawBytes,
      ratio: processedUploadData.ratio,
      isCompressed: processedUploadData.isCompressed,
      uploadedAt: formattedDateTime
    };

    await saveFileToDB(
      newId,
      processedUploadData.blobToStore,
      processedUploadData.originalName,
      processedUploadData.mimeType,
      processedUploadData.isCompressed
    );

    documents.unshift(newDoc);
  }

  saveDocuments();
  updateStorageMeter();
  closeModal();
  alert(`✅ Documento "${docData.title}" guardado con éxito.`);
}

// 14. Eliminar Registro
window.deleteDoc = async function(id) {
  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";
  if (!isPrivileged) {
    alert("Acción restringida: Como docente no puedes eliminar registros. Solo Rectoría o el Administrador.");
    return;
  }

  if (confirm(`¿Confirmas la eliminación del documento con ID ${id}?`)) {
    documents = documents.filter(d => d.id !== id);
    await deleteFileFromDB(id);
    saveDocuments();
    updateStorageMeter();
  }
};

// 15. Modal Ver Documento
window.viewDoc = function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  currentPreviewDocId = id;
  markAsRead(id);

  viewDocTitle.textContent = doc.title;
  viewDocMetaSubtitle.textContent = `Registrado por: ${doc.teacher} • ${doc.uploadedAt || 'Reciente'}`;

  const extraBovedaMeta = doc.folder === "boveda" 
    ? `<div style="margin-top:6px; font-size:0.8rem; color:#0f172a; font-weight:700;">
         Año: ${doc.bovedaYear || '2026'} • Subcarpeta: ${formatBovedaSubfolder(doc.bovedaSubfolder)}
       </div>`
    : '';

  viewDocBody.innerHTML = `
    <div class="view-document-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span class="${getFolderPastelClass(doc.folder)}">${formatFolder(doc.folder)}</span>
        <span class="tag-pastel-grade">${doc.grade} • ${doc.subject}</span>
        <code>${doc.id}</code>
      </div>
      
      ${extraBovedaMeta}

      <div style="margin-top:12px; font-size:0.8rem; color:#475569;">
        <strong>Archivo Adjunto:</strong> <i class="${getFileIconClass(doc.fileName)}"></i> ${escapeHTML(doc.fileName)} (${doc.compressedSize || doc.fileSize})
      </div>

      <div class="view-document-text">
        <strong>Descripción y Contenido Oficial:</strong>\n\n${escapeHTML(doc.notes || 'Documento sin notas adicionales. Utiliza el botón de descarga para abrir el archivo completo.')}
      </div>
    </div>
  `;

  modalViewDoc.classList.add("show");
  renderApp();
};

function closeViewModal() {
  modalViewDoc.classList.remove("show");
  currentPreviewDocId = null;
  renderApp();
}

function markAsRead(docId) {
  if (!currentUser) return;
  const userKey = currentUser.name;
  if (!readReceipts[userKey]) {
    readReceipts[userKey] = [];
  }
  if (!readReceipts[userKey].includes(docId)) {
    readReceipts[userKey].push(docId);
    saveReadReceipts();
  }
}

function isDocUnread(doc) {
  if (!currentUser || currentUser.role === "rectora" || currentUser.role === "admin") {
    return false;
  }
  const isTarget = doc.folder === "institucional" || doc.isPublic;
  const teacherRef = currentUser.role === "induccion" ? "Jessica" : currentUser.name;
  const isNotMine = doc.teacher !== teacherRef;
  if (isTarget && isNotMine) {
    const userReads = readReceipts[currentUser.name] || [];
    return !userReads.includes(doc.id);
  }
  return false;
}

// 16. Descarga de Archivos
window.downloadDoc = async function(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;

  markAsRead(id);
  renderApp();

  try {
    const record = await getFileFromDB(id);

    if (record && record.blobData) {
      if (record.isCompressed) {
        const zip = await JSZip.loadAsync(record.blobData);
        const zipFile = zip.file(record.originalName);

        if (zipFile) {
          const uncompressedBlob = await zipFile.async("blob");
          const url = URL.createObjectURL(uncompressedBlob);
          triggerDownload(url, record.originalName);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          return;
        }
      } else {
        const url = URL.createObjectURL(record.blobData);
        triggerDownload(url, record.originalName);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return;
      }
    }

    alert(`Nota: "${doc.fileName}" es un registro inicial de demostración.\n\nSube un archivo real y al hacer clic en este botón se descargará exactamente el archivo que subiste.`);

  } catch (error) {
    console.error("Error recuperando el archivo:", error);
    alert("Hubo un error al recuperar el archivo original.");
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

// 17. Filtrado
function getFilteredDocuments() {
  if (!currentUser) return [];

  const isPrivileged = currentUser.role === "admin" || currentUser.role === "rectora";

  return documents.filter(doc => {
    if (doc.folder === "boveda" && !isPrivileged) {
      return false;
    }

    if (!isPrivileged) {
      const teacherMatch = currentUser.role === "induccion" ? (doc.teacher === "Jessica" || doc.teacher.includes("Jessica")) : (doc.teacher === currentUser.name);
      const isShared = Boolean(doc.isPublic) || doc.folder === "institucional";
      if (!teacherMatch && !isShared) return false;
    }

    if (isPrivileged && currentTeacherFilter !== "all") {
      if (doc.teacher !== currentTeacherFilter) return false;
    }

    if (currentFolderFilter === "boveda") {
      if (doc.folder !== "boveda") return false;
      if (currentBovedaYear !== "all" && doc.bovedaYear !== currentBovedaYear) return false;
      if (currentBovedaSubfolder !== "all" && doc.bovedaSubfolder !== currentBovedaSubfolder) return false;
    } else if (currentFolderFilter === "publico") {
      if (!doc.isPublic) return false;
    } else if (currentFolderFilter !== "all") {
      if (doc.folder !== currentFolderFilter) return false;
    } else {
      if (doc.folder === "boveda" && currentFolderFilter === "all") {
        return false;
      }
    }

    if (currentFolderFilter !== "boveda") {
      if (currentGradeFilter && doc.grade !== currentGradeFilter) return false;
      if (currentSubjectFilter && doc.subject !== currentSubjectFilter) return false;
    }

    if (currentSearch) {
      const q = currentSearch;
      const match = 
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.teacher && doc.teacher.toLowerCase().includes(q)) ||
        (doc.subject && doc.subject.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        (doc.id && doc.id.toLowerCase().includes(q)) ||
        (doc.bovedaYear && doc.bovedaYear.toLowerCase().includes(q)) ||
        (doc.uploadedAt && doc.uploadedAt.toLowerCase().includes(q)) ||
        (doc.notes && doc.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

// 18. Renderizado
function renderApp() {
  updateCounts();
  updateBreadcrumb();
  updateStorageMeter();
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
    const teacherRef = currentUser.role === "induccion" ? "Jessica" : currentUser.name;
    const canEdit = isPrivileged || doc.teacher === teacherRef;
    const fileIcon = getFileIconClass(doc.fileName);
    const folderPastelClass = getFolderPastelClass(doc.folder);
    const unread = isDocUnread(doc);

    const bovedaSubfolderTag = doc.folder === "boveda"
      ? `<span class="tag-pastel-grade">${doc.bovedaYear || '2026'} • ${formatBovedaSubfolder(doc.bovedaSubfolder)}</span>`
      : `<span class="tag-pastel-grade">${doc.grade}</span>`;

    return `
      <article class="doc-card ${unread ? 'card-unread' : ''}">
        <div class="doc-card-header">
          <div class="badges-group">
            <span class="${folderPastelClass}">${formatFolder(doc.folder)}</span>
            ${bovedaSubfolderTag}
            ${doc.isPublic ? '<span class="tag-pastel-public"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
            ${unread ? '<span class="tag-unread-dot"><i class="ph-fill ph-circle"></i> Nuevo</span>' : ''}
          </div>
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
            <span><strong>Docente / Cargo:</strong> ${escapeHTML(doc.teacher)}</span>
          </div>
          <div class="doc-meta-item">
            <i class="ph-bold ph-folder-notch"></i>
            <span><strong>Sección:</strong> ${doc.folder === 'boveda' ? formatBovedaSubfolder(doc.bovedaSubfolder) : escapeHTML(doc.subject) + ' • ' + doc.period}</span>
          </div>
          
          <div class="file-attachment-badge">
            <div class="file-attachment-badge-left">
              <i class="${fileIcon}"></i>
              <span>${escapeHTML(doc.fileName)}</span>
            </div>
            ${doc.ratio ? `<span class="savings-pill"><i class="ph-bold ph-file-zip"></i> -${doc.ratio}</span>` : `<span class="savings-pill">${doc.fileSize}</span>`}
          </div>

          ${doc.notes ? `
            <div class="doc-meta-item" style="margin-top: 4px; font-style: italic;">
              <i class="ph-bold ph-note"></i>
              <span>${escapeHTML(doc.notes)}</span>
            </div>
          ` : ''}
        </div>

        <div class="doc-card-footer">
          <div class="main-actions-group">
            <button onclick="viewDoc('${doc.id}')" class="btn-view-action" title="Ver documento">
              <i class="ph-bold ph-eye"></i> Ver
            </button>
            <button onclick="downloadDoc('${doc.id}')" class="btn-download-action" title="Descargar archivo original">
              <i class="ph-bold ph-download-simple"></i> Descargar
            </button>
          </div>
          
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
    const teacherRef = currentUser.role === "induccion" ? "Jessica" : currentUser.name;
    const canEdit = isPrivileged || doc.teacher === teacherRef;
    const fileIcon = getFileIconClass(doc.fileName);
    const folderPastelClass = getFolderPastelClass(doc.folder);
    const unread = isDocUnread(doc);

    return `
      <tr>
        <td><code>${doc.id}</code></td>
        <td>
          <strong>${escapeHTML(doc.title)}</strong>
          ${unread ? ' <span class="tag-unread-dot">Nuevo</span>' : ''}
          ${doc.isPublic ? ' <span class="tag-pastel-public"><i class="ph-bold ph-globe"></i> Público</span>' : ''}
        </td>
        <td><i class="ph ph-user"></i> ${escapeHTML(doc.teacher)}</td>
        <td><span class="tag-pastel-grade">${doc.folder === 'boveda' ? (doc.bovedaYear || '2026') : doc.grade}</span></td>
        <td>${doc.folder === 'boveda' ? formatBovedaSubfolder(doc.bovedaSubfolder) : escapeHTML(doc.subject)}</td>
        <td><span class="${folderPastelClass}">${formatFolder(doc.folder)}</span></td>
        <td><small><i class="ph-bold ph-clock"></i> ${doc.uploadedAt || "Reciente"}</small></td>
        <td>
          <small><i class="${fileIcon}"></i> ${doc.compressedSize || doc.fileSize}</small>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="viewDoc('${doc.id}')" title="Ver documento">
              <i class="ph-bold ph-eye"></i>
            </button>
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
    institucional: "Institucional & Circulares",
    planeaciones: "Planeaciones",
    calificaciones: "Planillas de Notas",
    talleres: "Guías & Talleres",
    observador: "Observador & Actas",
    boveda: "🔒 Bóveda de Archivos Confidencial"
  };

  currentPathText.textContent = `${teacherText} • ${folderMap[currentFolderFilter] || currentFolderFilter}`;
}

// 19. Contadores
function updateCounts() {
  const isPrivileged = currentUser && (currentUser.role === "admin" || currentUser.role === "rectora");

  const visibleDocs = isPrivileged 
    ? documents 
    : documents.filter(d => (d.teacher === currentUser.name || d.teacher === "Jessica" || d.isPublic || d.folder === "institucional") && d.folder !== "boveda");

  document.getElementById("count-all-teachers").textContent = visibleDocs.filter(d => d.folder !== "boveda").length;
  document.getElementById("count-jessica").textContent = documents.filter(d => d.teacher.includes("Jessica")).length;
  document.getElementById("count-yuri").textContent = documents.filter(d => d.teacher === "Yuri").length;
  document.getElementById("count-elcy").textContent = documents.filter(d => d.teacher === "Elcy").length;
  document.getElementById("count-claudia").textContent = documents.filter(d => d.teacher === "Claudia (Rectora)").length;
  document.getElementById("count-public").textContent = documents.filter(d => d.isPublic && d.folder !== "boveda").length;

  let unreadCount = 0;
  visibleDocs.forEach(d => {
    if (isDocUnread(d)) unreadCount++;
  });

  if (unreadCount > 0) {
    bellBadge.textContent = unreadCount;
    bellBadge.classList.remove("hidden");
    sidebarInstitucionalBadge.textContent = unreadCount;
    sidebarInstitucionalBadge.classList.remove("hidden");
  } else {
    bellBadge.classList.add("hidden");
    sidebarInstitucionalBadge.classList.add("hidden");
  }
}

// Auxiliares
function getFolderPastelClass(folderKey) {
  const map = {
    boveda: "tag-pastel-boveda",
    institucional: "tag-pastel-institucional",
    planeaciones: "tag-pastel-planeaciones",
    calificaciones: "tag-pastel-calificaciones",
    talleres: "tag-pastel-talleres",
    observador: "tag-pastel-observador"
  };
  return map[folderKey] || "tag-pastel-institucional";
}

function formatFolder(key) {
  const map = {
    boveda: "Bóveda Directiva",
    institucional: "Institucional & Circulares",
    planeaciones: "Planeaciones",
    calificaciones: "Planillas de Notas",
    talleres: "Guías & Talleres",
    observador: "Observador & Actas"
  };
  return map[key] || key;
}

function formatBovedaSubfolder(key) {
  const map = {
    consejo: "Consejo Directivo",
    financiero: "Financiero & Contable",
    legal: "Resoluciones & Legal",
    contratos: "Nómina & Contratos",
    pei_soporte: "Soportes PEI & Licencias"
  };
  return map[key] || "Archivo General";
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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Iniciar aplicación
initAuth();
setupEvents();
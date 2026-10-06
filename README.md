#  Sistema de Gestión Documental & Base de Datos Escolar
### Gimnasio Martin Galeano

Prototipo interactivo diseñado como primer acercamiento a la estructuración, normalización y centralización de la información académica e institucional del **Gimnasio Martin Galeano**.

---

##  Objetivo del Proyecto

Brindar al cuerpo docente y administrativo una herramienta ágil, visual e intuitiva que permita organizar, registrar y consultar la documentación escolar clave (mallas curriculares, planeaciones didácticas, planillas de seguimiento y actas de convivencia), estableciendo las bases para una futura integración con motores de bases de datos relacionales o en la nube (como PostgreSQL o Supabase).

---

## Características Principales

* **Estructura por Rutas de Almacenamiento:** Navegación por carpetas temáticas:
  * `/root/Planeaciones_Mallas`
  * `/root/Planillas_Boletines`
  * `/root/Observador_Actas`
  * `/root/Institucional_PEI`
* **Persistencia Local (LocalStorage):** Los registros agregados se conservan en el navegador sin perderse al recargar la página.
* **Doble Vista de Visualización:**
  * **Vista Cuadrícula (Cards):** Presentación visual moderna y resumida para consulta rápida docente.
  * **Vista Base de Datos (Tabla):** Formato tabular con campos normalizados (`ID`, `Título`, `Ruta`, `Grado`, `Periodo`, `Docente Responsable`).
* **Búsqueda y Filtros en Tiempo Real:** Filtrado dinámico por texto libre (código, docente, palabras clave) y por nivel educativo (Preescolar, Primaria, Secundaria, Media).
* **Diseño Responsivo & Moderno:** Interfaz limpia inspirada en herramientas de gestión documental profesional.

---

## 📁 Estructura del Repositorio

```text
DB_Gimnasio_Martin_Galeano/
│
├── index.html       # Estructura semántica, accesibilidad y modales
├── styles.css       # Variables CSS, diseño de cuadrícula y tabla interactiva
├── app.js           # Lógica del CRUD, filtrado dinámico y persistencia local
└── README.md        # Documentación general del proyecto
```


## Tecnologías Empleadas
### HTML5: Marcado semántico y accesible.

CSS3 Moderno: Flexbox, CSS Grid, variables personalizadas y diseño adaptativo.

JavaScript (Vanilla ES6+): Manipulación del DOM, arquitectura basada en eventos y almacenamiento en localStorage.

Phosphor Icons: Iconografía limpia y consistente.

## Modelo de Datos (Esquema del Registro)
Cada documento dentro del sistema maneja la siguiente estructura:

JSON
{
  "id": "DOC-MG-001",
  "title": "Planeación Curricular Integrada de Ciencias y Tecnología",
  "folder": "planeaciones",
  "grade": "Primaria",
  "period": "1° Periodo",
  "author": "Docente Responsable",
  "url": "[https://enlace-al-documento.com](https://enlace-al-documento.com)",
  "notes": "Observaciones pedagógicas y alcance del estándar."
}
## Instrucciones de Uso Local
### Clona este repositorio o descarga los archivos en tu equipo:

Bash
git clone git@github.com:Frixix/Primer-acercamiento-a-la-bd-Gimnasio-Martin-Galeano-.git
Entra a la carpeta del proyecto:

Bash
cd Primer-acercamiento-a-la-bd-Gimnasio-Martin-Galeano-
Abre el archivo index.html en cualquier navegador web (Chrome, Edge, Firefox).

## Próximos Pasos (Fase 2)
[ ] Vinculación con autenticación por roles (Docente / Coordinación / Rectoría).

[ ] Conexión a base de datos externa para almacenamiento multiusuario en tiempo real.

[ ] Módulo de carga directa de archivos PDF/Word en la nube.


---
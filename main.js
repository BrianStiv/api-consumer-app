/* ============================================
   CONSTANTS I CONFIGURACIÓ
   Definim les constants globals i la configuració inicial
   ============================================ */

// URL base de l'API JSONPlaceholder per obtenir posts
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// Pàgina actual (comença a la 1)
let currentPage = 1;

// Quants ítems (posts) volem mostrar per pàgina
const itemsPerPage = 10;

// Controlador per cancel·lar peticions (permeter interrompre peticions en curs)
let abortController = null;


/* ============================================
   REFERÈNCIES ALS ELEMENTS DEL DOM
   Obtenim les referències als elements HTML per poder manipular-los amb JavaScript
   ============================================ */

// Selector per triar entre Fetch o Axios
const apiSelector = document.getElementById('apiSelector');

// Camp d'entrada per cercar per paraula clau
const searchInput = document.getElementById('searchInput');

// Botó per iniciar la cerca
const fetchButton = document.getElementById('fetchButton');

// Element per mostrar l'estat de càrrega
const loadingElement = document.getElementById('loading');

// Element per mostrar missatges d'error
const errorElement = document.getElementById('error');

// Contenidor on es mostraran les targetes amb les dades
const resultsContainer = document.getElementById('results');

// Contenidor per als botons de paginació
const paginationContainer = document.getElementById('pagination');


/* ============================================
   EVENT LISTENERS
   Definim els esdeveniments que respondran a les accions de l'usuari
   ============================================ */

// Quan l'usuari fa clic al botó "Obtenir Dades", cridem a la funció fetchData
fetchButton.addEventListener('click', fetchData);

// Quan l'usuari prem la tecla "Enter" al camp de cerca, també cridem a fetchData
searchInput.addEventListener('keypress', (event) => {
    // event.key === 'Enter' comprova si la tecla premuda és "Enter"
    if (event.key === 'Enter') {
        fetchData();
    }
});


/* ============================================
   FUNCIONS DE GESTIÓ DE L'ESTAT DE CÀRREGA
   Funcions per mostrar/amagar l'indicador de càrrega
   ============================================ */

/**
 * Funció per mostrar l'indicador de càrrega
 * Elimina la classe 'hidden' de loadingElement per fer-lo visible
 */
function showLoading() {
    // Traiem la classe 'hidden' per mostrar l'spinner
    loadingElement.classList.remove('hidden');
}

/**
 * Funció per amagar l'indicador de càrrega
 * Afegeix la classe 'hidden' a loadingElement per fer-lo invisible
 */
function hideLoading() {
    // Posem la classe 'hidden' per amagar l'spinner
    loadingElement.classList.add('hidden');
}


/* ============================================
   FUNCIONS DE GESTIÓ D'ERRORS
   Funcions per mostrar/amagar missatges d'error
   ============================================ */

/**
 * Funció per mostrar un missatge d'error
 * @param {string} message - El missatge d'error a mostrar
 */
function showError(message) {
    // Actualitzem el text de l'element d'error amb el missatge rebut
    errorElement.textContent = message;
    
    // Traiem la classe 'hidden' per fer visible el missatge d'error
    errorElement.classList.remove('hidden');
}

/**
 * Funció per amagar el missatge d'error
 * Afegeix la classe 'hidden' a errorElement per fer-lo invisible
 */
function hideError() {
    // Posem la classe 'hidden' per amagar el missatge d'error
    errorElement.classList.add('hidden');
}


/* ============================================
   FUNCIÓ PRINCIPAL: OBTENIR DADES
   Coordina tot el procés d'obtenció de dades
   ============================================ */

/**
 * Funció principal per obtenir dades de l'API
 * Gestiona el flux complet: controls, crida a l'API, i maneig d'estats
 */
async function fetchData() {
    // Obtenim el terme de cerca de l'input
    const searchTerm = searchInput.value.trim();
    
    // Comprovem si l'usuari ha seleccionat Axios o Fetch
    // El valor del selector és 'axios' o 'fetch'
    const useAxios = apiSelector.value === 'axios';
    
    // Si hi ha una petició en curs, la cancel·lem
    if (abortController) {
        abortController.abort();
    }
    // Creem un nou controlador per a la nova petició
    abortController = new AbortController();
    
    // Mostrem l'indicador de càrrega
    showLoading();
    
    // Amaguem qualsevol missatge d'error anterior
    hideError();
    
    // Netegem els resultats anteriors i la paginació
    resultsContainer.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    try {
        // Segons el mètode seleccionat, cridem a la funció corresponent
        if (useAxios) {
            // Si és Axios, utilitzem la funció específica per Axios
            await fetchDataWithAxios(searchTerm, abortController.signal);
        } else {
            // Si és Fetch, utilitzem la funció específica per Fetch
            await fetchDataWithFetch(searchTerm, abortController.signal);
        }
    } catch (error) {
        // Si hi ha un error inesperat (que no hem capturat dins de les funcions),
        // el mostrem a l'usuari
        // Comprovem si l'error és per cancel·lació o un error real
        if (error.name !== 'AbortError') {
            showError('Error inesperat: ' + error.message);
        }
    } finally {
        // Sempre amaguem l'indicador de càrrega, tant si ha anat bé com si no
        hideLoading();
        
        // Resetejem el controlador per a futures peticions
        abortController = null;
    }
}


/* ============================================
   FUNCIÓ: OBTENIR DADES AMB FETCH API
   Implementació utilitzant la API nativa del navegador
   ============================================ */

/**
 * Funció per obtenir dades utilitzant Fetch API
 * @param {string} searchTerm - Terme de cerca per filtrar els posts
 * @param {AbortSignal} signal - Senyal per poder cancel·lar la petició
 */
async function fetchDataWithFetch(searchTerm, signal) {
    // Constructorem l'URL amb els paràmetres de consulta (query string)
    // _page: número de pàgina actual
    // _limit: nombre d'items per pàgina
    // q: terme de cerca per filtrar (si n'hi ha)
    let url = `${API_URL}?_page=${currentPage}&_limit=${itemsPerPage}`;
    if (searchTerm) {
        url += `&q=${encodeURIComponent(searchTerm)}`;
    }
    
    // Fem la petició GET utilitzant fetch
    // Incloem el signal per permetre la cancel·lació
    const response = await fetch(url, { signal });
    
    // Comprovem si la resposta és correcta (estat HTTP 200-299)
    if (!response.ok) {
        // Si no és correcta, llancem un error amb el codi d'estat
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    // Obtenim el total d'ítems de l'encapçalament X-Total-Count
    // JSONPlaceholder inclou aquest encapçalament amb el nombre total de posts
    const totalItems = response.headers.get('x-total-count');
    
    // Convertim la resposta a JSON
    const data = await response.json();
    
    // Passem les dades i el total a la funció per mostrar els resultats
    displayResults(data, parseInt(totalItems));
}


/* ============================================
   FUNCIÓ: OBTENIR DADES AMB AXIOS
   Implementació utilitzant la llibreria Axios
   ============================================ */

/**
 * Funció per obtenir dades utilitzant Axios
 * @param {string} searchTerm - Terme de cerca per filtrar els posts
 * @param {AbortSignal} signal - Senyal per poder cancel·lar la petició
 */
async function fetchDataWithAxios(searchTerm, signal) {
    // Constructorem l'objecte de paràmetres per a Axios
    // Axios facilita afegir paràmetres de query mitjançant l'objecte params
    const params = {
        _page: currentPage,      // Pàgina actual
        _limit: itemsPerPage     // Items per pàgina
    };
    
    // Si hi ha un terme de cerca, l'afegim als paràmetres
    if (searchTerm) {
        params.q = searchTerm;
    }
    
    try {
        // Fem la petició GET amb Axios
        // Axios retorna un objecte amb la propietat 'data' que conté la resposta
        const response = await axios.get(API_URL, {
            params: params,          // Paràmetres de consulta
            signal: signal           // Senyal per cancel·lació
        });
        
        // Obtenim el total d'ítems de l'encapçalament X-Total-Count
        // A Axios, els encapçalaments estan a response.headers
        const totalItems = response.headers['x-total-count'];
        
        // Passem les dades (response.data) i el total a la funció per mostrar resultats
        displayResults(response.data, parseInt(totalItems));
        
    } catch (error) {
        // Capturem errors d'Axios
        // error.response existeix si el servidor ha respost amb un estat d'error (4xx, 5xx)
        // error.message existeix si hi ha hagut un error de xarxa
        if (error.response) {
            // Error del servidor (p.ex. 404, 500)
            throw new Error(`Error HTTP: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            // Error de xarxa (no s'ha rebut resposta)
            throw new Error('Error de xarxa: No s\'ha pogut connectar amb el servidor');
        } else {
            // Altres errors
            throw new Error(error.message);
        }
    }
}


/* ============================================
   FUNCIÓ: MOSTRAR RESULTATS
   Crea les targetes amb les dades obtingudes
   ============================================ */

/**
 * Funció per mostrar els resultats a la pàgina
 * @param {Array} items - Array de posts a mostrar
 * @param {number} totalItems - Total d'items disponibles (per a la paginació)
 */
function displayResults(items, totalItems) {
    // Netegem el contenidor de resultats abans d'afegir nous elements
    // Això garanteix que no se superposin resultats nous amb els anteriors
    resultsContainer.innerHTML = '';
    
    // Comprovem si hem rebut algún resultat
    if (items.length === 0) {
        // Si no hi ha resultats, mostrem un missatge informatiu
        resultsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No s\'han trobat resultats</p>';
        return; // Sortim de la funció sense crear paginació
    }
    
    // Recorrem cada item de l'array i creem una targeta per cadascun
    items.forEach(item => {
        // Creem un element div per a la targeta
        const card = document.createElement('div');
        
        // Afegim la classe 'card' per aplicar els estils CSS
        card.className = 'card';
        
        // Afegim el contingut HTML a la targeta
        // Mostrem: ID del post, Títol, i Cos del post
        card.innerHTML = `
            <span class="post-id">#${item.id}</span>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
        `;
        
        // Afegim la targeta al contenidor de resultats
        resultsContainer.appendChild(card);
    });
    
    // Un cop mostrats tots els resultats, generem la paginació
    // Passem el nombre total d'items per calcular quantes pàgines necessitem
    setupPagination(totalItems);
}


/* ============================================
   FUNCIÓ: CONFIGURAR PAGINACIÓ
   Crea els botons de navegació entre pàgines
   ============================================ */

/**
 * Funció per generar els botons de paginació
 * @param {number} totalItems - Total d'items per calcular el nombre de pàgines
 */
function setupPagination(totalItems) {
    // Netegem el contenidor de paginació abans d'afegir nous botons
    paginationContainer.innerHTML = '';
    
    // Calculem el nombre total de pàgines
    // Dividim el total d'items entre els items per pàgina
    // Math.ceil() arrodoneix cap amunt per asegurar que totes les pàgines es mostren
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Comprovem si només hi ha una pàgina
    // Si només hi ha una pàgina, no cal mostrar botons de paginació
    if (totalPages <= 1) {
        return;
    }
    
    // Creem un bucle per generar un botó per cada pàgina
    // Comencem des de 1 (no 0) perquè les pàgines comencen des de 1
    for (let page = 1; page <= totalPages; page++) {
        // Creem un element button per a cada pàgina
        const button = document.createElement('button');
        
        // Posem el número de pàgina com a text del botó
        button.textContent = page;
        
        // Si aquesta pàgina és la pàgina actual, la marquem com activa
        if (page === currentPage) {
            button.classList.add('active');
        }
        
        // Afegim un event listener per quan l'usuari faci clic
        button.addEventListener('click', () => {
            // Actualitzem la variable global currentPage amb el número de pàgina clicada
            currentPage = page;
            
            // Tornem a cridar fetchData per carregar les dades de la nova pàgina
            fetchData();
        });
        
        // Afegim el botó al contenidor de paginació
        paginationContainer.appendChild(button);
    }
}

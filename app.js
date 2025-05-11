// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                checkStandaloneMode();
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// DOM Elements and Variables
const elements = {
    taskInput: document.getElementById('taskInput'),
    prioritySelect: document.getElementById('prioritySelect'),
    dueDateInput: document.getElementById('dueDateInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    totalTasksEl: document.getElementById('totalTasks'),
    completedTasksEl: document.getElementById('completedTasks'),
    pendingTasksEl: document.getElementById('pendingTasks'),
    currentDateEl: document.getElementById('currentDate'),
    editModal: document.getElementById('editModal'),
    editTaskInput: document.getElementById('editTaskInput'),
    editPrioritySelect: document.getElementById('editPrioritySelect'),
    editDueDateInput: document.getElementById('editDueDateInput'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    closeBtn: document.querySelector('.close-btn'),
    toast: document.getElementById('toast'),
    installBtn: document.getElementById('installBtn')
};

let state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    currentFilter: 'all',
    currentEditId: null,
    deferredPrompt: null,
    isStandalone: false
};

// Initialize the app
function init() {
    displayCurrentDate();
    renderTasks();
    setupEventListeners();
    updateStats();
    checkEmptyState();
    
    // Set default due date to today
    const today = new Date().toISOString().split('T')[0];
    elements.dueDateInput.value = today;
    elements.editDueDateInput.value = today;
}

// Standalone Mode Detection
function checkStandaloneMode() {
    state.isStandalone = (
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone ||
        document.referrer.includes('android-app://')
    );
    
    console.log('Standalone mode:', state.isStandalone);
    elements.installBtn.style.display = state.isStandalone ? 'none' : 'none'; // Initially hidden
    
    return state.isStandalone;
}

// ... (keep all your existing functions with these replacements:)
// Replace 'tasks' with 'state.tasks'
// Replace DOM element variables with 'elements.' prefix
// Replace other variables with 'state.' prefix

// Updated PWA Installation Handlers
function setupPWAInstallation() {
    window.addEventListener('beforeinstallprompt', (e) => {
        if (checkStandaloneMode()) {
            console.log('In standalone mode - ignoring install prompt');
            return;
        }
        
        console.log('beforeinstallprompt event fired');
        e.preventDefault();
        state.deferredPrompt = e;
        
        // Only show install button if not in standalone and meets criteria
        if (!state.isStandalone) {
            elements.installBtn.style.display = 'block';
        }
        
        e.userChoice.then(choiceResult => {
            console.log('User choice:', choiceResult.outcome);
            state.deferredPrompt = null;
            elements.installBtn.style.display = 'none';
        });
    });

    elements.installBtn.addEventListener('click', async () => {
        if (!state.deferredPrompt) {
            showToast('Installation available after more interaction', 'info');
            return;
        }
        
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        
        console.log('Installation outcome:', outcome);
        if (outcome === 'accepted') {
            showToast('App installing...', 'success');
        }
        
        state.deferredPrompt = null;
        elements.installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        state.isStandalone = true;
        elements.installBtn.style.display = 'none';
        state.deferredPrompt = null;
    });

    // Periodic check for iOS
    setInterval(checkStandaloneMode, 3000);
}

// Updated setupEventListeners
function setupEventListeners() {
    // Task management listeners (keep your existing ones)
    
    // PWA installation
    setupPWAInstallation();
    
    // Check standalone mode on load
    window.addEventListener('load', checkStandaloneMode);
}

// Initialize the app
init();

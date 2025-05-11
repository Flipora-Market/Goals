// DOM Elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const currentDateEl = document.getElementById('currentDate');
const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const editDueDateInput = document.getElementById('editDueDateInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const closeBtn = document.querySelector('.close-btn');
const toast = document.getElementById('toast');
const installBtn = document.getElementById('installBtn');

// Variables
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentEditId = null;

// Initialize the app
function init() {
    displayCurrentDate();
    renderTasks();
    setupEventListeners();
    updateStats();
    checkEmptyState();
    
    // Set default due date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.value = today;
    editDueDateInput.value = today;
}

// Display current date
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('en-US', options);
}

// Render tasks based on current filter
function renderTasks() {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (currentFilter === 'high') {
        filteredTasks = tasks.filter(task => task.priority === 'high');
    }
    
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    if (task.completed) {
        taskElement.classList.add('task-complete-animation');
    }
    
    const priorityClass = `priority-${task.priority}`;
    
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-priority ${priorityClass}"></span>
        <span class="task-text">${task.text}</span>
        ${task.dueDate ? `<span class="task-due-date">(${formatDate(task.dueDate)})</span>` : ''}
        <div class="task-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    
    taskElement.dataset.id = task.id;
    
    // Add event listeners to buttons
    const checkbox = taskElement.querySelector('.task-checkbox');
    const editBtn = taskElement.querySelector('.edit-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');
    
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    editBtn.addEventListener('click', () => openEditModal(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    // Highlight overdue tasks
    if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
            taskElement.style.borderLeft = '4px solid var(--danger-color)';
        }
    }
    
    return taskElement;
}

// Format date for display
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        text,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    checkEmptyState();
    
    // Reset input
    taskInput.value = '';
    taskInput.focus();
    prioritySelect.value = 'medium';
    
    showToast('Task added successfully!', 'success');
}

// Toggle task completion
function toggleTaskComplete(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
        updateStats();
        
        const message = tasks[taskIndex].completed ? 'Task completed!' : 'Task marked as pending';
        showToast(message, 'success');
    }
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        checkEmptyState();
        showToast('Task deleted successfully!', 'success');
    }
}

// Open edit modal
function openEditModal(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        currentEditId = id;
        editTaskInput.value = task.text;
        editPrioritySelect.value = task.priority;
        editDueDateInput.value = task.dueDate || '';
        editModal.style.display = 'flex';
    }
}

// Save edited task
function saveEditedTask() {
    const text = editTaskInput.value.trim();
    const priority = editPrioritySelect.value;
    const dueDate = editDueDateInput.value;
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    const taskIndex = tasks.findIndex(task => task.id === currentEditId);
    if (taskIndex !== -1) {
        tasks[taskIndex].text = text;
        tasks[taskIndex].priority = priority;
        tasks[taskIndex].dueDate = dueDate;
        saveTasks();
        renderTasks();
        closeEditModal();
        showToast('Task updated successfully!', 'success');
    }
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    currentEditId = null;
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Update statistics
function updateStats() {
    totalTasksEl.textContent = tasks.length;
    const completedCount = tasks.filter(task => task.completed).length;
    completedTasksEl.textContent = completedCount;
    pendingTasksEl.textContent = tasks.length - completedCount;
}

// Check if task list is empty
function checkEmptyState() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Set background color based on type
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'success') {
        toast.style.backgroundColor = 'var(--success-color)';
    } else {
        toast.style.backgroundColor = 'var(--primary-color)';
    }
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Set up event listeners
function setupEventListeners() {
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Filter tasks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Edit modal
    saveEditBtn.addEventListener('click', saveEditedTask);
    cancelEditBtn.addEventListener('click', closeEditModal);
    closeBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
    
    // PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        let deferredPrompt = e;
        
        installBtn.style.display = 'block';
        
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });
    
    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
    });
    
    // Check on page load if the app is running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
    }
}

// Initialize the app
init();
// DOM Elements
const elements = {
    prevDayBtn: document.getElementById('prevDayBtn'),
    nextDayBtn: document.getElementById('nextDayBtn'),
    taskInput: document.getElementById('taskInput'),
    prioritySelect: document.getElementById('prioritySelect'),
    repeatSelect: document.getElementById('repeatSelect'),
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
    editRepeatSelect: document.getElementById('editRepeatSelect'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    closeBtn: document.querySelector('.close-btn'),
    toast: document.getElementById('toast'),
    installBtn: document.getElementById('installBtn')
};

// App State
const state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    currentFilter: 'all',
    currentEditId: null,
    deferredPrompt: null,
    currentViewDate: new Date(), // Tracks currently viewed date
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

// Initialize the app
function init() {
    normalizeTaskDates();
    displayCurrentDate();
    renderTasks();
    setupEventListeners();
    updateStats();
    checkEmptyState();
}

// Ensure all task dates are in proper format
function normalizeTaskDates() {
    state.tasks.forEach(task => {
        if (task.dueDate) {
            task.dueDate = new Date(task.dueDate).toISOString().split('T')[0];
        }
        if (task.originalDueDate) {
            task.originalDueDate = new Date(task.originalDueDate).toISOString().split('T')[0];
        }
    });
    saveTasks();
}

// Display current date with navigation
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDateEl.textContent = state.currentViewDate.toLocaleDateString('en-US', options);
    
    // Disable next day button if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    elements.nextDayBtn.disabled = state.currentViewDate.toDateString() === today.toDateString();
}

// Format date as YYYY-MM-DD
function formatDateYYYYMMDD(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Format date for display (e.g., Nov 20)
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get tasks for specific date
function getTasksForDate(date) {
    const dateStr = formatDateYYYYMMDD(date);
    return state.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDate === dateStr;
    });
}

// Render tasks based on current filter and date
function renderTasks() {
    elements.taskList.innerHTML = '';
    
    let filteredTasks = getTasksForDate(state.currentViewDate);
    
    if (state.currentFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (state.currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (state.currentFilter === 'high') {
        filteredTasks = filteredTasks.filter(task => task.priority === 'high');
    }
    
    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            elements.taskList.appendChild(taskElement);
        });
    }
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const priorityClass = `priority-${task.priority}`;
    const repeatInfo = task.repeat !== 'none' ? 
        `<span class="repeat-badge">${task.repeat}</span>` : '';
    
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-priority ${priorityClass}"></span>
        <span class="task-text">${task.text}</span>
        ${repeatInfo}
        <div class="task-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    
    taskElement.dataset.id = task.id;
    
    // Add event listeners
    const checkbox = taskElement.querySelector('.task-checkbox');
    const editBtn = taskElement.querySelector('.edit-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');
    
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    editBtn.addEventListener('click', () => openEditModal(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return taskElement;
}

// Add new task
function addTask() {
    const text = elements.taskInput.value.trim();
    const priority = elements.prioritySelect.value;
    const repeat = elements.repeatSelect.value;
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        text,
        priority,
        dueDate: formatDateYYYYMMDD(state.currentViewDate),
        repeat,
        completed: false,
        createdAt: new Date().toISOString(),
        originalDueDate: formatDateYYYYMMDD(state.currentViewDate)
    };
    
    state.tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    checkEmptyState();
    
    // Reset inputs
    elements.taskInput.value = '';
    elements.taskInput.focus();
    elements.prioritySelect.value = 'medium';
    elements.repeatSelect.value = 'none';
    
    showToast('Task added successfully!', 'success');
}

// Toggle task completion with repetition logic
function toggleTaskComplete(id) {
    const taskIndex = state.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return;

    const task = state.tasks[taskIndex];
    const today = new Date(state.currentViewDate);
    today.setHours(0, 0, 0, 0);
    
    const taskDueDate = new Date(task.dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    
    // Only allow completion on the due date
    if (today.getTime() !== taskDueDate.getTime()) {
        showToast(`This task can only be completed on ${formatDisplayDate(task.dueDate)}`, 'error');
        return;
    }

    task.completed = !task.completed;
    
    if (task.completed && task.repeat !== 'none') {
        scheduleNextTask(task);
    }
    
    saveTasks();
    renderTasks();
    updateStats();
    
    const message = task.completed ? 'Task completed!' : 'Task marked as pending';
    showToast(message, 'success');
}

// Schedule next task based on repeat pattern
function scheduleNextTask(task) {
    const nextDate = new Date(task.dueDate);
    
    switch(task.repeat) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            // Handle months with different number of days
            const originalDate = new Date(task.originalDueDate).getDate();
            const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            nextDate.setDate(Math.min(originalDate, daysInMonth));
            break;
    }
    
    const newTask = {
        ...task,
        id: Date.now().toString(),
        dueDate: formatDateYYYYMMDD(nextDate),
        completed: false
    };
    
    state.tasks.unshift(newTask);
    saveTasks();
    
    showToast(`Next occurrence scheduled for ${formatDisplayDate(nextDate)}`, 'info');
}

// Navigate to previous day
function goToPreviousDay() {
    const newDate = new Date(state.currentViewDate);
    newDate.setDate(newDate.getDate() - 1);
    state.currentViewDate = newDate;
    displayCurrentDate();
    renderTasks();
}

// Navigate to next day
function goToNextDay() {
    const newDate = new Date(state.currentViewDate);
    newDate.setDate(newDate.getDate() + 1);
    state.currentViewDate = newDate;
    displayCurrentDate();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        checkEmptyState();
        showToast('Task deleted successfully!', 'success');
    }
}

// Open edit modal
function openEditModal(id) {
    const task = state.tasks.find(task => task.id === id);
    if (task) {
        state.currentEditId = id;
        elements.editTaskInput.value = task.text;
        elements.editPrioritySelect.value = task.priority;
        elements.editRepeatSelect.value = task.repeat;
        elements.editModal.style.display = 'flex';
    }
}

// Save edited task
function saveEditedTask() {
    const text = elements.editTaskInput.value.trim();
    const priority = elements.editPrioritySelect.value;
    const repeat = elements.editRepeatSelect.value;
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    const taskIndex = state.tasks.findIndex(task => task.id === state.currentEditId);
    if (taskIndex !== -1) {
        state.tasks[taskIndex].text = text;
        state.tasks[taskIndex].priority = priority;
        state.tasks[taskIndex].repeat = repeat;
        
        saveTasks();
        renderTasks();
        closeEditModal();
        showToast('Task updated successfully!', 'success');
    }
}

// Close edit modal
function closeEditModal() {
    elements.editModal.style.display = 'none';
    state.currentEditId = null;
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

// Update statistics
function updateStats() {
    const tasksForDate = getTasksForDate(state.currentViewDate);
    elements.totalTasksEl.textContent = tasksForDate.length;
    const completedCount = tasksForDate.filter(task => task.completed).length;
    elements.completedTasksEl.textContent = completedCount;
    elements.pendingTasksEl.textContent = tasksForDate.length - completedCount;
}

// Check if task list is empty
function checkEmptyState() {
    const tasksForDate = getTasksForDate(state.currentViewDate);
    if (tasksForDate.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type) {
    elements.toast.textContent = message;
    elements.toast.className = 'toast show';
    
    if (type === 'error') {
        elements.toast.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'success') {
        elements.toast.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'info') {
        elements.toast.style.backgroundColor = 'var(--accent-color)';
    } else {
        elements.toast.style.backgroundColor = 'var(--primary-color)';
    }
    
    setTimeout(() => {
        elements.toast.className = 'toast';
    }, 3000);
}

// Set up event listeners
function setupEventListeners() {
    // Date navigation
    elements.prevDayBtn.addEventListener('click', goToPreviousDay);
    elements.nextDayBtn.addEventListener('click', goToNextDay);
    
    // Add task
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Filter tasks
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Edit modal
    elements.saveEditBtn.addEventListener('click', saveEditedTask);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.closeBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
    });
    
    // PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        elements.installBtn.style.display = 'block';
        
        e.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install prompt');
            } else {
                console.log('User dismissed install prompt');
            }
            state.deferredPrompt = null;
            elements.installBtn.style.display = 'none';
        });
    });
    
    elements.installBtn.addEventListener('click', async () => {
        if (!state.deferredPrompt) {
            showToast('Installation will be available after more interaction', 'info');
            return;
        }
        
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        
        console.log(`User response: ${outcome}`);
        state.deferredPrompt = null;
        elements.installBtn.style.display = 'none';
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        elements.installBtn.style.display = 'none';
        state.deferredPrompt = null;
    });
}

// Initialize the app
init();

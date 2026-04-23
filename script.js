let tasks = [];
let currentTimer = null;        // Stores the setInterval ID
let activeTaskId = null;        // Which task is currently being timed

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const timeEstimateSelect = document.getElementById('time-estimate');
const todoList = document.getElementById('todo-list');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');

function loadTasks() {
    const savedTasks = localStorage.getItem('focusflow-tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
}

// Render all tasks
function renderTasks(filter = 'all') {
    todoList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true; // 'all'
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="checkbox" data-action="toggle"></div>
            
            <div class="task-content" style="flex: 1;">
                <div class="todo-text">${task.text}</div>
                <div class="time-spent">
                    Time spent: <span class="time-display">${formatTime(task.timeSpent || 0)}</span>
                </div>
            </div>

            <div class="timer-display" id="timer-${task.id}">
                ${task.id === activeTaskId ? formatTime(task.currentTime || 0) : ''}
            </div>

            <button class="timer-btn ${task.id === activeTaskId ? 'active' : ''}" data-action="timer">
                ${task.id === activeTaskId ? 'Pause' : 'Start'}
            </button>

            <button class="delete-btn" data-action="delete">×</button>
        `;

        todoList.appendChild(li);
    });

    updateTaskCount();
}

// Format seconds into mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update remaining task count
function updateTaskCount() {
    const activeTasks = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
}

// Add new task
function addTask(text, estimatedMinutes) {
    if (!text.trim()) return;

    const newTask = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        timeSpent: 0,
        estimatedMinutes: parseInt(estimatedMinutes),
        currentTime: 0   // for live timer
    };

    tasks.unshift(newTask); // Add to top
    saveTasks();
    renderTasks();
    todoInput.value = '';
}

// Toggle complete
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        
        // Stop timer if this task was active and we mark it completed
        if (task.id === activeTaskId && task.completed) {
            stopTimer();
        }
        
        saveTasks();
        renderTasks();
    }
}

// Delete task
function deleteTask(id) {
    if (id === activeTaskId) {
        stopTimer();
    }
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Start or Pause Timer
function toggleTimer(id) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    if (activeTaskId === id) {
        // Pause current timer
        stopTimer();
    } else {
        // Stop any existing timer first
        stopTimer();
        
        // Start new timer
        activeTaskId = id;
        task.currentTime = task.timeSpent; // continue from saved time
        
        currentTimer = setInterval(() => {
            task.currentTime++;
            task.timeSpent = task.currentTime; // update saved time
            renderTasks(); // re-render to show live time
        }, 1000);

        renderTasks(); // update button text immediately
    }
}

// Stop any running timer
function stopTimer() {
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
    activeTaskId = null;
    renderTasks();
}

// Clear all completed tasks
function clearCompleted() {
    if (activeTaskId && tasks.find(t => t.id === activeTaskId && t.completed)) {
        stopTimer();
    }
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

// Event Listeners
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value;
    const estimatedTime = timeEstimateSelect.value;
    addTask(text, estimatedTime);
});

// Use event delegation for all buttons inside the list
todoList.addEventListener('click', (e) => {
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;
    
    const id = parseInt(todoItem.dataset.id);
    const action = e.target.dataset.action;

    if (action === 'toggle') {
        toggleComplete(id);
    } else if (action === 'delete') {
        deleteTask(id);
    } else if (action === 'timer') {
        toggleTimer(id);
    }
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // Add to clicked one
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        renderTasks(filter);
    });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
function playCompletionSound() {
    // You can replace this URL with any short bell/chime sound
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    audio.volume = 0.6;
    audio.play().catch(err => console.log("Sound play blocked:", err));
}

// Initialize the app
loadTasks();

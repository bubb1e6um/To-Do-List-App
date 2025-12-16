// ==========================================
// 1. НАСТРОЙКИ И ЭЛЕМЕНТЫ DOM
// ==========================================
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const addBtn = document.getElementById('add-btn');
const modalOverlay = document.getElementById('modal-overlay');
const cancelBtn = document.getElementById('cancel-btn');
const applyBtn = document.getElementById('apply-btn');
const newTodoInput = document.getElementById('new-todo-input');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const themeBtn = document.getElementById('theme-btn');
const actionsContainer = document.querySelector('.actions'); // Для добавления новой кнопки

// Состояние приложения
let todos = [];
let editMode = false;
let editId = null;

// ==========================================
// 2. РАБОТА С API (БЕСПЛАТНЫЕ СЕРВИСЫ)
// ==========================================

// А. Загрузка стартовых данных (Имитация)
async function fetchInitialTodos() {
    // Чтобы приложение не выглядело пустым при старте
    const starterData = [
        { id: 1, text: "Go shopping", completed: false },
        { id: 2, text: "Prepare a report", completed: true },
        { id: 3, text: "Make an appointment with a doctor", completed: false }
    ];
    
    // В реальном проекте здесь был бы fetch, но для стабильности берем массив
    todos = starterData;
    renderTodos();
}

// Б. ГЕНЕРАТОР ИДЕЙ (ВАРИАНТ 1)
// Функция делает запрос к API и добавляет случайную задачу
async function fetchRandomActivity() {
    const magicBtnIcon = document.getElementById('magic-btn').querySelector('i');
    
    // Анимация загрузки (крутим иконку)
    magicBtnIcon.classList.remove('fa-magic');
    magicBtnIcon.classList.add('fa-spinner', 'fa-spin');

    try {
        // Используем бесплатный API dummyjson (он стабильнее boredapi)
        const response = await fetch('https://dummyjson.com/todos/random');
        const data = await response.json();

        // data.todo содержит текст задачи, например "Do something nice..."
        if (data && data.todo) {
            addTodo(data.todo);
            
            // Прокручиваем список вниз к новой задаче
            setTimeout(() => {
                todoList.lastElementChild.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } catch (error) {
        console.error("Ошибка получения идеи:", error);
        alert("Не удалось получить идею. Проверьте интернет!");
    } finally {
        // Возвращаем иконку обратно
        magicBtnIcon.classList.remove('fa-spinner', 'fa-spin');
        magicBtnIcon.classList.add('fa-magic');
    }
}

// В. Внедрение кнопки "Магия" в интерфейс
function injectMagicButton() {
    // Создаем кнопку программно, чтобы не лезть в HTML
    const magicBtn = document.createElement('button');
    magicBtn.id = 'magic-btn';
    magicBtn.className = 'icon-btn';
    magicBtn.title = 'Мне скучно (Генератор идей)';
    magicBtn.innerHTML = '<i class="fas fa-magic"></i>';
    
    // Добавляем стиль для отличия (немного другой оттенок или просто стандартный)
    magicBtn.style.marginRight = '10px';
    
    // Вставляем кнопку перед кнопкой темы
    actionsContainer.insertBefore(magicBtn, themeBtn);

    // Вешаем слушатель событий
    magicBtn.addEventListener('click', fetchRandomActivity);
}

// ==========================================
// 3. ЛОГИКА ПРИЛОЖЕНИЯ (RENDER & CRUD)
// ==========================================

function renderTodos() {
    todoList.innerHTML = "";
    
    const filter = filterSelect.value;
    const searchTerm = searchInput.value.toLowerCase();

    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
        const matchesStatus = 
            filter === 'all' ? true :
            filter === 'completed' ? todo.completed :
            !todo.completed;
        return matchesSearch && matchesStatus;
    });

    if (filteredTodos.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-left">
                <div class="checkbox-custom" onclick="toggleComplete(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="todo-text">${todo.text}</span>
            </div>
            <div class="todo-actions">
                <i class="fas fa-pen action-icon" onclick="openEditModal(${todo.id})"></i>
                <i class="fas fa-trash action-icon" onclick="deleteTodo(${todo.id})"></i>
            </div>
        `;
        todoList.appendChild(li);
    });
}

function toggleComplete(id) {
    todos = todos.map(t => t.id === id ? {...t, completed: !t.completed} : t);
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    renderTodos();
}

function addTodo(text) {
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    todos.push(newTodo);
    renderTodos();
}

function updateTodo(id, text) {
    todos = todos.map(t => t.id === id ? {...t, text: text} : t);
    renderTodos();
}

// ==========================================
// 4. МОДАЛЬНОЕ ОКНО И СОБЫТИЯ
// ==========================================

function openModal() {
    modalOverlay.classList.remove('hidden');
    newTodoInput.focus();
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    newTodoInput.value = '';
    editMode = false;
    editId = null;
    document.querySelector('.modal-title').innerText = "NEW NOTE";
}

function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        editMode = true;
        editId = id;
        newTodoInput.value = todo.text;
        document.querySelector('.modal-title').innerText = "EDIT NOTE";
        openModal();
    }
}

// Слушатели событий
addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);

applyBtn.addEventListener('click', () => {
    const text = newTodoInput.value.trim();
    if (text) {
        if (editMode) {
            updateTodo(editId, text);
        } else {
            addTodo(text);
        }
        closeModal();
    }
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

searchInput.addEventListener('input', renderTodos);
filterSelect.addEventListener('change', renderTodos);

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeBtn.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});


injectMagicButton();
fetchInitialTodos();
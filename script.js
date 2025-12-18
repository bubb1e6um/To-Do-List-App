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
const actionsContainer = document.querySelector('.actions');

// Состояние приложения
let todos = [];
let editMode = false;
let editId = null;

// [LOCAL STORAGE] Ключи для хранилища
const LS_KEY_TODOS = 'my_todo_list_data';
const LS_KEY_THEME = 'my_todo_list_theme';

// ==========================================
// 2. РАБОТА С API И ХРАНИЛИЩЕМ
// ==========================================

// [LOCAL STORAGE] Функция сохранения текущего массива todos
function saveTodosToLocal() {
    localStorage.setItem(LS_KEY_TODOS, JSON.stringify(todos));
}

// А. Загрузка стартовых данных
async function fetchInitialTodos() {
    // [LOCAL STORAGE] Сначала пробуем достать данные из памяти
    const storedTodos = localStorage.getItem(LS_KEY_TODOS);

    if (storedTodos) {
        // Если в памяти что-то есть, парсим и используем это
        todos = JSON.parse(storedTodos);
        renderTodos();
    } else {
        // Если памяти нет (первый заход), грузим стартовые данные
        const starterData = [
            { id: 1, text: "Go shopping", completed: false },
            { id: 2, text: "Prepare a report", completed: true },
            { id: 3, text: "Make an appointment with a doctor", completed: false }
        ];
        todos = starterData;
        renderTodos();
        // [LOCAL STORAGE] Сразу сохраняем стартовый набор
        saveTodosToLocal();
    }
}

// Б. ГЕНЕРАТОР ИДЕЙ
async function fetchRandomActivity() {
    const magicBtnIcon = document.getElementById('magic-btn').querySelector('i');
    
    magicBtnIcon.classList.remove('fa-magic');
    magicBtnIcon.classList.add('fa-spinner', 'fa-spin');

    try {
        const response = await fetch('https://dummyjson.com/todos/random');
        const data = await response.json();

        if (data && data.todo) {
            addTodo(data.todo); // addTodo внутри себя уже вызовет сохранение
            
            setTimeout(() => {
                todoList.lastElementChild.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } catch (error) {
        console.error("Ошибка получения идеи:", error);
        alert("Не удалось получить идею. Проверьте интернет!");
    } finally {
        magicBtnIcon.classList.remove('fa-spinner', 'fa-spin');
        magicBtnIcon.classList.add('fa-magic');
    }
}

function injectMagicButton() {
    const magicBtn = document.createElement('button');
    magicBtn.id = 'magic-btn';
    magicBtn.className = 'icon-btn';
    magicBtn.title = 'Мне скучно (Генератор идей)';
    magicBtn.innerHTML = '<i class="fas fa-magic"></i>';
    magicBtn.style.marginRight = '10px';
    
    actionsContainer.insertBefore(magicBtn, themeBtn);
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
    saveTodosToLocal(); // [LOCAL STORAGE] Сохраняем изменение
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    renderTodos();
    saveTodosToLocal(); // [LOCAL STORAGE] Сохраняем удаление
}

function addTodo(text) {
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    todos.push(newTodo);
    renderTodos();
    saveTodosToLocal(); // [LOCAL STORAGE] Сохраняем новую задачу
}

function updateTodo(id, text) {
    todos = todos.map(t => t.id === id ? {...t, text: text} : t);
    renderTodos();
    saveTodosToLocal(); // [LOCAL STORAGE] Сохраняем редактирование
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

// [LOCAL STORAGE] Логика Темы
// 1. Функция применения темы
function applyTheme(isDark) {
    const icon = themeBtn.querySelector('i');
    if (isDark) {
        document.body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// 2. Проверка темы при загрузке
const savedTheme = localStorage.getItem(LS_KEY_THEME);
if (savedTheme === 'dark') {
    applyTheme(true);
}

// 3. Обработчик клика с сохранением
themeBtn.addEventListener('click', () => {
    const isDarkModeNow = document.body.classList.toggle('dark-mode');
    
    // Обновляем иконку
    const icon = themeBtn.querySelector('i');
    if (isDarkModeNow) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem(LS_KEY_THEME, 'dark'); // Сохраняем dark
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem(LS_KEY_THEME, 'light'); // Сохраняем light
    }
});

// Инициализация
injectMagicButton();
fetchInitialTodos();

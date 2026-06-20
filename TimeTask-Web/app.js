// --- State & Local Storage ---
let tasks = JSON.parse(localStorage.getItem('timeTask_tasks')) || [];
let routines = JSON.parse(localStorage.getItem('timeTask_routines')) || [];

function saveData() {
    localStorage.setItem('timeTask_tasks', JSON.stringify(tasks));
    localStorage.setItem('timeTask_routines', JSON.stringify(routines));
    renderAll();
}

// --- DOM Elements ---
const dateDisplay = document.getElementById('currentDateDisplay');
const taskForm = document.getElementById('taskForm');
const routineForm = document.getElementById('routineForm');
const resetBtn = document.getElementById('resetDataBtn');

const timelineContainer = document.getElementById('timelineContainer');
const tasksUl = document.getElementById('tasksUl');
const routinesUl = document.getElementById('routinesUl');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// --- Initialization ---
function init() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateDisplay.textContent = today.toLocaleDateString('ko-KR', options);

    // Event Listeners
    taskForm.addEventListener('submit', handleTaskSubmit);
    routineForm.addEventListener('submit', handleRoutineSubmit);
    resetBtn.addEventListener('click', resetData);

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    populateTimeSelects();
    renderAll();
}

// --- Time Selectors Population ---
function populateTimeSelects() {
    const hourSelects = ['taskDeadlineHour', 'routineStartHour', 'routineEndHour'];
    const minSelects = ['taskDeadlineMinute', 'routineStartMinute', 'routineEndMinute'];

    hourSelects.forEach(id => {
        const select = document.getElementById(id);
        if(!select) return;
        for(let i=1; i<=12; i++) {
            const val = i.toString().padStart(2, '0');
            select.innerHTML += `<option value="${val}">${val}시</option>`;
        }
    });

    minSelects.forEach(id => {
        const select = document.getElementById(id);
        if(!select) return;
        for(let i=0; i<60; i+=5) {
            const val = i.toString().padStart(2, '0');
            select.innerHTML += `<option value="${val}">${val}분</option>`;
        }
    });
}

// --- Handlers ---
function handleTaskSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('taskName').value;
    const durationMinutes = parseInt(document.getElementById('taskDuration').value);
    const priority = parseInt(document.getElementById('taskPriority').value);
    const dlDate = document.getElementById('taskDeadlineDate').value;
    const dlAmpm = document.getElementById('taskDeadlineAmpm').value;
    let dlHour = parseInt(document.getElementById('taskDeadlineHour').value);
    const dlMin = document.getElementById('taskDeadlineMinute').value;

    if(!dlDate) {
        alert("마감 날짜를 선택해주세요.");
        return;
    }

    if(dlAmpm === 'PM' && dlHour !== 12) dlHour += 12;
    if(dlAmpm === 'AM' && dlHour === 12) dlHour = 0;
    
    const dlHourStr = dlHour.toString().padStart(2, '0');
    const deadline = `${dlDate}T${dlHourStr}:${dlMin}`;

    const newTask = {
        id: Date.now().toString(),
        name,
        durationMinutes,
        priority,
        deadline,
        isCompleted: false
    };

    tasks.push(newTask);
    saveData();
    taskForm.reset();
}

function handleRoutineSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('routineName').value;
    const dayCheckboxes = document.querySelectorAll('input[name="routineDays"]:checked');
    if(dayCheckboxes.length === 0) {
        alert("최소 하나의 반복 요일을 선택해주세요.");
        return;
    }
    const daysOfWeek = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    function get24Hour(ampm, hour, min) {
        let h = parseInt(hour);
        if(ampm === 'PM' && h !== 12) h += 12;
        if(ampm === 'AM' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${min}`;
    }

    const stAmpm = document.getElementById('routineStartAmpm').value;
    const stHour = document.getElementById('routineStartHour').value;
    const stMin = document.getElementById('routineStartMinute').value;
    const startTime = get24Hour(stAmpm, stHour, stMin);

    const etAmpm = document.getElementById('routineEndAmpm').value;
    const etHour = document.getElementById('routineEndHour').value;
    const etMin = document.getElementById('routineEndMinute').value;
    const endTime = get24Hour(etAmpm, etHour, etMin);

    if(startTime >= endTime) {
        alert("종료 시간이 시작 시간보다 빨라야 합니다.");
        return;
    }

    const newRoutine = {
        id: Date.now().toString(),
        name,
        daysOfWeek,
        startTime,
        endTime
    };

    routines.push(newRoutine);
    saveData();
    routineForm.reset();
}

function resetData() {
    if(confirm("모든 데이터를 초기화하시겠습니까?")) {
        tasks = [];
        routines = [];
        saveData();
    }
}

function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        task.isCompleted = true;
        saveData();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
}

function deleteRoutine(id) {
    routines = routines.filter(r => r.id !== id);
    saveData();
}

// --- Rendering ---
function renderAll() {
    renderLists();
    renderTimeline();
}

function renderLists() {
    // Tasks
    const activeTasks = tasks.filter(t => !t.isCompleted);
    tasksUl.innerHTML = '';
    
    if(activeTasks.length === 0) {
        tasksUl.innerHTML = '<div class="empty-state">할 일이 없습니다.</div>';
    } else {
        activeTasks.forEach(t => {
            const li = document.createElement('li');
            li.className = 'data-list-item';
            
            const priorityText = t.priority === 3 ? '🔥 상' : (t.priority === 2 ? '⚡ 중' : '🌱 하');
            
            li.innerHTML = `
                <div class="data-info">
                    <strong>${t.name}</strong>
                    <div class="data-meta">
                        ${t.durationMinutes}분 | 우선순위: ${priorityText} <br>
                        마감: ${new Date(t.deadline).toLocaleString('ko-KR')}
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn-icon complete" onclick="completeTask('${t.id}')" title="완료">✓</button>
                    <button class="btn-icon delete" onclick="deleteTask('${t.id}')" title="삭제">✕</button>
                </div>
            `;
            tasksUl.appendChild(li);
        });
    }

    // Routines
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    routinesUl.innerHTML = '';
    
    if(routines.length === 0) {
        routinesUl.innerHTML = '<div class="empty-state">고정 일정이 없습니다.</div>';
    } else {
        // Sort by first day then time
        const sortedRoutines = [...routines].sort((a, b) => {
            const minDayA = Math.min(...(a.daysOfWeek || [a.dayOfWeek]));
            const minDayB = Math.min(...(b.daysOfWeek || [b.dayOfWeek]));
            if(minDayA !== minDayB) return minDayA - minDayB;
            return a.startTime.localeCompare(b.startTime);
        });

        sortedRoutines.forEach(r => {
            const daysArr = r.daysOfWeek || [r.dayOfWeek];
            const daysStr = daysArr.sort((a,b)=>a-b).map(d => dayMap[d]).join(', ');

            const li = document.createElement('li');
            li.className = 'data-list-item';
            li.innerHTML = `
                <div class="data-info">
                    <strong>${r.name}</strong>
                    <div class="data-meta">
                        매주 [${daysStr}] | ${r.startTime} ~ ${r.endTime}
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteRoutine('${r.id}')" title="삭제">✕</button>
                </div>
            `;
            routinesUl.appendChild(li);
        });
    }
}

// --- Smart Scheduling Algorithm ---
function renderTimeline() {
    timelineContainer.innerHTML = '';
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0(Sun) ~ 6(Sat)

    // 1. Get today's routines
    const todaysRoutines = routines.filter(r => {
        const daysArr = r.daysOfWeek || [r.dayOfWeek];
        return daysArr.includes(currentDayOfWeek);
    });
    
    // Sort routines by start time
    todaysRoutines.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 2. Calculate Free Time Blocks
    // We represent time as minutes from 00:00 (0 to 1440)
    let freeBlocks = [];
    let currentTime = 0; // 00:00

    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function minutesToTime(mins) {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = Math.floor(mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    todaysRoutines.forEach(r => {
        const startMins = timeToMinutes(r.startTime);
        const endMins = timeToMinutes(r.endTime);

        if(currentTime < startMins) {
            freeBlocks.push({
                start: currentTime,
                end: startMins,
                duration: startMins - currentTime
            });
        }
        currentTime = Math.max(currentTime, endMins);
    });

    if(currentTime < 1440) { // until 24:00
        freeBlocks.push({
            start: currentTime,
            end: 1440,
            duration: 1440 - currentTime
        });
    }

    // 3. Sort Tasks (Deadline ASC, Priority DESC)
    const activeTasks = tasks.filter(t => !t.isCompleted);
    activeTasks.sort((a, b) => {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        if(dateA !== dateB) return dateA - dateB; // Deadline ascending
        return b.priority - a.priority; // Priority descending
    });

    // 4. Allocate Tasks to Free Blocks
    let schedule = [];
    
    // Add routines to schedule first
    todaysRoutines.forEach(r => {
        schedule.push({
            type: 'routine',
            name: r.name,
            startMins: timeToMinutes(r.startTime),
            endMins: timeToMinutes(r.endTime),
            color: '#3b82f6'
        });
    });

    // Allocate tasks
    activeTasks.forEach(task => {
        let remainingDuration = task.durationMinutes;
        
        for(let i=0; i<freeBlocks.length; i++) {
            let block = freeBlocks[i];
            if(block.duration <= 0) continue;
            
            let allocDuration = Math.min(remainingDuration, block.duration);
            let allocStart = block.start;
            let allocEnd = allocStart + allocDuration;

            let color = task.priority === 3 ? '#ef4444' : (task.priority === 2 ? '#f59e0b' : '#10b981');

            schedule.push({
                type: 'task',
                name: `${task.name} (${allocDuration}분)`,
                startMins: allocStart,
                endMins: allocEnd,
                color: color,
                taskId: task.id
            });

            // Update block
            block.start = allocEnd;
            block.duration -= allocDuration;
            remainingDuration -= allocDuration;

            if(remainingDuration <= 0) break;
        }
    });

    // 5. Render Schedule
    schedule.sort((a, b) => a.startMins - b.startMins);

    if(schedule.length === 0) {
        timelineContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <p>오늘 등록된 일정이 없습니다.</p>
            </div>
        `;
        return;
    }

    schedule.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.style.borderLeftColor = item.color;

        const typeBadge = item.type === 'routine' 
            ? `<span class="badge badge-routine">고정 일정</span>` 
            : `<span class="badge badge-task">할 일</span>
               <button class="btn-icon complete" style="width:24px; height:24px; border:none; margin-left:10px; cursor:pointer;" onclick="completeTask('${item.taskId}')" title="완료">✓</button>`;

        div.innerHTML = `
            <div class="timeline-time">
                ${minutesToTime(item.startMins)} - ${minutesToTime(item.endMins)}
            </div>
            <div class="timeline-content">
                <div class="timeline-title">${item.name}</div>
                <div>${typeBadge}</div>
            </div>
        `;
        timelineContainer.appendChild(div);
    });
}

// Start app
init();

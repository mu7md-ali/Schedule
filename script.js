// ============================================
// DATA
// ============================================
let periodInfo = {};
let allSections = {};

async function loadData() {
    try {
        console.log('🔄 Loading data.json...');
        const res = await fetch('data.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        periodInfo = json.periodInfo;
        allSections = json.sections;
        console.log('✅ Data loaded:', Object.keys(allSections).length, 'sections');
    } catch (err) {
        console.error('❌ Failed to load data.json:', err);
        showToast('فشل تحميل البيانات - تأكد من وجود data.json', 'error');
        allSections = {'1': {data: {}}};
    }
}

// ============================================
// STATE
// ============================================
let currentSection = "1";
let isGroupView = false;
let currentGroup = null;
let currentEditCell = null;

// ============================================
// THEME
// ============================================
function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    showToast(next === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️', 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ============================================
// RAMADAN DECORATIONS 🌙✨
// ============================================
function initBinaryBackground() {
    const bg = document.getElementById('binary-bg');
    if (!bg) return;
    
    bg.innerHTML = '';
    bg.className = 'binary-background';
    
    // Add ramadan pattern for light mode
    const pattern = document.createElement('div');
    pattern.className = 'ramadan-pattern';
    bg.appendChild(pattern);
    
    // Create stars container
    const starsDiv = document.createElement('div');
    starsDiv.className = 'stars';
    
    // Generate 50 random stars
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsDiv.appendChild(star);
    }
    bg.appendChild(starsDiv);
    
    // Create crescent moon
    const crescent = document.createElement('div');
    crescent.className = 'crescent';
    crescent.style.right = '10%';
    crescent.style.top = '15%';
    bg.appendChild(crescent);
    
    // Create lanterns
    const lanternPositions = [
        { left: '15%', top: '20%', delay: '0s' },
        { right: '20%', top: '35%', delay: '1s' },
        { left: '25%', top: '60%', delay: '2s' },
        { right: '15%', top: '70%', delay: '1.5s' }
    ];
    
    lanternPositions.forEach(pos => {
        const lantern = document.createElement('div');
        lantern.className = 'lantern';
        lantern.style.animationDelay = pos.delay;
        if (pos.left) lantern.style.left = pos.left;
        if (pos.right) lantern.style.right = pos.right;
        lantern.style.top = pos.top;
        
        lantern.innerHTML = `
            <div class="lantern-rope"></div>
            <div class="lantern-body">
                <div class="lantern-light"></div>
            </div>
        `;
        
        bg.appendChild(lantern);
    });
}

// ============================================
// TOAST
// ============================================
function showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    t.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

// ============================================
// SECTION LOADING
// ============================================
function changeSection(num) {
    console.log('📋 changeSection called with:', num);
    if (!num) { console.warn('⚠️ No section number provided'); return; }
    if (!allSections[num]) { 
        console.error('❌ Section not found:', num); 
        showToast('هذا القسم غير متوفر', 'error'); 
        return; 
    }

    console.log('✅ Changing to section:', num);
    currentSection = num;
    isGroupView = false;
    currentGroup = null;

    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.remove('hidden');
    document.getElementById('groupView').classList.add('hidden');
    document.getElementById('notesSection').classList.remove('hidden');

    document.getElementById('groupABtn').classList.remove('hidden');
    document.getElementById('groupBBtn').classList.remove('hidden');
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.classList.remove('hidden');
    const printGroupBtn = document.getElementById('printGroupBtn');
    if (printGroupBtn) printGroupBtn.classList.add('hidden');
    document.getElementById('backBtn').classList.add('hidden');

    // Edit button — only for section 17
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (num === '17') {
        editBtn?.classList.remove('hidden');
    } else {
        editBtn?.classList.add('hidden');
        saveBtn?.classList.add('hidden');
        cancelBtn?.classList.add('hidden');
    }

    // Show English and Students buttons (hide for custom schedule)
    const englishBtn = document.getElementById('englishBtn');
    const studentsBtn = document.getElementById('sectionStudentsBtn');
    if (num === '17') {
        englishBtn?.classList.add('hidden');
        studentsBtn?.classList.add('hidden');
    } else {
        englishBtn?.classList.remove('hidden');
        studentsBtn?.classList.remove('hidden');
        if (studentsBtn) {
            studentsBtn.innerHTML = `<i class="fas fa-user-graduate"></i><span>Section ${num} Students</span>`;
        }

    }

    // sync selects
    ['sectionSelect','sectionSelectMain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = num;
    });

    const sec = allSections[num];
    const displayName = num === '17' ? '✏️ Custom Schedule' : `Section ${num}`;
    renderSectionTable(sec.data, displayName);
    showToast(`${displayName} Loaded ✅`, 'success');
}

// ============================================
// RENDER SECTION TABLE
// ============================================
function renderSectionTable(data, displayName) {
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
    const periods = ["1-2","3-4","5-6","7-8"];
    const body = document.getElementById('tableBody');
    body.innerHTML = '';
    document.getElementById('tableTitle').innerText = displayName;

    // Section 17: load saved data if exists
    if (currentSection === '17') {
        const saved = localStorage.getItem('custom17-data');
        if (saved) {
            data = JSON.parse(saved);
        }
    }

    days.forEach((day, di) => {
        const row = document.createElement('tr');
        row.className = 'day-row';
        row.style.animationDelay = `${di * 0.06}s`;

        // Day label
        const dayTd = document.createElement('td');
        dayTd.className = 'day-lbl';
        dayTd.textContent = day;
        row.appendChild(dayTd);

        periods.forEach((p, pi) => {
            // Insert break after period index 1 (before 5-6)
            if (pi === 2) {
                const brk = document.createElement('td');
                brk.innerHTML = `<div class="brk-cell">
                    <div class="brk-line"></div>
                    <span class="brk-icon">☕</span>
                    <span class="brk-lbl">BREAK</span>
                    <div class="brk-line"></div>
                </div>`;
                row.appendChild(brk);
            }

            const cell = data[day]?.[p] ?? null;
            const td = document.createElement('td');

            if (currentSection === '17') {
                // Custom schedule - editable cells
                td.innerHTML = renderCustomCell(cell, day, p);
            } else {
                if (cell) {
                    const roomHtml = (cell.r || '').replace(/AI/g, '<span class="ai-tag">AI</span>');
                    const isLec = cell.t === 'L';
                    td.innerHTML = `<div class="${isLec ? 'lec-card' : 'lab-card'}" onclick="showDetails('${day}','${p}','${currentSection}')">
                        <div class="card-subj">${cell.n}</div>
                        <div class="card-doc">${cell.d}</div>
                        <div class="card-room">${roomHtml}</div>
                    </div>`;
                } else {
                    td.innerHTML = `<div class="free-card">FREE</div>`;
                }
            }
            row.appendChild(td);
        });
        body.appendChild(row);
    });
}

function renderCustomCell(cell, day, period) {
    if (cell && cell.n) {
        const roomHtml = (cell.r || '').replace(/AI/g, '<span class="ai-tag">AI</span>');
        const isLec = cell.t === 'L' || cell.d?.includes('Dr.');
        return `<div class="${isLec ? 'lec-card' : 'lab-card'}" onclick="openCustomEdit('${day}','${period}')">
            <div class="card-subj">${cell.n}</div>
            <div class="card-doc">${cell.d}</div>
            <div class="card-room">${roomHtml}</div>
        </div>`;
    } else {
        return `<div class="free-card" onclick="openCustomEdit('${day}','${period}')" style="cursor: pointer;">+ ADD</div>`;
    }
}

// ============================================
// CUSTOM SCHEDULE EDIT MODAL
// ============================================
function openCustomEdit(day, period) {
    if (currentSection !== '17') return;
    
    currentEditCell = { day, period };
    
    // Get existing data
    const saved = localStorage.getItem('custom17-data');
    let data = saved ? JSON.parse(saved) : {};
    const cell = data[day]?.[period] || {};
    
    // Populate form
    document.getElementById('customSubject').value = cell.n || '';
    document.getElementById('customInstructor').value = cell.d || '';
    document.getElementById('customRoom').value = cell.r || '';
    document.getElementById('customType').value = cell.t || 'L';
    
    // Show modal
    document.getElementById('customEditModal').classList.add('active');
}

function closeCustomEdit() {
    document.getElementById('customEditModal').classList.remove('active');
    currentEditCell = null;
}

function saveCustomCell() {
    if (!currentEditCell) return;
    
    const { day, period } = currentEditCell;
    const subject = document.getElementById('customSubject').value.trim();
    const instructor = document.getElementById('customInstructor').value.trim();
    const room = document.getElementById('customRoom').value.trim();
    const type = document.getElementById('customType').value;
    
    // Get existing data
    const saved = localStorage.getItem('custom17-data');
    let data = saved ? JSON.parse(saved) : {};
    
    if (!data[day]) data[day] = {};
    
    if (subject) {
        data[day][period] = {
            n: subject,
            d: instructor || (type === 'L' ? 'Dr. TBD' : 'T.A TBD'),
            r: room || 'TBD',
            t: type
        };
    } else {
        delete data[day][period];
    }
    
    localStorage.setItem('custom17-data', JSON.stringify(data));
    
    // Re-render
    renderSectionTable(data, '✏️ Custom Schedule');
    closeCustomEdit();
    showToast('تم الحفظ! ✅', 'success');
}

function deleteCustomCell() {
    if (!currentEditCell) return;
    
    const { day, period } = currentEditCell;
    
    const saved = localStorage.getItem('custom17-data');
    let data = saved ? JSON.parse(saved) : {};
    
    if (data[day]) {
        delete data[day][period];
    }
    
    localStorage.setItem('custom17-data', JSON.stringify(data));
    
    renderSectionTable(data, '✏️ Custom Schedule');
    closeCustomEdit();
    showToast('تم الحذف! 🗑️', 'info');
}

// ============================================
// GROUP VIEW
// ============================================
function showGroupSchedule(group) {
    isGroupView = true;
    currentGroup = group;

    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('sectionView').classList.add('hidden');
    document.getElementById('groupView').classList.remove('hidden');
    document.getElementById('notesSection').classList.remove('hidden');

    document.getElementById('groupABtn').classList.add('hidden');
    document.getElementById('groupBBtn').classList.add('hidden');
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.classList.add('hidden');
    const printGroupBtn = document.getElementById('printGroupBtn');
    if (printGroupBtn) printGroupBtn.classList.remove('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (editBtn) editBtn.classList.add('hidden');
    if (saveBtn) saveBtn.classList.add('hidden');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    ['sectionSelect','sectionSelectMain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    renderGroupTable(group);
    showToast(`Group ${group} Loaded ✅`, 'success');
}

function renderGroupTable(group) {
    const sections = group === 'A'
        ? ['1','2','3','4','5','6','7','8']
        : ['9','10','11','12','13','14','15','16'];
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
    const periods = ["1-2","3-4","5-6","7-8"];

    document.getElementById('groupTitle').innerText = `Group ${group} Schedule`;
    const tbody = document.getElementById('groupTableBody');
    tbody.innerHTML = '';

    sections.forEach((secNum, idx) => {
        const sec = allSections[secNum];
        if (!sec) return;

        const tr = document.createElement('tr');
        tr.style.animationDelay = `${idx * 0.05}s`;

        const th = document.createElement('th');
        th.className = `grp-sec-th${sec.group === 'B' ? ' gb' : ''}`;
        th.innerHTML = `<div style="cursor: pointer;" onclick="showSectionFromGroup('${secNum}')">SEC ${secNum.padStart(2,'0')}</div>`;
        tr.appendChild(th);

        days.forEach(day => {
            const td = document.createElement('td');
            td.className = 'period-cell';
            periods.forEach(period => {
                const cell = sec.data[day]?.[period] || null;
                const info = periodInfo[period];
                if (cell) {
                    const mini = document.createElement('div');
                    mini.className = `mini-card${cell.t === 'S' ? ' lab' : ''}`;
                    mini.onclick = () => showDetails(day, period, secNum);
                    mini.innerHTML = `<div class="mini-t">${period} | ${info?.time || ''}</div>
                        <div class="mini-s">${cell.n}</div>
                        <div class="mini-d">${cell.d}</div>
                        <div class="mini-r">${(cell.r||'').replace(/AI/g,'<span style="color:#00ffff">AI</span>')}</div>`;
                    td.appendChild(mini);
                } else {
                    const fr = document.createElement('div');
                    fr.className = 'mini-free';
                    fr.innerHTML = `${period} | ${info?.time || ''}<br>FREE`;
                    td.appendChild(fr);
                }
            });
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function showSectionFromGroup(secNum) {
    changeSection(secNum);
}

function backToSection() { 
    changeSection(currentSection); 
}

// ============================================
// EDIT MODE — Section 17 only
// ============================================
function enableEditing() {
    showToast('Edit Mode — اضغط على أي خلية لتعديلها', 'info');
    document.getElementById('editBtn')?.classList.add('hidden');
    document.getElementById('saveEditBtn')?.classList.remove('hidden');
    document.getElementById('cancelEditBtn')?.classList.remove('hidden');
}

function saveEditing() {
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('تم الحفظ! ✅', 'success');
}

function cancelEditing() {
    const saved = localStorage.getItem('custom17-data');
    let data = saved ? JSON.parse(saved) : {};
    renderSectionTable(data, '✏️ Custom Schedule');
    document.getElementById('editBtn')?.classList.remove('hidden');
    document.getElementById('saveEditBtn')?.classList.add('hidden');
    document.getElementById('cancelEditBtn')?.classList.add('hidden');
    showToast('تم الإلغاء', 'info');
}

function showDetails(day, period, secNum) {
    const cell = allSections[secNum]?.data?.[day]?.[period];
    if (cell) showToast(`${cell.n} | ${cell.d} | ${cell.r}`, 'info');
}

// ============================================
// PRINT METHODS
// ============================================
function printTable() {
    const original = document.getElementById('sectionView');
    if (!original) {
        showToast('Table not found', 'error');
        return;
    }
    
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fef9e7' : '#0a051f';
    
    const printContent = original.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
<!DOCTYPE html>
<html data-theme="${theme}">
<head>
    <meta charset="UTF-8">
    <title>CS Schedule - Section ${currentSection}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
    <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        body { background: ${bgColor}; padding: 20px; font-family: 'Inter', sans-serif; }
        .table-card { max-width: none !important; width: 100% !important; }
        .tbl-scroll { overflow: visible !important; }
        .sched-table { width: 100% !important; min-width: 0 !important; }
        .lec-card { background: ${theme === 'dark' ? 'rgba(255,215,0,0.2)' : 'rgba(212,175,55,0.15)'} !important; border: 2px solid rgba(255,215,0,0.6) !important; }
        .lab-card { background: ${theme === 'dark' ? 'rgba(147,112,219,0.2)' : 'rgba(139,92,246,0.15)'} !important; border: 2px solid rgba(147,112,219,0.6) !important; }
        @media print { body { background: ${theme === 'light' ? '#fef9e7' : '#0a051f'} !important; } * { overflow: visible !important; } }
    </style>
</head>
<body>
    <div class="table-card">${printContent}</div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>
    `);
    printWindow.document.close();
}

function printGroupTable() {
    const original = document.getElementById('groupView');
    if (!original) {
        showToast('Table not found', 'error');
        return;
    }
    
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const bgColor = theme === 'light' ? '#fef9e7' : '#0a051f';
    
    const printContent = original.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
<!DOCTYPE html>
<html data-theme="${theme}">
<head>
    <meta charset="UTF-8">
    <title>Group ${currentGroup} Schedule</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
    <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; overflow: visible !important; }
        body { background: ${bgColor}; padding: 20px; font-family: 'Inter', sans-serif; }
        @media print { body { background: ${theme === 'light' ? '#fef9e7' : '#0a051f'} !important; } }
    </style>
</head>
<body>${printContent}
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>
    `);
    printWindow.document.close();
}

// ============================================
// MODALS
// ============================================
function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function showAcademicCalendar() {
    document.getElementById('calendarModal')?.classList.remove('hidden');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    if (e.target.id === 'englishScheduleModal') closeEnglishSchedule();
    if (e.target.id === 'studentsNamesModal') closeStudentsNames();
    if (e.target.id === 'customEditModal') closeCustomEdit();
};

// ============================================
// FREE NOTES
// ============================================
let notesTimer = null;

function autoSaveNotes() {
    const ta = document.getElementById('freeNotesArea');
    const saved = document.getElementById('notesSaved');
    const count = document.getElementById('notesCount');

    if (count) count.textContent = `${ta.value.length} characters`;

    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
        localStorage.setItem('free-notes', ta.value);
        if (saved) {
            saved.classList.add('visible');
            setTimeout(() => saved.classList.remove('visible'), 2000);
        }
    }, 600);
}

function updateNotesCount() {
    const ta = document.getElementById('freeNotesArea');
    const count = document.getElementById('notesCount');
    if (ta && count) count.textContent = `${ta.value.length} characters`;
}

function clearAllNotes() {
    const ta = document.getElementById('freeNotesArea');
    if (!ta) return;
    if (confirm('هتمسح كل الملاحظات؟ / Clear all notes?')) {
        ta.value = '';
        localStorage.removeItem('free-notes');
        updateNotesCount();
        showToast('تم مسح الملاحظات', 'info');
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    if (document.activeElement.isContentEditable) return;

    const k = e.key;

    if (!e.shiftKey && k >= '1' && k <= '9') { changeSection(k); return; }
    if (e.shiftKey && k >= '1' && k <= '7') { changeSection(String(parseInt(k)+9)); return; }

    switch (k.toLowerCase()) {
        case 'a':
            if (!document.getElementById('groupABtn')?.classList.contains('hidden')) showGroupSchedule('A');
            break;
        case 'b':
            if (!document.getElementById('groupBBtn')?.classList.contains('hidden')) showGroupSchedule('B');
            break;
        case 'c':
            showAcademicCalendar();
            break;
        case 't':
            toggleTheme();
            break;
        case 'escape':
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            closeEnglishSchedule();
            closeStudentsNames();
            closeCustomEdit();
            break;
    }
});

// ============================================
// ONLINE / OFFLINE
// ============================================
window.addEventListener('online',  () => showToast('متصل بالإنترنت ✅', 'success'));
window.addEventListener('offline', () => showToast('غير متصل — التطبيق لا يزال يعمل 📴', 'info'));

// ============================================
// ENGLISH SCHEDULE MODAL
// ============================================
let englishScheduleData = null;

async function loadEnglishScheduleData() {
    try {
        const response = await fetch('english-schedule-data.json');
        englishScheduleData = await response.json();
        console.log('✅ English Schedule data loaded');
    } catch (error) {
        console.error('❌ Error loading English Schedule data:', error);
    }
}

function openEnglishSchedule() {
    if (!englishScheduleData) {
        showToast('Loading data...', 'info');
        loadEnglishScheduleData().then(() => {
            if (englishScheduleData) displayEnglishSchedule();
        });
    } else {
        displayEnglishSchedule();
    }
}

function displayEnglishSchedule() {
    const modal = document.getElementById('englishScheduleModal');
    const body = document.getElementById('englishScheduleBody');
    
    if (!modal || !body) {
        console.error('English Schedule modal elements not found');
        return;
    }
    
    body.innerHTML = '';
    
    englishScheduleData.sections.forEach(section => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'schedule-category';
        
        categoryDiv.innerHTML = `
            <h3 class="category-title">
                <i class="fas fa-graduation-cap"></i> ${section.category}
            </h3>
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th><i class="fas fa-layer-group"></i> Level</th>
                        <th><i class="fas fa-calendar-day"></i> Day</th>
                        <th><i class="fas fa-clock"></i> Period</th>
                        <th><i class="fas fa-map-marker-alt"></i> Location</th>
                        <th><i class="fas fa-user-tie"></i> Instructor</th>
                    </tr>
                </thead>
                <tbody>
                    ${section.schedule.map(item => `
                        <tr>
                            <td><span class="level-badge">Level ${item.level}</span></td>
                            <td><span class="day-badge">${item.day}</span></td>
                            <td><span class="period-badge">${item.period}</span></td>
                            <td><span class="location-badge">${item.location}</span></td>
                            <td><span class="instructor-name">${item.instructor}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        body.appendChild(categoryDiv);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEnglishSchedule() {
    const modal = document.getElementById('englishScheduleModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// STUDENTS NAMES MODAL
// ============================================
let studentsData = null;
let currentStudentsSection = null;
const SPECIAL_STUDENT = "محمد على السيد على سالم شرف الدين";

async function loadStudentsData() {
    try {
        if (typeof sectionsData === 'undefined') {
            console.log('⚠️ sectionsData not loaded yet');
            return;
        }
        studentsData = sectionsData;
        console.log('✅ Students data loaded:', studentsData.length, 'sections');
    } catch (error) {
        console.error('❌ Error loading students data:', error);
    }
}

function openCurrentSectionStudents() {
    if (!currentSection || currentSection === '17') {
        showToast('اختر سكشن أولاً', 'error');
        return;
    }
    openStudentsNamesWithSection(parseInt(currentSection));
}

function openStudentsNames() {
    if (!studentsData) {
        loadStudentsData();
        setTimeout(() => {
            if (studentsData) displayStudentsModal();
        }, 100);
    } else {
        displayStudentsModal();
    }
}

function openStudentsNamesWithSection(sectionNum) {
    if (!studentsData) {
        loadStudentsData();
        setTimeout(() => {
            if (studentsData) {
                displayStudentsModal();
                showStudentsBySection(sectionNum);
            }
        }, 100);
    } else {
        displayStudentsModal();
        showStudentsBySection(sectionNum);
    }
}

function displayStudentsModal() {
    const modal = document.getElementById('studentsNamesModal');
    if (!modal) {
        console.error('Students Names modal not found');
        return;
    }
    
    generateSectionButtons();
    
    if (!currentStudentsSection && studentsData && studentsData.length > 0) {
        showStudentsBySection(1);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function generateSectionButtons() {
    const container = document.getElementById('sectionButtonsContainer');
    if (!container || !studentsData) return;
    
    container.innerHTML = '';
    
    studentsData.forEach(section => {
        const btn = document.createElement('button');
        btn.className = `section-btn ${section.section <= 8 ? 'group-a' : 'group-b'}`;
        btn.textContent = `Sec ${section.section}`;
        btn.onclick = () => showStudentsBySection(section.section);
        container.appendChild(btn);
    });
}

function showStudentsBySection(sectionNumber) {
    currentStudentsSection = sectionNumber;
    
    const sectionData = studentsData.find(s => s.section === sectionNumber);
    if (!sectionData) {
        console.error('Section not found:', sectionNumber);
        return;
    }
    
    document.querySelectorAll('.section-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === `Sec ${sectionNumber}`) {
            btn.classList.add('active');
        }
    });
    
    const groupLetter = sectionNumber <= 8 ? 'A' : 'B';
    const titleEl = document.getElementById('currentSectionTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="fas fa-user-graduate"></i> Section ${sectionNumber} - Group ${groupLetter}`;
    }
    
    const countEl = document.getElementById('studentCount');
    if (countEl) {
        countEl.textContent = `Total Students: ${sectionData.students.length}`;
    }
    
    displayStudentsTable(sectionData.students);
    
    const searchInput = document.getElementById('studentsSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

function displayStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const tr = document.createElement('tr');
        
        if (student.name === SPECIAL_STUDENT) {
            tr.classList.add('special-student');
        }
        
        tr.innerHTML = `
            <td>${student.rank}</td>
            <td>${student.name}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

function filterStudents() {
    const searchInput = document.getElementById('studentsSearchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const name = row.querySelector('td:last-child').textContent.toLowerCase();
        if (name.includes(searchValue)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    const totalCount = rows.length;
    const countEl = document.getElementById('studentCount');
    if (countEl) {
        if (searchValue) {
            countEl.textContent = `Showing ${visibleCount} of ${totalCount} students`;
        } else {
            countEl.textContent = `Total Students: ${totalCount}`;
        }
    }
}

function closeStudentsNames() {
    const modal = document.getElementById('studentsNamesModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentStudentsSection = null;
    }
}

// ============================================
// INITIALIZATION
// ============================================



// =====================================================
// STUDY PLAN — CLEAN REBUILD — NO SVG, NO IDs
// =====================================================

const SP_COLORS = {
    prog:'#00d4ff', math:'#9370db', systems:'#32cd32',
    hardware:'#ff8c00', networks:'#e67e22', ai:'#ffd700',
    graphics:'#ff69b4', lang:'#64c8ff', soft:'#b0b0b0', science:'#50dcb4'
};
const SP_LABELS = {
    prog:'Programming', math:'Math', systems:'Systems',
    hardware:'Hardware', networks:'Networks', ai:'AI',
    graphics:'Graphics', lang:'Language', soft:'Soft Skills', science:'Science'
};

const SP_DATA = [
    // Level 1 Term 1
    { id:99, name:'English Language',   pre:null, chain:'lang',     lv:1, tm:1 },
    { id:2,  name:'Creative Thinking',  pre:null, chain:'soft',     lv:1, tm:1 },
    { id:3,  name:'Calculus',           pre:null, chain:'math',     lv:1, tm:1 },
    { id:4,  name:'Intro to CS',        pre:null, chain:'prog',     lv:1, tm:1 },
    { id:5,  name:'Physics',            pre:null, chain:'science',  lv:1, tm:1 },
    { id:1,  name:'Electronics',        pre:null, chain:'hardware', lv:1, tm:1 },
    // Level 1 Term 2
    { id:6,  name:'Technical Writing',  pre:99,  chain:'lang',     lv:1, tm:2 },
    { id:8,  name:'Linear Algebra',     pre:3,   chain:'math',     lv:1, tm:2 },
    { id:7,  name:'Discrete Math',      pre:8,   chain:'math',     lv:1, tm:2 },
    { id:9,  name:'Programming',        pre:4,   chain:'prog',     lv:1, tm:2 },
    { id:10, name:'Info Systems',       pre:null, chain:'systems',  lv:1, tm:2 },
    { id:11, name:'Logic Design',       pre:1,   chain:'hardware', lv:1, tm:2 },
    // Level 2 Term 1
    { id:12, name:'Statistics',         pre:7,   chain:'math',     lv:2, tm:1 },
    { id:13, name:'Work Ethics',        pre:null, chain:'soft',     lv:2, tm:1 },
    { id:14, name:'Operations Research',pre:12,  chain:'math',     lv:2, tm:1 },
    { id:15, name:'OOP',                pre:9,   chain:'prog',     lv:2, tm:1 },
    { id:16, name:'File Processing',    pre:15,  chain:'prog',     lv:2, tm:1 },
    { id:17, name:'Assembly',           pre:11,  chain:'hardware', lv:2, tm:1 },
    // Level 2 Term 2
    { id:18, name:'Business Admin',     pre:null, chain:'soft',     lv:2, tm:2 },
    { id:19, name:'Human Rights',       pre:null, chain:'soft',     lv:2, tm:2 },
    { id:20, name:'Networks',           pre:9,   chain:'networks', lv:2, tm:2 },
    { id:21, name:'Data Structure',     pre:null, chain:'prog',     lv:2, tm:2 },
    { id:22, name:'Web Programming',    pre:16,  chain:'prog',     lv:2, tm:2 },
    { id:23, name:'Systems Analysis',   pre:22,  chain:'systems',  lv:2, tm:2 },
    // Level 3 Term 1
    { id:24, name:'HCI',                pre:null, chain:'soft',     lv:3, tm:1 },
    { id:25, name:'Multimedia',         pre:null, chain:'graphics', lv:3, tm:1 },
    { id:26, name:'Logic Programming',  pre:22,  chain:'prog',     lv:3, tm:1 },
    { id:27, name:'Algorithms',         pre:21,  chain:'prog',     lv:3, tm:1 },
    { id:28, name:'Databases',          pre:23,  chain:'systems',  lv:3, tm:1 },
    { id:29, name:'Software Engineering',pre:23, chain:'systems',  lv:3, tm:1 },
    // Level 3 Term 2
    { id:30, name:'Neural Networks',    pre:null, chain:'ai',       lv:3, tm:2 },
    { id:31, name:'AI',                 pre:null, chain:'ai',       lv:3, tm:2 },
    { id:32, name:'Mobile Apps',        pre:22,  chain:'prog',     lv:3, tm:2 },
    { id:33, name:'Compiler Design',    pre:17,  chain:'hardware', lv:3, tm:2 },
    { id:34, name:'Operating Systems',  pre:33,  chain:'systems',  lv:3, tm:2 },
    { id:35, name:'Graphics',           pre:34,  chain:'graphics', lv:3, tm:2 },
    // Level 4 Term 1
    { id:36, name:'Parallel Processing',pre:20,  chain:'networks', lv:4, tm:1 },
    { id:37, name:'Cloud Computing',    pre:36,  chain:'networks', lv:4, tm:1 },
    { id:38, name:'Senior Project 1',   pre:29,  chain:'systems',  lv:4, tm:1 },
    { id:39, name:'Data Warehouse',     pre:null, chain:'systems',  lv:4, tm:1 },
    { id:40, name:'Embedded Systems',   pre:null, chain:'hardware', lv:4, tm:1 },
    { id:41, name:'Image Processing',   pre:35,  chain:'graphics', lv:4, tm:1 },
    // Level 4 Term 2
    { id:42, name:'Machine Learning',   pre:12,  chain:'ai',       lv:4, tm:2 },
    { id:43, name:'IoT',               pre:37,  chain:'networks', lv:4, tm:2 },
    { id:44, name:'Senior Project 2',   pre:38,  chain:'systems',  lv:4, tm:2 },
    { id:45, name:'Security',           pre:null, chain:'networks', lv:4, tm:2 },
    { id:46, name:'Distributed Systems',pre:34,  chain:'systems',  lv:4, tm:2 },
];

let sp_active = null;

// ── Open/Close ───────────────────────────────────────
function showStudyPlan() {
    const modal = document.getElementById('studyPlanModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (!modal.dataset.built) {
        buildSP();
        modal.dataset.built = '1';
    }
}
function closeStudyPlan() {
    document.getElementById('studyPlanModal')?.classList.add('hidden');
    sp_active = null;
}

// ── Build UI ─────────────────────────────────────────
function buildSP() {
    const modal = document.getElementById('studyPlanModal');

    // max rows per column pair (each level×term)
    const cols = {};
    for (let lv = 1; lv <= 4; lv++)
        for (let tm = 1; tm <= 2; tm++) {
            const key = `${lv}-${tm}`;
            cols[key] = SP_DATA.filter(c => c.lv === lv && c.tm === tm);
        }
    const maxRows = Math.max(...Object.values(cols).map(a => a.length));

    // legend
    const chains = [...new Set(SP_DATA.map(c => c.chain))];
    const legendHtml = chains.map(ch => `
        <div class="sp-pill" style="border-color:${SP_COLORS[ch]}55;color:${SP_COLORS[ch]};">
            <div class="sp-pill-dot" style="background:${SP_COLORS[ch]};"></div>
            ${SP_LABELS[ch]||ch}
        </div>`).join('');

    // build grid rows
    // Row 0: level headers (span 2 cols each)
    // Row 1: term headers
    // Row 2+: cards

    let gridHtml = '';

    // Level headers row
    for (let lv = 1; lv <= 4; lv++) {
        const border = lv > 1 ? 'lvl-border' : '';
        gridHtml += `<div class="sp-level-head ${border}" style="grid-column:${(lv-1)*2+1} / span 2; grid-row:1;">⬡ Level ${lv}</div>`;
    }

    // Term headers row
    for (let lv = 1; lv <= 4; lv++) {
        const col1 = (lv-1)*2+1;
        const col2 = (lv-1)*2+2;
        gridHtml += `<div class="sp-col-head term1" style="grid-column:${col1};grid-row:2;">T1</div>`;
        gridHtml += `<div class="sp-col-head term2" style="grid-column:${col2};grid-row:2;">T2</div>`;
    }

    // Card rows
    for (let row = 0; row < maxRows; row++) {
        for (let lv = 1; lv <= 4; lv++) {
            for (let tm = 1; tm <= 2; tm++) {
                const gridCol = (lv-1)*2 + tm;
                const gridRow = row + 3;
                const course = cols[`${lv}-${tm}`][row];
                const borderLeft = (lv > 1 && tm === 1) ? 'border-left:3px solid rgba(255,215,0,0.15);' : tm === 2 ? 'border-left:1px solid rgba(255,255,255,0.05);' : '';
                if (course) {
                    gridHtml += `
                    <div style="grid-column:${gridCol};grid-row:${gridRow};padding:4px 3px;${borderLeft}">
                        <div class="sp-card"
                             data-id="${course.id}"
                             data-chain="${course.chain}"
                             data-pre="${course.pre ?? ''}"
                             onclick="spTap(${course.id})">
                            <div class="sp-card-name">${course.name}</div>
                        </div>
                    </div>`;
                } else {
                    gridHtml += `<div style="grid-column:${gridCol};grid-row:${gridRow};${borderLeft}"></div>`;
                }
            }
        }
    }

    modal.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
        <div class="sp-header">
            <div class="sp-title"><i class="fas fa-graduation-cap"></i> CS Study Plan — خطة الدراسة</div>
            <button class="sp-close" onclick="closeStudyPlan()"><i class="fas fa-times"></i></button>
        </div>
        <div class="sp-legend">${legendHtml}</div>
        <div class="sp-info" id="spInfo">
            <span class="sp-info-name" id="spInfoName"></span>
            <span id="spInfoTags"></span>
        </div>
        <div class="sp-body">
            <div class="sp-grid" id="spGrid">${gridHtml}</div>
        </div>
    </div>`;
}

// ── Tap handler ──────────────────────────────────────
function spTap(id) {
    // Toggle off
    if (sp_active === id) {
        sp_active = null;
        spClearStates();
        document.getElementById('spInfo')?.classList.remove('show');
        return;
    }
    sp_active = id;

    const course = SP_DATA.find(c => c.id === id);
    if (!course) return;

    const prereqs  = spGetPrereqs(id);
    const unlocks  = spGetUnlocks(id);
    const related  = new Set([...prereqs.map(c=>c.id), id, ...unlocks.map(c=>c.id)]);

    // Apply classes
    document.querySelectorAll('.sp-card').forEach(card => {
        const cid = parseInt(card.dataset.id);
        card.classList.remove('is-selected','is-prereq','is-unlocks','is-dim');
        if (cid === id)                          card.classList.add('is-selected');
        else if (prereqs.find(c=>c.id===cid))   card.classList.add('is-prereq');
        else if (unlocks.find(c=>c.id===cid))   card.classList.add('is-unlocks');
        else                                      card.classList.add('is-dim');
    });

    // Info panel
    const infoEl   = document.getElementById('spInfo');
    const nameEl   = document.getElementById('spInfoName');
    const tagsEl   = document.getElementById('spInfoTags');
    const col      = SP_COLORS[course.chain] || '#ffd700';
    nameEl.textContent  = course.name;
    nameEl.style.color  = col;
    nameEl.style.textShadow = `0 0 10px ${col}`;

    let tags = `<span class="sp-info-tag">${SP_LABELS[course.chain]||course.chain}</span>`;
    if (prereqs.length) tags += `<span class="sp-info-tag pre">📌 ${prereqs.map(p=>p.name).join(' → ')}</span>`;
    else                tags += `<span class="sp-info-tag">✅ No prerequisites</span>`;
    if (unlocks.length) tags += `<span class="sp-info-tag open">🔓 ${unlocks.map(u=>u.name).join(', ')}</span>`;
    tagsEl.innerHTML = tags;
    infoEl?.classList.add('show');

    // Scroll selected into view
    const el = [...document.querySelectorAll('.sp-card')].find(c=>parseInt(c.dataset.id)===id);
    el?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
}

function spClearStates() {
    document.querySelectorAll('.sp-card').forEach(c =>
        c.classList.remove('is-selected','is-prereq','is-unlocks','is-dim'));
}

function spGetPrereqs(id) {
    const chain = [];
    let cur = SP_DATA.find(c=>c.id===id);
    while (cur && cur.pre) {
        const p = SP_DATA.find(c=>c.id===cur.pre);
        if (!p || chain.find(c=>c.id===p.id)) break;
        chain.unshift(p);
        cur = p;
    }
    return chain;
}

function spGetUnlocks(id) {
    const result = [];
    const queue  = [id];
    const seen   = new Set();
    while (queue.length) {
        const cid = queue.shift();
        if (seen.has(cid)) continue;
        seen.add(cid);
        SP_DATA.forEach(c => {
            if (c.pre === cid && !seen.has(c.id)) {
                result.push(c);
                queue.push(c.id);
            }
        });
    }
    return result;
}


// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadEnglishScheduleData();
    loadStudentsData();
});


// ============================================
// SUBJECT FILES - LONG PRESS & GOOGLE DRIVE LINKS
// ============================================

// Subject Google Drive links
// Format: subject name (lowercase, no emojis) -> drive folder link
const subjectDriveLinks = {
    "business administration": "https://drive.google.com/drive/folders/1_GE-P572jVZLhJZqnU7t7ahl5GxVTU8I",
    "data structure": "https://drive.google.com/drive/folders/1EcZ47bZzeT0lER5etJe-2viYPueFYtb2",
    "web programming": "https://drive.google.com/drive/folders/1RIdM672Mfhcr8KhVpzXgJr-DsWC0zL7A",
    "computer network": "https://drive.google.com/drive/folders/1XlfEGfvmQigDkWkEgxO9ewxxBN9n3ElF",
    "system analysis": "https://drive.google.com/drive/folders/11OcZ2n_v--nO3KehMMDu8onO15kxz-ZJ",
    "human rights": "https://drive.google.com/drive/folders/10WOEaho7ElyojafkQRgm6fBodkFXlRi-"
};

let longPressTimer = null;
let isLongPress = false;
const LONG_PRESS_DURATION = 800; // 0.8 seconds - faster response

// ============================================
// LONG PRESS DETECTION
// ============================================

function initLongPressDetection() {
    // Use event delegation on the table body
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.addEventListener('mousedown', handlePressStart);
    tableBody.addEventListener('touchstart', handlePressStart, { passive: false });
    
    tableBody.addEventListener('mouseup', handlePressEnd);
    tableBody.addEventListener('touchend', handlePressEnd);
    tableBody.addEventListener('touchcancel', handlePressEnd);
    
    tableBody.addEventListener('mouseleave', handlePressCancel);
    
    // Prevent context menu on long press
    tableBody.addEventListener('contextmenu', (e) => {
        if (isLongPress) {
            e.preventDefault();
        }
    });
}

function handlePressStart(e) {
    // Find the closest card element
    const card = e.target.closest('.lec-card, .lab-card');
    if (!card) return;
    
    // Get subject name from the card
    const subjectName = card.querySelector('.card-subj')?.textContent?.trim();
    if (!subjectName) return;
    
    isLongPress = false;
    
    // Show indicator
    showLongPressIndicator();
    
    // Start timer
    longPressTimer = setTimeout(() => {
        isLongPress = true;
        hideLongPressIndicator();
        openSubjectFiles(subjectName);
        
        // Add visual feedback
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, LONG_PRESS_DURATION);
}

function handlePressEnd(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    hideLongPressIndicator();
}

function handlePressCancel(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    hideLongPressIndicator();
}

function showLongPressIndicator() {
    let indicator = document.getElementById('longPressIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'longPressIndicator';
        indicator.className = 'long-press-indicator';
        indicator.innerHTML = '<i class="fas fa-hand-pointer"></i> Keep holding to view files...';
        document.body.appendChild(indicator);
    }
    indicator.classList.add('show');
}

function hideLongPressIndicator() {
    const indicator = document.getElementById('longPressIndicator');
    if (indicator) {
        indicator.classList.remove('show');
    }
}

// ============================================
// SUBJECT FILES MODAL - GOOGLE DRIVE LINKS
// ============================================

let currentSubjectName = null;

function openSubjectFiles(subjectName) {
    // Clean subject name (remove emojis, lowercase)
    const cleanName = cleanSubjectName(subjectName);
    currentSubjectName = subjectName;
    
    const driveLink = subjectDriveLinks[cleanName];
    
    if (driveLink) {
        // Open Google Drive link directly in new tab
        window.open(driveLink, '_blank');
        showToast(`Opening ${subjectName} Drive folder 🚀`, 'success');
    } else {
        showToast(`No Drive link for ${subjectName} 😕`, 'error');
    }
}

function cleanSubjectName(name) {
    // Remove emojis and extra spaces, convert to lowercase
    return name
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function openFolder(folderName) {
    currentFolderPath.push(folderName);
    renderFiles();
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize long press detection when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initLongPressDetection();
});

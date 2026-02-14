// =============================================
// DATA — loaded from data.json
// =============================================
let periodInfo = {};
let allSections = {};
let customSectionData = null; // NEW: separate storage for custom

async function loadData() {
    try {
        const response = await fetch('data.json');
        const json = await response.json();
        periodInfo = json.periodInfo;
        allSections = json.sections;
        
        // Load custom section if exists
        const savedCustom = localStorage.getItem('customSectionData');
        if (savedCustom) {
            customSectionData = JSON.parse(savedCustom);
            allSections.custom = customSectionData;
        }
    } catch (err) {
        console.error('Failed to load data.json:', err);
    }
}

// =============================================
// STATE
// =============================================
let currentSection = "1";
let originalContent = '';
let isEditing = false;
let isGroupView = false;
let currentGroup = null;
let currentNoteSlot = null;
let hasCustomSection = false;

// =============================================
// THEME
// =============================================
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// =============================================
// BINARY BACKGROUND
// =============================================
function initBinaryBackground() {
    const container = document.getElementById('binary-bg');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const col = document.createElement('div');
        col.className = 'binary-column';
        col.style.left = `${(i / 30) * 100}%`;
        col.style.animationDuration = `${15 + Math.random() * 10}s`;
        col.style.animationDelay = `${Math.random() * 5}s`;
        let txt = '';
        for (let j = 0; j < 40; j++) { txt += (Math.random() > 0.5 ? '1' : '0') + '<br>'; }
        col.innerHTML = txt;
        container.appendChild(col);
    }
}

// =============================================
// TOAST
// =============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-exclamation-circle"></i>', info: '<i class="fas fa-info-circle"></i>' };
    toast.innerHTML = `${icons[type] || ''} ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// =============================================
// SECTION LOADING
// =============================================
function changeSection(sectionNum) {
    if (!sectionNum) return;
    document.getElementById('skeletonLoader').classList.remove('hidden');
    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');

    setTimeout(() => {
        currentSection = sectionNum;
        isGroupView = false;
        currentGroup = null;

        document.getElementById('sectionView').classList.remove('hidden');
        document.getElementById('groupView').classList.add('hidden');
        document.getElementById('skeletonLoader').classList.add('hidden');
        document.getElementById('groupABtn').classList.remove('hidden');
        document.getElementById('groupBBtn').classList.remove('hidden');
        document.getElementById('backBtn').classList.add('hidden');

        const section = allSections[sectionNum];
        const displayName = sectionNum === 'custom' ? 'My Custom Section' : `Section ${sectionNum}`;
        renderSectionTable(section.data, displayName);

        document.getElementById('sectionSelect').value = sectionNum;
        document.getElementById('sectionSelectMain').value = sectionNum;

        showToast(`${displayName} Loaded`, 'success');
    }, 400);
}

// =============================================
// RENDER SECTION TABLE
// =============================================
function renderSectionTable(data, displayName) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const periods = ["1-2", "3-4", "5-6", "7-8"];
    const body = document.getElementById('tableBody');
    body.innerHTML = '';
    document.getElementById('tableTitle').innerText = displayName;

    // Load saved edited HTML if exists
    const savedHTML = localStorage.getItem(`edit-${currentSection}`);
    if (savedHTML && !isGroupView) {
        document.getElementById('captureArea').innerHTML = savedHTML;
        return;
    }

    days.forEach((day, index) => {
        const row = document.createElement('tr');
        row.className = 'day-row';
        row.style.animationDelay = `${index * 0.05}s`;
        row.innerHTML = `<td class="font-black text-white/50 text-[9px] sm:text-[11px] pr-1 sm:pr-4 align-middle uppercase tracking-wider whitespace-nowrap">${day}</td>`;

        periods.forEach((p, pIndex) => {
            if (pIndex === 2) {
                row.innerHTML += `<td><div class="break-cell"><div class="break-line"></div><span class="break-icon">☕</span><span class="break-text">BREAK</span><div class="break-line"></div></div></td>`;
            }
            const cell = data[day] ? data[day][p] : null;
            const noteKey = `note-${currentSection}-${day}-${p}`;
            const hasNote = localStorage.getItem(noteKey);

            if (cell) {
                const roomHtml = cell.r.replace(/AI/g, '<span class="ai-highlight">AI</span>');
                const isLecture = cell.t === 'L';
                row.innerHTML += `<td><div class="${isLecture ? 'lecture-card' : 'lab-card'}${hasNote ? ' has-note' : ''}" onclick="showDetails('${day}','${p}','${currentSection}')" oncontextmenu="openNoteModal('${day}','${p}','${currentSection}');return false;"><div class="font-black text-[8px] sm:text-[11px] mb-1 leading-tight text-white text-center">${cell.n}</div><div class="text-[6px] sm:text-[9px] font-bold text-white/60 mb-1 text-center">${cell.d}</div><div class="room-text">${roomHtml}</div></div></td>`;
            } else {
                row.innerHTML += `<td><div class="free-card" onclick="openNoteModal('${day}','${p}','${currentSection}')">FREE</div></td>`;
            }
        });
        body.appendChild(row);
    });
}

// =============================================
// GROUP VIEW
// =============================================
function showGroupSchedule(group) {
    isGroupView = true;
    currentGroup = group;
    document.getElementById('sectionView').classList.add('hidden');
    document.getElementById('groupView').classList.remove('hidden');
    document.getElementById('noticeBox').classList.add('hidden');
    document.getElementById('controlsArea').classList.remove('hidden');
    document.getElementById('groupABtn').classList.add('hidden');
    document.getElementById('groupBBtn').classList.add('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('sectionSelect').value = "";
    document.getElementById('sectionSelectMain').value = "";
    renderGroupTable(group);
    showToast(`Group ${group} Schedule Loaded`, 'success');
}

function renderGroupTable(group) {
    const sections = group === 'A' ? ['1','2','3','4','5','6','7','8'] : ['9','10','11','12','13','14','15','16'];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const periods = ["1-2", "3-4", "5-6", "7-8"];
    document.getElementById('groupTitle').innerText = `Group ${group} Schedule`;
    const tbody = document.getElementById('groupTableBody');
    tbody.innerHTML = '';
    sections.forEach((secNum, index) => {
        const sec = allSections[secNum];
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        const th = document.createElement('th');
        th.className = `section-header${sec.group === 'B' ? ' group-b' : ''}`;
        th.innerText = `SEC ${secNum.padStart(2, '0')}`;
        tr.appendChild(th);
        days.forEach(day => {
            const td = document.createElement('td');
            td.className = 'period-cell';
            periods.forEach(period => {
                const cell = sec.data[day] && sec.data[day][period] ? sec.data[day][period] : null;
                const info = periodInfo[period];
                if (cell) {
                    const isLab = cell.t === 'S';
                    const miniCard = document.createElement('div');
                    miniCard.className = `mini-card${isLab ? ' lab' : ''}`;
                    miniCard.onclick = () => showDetails(day, period, secNum);
                    miniCard.innerHTML = `<div class="mini-time">${period} | ${info.time} | ${info.duration}</div><div class="mini-subject">${cell.n}</div><div class="mini-doctor">${cell.d}</div><div class="mini-room">${cell.r.replace(/AI/g, '<span style="color:#00ffff">AI</span>')}</div>`;
                    td.appendChild(miniCard);
                } else {
                    const freeDiv = document.createElement('div');
                    freeDiv.className = 'mini-free';
                    freeDiv.innerHTML = `${period} | ${info.time}<br>FREE`;
                    td.appendChild(freeDiv);
                }
            });
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function backToSection() { changeSection(currentSection); }

function showDetails(day, period, sectionNum) {
    if (isEditing) return;
    const cell = allSections[sectionNum]?.data?.[day]?.[period];
    if (cell) showToast(`${cell.n} | ${cell.d} | ${cell.r}`, 'info');
}

// =============================================
// EDIT MODE (saves to localStorage)
// =============================================
function enableEditing() {
    isEditing = true;
    const area = isGroupView ? document.getElementById('groupView') : document.getElementById('captureArea');
    originalContent = area.innerHTML;
    area.contentEditable = "true";
    document.getElementById('editModeBtn').classList.add('hidden');
    document.getElementById('confirmBtn').classList.remove('hidden');
    document.getElementById('cancelBtn').classList.remove('hidden');
    showToast('Edit Mode: Click any text to edit', 'info');
}

function disableEditing(save) {
    isEditing = false;
    const area = isGroupView ? document.getElementById('groupView') : document.getElementById('captureArea');
    if (save) {
        // Save edited HTML to localStorage
        if (!isGroupView) {
            localStorage.setItem(`edit-${currentSection}`, area.innerHTML);
        }
        showToast('Changes Saved! Will persist after refresh.', 'success');
    } else {
        area.innerHTML = originalContent;
        showToast('Changes Discarded', 'error');
    }
    area.contentEditable = "false";
    document.getElementById('editModeBtn').classList.remove('hidden');
    document.getElementById('confirmBtn').classList.add('hidden');
    document.getElementById('cancelBtn').classList.add('hidden');
}

// =============================================
// DOWNLOAD IMAGE (fixed cropping)
// =============================================
async function downloadTable() {
    const area = document.getElementById('captureArea');
    showToast('Generating image...', 'info');
    try {
        // Scroll to top first to avoid cropping
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(area, {
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#f8fafc' : '#0a0f1c',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: area.scrollWidth,
            width: area.scrollWidth,
            height: area.scrollHeight
        });

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `CS_Section${currentSection}_${date}_${time}.jpg`;

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await showSaveFilePicker({ suggestedName: filename, types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg'] } }] });
                const writable = await handle.createWritable();
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                await writable.write(blob);
                await writable.close();
                showToast('Image saved!', 'success');
                return;
            } catch (e) { /* fallback */ }
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        showToast('Image downloaded!', 'success');
    } catch (err) {
        console.error(err);
        showToast('Download failed', 'error');
    }
}

// =============================================
// DOWNLOAD PDF - FIXED SIZE
// =============================================
function downloadGroupPDF() {
    const { jsPDF } = window.jspdf;
    showToast('Generating PDF...', 'info');
    const element = document.getElementById('groupView');
    const clone = element.cloneNode(true);
    
    // Remove action buttons from clone
    clone.querySelectorAll('.action-btn, button').forEach(btn => btn.remove());
    
    clone.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;background:#0a0f1c;padding:20px;';
    document.body.appendChild(clone);
    
    html2canvas(clone, { 
        backgroundColor: '#0a0f1c', 
        scale: 1, // REDUCED from 1.5 to 1 for smaller file
        useCORS: true, 
        allowTaint: true, 
        width: 1200, 
        windowWidth: 1200,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = 297, pageHeight = 210;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
        
        // Only add new page if needed
        if (imgHeight > pageHeight) {
            let heightLeft = imgHeight - pageHeight;
            let position = -pageHeight;
            while (heightLeft > 0) {
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
                position -= pageHeight;
                heightLeft -= pageHeight;
            }
        }
        
        pdf.save(`CS_Schedule_Group_${currentGroup}.pdf`);
        document.body.removeChild(clone);
        showToast('PDF Downloaded!', 'success');
    }).catch(err => { 
        document.body.removeChild(clone); 
        showToast('PDF Failed', 'error'); 
        console.error(err); 
    });
}

// =============================================
// MODALS
// =============================================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showAcademicCalendar() { document.getElementById('calendarModal').classList.remove('hidden'); }

// =============================================
// NOTES
// =============================================
function openNoteModal(day, period, section) {
    currentNoteSlot = { day, period, section };
    const noteKey = `note-${section}-${day}-${period}`;
    document.getElementById('noteText').value = localStorage.getItem(noteKey) || '';
    document.getElementById('notesModal').classList.remove('hidden');
}

function saveNote() {
    if (!currentNoteSlot) return;
    const { section, day, period } = currentNoteSlot;
    const noteKey = `note-${section}-${day}-${period}`;
    const text = document.getElementById('noteText').value;
    if (text.trim()) { localStorage.setItem(noteKey, text); showToast('Note saved!', 'success'); }
    else { localStorage.removeItem(noteKey); showToast('Note removed', 'info'); }
    closeModal('notesModal');
    // Clear saved edit HTML so notes re-render
    localStorage.removeItem(`edit-${currentSection}`);
    if (currentSection === section) renderSectionTable(allSections[currentSection].data, `Section ${currentSection}`);
}

// =============================================
// NOTES MANAGER - NEW FEATURE
// =============================================
function showNotesManager() {
    // Create modal if not exists
    let modal = document.getElementById('notesManagerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notesManagerModal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content notes-modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-sticky-note"></i> My Notes</h2>
                    <button onclick="closeModal('notesManagerModal')" class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" id="notesListContainer">
                    <p style="color: var(--text-secondary); text-align: center;">Loading notes...</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Load and display notes
    const container = document.getElementById('notesListContainer');
    const notes = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('note-')) {
            const parts = key.split('-');
            if (parts.length === 4) {
                notes.push({
                    key: key,
                    section: parts[1],
                    day: parts[2],
                    period: parts[3],
                    text: localStorage.getItem(key)
                });
            }
        }
    }
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-sticky-note" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                <p>No notes yet. Right-click on any subject to add a note!</p>
            </div>
        `;
    } else {
        container.innerHTML = notes.map(note => `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <span style="font-size: 0.75rem; color: var(--color-lecture); font-weight: 700;">
                        <i class="fas fa-calendar"></i> ${note.day} ${note.period} | Section ${note.section}
                    </span>
                    <button onclick="deleteNote('${note.key}')" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.7rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p style="color: var(--text-primary); font-size: 0.85rem; line-height: 1.5;">${note.text}</p>
            </div>
        `).join('');
    }
    
    modal.classList.remove('hidden');
}

function deleteNote(key) {
    localStorage.removeItem(key);
    // Clear saved edit HTML
    const sectionMatch = key.match(/note-(\d+)-/);
    if (sectionMatch) {
        localStorage.removeItem(`edit-${sectionMatch[1]}`);
    }
    showNotesManager(); // Refresh
    showToast('Note deleted', 'info');
}

// =============================================
// DESIGNER MODE
// =============================================
let draggedSubject = null;
let designerSchedule = {};

const designerSubjects = [
    { code: "BA", name: "Business Administration 💼", type: "L", doctor: "Dr. Sameh Mohamed", room: "مدرج 1 إعلام" },
    { code: "DS", name: "Data Structure 🌳", type: "L", doctor: "Dr. Osama Shafik", room: "مدرج 5 إعلام" },
    { code: "DS_LAB", name: "Data Structure Lab 🌳", type: "S", doctor: "T.A Various", room: "Lab" },
    { code: "SA", name: "System Analysis 📊", type: "L", doctor: "Dr. Magdy Elhenawy", room: "مدرج 7 علوم حاسب" },
    { code: "SA_LAB", name: "System Analysis Lab 📊", type: "S", doctor: "T.A Various", room: "Lab" },
    { code: "WP", name: "Web Programming 🌐", type: "L", doctor: "Dr. Mohamed Mostafa", room: "مدرج 5 إعلام" },
    { code: "WP_LAB", name: "Web Programming Lab 🌐", type: "S", doctor: "T.A Various", room: "Lab" },
    { code: "CN", name: "Computer Network 🔌", type: "L", doctor: "Dr. Hesham Abo el-fotoh", room: "مدرج 5 إعلام" },
    { code: "CN_LAB", name: "Computer Network Lab 🔌", type: "S", doctor: "T.A Various", room: "Lab" },
    { code: "HR", name: "Human Rights ⚖️", type: "L", doctor: "Dr. Ahmed Noaman", room: "مدرج 5 إعلام" }
];

function openDesignerMode() {
    document.getElementById('designerModal').classList.remove('hidden');
    initDesigner();
}

function initDesigner() {
    designerSchedule = {};
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const periods = ["1-2", "3-4", "5-6", "7-8"];
    days.forEach(day => { designerSchedule[day] = {}; periods.forEach(p => { designerSchedule[day][p] = null; }); });
    renderSubjectCards();
    renderDesignerTable();
}

function countSubjects() {
    let lectures = 0, labs = 0;
    Object.values(designerSchedule).forEach(day => {
        Object.values(day).forEach(sub => { if (sub) { if (sub.type === 'L') lectures++; else labs++; } });
    });
    return { lectures, labs };
}

function isSubjectUsedOnDay(day, code) {
    return Object.values(designerSchedule[day]).some(s => s && s.code === code);
}

function checkConflicts() {
    const conflicts = [];
    Object.entries(designerSchedule).forEach(([day, slots]) => {
        const used = new Set();
        Object.values(slots).forEach(sub => {
            if (sub) { if (used.has(sub.code)) conflicts.push(`${sub.name} appears twice on ${day}`); used.add(sub.code); }
        });
    });
    const warn = document.getElementById('conflictWarning');
    const txt = document.getElementById('conflictText');
    if (conflicts.length > 0) { warn.classList.remove('hidden'); txt.innerText = conflicts.join(' | '); }
    else { warn.classList.add('hidden'); }
    return conflicts.length === 0;
}

function updateValidation() {
    const { lectures, labs } = countSubjects();
    const isValid = lectures === 6 && labs === 4;
    let div = document.getElementById('designerValidation');
    if (!div) {
        div = document.createElement('div');
        div.id = 'designerValidation';
        const body = document.querySelector('#designerModal .modal-body');
        body.insertBefore(div, body.children[3]);
    }
    div.className = isValid ? 'designer-validation valid' : 'designer-validation';
    div.innerHTML = `<i class="fas fa-${isValid ? 'check-circle' : 'info-circle'}"></i> Lectures: ${lectures}/6 &nbsp;|&nbsp; Labs: ${labs}/4 ${isValid ? '— Ready to save! ✅' : ''}`;
}

function renderSubjectCards() {
    const container = document.getElementById('subjectCards');
    container.innerHTML = '';
    designerSubjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = `subject-card ${sub.type === 'L' ? 'lecture' : 'lab'}`;
        card.draggable = true;
        card.dataset.code = sub.code;
        card.innerHTML = `<div class="subject-card-name">${sub.name}</div><div class="subject-card-type">${sub.type === 'L' ? 'Lecture' : 'Lab'} — ${sub.doctor}</div>`;
        card.addEventListener('dragstart', function(e) { draggedSubject = designerSubjects.find(s => s.code === this.dataset.code); this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'copy'; });
        card.addEventListener('dragend', function() { this.classList.remove('dragging'); });
        container.appendChild(card);
    });
}

function renderDesignerTable() {
    const tbody = document.getElementById('designerTableBody');
    tbody.innerHTML = '';
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const periods = ["1-2", "3-4", "5-6", "7-8"];
    days.forEach(day => {
        const row = document.createElement('tr');
        const dayTd = document.createElement('td');
        dayTd.textContent = day.substring(0, 3);
        row.appendChild(dayTd);
        periods.forEach((period, idx) => {
            if (idx === 2) {
                const brk = document.createElement('td');
                brk.innerHTML = '<div class="break-cell" style="min-height:45px;"><span style="font-size:0.7rem;">☕</span></div>';
                row.appendChild(brk);
            }
            const td = document.createElement('td');
            const slot = document.createElement('div');
            slot.className = 'drop-slot';
            slot.dataset.day = day;
            slot.dataset.period = period;
            const sub = designerSchedule[day][period];
            if (sub) {
                slot.classList.add('occupied', sub.type === 'L' ? 'lecture' : 'lab');
                slot.innerHTML = `<div class="drop-slot-content"><div class="drop-slot-subject">${sub.name}</div><span class="drop-slot-remove" onclick="removeFromSlot('${day}','${period}')"><i class="fas fa-times"></i> Remove</span></div>`;
            } else {
                slot.innerHTML = '<span class="drop-slot-placeholder">Drop here</span>';
            }
            slot.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; this.classList.add('drag-over'); });
            slot.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
            slot.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                if (!draggedSubject) return;
                const d = this.dataset.day, p = this.dataset.period;
                if (designerSchedule[d][p]) { showToast('Slot occupied! Remove first.', 'error'); return; }
                if (isSubjectUsedOnDay(d, draggedSubject.code)) { showToast(`${draggedSubject.name} already on ${d}!`, 'error'); return; }
                designerSchedule[d][p] = draggedSubject;
                renderDesignerTable();
                updateValidation();
                checkConflicts();
                showToast(`Added to ${d} ${p}`, 'success');
            });
            td.appendChild(slot);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    updateValidation();
    checkConflicts();
}

function removeFromSlot(day, period) {
    designerSchedule[day][period] = null;
    renderDesignerTable();
    updateValidation();
    checkConflicts();
    showToast('Subject removed', 'info');
}

function clearDesignerSchedule() {
    Object.keys(designerSchedule).forEach(day => {
        Object.keys(designerSchedule[day]).forEach(p => { designerSchedule[day][p] = null; });
    });
    renderDesignerTable();
    showToast('Schedule cleared', 'info');
}

// Confirm before saving
function confirmSaveDesigner() {
    const { lectures, labs } = countSubjects();
    if (lectures !== 6 || labs !== 4) { showToast(`Need exactly 6 lectures & 4 labs. Current: ${lectures}L / ${labs}Lab`, 'error'); return; }
    if (!checkConflicts()) { showToast('Resolve conflicts first!', 'error'); return; }

    // Build summary
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const periods = ["1-2", "3-4", "5-6", "7-8"];
    let summary = '';
    days.forEach(day => {
        const slots = periods.map(p => designerSchedule[day][p]).filter(Boolean);
        if (slots.length) summary += `<strong style="color:var(--color-lecture)">${day}:</strong> ${slots.map(s => s.name).join(', ')}<br>`;
    });

    document.getElementById('confirmSummary').innerHTML = summary || 'Empty schedule';
    document.getElementById('designerConfirmModal').classList.remove('hidden');
}

// =============================================
// DESIGNER MODE - FIXED SAVE
// =============================================
function doSaveDesigner() {
    // Create proper section object
    const customData = {
        group: 'Custom',
        data: JSON.parse(JSON.stringify(designerSchedule))
    };
    
    // Save to localStorage properly
    localStorage.setItem('customSectionData', JSON.stringify(customData));
    customSectionData = customData;
    
    // Update allSections
    allSections.custom = customData;
    
    // Add to dropdowns if not exists
    if (!hasCustomSection) {
        ['sectionSelect', 'sectionSelectMain'].forEach(id => {
            const sel = document.getElementById(id);
            // Remove existing custom option if any
            const existing = sel.querySelector('option[value="custom"]');
            if (existing) existing.remove();
            
            const opt = document.createElement('option');
            opt.value = 'custom';
            opt.textContent = '🎨 My Custom Section';
            sel.appendChild(opt);
        });
        hasCustomSection = true;
    }

    closeModal('designerConfirmModal');
    closeModal('designerModal');
    
    // Small delay to ensure UI updates
    setTimeout(() => {
        changeSection('custom');
        showToast('Custom schedule saved! 🎉', 'success');
    }, 100);
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (document.activeElement.isContentEditable) return;

    const key = e.key;

    // Sections 1–9
    if (!e.shiftKey && key >= '1' && key <= '9') { changeSection(key); return; }

    // Sections 10–16 (Shift+1 to Shift+7)
    if (e.shiftKey && key >= '1' && key <= '7') { changeSection(String(parseInt(key) + 9)); return; }

    switch (key.toLowerCase()) {
        case 'a': if (document.getElementById('groupABtn') && !document.getElementById('groupABtn').classList.contains('hidden')) showGroupSchedule('A'); break;
        case 'b': if (document.getElementById('groupBBtn') && !document.getElementById('groupBBtn').classList.contains('hidden')) showGroupSchedule('B'); break;
        case 'd': openDesignerMode(); break;
        case 'c': showAcademicCalendar(); break;
        case 't': toggleTheme(); break;
        case 'n': showNotesManager(); break; // NEW: N for notes
        case '?': {
            const panel = document.getElementById('shortcutsPanel');
            panel.classList.toggle('visible');
            break;
        }
        case 'escape': {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            document.getElementById('shortcutsPanel')?.classList.remove('visible');
            break;
        }
    }
});

// =============================================
// CLOSE MODAL ON BACKDROP CLICK
// =============================================
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
};

// =============================================
// ONLINE / OFFLINE
// =============================================
window.addEventListener('online', () => showToast('Back online! ✅', 'success'));
window.addEventListener('offline', () => showToast('You are offline. App still works! 📴', 'info'));

// =============================================
// PWA INSTALL
// =============================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
});

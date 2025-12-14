class CalendarTool {
    constructor() {
        this.yearInput = document.getElementById('yearInput');
        this.monthInput = document.getElementById('monthInput');
        this.startDayInput = document.getElementById('startDay');
        this.bgImageInput = document.getElementById('bgImage');
        this.showTaiwanHolidaysCheckbox = document.getElementById('showTaiwanHolidays');
        this.showJapanHolidaysCheckbox = document.getElementById('showJapanHolidays');
        this.calendarGrid = document.getElementById('calendarGrid');
        this.weekdaysContainer = document.getElementById('weekdaysContainer');
        this.calendarTitle = document.getElementById('calendarTitle');
        this.calendarImage = document.getElementById('calendarImage');
        this.prevMonthBtn = document.getElementById('prevMonthBtn');
        this.nextMonthBtn = document.getElementById('nextMonthBtn');
        
        // Modal elements
        this.modal = document.getElementById('noteModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.noteInput = document.getElementById('noteInput');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.modalDateDisplay = document.getElementById('modalDateDisplay');
        this.colorOptions = document.querySelectorAll('.color-option');
        
        // New buttons
        this.downloadBtn = document.getElementById('downloadBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importInput = document.getElementById('importInput');
        this.calendarCard = document.getElementById('calendarCard');

        this.currentSelectedDate = null;
        this.currentSelectedColor = '#ffffff';
        this.notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};
        this.currentBgImageData = null; // Store base64 image data
        this.holidayData = {}; // Store Taiwan holiday data
        this.japanHolidayData = {}; // Store Japan holiday data

        this.weekdayLabelsEN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        this.monthNamesEN = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.init();
    }

    init() {
        this.yearInput.addEventListener('change', () => this.loadHolidaysAndRender());
        this.monthInput.addEventListener('change', () => this.renderCalendar());
        this.startDayInput.addEventListener('change', () => this.renderCalendar());
        this.bgImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.showTaiwanHolidaysCheckbox.addEventListener('change', () => this.loadHolidaysAndRender());
        this.showJapanHolidaysCheckbox.addEventListener('change', () => this.loadHolidaysAndRender());
        this.prevMonthBtn.addEventListener('click', () => this.prevMonth());
        this.nextMonthBtn.addEventListener('click', () => this.nextMonth());
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.prevMonth();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.nextMonth();
            }
        });
        
        // Action buttons events
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.exportBtn.addEventListener('click', () => this.exportSettings());
        this.importBtn.addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', (e) => this.importSettings(e));

        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteNote());

        // Color selection events
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.currentSelectedColor = option.getAttribute('data-color');
            });
        });

        const today = new Date();
        this.yearInput.value = today.getFullYear();
        this.monthInput.value = today.getMonth();

        this.loadHolidaysAndRender();
    }

    prevMonth() {
        let month = parseInt(this.monthInput.value);
        let year = parseInt(this.yearInput.value);
        
        month--;
        if (month < 0) {
            month = 11;
            year--;
            this.yearInput.value = year;
        }
        this.monthInput.value = month;
        this.loadHolidaysAndRender();
    }

    nextMonth() {
        let month = parseInt(this.monthInput.value);
        let year = parseInt(this.yearInput.value);
        
        month++;
        if (month > 11) {
            month = 0;
            year++;
            this.yearInput.value = year;
        }
        this.monthInput.value = month;
        this.loadHolidaysAndRender();
    }

    async loadHolidaysAndRender() {
        const year = parseInt(this.yearInput.value);
        const currentYear = new Date().getFullYear();
        
        // Only load Taiwan holiday API for current year and next year
        if (this.showTaiwanHolidaysCheckbox.checked && 
            (year === currentYear || year === currentYear + 1) && 
            !this.holidayData[year]) {
            try {
                const response = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`);
                if (response.ok) {
                    const data = await response.json();
                    this.holidayData[year] = {};
                    data.forEach(day => {
                        if (day.isHoliday) {
                            const dateStr = day.date; // format: "20250101"
                            const month = parseInt(dateStr.substring(4, 6)) - 1;
                            const dayNum = parseInt(dateStr.substring(6, 8));
                            this.holidayData[year][`${month}-${dayNum}`] = day.description || '假日';
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to load Taiwan holiday data:', error);
            }
        }
        
        // Load Japan holiday data if checkbox is checked
        if (this.showJapanHolidaysCheckbox.checked && 
            (year === currentYear || year === currentYear + 1) && 
            !this.japanHolidayData[year]) {
            try {
                const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/jp`);
                if (response.ok) {
                    const data = await response.json();
                    this.japanHolidayData[year] = {};
                    data.forEach(holiday => {
                        const dateStr = holiday.date; // format: "2025-01-01"
                        const [y, m, d] = dateStr.split('-');
                        const month = parseInt(m) - 1;
                        const dayNum = parseInt(d);
                        this.japanHolidayData[year][`${month}-${dayNum}`] = holiday.localName || holiday.name;
                    });
                }
            } catch (error) {
                console.error('Failed to load Japan holiday data:', error);
            }
        }
        
        this.renderCalendar();
    }

    isHoliday(year, month, day) {
        const currentYear = new Date().getFullYear();
        if (!this.showTaiwanHolidaysCheckbox.checked) return false;
        // Only check API data for current year and next year
        if (year === currentYear || year === currentYear + 1) {
            if (this.holidayData[year]) {
                return this.holidayData[year][`${month}-${day}`] !== undefined;
            }
        }
        return false;
    }

    getHolidayName(year, month, day) {
        const currentYear = new Date().getFullYear();
        if (!this.showTaiwanHolidaysCheckbox.checked) return null;
        // Only check API data for current year and next year
        if (year === currentYear || year === currentYear + 1) {
            if (this.holidayData[year]) {
                return this.holidayData[year][`${month}-${day}`] || null;
            }
        }
        return null;
    }

    isJapanHoliday(year, month, day) {
        const currentYear = new Date().getFullYear();
        if (!this.showJapanHolidaysCheckbox.checked) return false;
        if (year === currentYear || year === currentYear + 1) {
            if (this.japanHolidayData[year]) {
                return this.japanHolidayData[year][`${month}-${day}`] !== undefined;
            }
        }
        return false;
    }

    getJapanHolidayName(year, month, day) {
        const currentYear = new Date().getFullYear();
        if (!this.showJapanHolidaysCheckbox.checked) return null;
        if (year === currentYear || year === currentYear + 1) {
            if (this.japanHolidayData[year]) {
                return this.japanHolidayData[year][`${month}-${day}`] || null;
            }
        }
        return null;
    }

    downloadImage() {
        // Use html2canvas to capture the calendar card
        html2canvas(this.calendarCard, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: null
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `calendar-${this.yearInput.value}-${parseInt(this.monthInput.value) + 1}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    exportSettings() {
        const settings = {
            year: this.yearInput.value,
            month: this.monthInput.value,
            startDay: this.startDayInput.value,
            notes: this.notes,
            bgImage: this.currentBgImageData
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "calendar_settings.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                // Apply settings
                if (settings.year) this.yearInput.value = settings.year;
                if (settings.month) this.monthInput.value = settings.month;
                if (settings.startDay) this.startDayInput.value = settings.startDay;
                if (settings.notes) {
                    this.notes = settings.notes;
                    localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
                }
                
                if (settings.bgImage) {
                    this.currentBgImageData = settings.bgImage;
                    this.calendarImage.style.backgroundImage = `url('${settings.bgImage}')`;
                }

                this.renderCalendar();
                alert('設定匯入成功！');
            } catch (error) {
                console.error(error);
                alert('匯入失敗：檔案格式錯誤');
            }
            // Reset input
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    openModal(year, month, day) {
        this.currentSelectedDate = `${year}-${month}-${day}`;
        this.modalDateDisplay.textContent = `${year} / ${month + 1} / ${day}`;
        
        const noteData = this.notes[this.currentSelectedDate];
        if (noteData) {
            // Handle both old string format and new object format
            if (typeof noteData === 'string') {
                this.noteInput.value = noteData;
                this.currentSelectedColor = '#ffffff';
            } else {
                this.noteInput.value = noteData.text;
                this.currentSelectedColor = noteData.color || '#ffffff';
            }
        } else {
            this.noteInput.value = '';
            this.currentSelectedColor = '#ffffff';
        }

        // Update color selection UI
        this.colorOptions.forEach(opt => {
            if (opt.getAttribute('data-color') === this.currentSelectedColor) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        this.modal.classList.add('show');
        this.noteInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.currentSelectedDate = null;
    }

    saveNote() {
        if (this.currentSelectedDate) {
            const noteText = this.noteInput.value.trim();
            if (noteText) {
                this.notes[this.currentSelectedDate] = {
                    text: noteText,
                    color: this.currentSelectedColor
                };
            } else {
                delete this.notes[this.currentSelectedDate];
            }
            localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
            this.renderCalendar();
            this.closeModal();
        }
    }

    deleteNote() {
        if (this.currentSelectedDate) {
            delete this.notes[this.currentSelectedDate];
            localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
            this.renderCalendar();
            this.closeModal();
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentBgImageData = e.target.result; // Store for export
                this.calendarImage.style.backgroundImage = `url('${e.target.result}')`;
            };
            reader.readAsDataURL(file);
        }
    }

    renderCalendar() {
        const year = parseInt(this.yearInput.value);
        const month = parseInt(this.monthInput.value);
        const startDay = parseInt(this.startDayInput.value);

        // Title format: "2025 January"
        this.calendarTitle.textContent = `${year} ${this.monthNamesEN[month]}`;

        this.renderWeekdays(startDay);
        this.renderDays(year, month, startDay);
    }

    renderWeekdays(startDay) {
        this.weekdaysContainer.innerHTML = '';
        // Create array based on start day
        let labels = [...this.weekdayLabelsEN];
        if (startDay === 1) { // Monday start
            const sunday = labels.shift();
            labels.push(sunday);
        }

        labels.forEach(label => {
            const weekday = document.createElement('div');
            weekday.className = 'weekday';
            weekday.textContent = label;
            this.weekdaysContainer.appendChild(weekday);
        });
    }

    renderDays(year, month, startDay) {
        this.calendarGrid.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Adjust first day based on start day setting
        let adjustedFirstDay = (firstDay - startDay + 7) % 7;

        // Previous month's days
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            this.createDayElement(day, true, year, month - 1);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            this.createDayElement(day, false, year, month);
        }

        // Next month's days
        const totalCells = this.calendarGrid.children.length;
        const remainingCells = (42 - totalCells); // 6 weeks * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayElement(day, true, year, month + 1);
        }
    }

    createDayElement(day, isOtherMonth, year, month) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        // Adjust year and month for boundary cases
        let displayYear = year;
        let displayMonth = month;

        if (month < 0) {
            displayYear = year - 1;
            displayMonth = 11;
        } else if (month > 11) {
            displayYear = year + 1;
            displayMonth = 0;
        }

        // Check if it's a weekend (Saturday or Sunday) or holiday
        const date = new Date(displayYear, displayMonth, day);
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHolidayDay = this.isHoliday(displayYear, displayMonth, day);
        const holidayName = this.getHolidayName(displayYear, displayMonth, day);
        const isJapanHolidayDay = this.isJapanHoliday(displayYear, displayMonth, day);
        const japanHolidayName = this.getJapanHolidayName(displayYear, displayMonth, day);
        
        if (isWeekend && !isOtherMonth) {
            dayElement.classList.add('weekend');
        }

        // Only add holiday class if it's not a weekend
        if (isHolidayDay && !isOtherMonth && !isWeekend) {
            dayElement.classList.add('taiwan-holiday');
        }

        if (isJapanHolidayDay && !isOtherMonth && !isWeekend) {
            dayElement.classList.add('japan-holiday');
        }

        // Add tooltip for holidays
        const tooltips = [];
        if (holidayName && !isOtherMonth) {
            tooltips.push(`🇹🇼 ${holidayName}`);
        }
        if (japanHolidayName && !isOtherMonth) {
            tooltips.push(`🇯🇵 ${japanHolidayName}`);
        }
        if (tooltips.length > 0) {
            dayElement.setAttribute('title', tooltips.join('\n'));
        }

        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Check for note
        const noteKey = `${displayYear}-${displayMonth}-${day}`;
        const noteData = this.notes[noteKey];
        
        if (noteData && !isOtherMonth) {
            const noteElement = document.createElement('span');
            noteElement.className = 'day-note';
            
            // Handle both old string format and new object format
            if (typeof noteData === 'string') {
                noteElement.textContent = noteData;
            } else {
                noteElement.textContent = noteData.text;
                if (noteData.color && noteData.color !== '#ffffff') {
                    dayElement.style.backgroundColor = noteData.color;
                }
            }
            
            dayElement.appendChild(noteElement);
        }

        if (!isOtherMonth) {
            dayElement.addEventListener('click', () => {
                this.openModal(displayYear, displayMonth, day);
            });
        }

        this.calendarGrid.appendChild(dayElement);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarTool();
});

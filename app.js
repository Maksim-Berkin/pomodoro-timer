// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 20) + 's';
        particlesContainer.appendChild(particle);
    }
}
createParticles();

// Timer state
let timer = {
    minutes: 25,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    interval: null,
    currentSession: 'work',
    sessionCount: 0,
    totalFocusTime: 0,
    currentStreak: 0,
    totalBreaks: 0
};

// Settings
const settings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    soundEnabled: true,
    autoStart: false
};

// Audio
const audio = new Audio('data:audio/wav;base64,UklGRrQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZAFAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');

// DOM elements
const timeDisplay = document.getElementById('time');
const sessionInfo = document.getElementById('sessionInfo');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const progressCircle = document.getElementById('progress');
const sessionBadges = document.querySelectorAll('.session-badge');

// Statistics elements
const completedSessionsEl = document.getElementById('completedSessions');
const focusTimeEl = document.getElementById('focusTime');
const currentStreakEl = document.getElementById('currentStreak');
const totalBreaksEl = document.getElementById('totalBreaks');

// Settings elements
const workDurationInput = document.getElementById('workDuration');
const shortBreakInput = document.getElementById('shortBreak');
const longBreakInput = document.getElementById('longBreak');
const soundToggle = document.getElementById('soundToggle');
const autoStartToggle = document.getElementById('autoStartToggle');

// Update display
function updateDisplay() {
    const minutes = String(timer.minutes).padStart(2, '0');
    const seconds = String(timer.seconds).padStart(2, '0');
    timeDisplay.textContent = `${minutes}:${seconds}`;

    // Update progress circle
    const totalSeconds = settings[timer.currentSession] * 60;
    const currentSeconds = timer.minutes * 60 + timer.seconds;
    const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 722.57;
    progressCircle.style.strokeDashoffset = progress;

    // Update page title
    document.title = `${minutes}:${seconds} - Pomodoro Timer`;
}

// Start timer
function startTimer() {
    if (timer.isRunning && !timer.isPaused) return;

    timer.isRunning = true;
    timer.isPaused = false;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';

    sessionInfo.textContent = getSessionMessage();

    timer.interval = setInterval(() => {
        if (timer.seconds === 0) {
            if (timer.minutes === 0) {
                completeSession();
                return;
            }
            timer.minutes--;
            timer.seconds = 59;
        } else {
            timer.seconds--;
        }

        // Update focus time every minute for work sessions
        if (timer.currentSession === 'work' && timer.seconds === 0) {
            timer.totalFocusTime++;
            focusTimeEl.textContent = timer.totalFocusTime;
            saveStats();
        }

        updateDisplay();
    }, 1000);
}

// Pause timer
function pauseTimer() {
    timer.isPaused = true;
    timer.isRunning = false;
    clearInterval(timer.interval);
    pauseBtn.style.display = 'none';
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'Resume';
    sessionInfo.textContent = 'Paused';
}

// Reset timer
function resetTimer() {
    clearInterval(timer.interval);
    timer.isRunning = false;
    timer.isPaused = false;
    timer.minutes = settings[timer.currentSession];
    timer.seconds = 0;
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    startBtn.textContent = 'Start';
    sessionInfo.textContent = 'Ready to focus';
    updateDisplay();
}

// Skip to next session
function skipSession() {
    resetTimer();
    if (timer.currentSession === 'work') {
        if (timer.sessionCount % 4 === 3) {
            changeSession('long');
        } else {
            changeSession('short');
        }
    } else {
        changeSession('work');
    }
}

// Complete session
function completeSession() {
    clearInterval(timer.interval);

    if (settings.soundEnabled) {
        playNotification();
    }

    // Update stats
    if (timer.currentSession === 'work') {
        timer.sessionCount++;
        timer.currentStreak++;
        completedSessionsEl.textContent = timer.sessionCount;
        currentStreakEl.textContent = timer.currentStreak;
    } else {
        timer.totalBreaks++;
        totalBreaksEl.textContent = timer.totalBreaks;
    }

    saveStats();

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: `${timer.currentSession === 'work' ? 'Work' : 'Break'} session completed!`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>'
        });
    }

    // Auto-start next session
    if (settings.autoStart) {
        skipSession();
        startTimer();
    } else {
        skipSession();
    }
}

// Change session type
function changeSession(type) {
    const typeMap = { work: 'work', short: 'shortBreak', long: 'longBreak' };
    timer.currentSession = typeMap[type] || type;
    timer.minutes = settings[timer.currentSession];
    timer.seconds = 0;

    // Update badges
    sessionBadges.forEach(badge => {
        badge.classList.toggle('active', badge.dataset.type === type);
    });

    // Update display
    updateDisplay();
    sessionInfo.textContent = getSessionMessage();
}

// Get session message
function getSessionMessage() {
    const messages = {
        work: 'Time to focus! 🎯',
        shortBreak: 'Take a short break ☕',
        longBreak: 'Relax and recharge 🌟'
    };
    return messages[timer.currentSession];
}

// Play notification sound
function playNotification() {
    // Simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Save stats to localStorage
function saveStats() {
    const stats = {
        sessionCount: timer.sessionCount,
        totalFocusTime: timer.totalFocusTime,
        currentStreak: timer.currentStreak,
        totalBreaks: timer.totalBreaks,
        date: new Date().toDateString()
    };
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('pomodoroStats');
    if (saved) {
        const stats = JSON.parse(saved);
        // Reset if it's a new day
        if (stats.date !== new Date().toDateString()) {
            timer.sessionCount = 0;
            timer.totalFocusTime = 0;
            timer.currentStreak = 0;
            timer.totalBreaks = 0;
        } else {
            timer.sessionCount = stats.sessionCount || 0;
            timer.totalFocusTime = stats.totalFocusTime || 0;
            timer.currentStreak = stats.currentStreak || 0;
            timer.totalBreaks = stats.totalBreaks || 0;
        }

        completedSessionsEl.textContent = timer.sessionCount;
        focusTimeEl.textContent = timer.totalFocusTime;
        currentStreakEl.textContent = timer.currentStreak;
        totalBreaksEl.textContent = timer.totalBreaks;
    }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', skipSession);

sessionBadges.forEach(badge => {
    badge.addEventListener('click', () => {
        if (!timer.isRunning) {
            changeSession(badge.dataset.type);
        }
    });
});

// Settings listeners
workDurationInput.addEventListener('change', (e) => {
    settings.work = parseInt(e.target.value);
    if (timer.currentSession === 'work' && !timer.isRunning) {
        timer.minutes = settings.work;
        updateDisplay();
    }
});

shortBreakInput.addEventListener('change', (e) => {
    settings.shortBreak = parseInt(e.target.value);
    if (timer.currentSession === 'shortBreak' && !timer.isRunning) {
        timer.minutes = settings.shortBreak;
        updateDisplay();
    }
});

longBreakInput.addEventListener('change', (e) => {
    settings.longBreak = parseInt(e.target.value);
    if (timer.currentSession === 'longBreak' && !timer.isRunning) {
        timer.minutes = settings.longBreak;
        updateDisplay();
    }
});

soundToggle.addEventListener('change', (e) => {
    settings.soundEnabled = e.target.checked;
});

autoStartToggle.addEventListener('change', (e) => {
    settings.autoStart = e.target.checked;
});

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize
loadStats();
updateDisplay();
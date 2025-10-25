class SecuritySpecialistApp {
    constructor() {
        // User Authentication
        this.currentUser = null;
        this.users = this.loadUsers();
        
        // Mission and Data Management
        this.currentMission = null;
        this.missionLogs = this.loadMissionLogs();
        this.sites = this.loadSites();
        this.bolos = this.loadBolos();
        this.pois = this.loadPOIs();
        this.guardProfile = this.loadGuardProfile();
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        this.missionStartTime = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.autoSaveInterval = null;
        
        // Initialize authentication first
        this.initAuthentication();
    }

    initAuthentication() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.init();
        } else {
            this.showLoginScreen();
        }
    }

    loadUsers() {
        const defaultUsers = {
            // Guard users
            '0110': { badge: '0110', password: 'MobileUnit1', role: 'guard', name: 'Guard 0110' },
            '0220': { badge: '0220', password: 'MobileUnit1', role: 'guard', name: 'Guard 0220' },
            '0330': { badge: '0330', password: 'MobileUnit1', role: 'guard', name: 'Guard 0330' },
            '0440': { badge: '0440', password: 'MobileUnit1', role: 'guard', name: 'Guard 0440' },
            '0550': { badge: '0550', password: 'MobileUnit1', role: 'guard', name: 'Guard 0550' },
            '0660': { badge: '0660', password: 'MobileUnit1', role: 'guard', name: 'Guard 0660' },
            '0770': { badge: '0770', password: 'MobileUnit1', role: 'guard', name: 'Guard 0770' },
            '0880': { badge: '0880', password: 'MobileUnit1', role: 'guard', name: 'Guard 0880' },
            '0990': { badge: '0990', password: 'MobileUnit1', role: 'guard', name: 'Guard 0990' },
            // Management user
            '0099': { badge: '0099', password: 'MobileUnit1Management', role: 'management', name: 'Management' }
        };

        const savedUsers = localStorage.getItem('systemUsers');
        return savedUsers ? JSON.parse(savedUsers) : defaultUsers;
    }

    saveUsers() {
        localStorage.setItem('systemUsers', JSON.stringify(this.users));
    }

    showLoginScreen() {
        const mainContent = document.getElementById('mainContent');
        const loginScreen = document.getElementById('loginScreen');
        const mainHeader = document.getElementById('mainHeader');
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
        if (mainHeader) {
            mainHeader.style.display = 'none';
        }
        
        // Bind login events
        this.bindLoginEvents();
    }

    bindLoginEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const badgeInput = document.getElementById('badgeNumber');
        const passwordInput = document.getElementById('password');
        const loginError = document.getElementById('loginError');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        if (badgeInput) {
            badgeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    passwordInput.focus();
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }

        // Clear error on input
        [badgeInput, passwordInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    if (loginError) {
                        loginError.style.display = 'none';
                    }
                });
            }
        });
    }

    handleLogin() {
        const badgeInput = document.getElementById('badgeNumber');
        const passwordInput = document.getElementById('password');
        const loginError = document.getElementById('loginError');

        const badge = badgeInput.value.trim();
        const password = passwordInput.value.trim();

        if (!badge || !password) {
            this.showLoginError('Please enter both badge number and password');
            return;
        }

        const user = this.users[badge];
        if (!user || user.password !== password) {
            this.showLoginError('Invalid badge number or password');
            return;
        }

        // Successful login
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Log the access
        this.logAccess(user);
        
        // Hide login screen and show main app
        document.getElementById('loginScreen').style.display = 'none';
        this.init();
    }

    showLoginError(message) {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        }
    }

    logAccess(user) {
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        accessLogs.push({
            badge: user.badge,
            name: user.name,
            role: user.role,
            timestamp: new Date().toISOString(),
            action: 'login'
        });
        
        // Keep only last 1000 access logs
        if (accessLogs.length > 1000) {
            accessLogs.splice(0, accessLogs.length - 1000);
        }
        
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
    }

    logout() {
        if (this.currentUser) {
            this.logAccess({...this.currentUser, action: 'logout'});
        }
        
        // Clear current user
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Clear any active mission
        if (this.currentMission) {
            this.endMission();
        }
        
        // Show login screen
        location.reload(); // Simple reload to reset state
    }

    init() {
        // Show loading sequence
        this.showLoadingSequence().then(() => {
            this.updateUserInterface();
            this.bindEvents();
            this.restoreCurrentMission();
            if (!this.currentMission) {
                this.loadMainPage();
            }
            this.startAutoSave();
            this.addBeforeUnloadListener();
            this.addNavigationPrevention();
            this.addSecurityTerminalFeatures();
            
            // Initialize prompt system for desktop
            this.currentPrompt = null;
            this.promptCallback = null;
        });
    }

    updateUserInterface() {
        const mainHeader = document.getElementById('mainHeader');
        const currentUserEl = document.getElementById('currentUser');
        const userRoleEl = document.getElementById('userRole');
        const logoutBtn = document.getElementById('logoutBtn');

        if (mainHeader) {
            mainHeader.style.display = 'flex';
        }

        if (currentUserEl && this.currentUser) {
            currentUserEl.textContent = `Badge ${this.currentUser.badge} - ${this.currentUser.name}`;
        }

        if (userRoleEl && this.currentUser) {
            userRoleEl.textContent = this.currentUser.role === 'management' ? 'MANAGEMENT' : 'GUARD';
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Update header attributes for display
        if (mainHeader && this.currentUser) {
            mainHeader.setAttribute('data-badge', this.currentUser.badge);
            mainHeader.setAttribute('data-unit', `UNIT-${this.currentUser.badge}`);
        }
    }

    async showLoadingSequence() {
        return new Promise((resolve) => {
            const loadingSteps = [
                'Authenticating user credentials...',
                'Loading user permissions...',
                'Initializing security protocols...',
                'Loading database connections...',
                'Verifying system integrity...',
                'Establishing secure communications...',
                'System ready for operations'
            ];
            
            let currentStep = 0;
            const loadingContent = document.querySelector('.loading-content h2');
            const loadingScreen = document.querySelector('.loading-screen');
            
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
            }
            
            const stepInterval = setInterval(() => {
                if (currentStep < loadingSteps.length) {
                    if (loadingContent) {
                        loadingContent.textContent = loadingSteps[currentStep];
                    }
                    currentStep++;
                } else {
                    clearInterval(stepInterval);
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                    resolve();
                }
            }, 400);
        });
    }

    // Enhanced data loading methods for multi-user system
    loadMissionLogs() {
        const logs = localStorage.getItem('missionLogs');
        return logs ? JSON.parse(logs) : [];
    }

    saveMissionLogs() {
        localStorage.setItem('missionLogs', JSON.stringify(this.missionLogs));
    }

    // Add user information to mission logs
    addMissionLog(logData) {
        const log = {
            ...logData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId: this.currentUser?.badge,
            userName: this.currentUser?.name,
            userRole: this.currentUser?.role
        };
        
        this.missionLogs.unshift(log);
        this.saveMissionLogs();
        return log;
    }

    // Management-only functions
    isManagement() {
        return this.currentUser && this.currentUser.role === 'management';
    }

    canEditReport(report) {
        if (this.isManagement()) return true;
        return report.userId === this.currentUser?.badge;
    }

    // Enhanced report viewing for management
    getAllReports() {
        if (!this.isManagement()) {
            // Guards can only see their own reports and shared reports
            return this.missionLogs.filter(log => 
                log.userId === this.currentUser?.badge || log.shared === true
            );
        }
        // Management can see all reports
        return this.missionLogs;
    }

    // Add management notes to reports
    addManagementNote(reportId, note) {
        if (!this.isManagement()) {
            alert('Access denied: Management privileges required');
            return false;
        }

        const report = this.missionLogs.find(log => log.id === reportId);
        if (report) {
            if (!report.managementNotes) {
                report.managementNotes = [];
            }
            
            report.managementNotes.push({
                note: note,
                timestamp: new Date().toISOString(),
                addedBy: this.currentUser.name,
                badge: this.currentUser.badge
            });
            
            this.saveMissionLogs();
            return true;
        }
        return false;
    }

    isMobileDevice() {
        return window.innerWidth <= 1023 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Helper function to safely enable/disable buttons
    safeSetButtonState(buttonId, disabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = disabled;
        }
    }

    // Helper function to safely update status display
    safeUpdateStatus(text, className) {
        const statusElement = document.getElementById('missionStatus');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.className = className;
        }
    }

    handleDesktopCommandButton(button) {
        const buttonText = button.textContent.toLowerCase().trim();
        
        // Map button actions to console commands or prompts
        switch(buttonText) {
            case 'start mission':
                this.executeConsoleCommand('start');
                break;
            case 'go on site':
                this.startPromptSequence('onsite', [
                    { prompt: 'location:', key: 'location', required: true },
                    { prompt: 'details:', key: 'details', required: false }
                ]);
                break;
            case 'go off site':
                this.executeConsoleCommand('offsite');
                break;
            case 'add incident':
                this.startPromptSequence('incident', [
                    { prompt: 'type:', key: 'type', required: true },
                    { prompt: 'location:', key: 'location', required: true },
                    { prompt: 'description:', key: 'description', required: true }
                ]);
                break;
            case 'request backup':
                this.executeConsoleCommand('backup');
                break;
            case 'radio check':
                this.startPromptSequence('radio', [
                    { prompt: 'message:', key: 'message', required: true }
                ]);
                break;
            case 'end mission':
                this.executeConsoleCommand('end');
                break;
            case 'view logs':
                this.showLogsModal();
                break;
            default:
                this.addConsoleOutput(`Unknown command: ${buttonText}`, 'error');
        }
    }

    startPromptSequence(command, prompts) {
        if (this.isMobileDevice()) {
            // On mobile, use modal dialogs
            this.showMobilePromptModal(command, prompts);
        } else {
            // On desktop, use console prompts
            this.currentPromptSequence = { command, prompts, currentIndex: 0, data: {} };
            this.showNextPrompt();
        }
    }

    showNextPrompt() {
        if (!this.currentPromptSequence) return;
        
        const { prompts, currentIndex } = this.currentPromptSequence;
        
        if (currentIndex >= prompts.length) {
            // All prompts completed, execute command
            this.executePromptCommand();
            return;
        }
        
        const prompt = prompts[currentIndex];
        this.addConsoleOutput(`${prompt.prompt}`, 'command');
        this.currentPrompt = prompt;
        
        // Focus console input
        const consoleInput = document.getElementById('consoleInput');
        if (consoleInput) {
            consoleInput.focus();
        }
    }

    handlePromptInput(input) {
        if (!this.currentPrompt || !this.currentPromptSequence) return false;
        
        const { key, required } = this.currentPrompt;
        
        if (required && !input.trim()) {
            this.addConsoleOutput('This field is required', 'error');
            return false;
        }
        
        // Store the input
        this.currentPromptSequence.data[key] = input.trim();
        
        // Move to next prompt
        this.currentPromptSequence.currentIndex++;
        this.currentPrompt = null;
        
        // Show next prompt or execute command
        this.showNextPrompt();
        return true;
    }

    executePromptCommand() {
        if (!this.currentPromptSequence) return;
        
        const { command, data } = this.currentPromptSequence;
        
        // Build command string
        let commandStr = command;
        Object.values(data).forEach(value => {
            if (value) commandStr += ` ${value}`;
        });
        
        // Clear prompt sequence
        this.currentPromptSequence = null;
        
        // Execute the command
        this.executeConsoleCommand(commandStr);
    }

    showMobilePromptModal(command, prompts) {
        // Create modal for mobile input
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h2>${command.charAt(0).toUpperCase() + command.slice(1)} Information</h2>
            <span class="close">&times;</span>
        `;
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        const form = document.createElement('form');
        const formData = {};
        
        prompts.forEach((prompt, index) => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = prompt.prompt.replace(':', '');
            if (prompt.required) label.textContent += ' *';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `prompt_${index}`;
            input.required = prompt.required;
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
            
            formData[prompt.key] = input;
        });
        
        const formActions = document.createElement('div');
        formActions.className = 'form-actions';
        
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn-primary control-btn';
        submitBtn.textContent = 'Submit';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary control-btn';
        cancelBtn.textContent = 'Cancel';
        
        formActions.appendChild(cancelBtn);
        formActions.appendChild(submitBtn);
        form.appendChild(formActions);
        
        modalBody.appendChild(form);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event handlers
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modalHeader.querySelector('.close').addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect form data
            const data = {};
            let commandStr = command;
            
            prompts.forEach(prompt => {
                const input = formData[prompt.key];
                const value = input.value.trim();
                
                if (prompt.required && !value) {
                    input.focus();
                    return;
                }
                
                data[prompt.key] = value;
                if (value) commandStr += ` ${value}`;
            });
            
            closeModal();
            this.executeConsoleCommand(commandStr);
        });
        
        // Focus first input
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    bindEvents() {
        // Mobile-specific event binding
        if (this.isMobileDevice()) {
            this.bindMobileEvents();
        } else {
            this.bindDesktopEvents();
        }
        
        // Common events
        this.bindCommonEvents();
    }

    bindMobileEvents() {
        // Mobile button events will be bound when dashboard is loaded
    }

    bindDesktopEvents() {
        // Console input handling
        const consoleInput = document.getElementById('consoleInput');
        if (consoleInput) {
            consoleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const command = consoleInput.value.trim();
                    
                    if (this.currentPrompt) {
                        // Handle prompt input
                        if (this.handlePromptInput(command)) {
                            consoleInput.value = '';
                        }
                    } else if (command) {
                        // Handle regular command
                        consoleInput.value = '';
                        this.addConsoleOutput(`> ${command}`, 'command');
                        this.executeConsoleCommand(command);
                    }
                } else if (e.key === 'Escape') {
                    // Cancel current prompt sequence
                    if (this.currentPromptSequence) {
                        this.currentPromptSequence = null;
                        this.currentPrompt = null;
                        this.addConsoleOutput('Operation cancelled', 'warning');
                        consoleInput.value = '';
                    }
                }
            });
        }
    }

    bindCommonEvents() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
    }

    executeConsoleCommand(command) {
        const parts = command.toLowerCase().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'start':
                this.handleStartCommand(args);
                break;
            case 'end':
                this.handleEndCommand();
                break;
            case 'onsite':
                this.handleOnsiteCommand(args);
                break;
            case 'offsite':
                this.handleOffsiteCommand();
                break;
            case 'incident':
                this.handleIncidentCommand(args);
                break;
            case 'radio':
                this.handleRadioCommand(args);
                break;
            case 'backup':
                this.handleBackupCommand();
                break;
            case 'status':
                this.handleStatusCommand();
                break;
            case 'logs':
                this.showLogsModal();
                break;
            case 'sites':
                this.handleSitesCommand();
                break;
            case 'bolos':
                this.handleBolosCommand();
                break;
            case 'time':
                this.handleTimeCommand();
                break;
            case 'clear':
                this.clearConsole();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'code':
                this.handleCodeCommand(args);
                break;
            case 'bolo':
                this.handleBoloCommand(args);
                break;
            case 'patrol':
                this.handlePatrolCommand(args);
                break;
            case 'checkpoint':
                this.handleCheckpointCommand(args);
                break;
            case 'report':
                this.handleReportCommand(args);
                break;
            default:
                this.addConsoleOutput(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
        }
    }

    handleStartCommand(args) {
        if (this.currentMission) {
            this.addConsoleOutput('Mission already active. Use "end" to complete current mission first.', 'warning');
            return;
        }

        let missionType = 'General Patrol';
        let startTime = new Date();
        let endTime = null;
        let details = '';

        if (args.length > 0) {
            // Parse different start command formats
            if (args[0].match(/^\d{1,2}:\d{2}$/)) {
                // Professional time format: start 06:00 am end 14:00 pm details
                const timeArgs = args.join(' ');
                const timeMatch = timeArgs.match(/(\d{1,2}:\d{2})\s*(am|pm)?\s*end\s*(\d{1,2}:\d{2})\s*(am|pm)?\s*(.*)/i);
                
                if (timeMatch) {
                    const [, startTimeStr, startPeriod, endTimeStr, endPeriod, detailsStr] = timeMatch;
                    
                    // Parse start time
                    const [startHour, startMin] = startTimeStr.split(':').map(Number);
                    startTime = new Date();
                    let adjustedStartHour = startHour;
                    if (startPeriod && startPeriod.toLowerCase() === 'pm' && startHour !== 12) {
                        adjustedStartHour += 12;
                    } else if (startPeriod && startPeriod.toLowerCase() === 'am' && startHour === 12) {
                        adjustedStartHour = 0;
                    }
                    startTime.setHours(adjustedStartHour, startMin, 0, 0);
                    
                    // Parse end time
                    const [endHour, endMin] = endTimeStr.split(':').map(Number);
                    endTime = new Date();
                    let adjustedEndHour = endHour;
                    if (endPeriod && endPeriod.toLowerCase() === 'pm' && endHour !== 12) {
                        adjustedEndHour += 12;
                    } else if (endPeriod && endPeriod.toLowerCase() === 'am' && endHour === 12) {
                        adjustedEndHour = 0;
                    }
                    endTime.setHours(adjustedEndHour, endMin, 0, 0);
                    
                    // If end time is before start time, assume it's next day
                    if (endTime <= startTime) {
                        endTime.setDate(endTime.getDate() + 1);
                    }
                    
                    details = detailsStr.trim();
                    missionType = details || 'Scheduled Patrol';
                }
            } else {
                // Simple format: start [officer_name] or start [details]
                missionType = args.join(' ');
            }
        }

        this.currentMission = {
            id: Date.now().toString(),
            type: missionType,
            startTime: startTime.toISOString(),
            endTime: endTime ? endTime.toISOString() : null,
            status: 'active',
            details: details,
            userId: this.currentUser?.badge,
            userName: this.currentUser?.name
        };

        this.missionStartTime = startTime;
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        
        this.saveCurrentMission();
        this.updateDashboard();
        
        const timeStr = endTime ? 
            ` (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})` : 
            ` at ${startTime.toLocaleTimeString()}`;
        
        this.addConsoleOutput(`Mission started: ${missionType}${timeStr}`, 'success');
        this.addConsoleOutput('Use "status" to check mission details or "help" for available commands.', 'system');
    }

    handleEndCommand() {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission to end.', 'warning');
            return;
        }

        this.endMission();
    }

    endMission() {
        if (!this.currentMission) return;

        const endTime = new Date();
        const duration = this.missionStartTime ? 
            Math.round((endTime - this.missionStartTime) / (1000 * 60)) : 0;

        // Create mission log
        const missionLog = {
            id: this.currentMission.id,
            type: this.currentMission.type,
            startTime: this.currentMission.startTime,
            endTime: endTime.toISOString(),
            duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
            status: 'completed',
            details: this.currentMission.details,
            patrolStops: [...this.currentPatrolStops],
            incidents: [...this.currentIncidents],
            userId: this.currentUser?.badge,
            userName: this.currentUser?.name,
            userRole: this.currentUser?.role
        };

        this.addMissionLog(missionLog);

        // Clear current mission
        this.currentMission = null;
        this.missionStartTime = null;
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;

        localStorage.removeItem('currentMission');
        
        this.addConsoleOutput(`Mission completed. Duration: ${missionLog.duration}`, 'success');
        this.addConsoleOutput('Mission log saved to database.', 'system');
        
        this.loadMainPage();
    }

    handleOnsiteCommand(args) {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission. Start a mission first.', 'warning');
            return;
        }

        if (this.isOnSite) {
            this.addConsoleOutput('Already on site. Use "offsite" to leave current location first.', 'warning');
            return;
        }

        const location = args.join(' ') || 'Unknown Location';
        const arrivalTime = new Date();

        this.isOnSite = true;
        this.currentSiteStartTime = arrivalTime;

        const patrolStop = {
            id: Date.now().toString(),
            location: location,
            arrivalTime: arrivalTime.toISOString(),
            departureTime: null,
            duration: null,
            status: 'on-site'
        };

        this.currentPatrolStops.push(patrolStop);
        this.currentPatrolStop = patrolStop;
        
        this.saveCurrentMission();
        this.updateDashboard();
        
        this.addConsoleOutput(`Arrived on site: ${location} at ${arrivalTime.toLocaleTimeString()}`, 'success');
    }

    handleOffsiteCommand() {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission.', 'warning');
            return;
        }

        if (!this.isOnSite) {
            this.addConsoleOutput('Not currently on site.', 'warning');
            return;
        }

        const departureTime = new Date();
        
        if (this.currentPatrolStop && this.currentSiteStartTime) {
            const duration = Math.round((departureTime - this.currentSiteStartTime) / (1000 * 60));
            
            this.currentPatrolStop.departureTime = departureTime.toISOString();
            this.currentPatrolStop.duration = `${Math.floor(duration / 60)}h ${duration % 60}m`;
            this.currentPatrolStop.status = 'completed';
        }

        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        
        this.saveCurrentMission();
        this.updateDashboard();
        
        this.addConsoleOutput(`Departed site at ${departureTime.toLocaleTimeString()}`, 'success');
    }

    handleIncidentCommand(args) {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission. Start a mission first.', 'warning');
            return;
        }

        if (args.length < 3) {
            this.addConsoleOutput('Usage: incident [type] [location] [description]', 'error');
            return;
        }

        const type = args[0];
        const location = args[1];
        const description = args.slice(2).join(' ');

        const incident = {
            id: Date.now().toString(),
            type: type,
            location: location,
            description: description,
            timestamp: new Date().toISOString(),
            reportedBy: this.currentUser?.name,
            badge: this.currentUser?.badge,
            status: 'reported'
        };

        this.currentIncidents.push(incident);
        this.saveCurrentMission();
        
        this.addConsoleOutput(`Incident reported: ${type} at ${location}`, 'success');
        this.addConsoleOutput(`Description: ${description}`, 'system');
        this.addConsoleOutput(`Incident ID: ${incident.id}`, 'system');
    }

    handleRadioCommand(args) {
        const message = args.join(' ') || 'Radio check';
        
        this.addConsoleOutput(`[RADIO] ${this.currentUser?.name}: ${message}`, 'command');
        
        // Simulate dispatch response
        setTimeout(() => {
            const responses = [
                `Dispatch: Copy ${this.currentUser?.name}, message received loud and clear.`,
                `Dispatch: 10-4 ${this.currentUser?.badge}, all units be advised.`,
                `Dispatch: Roger ${this.currentUser?.name}, dispatch acknowledges.`,
                `Control: Copy your transmission ${this.currentUser?.badge}.`
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addConsoleOutput(`[RADIO] ${response}`, 'system');
        }, 1000 + Math.random() * 2000);
    }

    handleBackupCommand() {
        this.addConsoleOutput(`[EMERGENCY] Backup requested by ${this.currentUser?.name} (Badge ${this.currentUser?.badge})`, 'warning');
        this.addConsoleOutput('[EMERGENCY] Location: Current position', 'warning');
        this.addConsoleOutput('[EMERGENCY] Transmitting to all units and dispatch...', 'warning');
        
        setTimeout(() => {
            this.addConsoleOutput('[RADIO] Dispatch: All units, Code 3 backup requested. Respond to location.', 'system');
            this.addConsoleOutput('[RADIO] Unit 15: En route, ETA 5 minutes.', 'system');
            this.addConsoleOutput('[RADIO] Unit 23: Responding from sector 7.', 'system');
        }, 2000);
    }

    handleStatusCommand() {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission.', 'warning');
            return;
        }

        const now = new Date();
        const duration = this.missionStartTime ? 
            Math.round((now - this.missionStartTime) / (1000 * 60)) : 0;

        this.addConsoleOutput('=== MISSION STATUS ===', 'system');
        this.addConsoleOutput(`Mission: ${this.currentMission.type}`, 'system');
        this.addConsoleOutput(`Officer: ${this.currentUser?.name} (Badge ${this.currentUser?.badge})`, 'system');
        this.addConsoleOutput(`Start Time: ${new Date(this.currentMission.startTime).toLocaleString()}`, 'system');
        this.addConsoleOutput(`Duration: ${Math.floor(duration / 60)}h ${duration % 60}m`, 'system');
        this.addConsoleOutput(`Status: ${this.isOnSite ? 'ON SITE' : 'MOBILE'}`, 'system');
        
        if (this.currentPatrolStop) {
            this.addConsoleOutput(`Current Location: ${this.currentPatrolStop.location}`, 'system');
        }
        
        this.addConsoleOutput(`Patrol Stops: ${this.currentPatrolStops.length}`, 'system');
        this.addConsoleOutput(`Incidents: ${this.currentIncidents.length}`, 'system');
        this.addConsoleOutput('=====================', 'system');
    }

    handleSitesCommand() {
        this.addConsoleOutput('=== SAVED SITES ===', 'system');
        
        if (this.sites.length === 0) {
            this.addConsoleOutput('No saved sites.', 'system');
        } else {
            this.sites.forEach((site, index) => {
                this.addConsoleOutput(`${index + 1}. ${site.name} - ${site.description}`, 'system');
            });
        }
        
        this.addConsoleOutput('==================', 'system');
    }

    handleBolosCommand() {
        this.addConsoleOutput('=== ACTIVE BOLOs ===', 'system');
        
        if (this.bolos.length === 0) {
            this.addConsoleOutput('No active BOLOs.', 'system');
        } else {
            this.bolos.forEach((bolo, index) => {
                this.addConsoleOutput(`${index + 1}. ${bolo.subject}: ${bolo.description}`, 'system');
                this.addConsoleOutput(`   Added: ${new Date(bolo.timestamp).toLocaleString()}`, 'system');
            });
        }
        
        this.addConsoleOutput('===================', 'system');
    }

    handleTimeCommand() {
        const now = new Date();
        this.addConsoleOutput(`Current Time: ${now.toLocaleString()}`, 'system');
        this.addConsoleOutput(`UTC Time: ${now.toISOString()}`, 'system');
    }

    handleCodeCommand(args) {
        const code = args[0];
        
        const codes = {
            '10-4': 'Acknowledgment (OK)',
            '10-8': 'In service',
            '10-7': 'Out of service',
            '10-20': 'Location',
            '10-23': 'Arrived at scene',
            '10-24': 'Assignment completed',
            '10-99': 'Emergency - all units stand by',
            '10-33': 'Emergency traffic',
            '10-54': 'Possible dead body',
            '10-56': 'Intoxicated person',
            '10-80': 'Chase in progress',
            '11-99': 'Officer needs help',
            'Code 1': 'Respond at normal speed',
            'Code 2': 'Respond quickly, no lights/siren',
            'Code 3': 'Respond emergency, lights and siren'
        };

        if (!code) {
            this.addConsoleOutput('=== SECURITY CODES ===', 'system');
            Object.entries(codes).forEach(([c, desc]) => {
                this.addConsoleOutput(`${c}: ${desc}`, 'system');
            });
            this.addConsoleOutput('=====================', 'system');
        } else {
            const description = codes[code] || codes[code.toUpperCase()];
            if (description) {
                this.addConsoleOutput(`${code}: ${description}`, 'system');
            } else {
                this.addConsoleOutput(`Unknown code: ${code}`, 'error');
            }
        }
    }

    handleBoloCommand(args) {
        if (args.length < 2) {
            this.addConsoleOutput('Usage: bolo [subject] [description]', 'error');
            return;
        }

        const subject = args[0];
        const description = args.slice(1).join(' ');

        const bolo = {
            id: Date.now().toString(),
            subject: subject,
            description: description,
            timestamp: new Date().toISOString(),
            addedBy: this.currentUser?.name,
            badge: this.currentUser?.badge,
            status: 'active'
        };

        this.bolos.push(bolo);
        this.saveBolos();
        
        this.addConsoleOutput(`BOLO created for: ${subject}`, 'success');
        this.addConsoleOutput(`Description: ${description}`, 'system');
        this.addConsoleOutput(`BOLO ID: ${bolo.id}`, 'system');
    }

    handlePatrolCommand(args) {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission. Start a mission first.', 'warning');
            return;
        }

        const location = args.join(' ') || 'Patrol Route';
        
        this.addConsoleOutput(`Beginning patrol: ${location}`, 'success');
        this.addConsoleOutput('Use "onsite [location]" when arriving at checkpoints.', 'system');
    }

    handleCheckpointCommand(args) {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission. Start a mission first.', 'warning');
            return;
        }

        if (args.length < 2) {
            this.addConsoleOutput('Usage: checkpoint [name] [status]', 'error');
            return;
        }

        const name = args[0];
        const status = args.slice(1).join(' ');

        const checkpoint = {
            id: Date.now().toString(),
            name: name,
            status: status,
            timestamp: new Date().toISOString(),
            officer: this.currentUser?.name,
            badge: this.currentUser?.badge
        };

        // Add to current mission data
        if (!this.currentMission.checkpoints) {
            this.currentMission.checkpoints = [];
        }
        this.currentMission.checkpoints.push(checkpoint);
        
        this.saveCurrentMission();
        
        this.addConsoleOutput(`Checkpoint logged: ${name} - ${status}`, 'success');
    }

    handleReportCommand(args) {
        if (!this.currentMission) {
            this.addConsoleOutput('No active mission. Start a mission first.', 'warning');
            return;
        }

        const summary = args.join(' ') || 'General report';
        
        const report = {
            id: Date.now().toString(),
            summary: summary,
            timestamp: new Date().toISOString(),
            missionId: this.currentMission.id,
            officer: this.currentUser?.name,
            badge: this.currentUser?.badge,
            type: 'general'
        };

        this.addMissionLog(report);
        
        this.addConsoleOutput(`Report filed: ${summary}`, 'success');
        this.addConsoleOutput(`Report ID: ${report.id}`, 'system');
    }

    clearConsole() {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            consoleOutput.innerHTML = '';
        }
    }

    showHelp() {
        this.addConsoleOutput('=== AVAILABLE COMMANDS ===', 'system');
        this.addConsoleOutput('Mission Control:', 'system');
        this.addConsoleOutput('  start [details] - Start new mission', 'system');
        this.addConsoleOutput('  end - End current mission', 'system');
        this.addConsoleOutput('  status - Show mission status', 'system');
        this.addConsoleOutput('', 'system');
        this.addConsoleOutput('Site Operations:', 'system');
        this.addConsoleOutput('  onsite [location] - Arrive at location', 'system');
        this.addConsoleOutput('  offsite - Depart current location', 'system');
        this.addConsoleOutput('  patrol [location] - Begin patrol', 'system');
        this.addConsoleOutput('  checkpoint [name] [status] - Log checkpoint', 'system');
        this.addConsoleOutput('', 'system');
        this.addConsoleOutput('Incident Reporting:', 'system');
        this.addConsoleOutput('  incident [type] [location] [description]', 'system');
        this.addConsoleOutput('  bolo [subject] [description] - Create BOLO', 'system');
        this.addConsoleOutput('  report [summary] - File general report', 'system');
        this.addConsoleOutput('', 'system');
        this.addConsoleOutput('Communication:', 'system');
        this.addConsoleOutput('  radio [message] - Radio check', 'system');
        this.addConsoleOutput('  backup - Request emergency backup', 'system');
        this.addConsoleOutput('  code [code] - Look up security codes', 'system');
        this.addConsoleOutput('', 'system');
        this.addConsoleOutput('System:', 'system');
        this.addConsoleOutput('  logs - View mission history', 'system');
        this.addConsoleOutput('  sites - List saved sites', 'system');
        this.addConsoleOutput('  bolos - List active BOLOs', 'system');
        this.addConsoleOutput('  time - Show current time', 'system');
        this.addConsoleOutput('  clear - Clear console', 'system');
        this.addConsoleOutput('  help - Show this help', 'system');
        this.addConsoleOutput('==========================', 'system');
    }

    addConsoleOutput(text, type = 'output') {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;

        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'console-timestamp';
        timestamp.textContent = `[${new Date().toLocaleTimeString()}] `;
        
        const content = document.createElement('span');
        content.className = `console-${type}-text`;
        content.textContent = text;
        
        line.appendChild(timestamp);
        line.appendChild(content);
        consoleOutput.appendChild(line);
        
        // Scroll to bottom
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    loadMainPage() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="main-screen">
                <div class="mission-selection">
                    <h2>Select Mission Type</h2>
                    <div class="mission-cards">
                        <div class="mission-card" data-mission="fixed-post">
                            <div class="mission-icon">🏢</div>
                            <h3>Fixed Post</h3>
                            <p>Stationary security assignment at designated location with access control and monitoring duties</p>
                        </div>
                        <div class="mission-card" data-mission="mobile-patrol">
                            <div class="mission-icon">🚗</div>
                            <h3>Mobile Patrol</h3>
                            <p>Vehicle-based patrol covering multiple locations with periodic security checks and response duties</p>
                        </div>
                        <div class="mission-card" data-mission="desk-duty">
                            <div class="mission-icon">💻</div>
                            <h3>Desk Duty</h3>
                            <p>Administrative security operations including monitoring systems and coordinating communications</p>
                        </div>
                    </div>
                    <div class="database-buttons">
                        <button id="logsBtn" class="nav-btn">View All Reports</button>
                        ${this.isManagement() ? '<button id="managementBtn" class="nav-btn">Management Panel</button>' : ''}
                        <button id="profileBtn" class="nav-btn">Profile</button>
                    </div>
                </div>
            </div>
        `;

        this.bindMainPageEvents();
    }

    bindMainPageEvents() {
        // Mission card events
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('click', () => {
                const missionType = card.dataset.mission;
                this.startMissionType(missionType);
            });
        });

        // Navigation button events
        const logsBtn = document.getElementById('logsBtn');
        if (logsBtn) {
            logsBtn.addEventListener('click', () => this.showLogsModal());
        }

        const managementBtn = document.getElementById('managementBtn');
        if (managementBtn && this.isManagement()) {
            managementBtn.addEventListener('click', () => this.showManagementPanel());
        }

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfileModal());
        }
    }

    startMissionType(missionType) {
        const missionNames = {
            'fixed-post': 'Fixed Post Security',
            'mobile-patrol': 'Mobile Patrol',
            'desk-duty': 'Desk Duty Operations'
        };

        const missionName = missionNames[missionType] || 'Security Mission';
        this.executeConsoleCommand(`start ${missionName}`);
    }

    updateDashboard() {
        if (!this.currentMission) return;

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const duration = this.missionStartTime ? 
            Math.round((new Date() - this.missionStartTime) / (1000 * 60)) : 0;

        mainContent.innerHTML = `
            <div class="main-screen">
                <div class="dashboard">
                    <div class="dashboard-header">
                        <div class="mission-info">
                            <h2>${this.currentMission.type}</h2>
                            <div class="mission-status ${this.isOnSite ? 'status-onsite' : 'status-active'}">
                                ${this.isOnSite ? 'ON SITE' : 'ACTIVE'}
                            </div>
                        </div>
                        <div class="mission-time">
                            Duration: ${Math.floor(duration / 60)}h ${duration % 60}m
                        </div>
                    </div>

                    <div class="dashboard-controls">
                        ${!this.isOnSite ? 
                            '<button class="control-btn btn-primary" onclick="app.handleDesktopCommandButton(this)">Go On Site</button>' :
                            '<button class="control-btn btn-warning" onclick="app.handleDesktopCommandButton(this)">Go Off Site</button>'
                        }
                        <button class="control-btn btn-info" onclick="app.handleDesktopCommandButton(this)">Add Incident</button>
                        <button class="control-btn btn-warning" onclick="app.handleDesktopCommandButton(this)">Request Backup</button>
                        <button class="control-btn btn-info" onclick="app.handleDesktopCommandButton(this)">Radio Check</button>
                        <button class="control-btn btn-success" onclick="app.handleDesktopCommandButton(this)">View Logs</button>
                        <button class="control-btn btn-danger" onclick="app.handleDesktopCommandButton(this)">End Mission</button>
                    </div>

                    ${this.currentPatrolStops.length > 0 ? `
                        <div class="patrol-stops">
                            <h3>Recent Patrol Stops</h3>
                            ${this.currentPatrolStops.slice(-5).map(stop => `
                                <div class="patrol-stop">
                                    <div class="patrol-stop-time">${new Date(stop.arrivalTime).toLocaleTimeString()}</div>
                                    <div class="patrol-stop-location">${stop.location} - ${stop.status}</div>
                                    ${stop.duration ? `<div class="patrol-stop-duration">Duration: ${stop.duration}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${!this.isMobileDevice() ? `
                        <div class="command-console">
                            <div id="consoleOutput" class="console-output"></div>
                            <div class="console-input-row">
                                <span class="prompt">${this.currentUser?.badge}></span>
                                <input type="text" id="consoleInput" placeholder="Enter command..." autocomplete="off">
                            </div>
                            <div class="console-hint">
                                Type 'help' for available commands. Press Enter to execute, ESC to cancel prompts.
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Re-bind desktop events if not mobile
        if (!this.isMobileDevice()) {
            this.bindDesktopEvents();
            
            // Add welcome message to console
            setTimeout(() => {
                this.addConsoleOutput(`Mission active: ${this.currentMission.type}`, 'success');
                this.addConsoleOutput('Console ready for commands. Type "help" for assistance.', 'system');
            }, 100);
        }
    }

    showLogsModal() {
        const modal = document.getElementById('logsModal');
        if (!modal) return;

        const logsList = document.getElementById('logsList');
        if (!logsList) return;

        const reports = this.getAllReports();
        
        if (reports.length === 0) {
            logsList.innerHTML = '<p>No reports available.</p>';
        } else {
            logsList.innerHTML = reports.map(log => `
                <div class="mission-log">
                    <div class="mission-log-header">
                        <div>
                            <div class="mission-log-title">${log.type || log.summary || 'Mission Report'}</div>
                            <div class="mission-log-date">
                                ${new Date(log.timestamp || log.startTime).toLocaleString()} 
                                - ${log.userName || log.officer || 'Unknown'} (Badge ${log.userId || log.badge || 'N/A'})
                            </div>
                        </div>
                        <div class="mission-log-actions">
                            <button class="btn-small btn-info" onclick="app.viewReportDetails('${log.id}')">View</button>
                            ${this.canEditReport(log) ? `<button class="btn-small btn-warning" onclick="app.editReport('${log.id}')">Edit</button>` : ''}
                            ${this.isManagement() ? `<button class="btn-small btn-success" onclick="app.addManagementNotePrompt('${log.id}')">Add Note</button>` : ''}
                        </div>
                    </div>
                    ${log.details ? `<div class="mission-log-details">${log.details}</div>` : ''}
                    ${log.managementNotes && log.managementNotes.length > 0 ? `
                        <div class="management-notes">
                            <strong>Management Notes:</strong>
                            ${log.managementNotes.map(note => `
                                <div class="management-note">
                                    <small>${new Date(note.timestamp).toLocaleString()} - ${note.addedBy}:</small>
                                    <div>${note.note}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        modal.style.display = 'block';
    }

    viewReportDetails(reportId) {
        const report = this.missionLogs.find(log => log.id === reportId);
        if (!report) return;

        // Create detailed view modal
        const detailModal = document.createElement('div');
        detailModal.className = 'modal';
        detailModal.style.display = 'block';
        
        detailModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Report Details</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="copy-area">
                        <strong>Report ID:</strong> ${report.id}<br>
                        <strong>Type:</strong> ${report.type || report.summary || 'General Report'}<br>
                        <strong>Officer:</strong> ${report.userName || report.officer} (Badge ${report.userId || report.badge})<br>
                        <strong>Date/Time:</strong> ${new Date(report.timestamp || report.startTime).toLocaleString()}<br>
                        ${report.endTime ? `<strong>End Time:</strong> ${new Date(report.endTime).toLocaleString()}<br>` : ''}
                        ${report.duration ? `<strong>Duration:</strong> ${report.duration}<br>` : ''}
                        ${report.details ? `<strong>Details:</strong> ${report.details}<br>` : ''}
                        
                        ${report.patrolStops && report.patrolStops.length > 0 ? `
                            <br><strong>Patrol Stops:</strong><br>
                            ${report.patrolStops.map(stop => 
                                `- ${stop.location} (${new Date(stop.arrivalTime).toLocaleTimeString()}${stop.duration ? `, ${stop.duration}` : ''})`
                            ).join('<br>')}
                        ` : ''}
                        
                        ${report.incidents && report.incidents.length > 0 ? `
                            <br><strong>Incidents:</strong><br>
                            ${report.incidents.map(incident => 
                                `- ${incident.type} at ${incident.location}: ${incident.description}`
                            ).join('<br>')}
                        ` : ''}
                        
                        ${report.managementNotes && report.managementNotes.length > 0 ? `
                            <br><strong>Management Notes:</strong><br>
                            ${report.managementNotes.map(note => 
                                `- ${new Date(note.timestamp).toLocaleString()} (${note.addedBy}): ${note.note}`
                            ).join('<br>')}
                        ` : ''}
                    </div>
                    <div class="form-actions">
                        <button class="btn-secondary control-btn" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailModal);
        
        // Close handler
        detailModal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(detailModal);
        });
    }

    editReport(reportId) {
        if (!this.canEditReport(this.missionLogs.find(log => log.id === reportId))) {
            alert('Access denied: You can only edit your own reports or you need management privileges.');
            return;
        }

        // Implementation for editing reports would go here
        alert('Edit functionality would be implemented here');
    }

    addManagementNotePrompt(reportId) {
        if (!this.isManagement()) {
            alert('Access denied: Management privileges required');
            return;
        }

        const note = prompt('Enter management note:');
        if (note && note.trim()) {
            if (this.addManagementNote(reportId, note.trim())) {
                alert('Management note added successfully');
                this.showLogsModal(); // Refresh the modal
            } else {
                alert('Failed to add management note');
            }
        }
    }

    showManagementPanel() {
        if (!this.isManagement()) {
            alert('Access denied: Management privileges required');
            return;
        }

        // Create management panel modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        const recentAccess = accessLogs.slice(-20).reverse();
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Management Panel</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="popup-menu">
                        <div class="popup-menu-title">Management Dashboard</div>
                        
                        <div class="menu-options">
                            <div class="menu-option-card" onclick="app.showAllReportsManagement()">
                                <div class="menu-option-icon">📊</div>
                                <div class="menu-option-title">All Reports</div>
                                <div class="menu-option-desc">View and manage all guard reports</div>
                            </div>
                            
                            <div class="menu-option-card" onclick="app.showUserManagement()">
                                <div class="menu-option-icon">👥</div>
                                <div class="menu-option-title">User Management</div>
                                <div class="menu-option-desc">Manage guard accounts and permissions</div>
                            </div>
                            
                            <div class="menu-option-card" onclick="app.showSystemStats()">
                                <div class="menu-option-icon">📈</div>
                                <div class="menu-option-title">System Statistics</div>
                                <div class="menu-option-desc">View system usage and statistics</div>
                            </div>
                            
                            <div class="menu-option-card" onclick="app.exportAllData()">
                                <div class="menu-option-icon">💾</div>
                                <div class="menu-option-title">Export Data</div>
                                <div class="menu-option-desc">Export all system data</div>
                            </div>
                        </div>
                        
                        <div class="recent-access">
                            <h3>Recent Access Log</h3>
                            <div class="copy-area" style="max-height: 200px;">
                                ${recentAccess.length > 0 ? 
                                    recentAccess.map(log => 
                                        `${new Date(log.timestamp).toLocaleString()} - ${log.name} (${log.badge}) - ${log.action}`
                                    ).join('<br>') :
                                    'No recent access logs'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handler
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showAllReportsManagement() {
        // Close current modal and show enhanced reports view
        document.querySelector('.modal').remove();
        this.showLogsModal();
    }

    showUserManagement() {
        alert('User management functionality would be implemented here');
    }

    showSystemStats() {
        const stats = {
            totalUsers: Object.keys(this.users).length,
            totalReports: this.missionLogs.length,
            activeGuards: Object.values(this.users).filter(u => u.role === 'guard').length,
            managementUsers: Object.values(this.users).filter(u => u.role === 'management').length
        };

        alert(`System Statistics:
Total Users: ${stats.totalUsers}
Active Guards: ${stats.activeGuards}
Management Users: ${stats.managementUsers}
Total Reports: ${stats.totalReports}`);
    }

    exportAllData() {
        const data = {
            users: this.users,
            missionLogs: this.missionLogs,
            sites: this.sites,
            bolos: this.bolos,
            accessLogs: JSON.parse(localStorage.getItem('accessLogs') || '[]'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sigsecspec_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showProfileModal() {
        // Implementation for profile modal would go here
        alert(`Profile: ${this.currentUser?.name}
Badge: ${this.currentUser?.badge}
Role: ${this.currentUser?.role}
Status: Active`);
    }

    // Data loading and saving methods
    loadSites() {
        const sites = localStorage.getItem('sites');
        return sites ? JSON.parse(sites) : [
            { id: '1', name: 'Main Entrance', description: 'Primary building entrance checkpoint' },
            { id: '2', name: 'Parking Garage', description: 'Underground parking security point' },
            { id: '3', name: 'Loading Dock', description: 'Rear building loading area' }
        ];
    }

    saveSites() {
        localStorage.setItem('sites', JSON.stringify(this.sites));
    }

    loadBolos() {
        const bolos = localStorage.getItem('bolos');
        return bolos ? JSON.parse(bolos) : [];
    }

    saveBolos() {
        localStorage.setItem('bolos', JSON.stringify(this.bolos));
    }

    loadPOIs() {
        const pois = localStorage.getItem('pois');
        return pois ? JSON.parse(pois) : [];
    }

    savePOIs() {
        localStorage.setItem('pois', JSON.stringify(this.pois));
    }

    loadGuardProfile() {
        const profile = localStorage.getItem('guardProfile');
        return profile ? JSON.parse(profile) : {
            name: this.currentUser?.name || 'Security Officer',
            badge: this.currentUser?.badge || '0000',
            department: 'Security',
            shift: 'Day Shift'
        };
    }

    saveGuardProfile() {
        localStorage.setItem('guardProfile', JSON.stringify(this.guardProfile));
    }

    saveCurrentMission() {
        if (this.currentMission) {
            localStorage.setItem('currentMission', JSON.stringify({
                mission: this.currentMission,
                patrolStops: this.currentPatrolStops,
                incidents: this.currentIncidents,
                missionStartTime: this.missionStartTime,
                isOnSite: this.isOnSite,
                currentSiteStartTime: this.currentSiteStartTime,
                currentPatrolStop: this.currentPatrolStop
            }));
        }
    }

    restoreCurrentMission() {
        const saved = localStorage.getItem('currentMission');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Only restore if it belongs to current user
            if (data.mission && data.mission.userId === this.currentUser?.badge) {
                this.currentMission = data.mission;
                this.currentPatrolStops = data.patrolStops || [];
                this.currentIncidents = data.incidents || [];
                this.missionStartTime = data.missionStartTime ? new Date(data.missionStartTime) : null;
                this.isOnSite = data.isOnSite || false;
                this.currentSiteStartTime = data.currentSiteStartTime ? new Date(data.currentSiteStartTime) : null;
                this.currentPatrolStop = data.currentPatrolStop || null;
                
                this.updateDashboard();
            } else {
                // Clear mission if it doesn't belong to current user
                localStorage.removeItem('currentMission');
            }
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveCurrentMission();
        }, 30000); // Auto-save every 30 seconds
    }

    addBeforeUnloadListener() {
        window.addEventListener('beforeunload', (e) => {
            if (this.currentMission) {
                this.saveCurrentMission();
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    addNavigationPrevention() {
        // Prevent accidental navigation during active missions
        let isNavigating = false;
        
        window.addEventListener('beforeunload', () => {
            isNavigating = true;
        });
        
        document.addEventListener('click', (e) => {
            if (this.currentMission && e.target.tagName === 'A' && !isNavigating) {
                if (!confirm('You have an active mission. Are you sure you want to navigate away?')) {
                    e.preventDefault();
                }
            }
        });
    }

    addSecurityTerminalFeatures() {
        // Add keyboard shortcuts for desktop
        if (!this.isMobileDevice()) {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'h':
                            e.preventDefault();
                            this.showHelp();
                            break;
                        case 'l':
                            e.preventDefault();
                            this.showLogsModal();
                            break;
                        case 's':
                            e.preventDefault();
                            if (this.currentMission) {
                                this.handleStatusCommand();
                            }
                            break;
                    }
                }
            });
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SecuritySpecialistApp();
});
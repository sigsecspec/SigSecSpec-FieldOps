class SecuritySpecialistApp {
    constructor() {
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
        
        this.init();
    }

    init() {
        // Show loading sequence
        this.showLoadingSequence().then(() => {
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

    async showLoadingSequence() {
        return new Promise((resolve) => {
            const loadingSteps = [
                'Initializing security protocols...',
                'Loading database connections...',
                'Verifying system integrity...',
                'Establishing secure communications...',
                'System ready for operations'
            ];
            
            let currentStep = 0;
            const loadingContent = document.querySelector('.loading-content h2');
            
            const stepInterval = setInterval(() => {
                if (currentStep < loadingSteps.length) {
                    if (loadingContent) {
                        loadingContent.textContent = loadingSteps[currentStep];
                    }
                    currentStep++;
                } else {
                    clearInterval(stepInterval);
                    resolve();
                }
            }, 400);
        });
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

    // Mobile-specific helper functions

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
                ], (data) => {
                    this.executeConsoleCommand(`onsite ${data.location} ${data.details || ''}`);
                });
                break;
            case 'go off site':
                this.executeConsoleCommand('offsite');
                break;
            case 'report incident':
                this.startPromptSequence('incident', [
                    { prompt: 'type:', key: 'type', required: true },
                    { prompt: 'location:', key: 'location', required: true },
                    { prompt: 'description:', key: 'description', required: true },
                    { prompt: 'action taken:', key: 'action', required: false }
                ], (data) => {
                    this.executeConsoleCommand(`incident ${data.type} ${data.location} ${data.description} ${data.action || ''}`);
                });
                break;
            case 'add check':
                this.startPromptSequence('check', [
                    { prompt: 'check name:', key: 'name', required: true },
                    { prompt: 'status:', key: 'status', required: true },
                    { prompt: 'notes:', key: 'notes', required: false }
                ], (data) => {
                    this.executeConsoleCommand(`check ${data.name} ${data.status} ${data.notes || ''}`);
                });
                break;
            case 'mission report':
                this.startPromptSequence('report', [
                    { prompt: 'summary:', key: 'summary', required: true }
                ], (data) => {
                    this.executeConsoleCommand(`report ${data.summary}`);
                });
                break;
            case 'end mission':
                this.executeConsoleCommand('end');
                break;
            default:
                this.consoleWrite(`Unknown button command: ${buttonText}`);
        }
    }

    executeConsoleCommand(command) {
        // Simulate typing the command in console
        const input = document.getElementById('consoleInput');
        if (input) {
            input.value = command;
            this.handleCommand(command);
            input.value = '';
        }
    }

    // Enhanced step-by-step command interface
    startStepByStepCommand(commandName, steps, callback) {
        this.currentStepByStep = {
            commandName,
            steps,
            callback,
            currentIndex: 0,
            data: {},
            cancelled: false
        };
        
        this.consoleWrite(`=== ${commandName.toUpperCase()} COMMAND - STEP BY STEP ===`);
        this.consoleWrite('Use ENTER to complete each step, TAB to cancel at any time');
        this.consoleWrite('');
        this.showNextStep();
    }

    showNextStep() {
        if (!this.currentStepByStep || this.currentStepByStep.cancelled) return;
        
        const stepData = this.currentStepByStep;
        if (stepData.currentIndex >= stepData.steps.length) {
            // All steps completed, execute callback
            this.resetConsolePrompt();
            stepData.callback(stepData.data);
            this.currentStepByStep = null;
            return;
        }
        
        const currentStep = stepData.steps[stepData.currentIndex];
        this.currentStep = currentStep;
        
        // Show the step in console with clear formatting
        const stepText = currentStep.required ? 
            `Step ${stepData.currentIndex + 1}/${stepData.steps.length}: ${currentStep.prompt} (required)` : 
            `Step ${stepData.currentIndex + 1}/${stepData.steps.length}: ${currentStep.prompt} (optional - press Enter to skip)`;
        
        this.consoleWrite(stepText);
        
        // Update the console input prompt to show the current step
        this.updateConsolePrompt(`${currentStep.prompt}`);
        
        // Set up the input to handle this step
        this.setupStepInput();
    }

    setupStepInput() {
        const input = document.getElementById('consoleInput');
        if (!input) return;
        
        // Remove any existing listeners
        if (this.stepKeyListener) {
            input.removeEventListener('keydown', this.stepKeyListener);
        }
        
        this.stepKeyListener = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleStepInput(input.value.trim());
                input.value = '';
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.cancelStepByStep();
            }
        };
        
        input.addEventListener('keydown', this.stepKeyListener);
        input.focus();
    }

    handleStepInput(value) {
        if (!this.currentStepByStep || !this.currentStep) return;
        
        const stepData = this.currentStepByStep;
        const step = this.currentStep;
        
        // Validate required fields
        if (step.required && !value) {
            this.consoleWrite(`ERROR: ${step.prompt} is required. Please enter a value.`);
            return;
        }
        
        // Store the value
        stepData.data[step.key] = value;
        
        // Show what was entered
        if (value) {
            this.consoleWrite(`✓ ${step.prompt}: ${value}`);
        } else {
            this.consoleWrite(`✓ ${step.prompt}: (skipped)`);
        }
        
        // Move to next step
        stepData.currentIndex++;
        this.currentStep = null;
        
        // Remove step listener and show next step
        const input = document.getElementById('consoleInput');
        if (input && this.stepKeyListener) {
            input.removeEventListener('keydown', this.stepKeyListener);
            this.stepKeyListener = null;
        }
        
        this.showNextStep();
    }

    cancelStepByStep() {
        if (!this.currentStepByStep) return;
        
        this.consoleWrite('');
        this.consoleWrite('❌ Command cancelled by user');
        this.consoleWrite('');
        
        // Clean up
        this.currentStepByStep.cancelled = true;
        this.currentStepByStep = null;
        this.currentStep = null;
        
        // Remove listeners and reset prompt
        const input = document.getElementById('consoleInput');
        if (input && this.stepKeyListener) {
            input.removeEventListener('keydown', this.stepKeyListener);
            this.stepKeyListener = null;
        }
        
        this.resetConsolePrompt();
    }

    startPromptSequence(command, prompts, callback) {
        if (this.isMobileDevice()) {
            // On mobile, use modal dialogs
            this.showMobilePromptModal(command, prompts, callback);
        } else {
            // On desktop, use step-by-step console interface
            this.startStepByStepCommand(command, prompts, callback);
        }
    }

    showMobilePromptModal(command, prompts, callback) {
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
            
            prompts.forEach(prompt => {
                const input = formData[prompt.key];
                const value = input.value.trim();
                
                if (prompt.required && !value) {
                    input.focus();
                    return;
                }
                
                data[prompt.key] = value;
            });
            
            closeModal();
            callback(data);
        });
        
        // Focus first input
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    updateConsolePrompt(promptText) {
        const promptElement = document.querySelector('.prompt');
        if (promptElement) {
            promptElement.textContent = promptText || 'SIGSECSPEC>';
        }
    }

    resetConsolePrompt() {
        this.updateConsolePrompt('SIGSECSPEC>');
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
                    
                    if (this.currentStepByStep && !this.currentStepByStep.cancelled) {
                        // Let the step-by-step handler manage this
                        return;
                    }
                    
                    if (command) {
                        consoleInput.value = '';
                        this.consoleWrite(`> ${command}`);
                        this.handleCommand(command);
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

    handleCommand(command) {
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
            case 'check':
                this.handleCheckCommand(args);
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
                this.consoleWrite(`Unknown command: ${cmd}. Type 'help' for available commands.`);
        }
    }

    handleStartCommand(args) {
        if (this.currentMission) {
            this.consoleWrite('Mission already active. Use "end" to complete current mission first.');
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
            details: details
        };

        this.missionStartTime = startTime;
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        
        this.saveCurrentMission();
        this.updateDashboard();
        
        const timeStr = endTime ? 
            ` (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})` : 
            ` at ${startTime.toLocaleTimeString()}`;
        
        this.consoleWrite(`Mission started: ${missionType}${timeStr}`);
        this.consoleWrite('Use "status" to check mission details or "help" for available commands.');
    }

    handleEndCommand() {
        if (!this.currentMission) {
            this.consoleWrite('No active mission to end.');
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
            incidents: [...this.currentIncidents]
        };

        this.missionLogs.unshift(missionLog);
        this.saveMissionLogs();

        // Clear current mission
        this.currentMission = null;
        this.missionStartTime = null;
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;

        localStorage.removeItem('currentMission');
        
        this.consoleWrite(`Mission completed. Duration: ${missionLog.duration}`);
        this.consoleWrite('Mission log saved to database.');
        
        this.loadMainPage();
    }

    handleOnsiteCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        if (this.isOnSite) {
            this.consoleWrite('Already on site. Use "offsite" to leave current location first.');
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
        
        this.consoleWrite(`Arrived on site: ${location} at ${arrivalTime.toLocaleTimeString()}`);
    }

    handleOffsiteCommand() {
        if (!this.currentMission) {
            this.consoleWrite('No active mission.');
            return;
        }

        if (!this.isOnSite) {
            this.consoleWrite('Not currently on site.');
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
        
        this.consoleWrite(`Departed site at ${departureTime.toLocaleTimeString()}`);
    }

    handleIncidentCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        if (args.length < 3) {
            this.consoleWrite('Usage: incident [type] [location] [description]');
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
            status: 'reported'
        };

        this.currentIncidents.push(incident);
        this.saveCurrentMission();
        
        this.consoleWrite(`Incident reported: ${type} at ${location}`);
        this.consoleWrite(`Description: ${description}`);
        this.consoleWrite(`Incident ID: ${incident.id}`);
    }

    handleCheckCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        if (args.length < 2) {
            this.consoleWrite('Usage: check [name] [status] [notes]');
            return;
        }

        const name = args[0];
        const status = args[1];
        const notes = args.slice(2).join(' ');

        const check = {
            id: Date.now().toString(),
            name: name,
            status: status,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        // Add to current mission data
        if (!this.currentMission.checks) {
            this.currentMission.checks = [];
        }
        this.currentMission.checks.push(check);
        
        this.saveCurrentMission();
        
        this.consoleWrite(`Check logged: ${name} - ${status}`);
        if (notes) {
            this.consoleWrite(`Notes: ${notes}`);
        }
    }

    handleStatusCommand() {
        if (!this.currentMission) {
            this.consoleWrite('No active mission.');
            return;
        }

        const now = new Date();
        const duration = this.missionStartTime ? 
            Math.round((now - this.missionStartTime) / (1000 * 60)) : 0;

        this.consoleWrite('=== MISSION STATUS ===');
        this.consoleWrite(`Mission: ${this.currentMission.type}`);
        this.consoleWrite(`Start Time: ${new Date(this.currentMission.startTime).toLocaleString()}`);
        this.consoleWrite(`Duration: ${Math.floor(duration / 60)}h ${duration % 60}m`);
        this.consoleWrite(`Status: ${this.isOnSite ? 'ON SITE' : 'MOBILE'}`);
        
        if (this.currentPatrolStop) {
            this.consoleWrite(`Current Location: ${this.currentPatrolStop.location}`);
        }
        
        this.consoleWrite(`Patrol Stops: ${this.currentPatrolStops.length}`);
        this.consoleWrite(`Incidents: ${this.currentIncidents.length}`);
        this.consoleWrite('=====================');
    }

    handleSitesCommand() {
        this.consoleWrite('=== SAVED SITES ===');
        
        if (this.sites.length === 0) {
            this.consoleWrite('No saved sites.');
        } else {
            this.sites.forEach((site, index) => {
                this.consoleWrite(`${index + 1}. ${site.name} - ${site.description}`);
            });
        }
        
        this.consoleWrite('==================');
    }

    handleBolosCommand() {
        this.consoleWrite('=== ACTIVE BOLOs ===');
        
        if (this.bolos.length === 0) {
            this.consoleWrite('No active BOLOs.');
        } else {
            this.bolos.forEach((bolo, index) => {
                this.consoleWrite(`${index + 1}. ${bolo.subject}: ${bolo.description}`);
                this.consoleWrite(`   Added: ${new Date(bolo.timestamp).toLocaleString()}`);
            });
        }
        
        this.consoleWrite('===================');
    }

    handleTimeCommand() {
        const now = new Date();
        this.consoleWrite(`Current Time: ${now.toLocaleString()}`);
        this.consoleWrite(`UTC Time: ${now.toISOString()}`);
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
            this.consoleWrite('=== SECURITY CODES ===');
            Object.entries(codes).forEach(([c, desc]) => {
                this.consoleWrite(`${c}: ${desc}`);
            });
            this.consoleWrite('=====================');
        } else {
            const description = codes[code] || codes[code.toUpperCase()];
            if (description) {
                this.consoleWrite(`${code}: ${description}`);
            } else {
                this.consoleWrite(`Unknown code: ${code}`);
            }
        }
    }

    handleBoloCommand(args) {
        if (args.length < 2) {
            this.consoleWrite('Usage: bolo [subject] [description]');
            return;
        }

        const subject = args[0];
        const description = args.slice(1).join(' ');

        const bolo = {
            id: Date.now().toString(),
            subject: subject,
            description: description,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        this.bolos.push(bolo);
        this.saveBolos();
        
        this.consoleWrite(`BOLO created for: ${subject}`);
        this.consoleWrite(`Description: ${description}`);
        this.consoleWrite(`BOLO ID: ${bolo.id}`);
    }

    handlePatrolCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        const location = args.join(' ') || 'Patrol Route';
        
        this.consoleWrite(`Beginning patrol: ${location}`);
        this.consoleWrite('Use "onsite [location]" when arriving at checkpoints.');
    }

    handleCheckpointCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        if (args.length < 2) {
            this.consoleWrite('Usage: checkpoint [name] [status]');
            return;
        }

        const name = args[0];
        const status = args.slice(1).join(' ');

        const checkpoint = {
            id: Date.now().toString(),
            name: name,
            status: status,
            timestamp: new Date().toISOString()
        };

        // Add to current mission data
        if (!this.currentMission.checkpoints) {
            this.currentMission.checkpoints = [];
        }
        this.currentMission.checkpoints.push(checkpoint);
        
        this.saveCurrentMission();
        
        this.consoleWrite(`Checkpoint logged: ${name} - ${status}`);
    }

    handleReportCommand(args) {
        if (!this.currentMission) {
            this.consoleWrite('No active mission. Start a mission first.');
            return;
        }

        const summary = args.join(' ') || 'General report';
        
        const report = {
            id: Date.now().toString(),
            summary: summary,
            timestamp: new Date().toISOString(),
            missionId: this.currentMission.id,
            type: 'general'
        };

        this.missionLogs.unshift(report);
        this.saveMissionLogs();
        
        this.consoleWrite(`Report filed: ${summary}`);
        this.consoleWrite(`Report ID: ${report.id}`);
    }

    clearConsole() {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            consoleOutput.innerHTML = '';
        }
    }

    showHelp() {
        this.consoleWrite('=== AVAILABLE COMMANDS ===');
        this.consoleWrite('Mission Control:');
        this.consoleWrite('  start [details] - Start new mission');
        this.consoleWrite('  end - End current mission');
        this.consoleWrite('  status - Show mission status');
        this.consoleWrite('');
        this.consoleWrite('Site Operations:');
        this.consoleWrite('  onsite [location] - Arrive at location');
        this.consoleWrite('  offsite - Depart current location');
        this.consoleWrite('  patrol [location] - Begin patrol');
        this.consoleWrite('  checkpoint [name] [status] - Log checkpoint');
        this.consoleWrite('');
        this.consoleWrite('Incident Reporting:');
        this.consoleWrite('  incident [type] [location] [description]');
        this.consoleWrite('  bolo [subject] [description] - Create BOLO');
        this.consoleWrite('  report [summary] - File general report');
        this.consoleWrite('  check [name] [status] [notes] - Log check');
        this.consoleWrite('');
        this.consoleWrite('System:');
        this.consoleWrite('  logs - View mission history');
        this.consoleWrite('  sites - List saved sites');
        this.consoleWrite('  bolos - List active BOLOs');
        this.consoleWrite('  time - Show current time');
        this.consoleWrite('  code [code] - Look up security codes');
        this.consoleWrite('  clear - Clear console');
        this.consoleWrite('  help - Show this help');
        this.consoleWrite('==========================');
    }

    consoleWrite(text) {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;

        const line = document.createElement('div');
        line.textContent = text;
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

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showGuardProfile());
        }
    }

    startMissionType(missionType) {
        const missionNames = {
            'fixed-post': 'Fixed Post Security',
            'mobile-patrol': 'Mobile Patrol',
            'desk-duty': 'Desk Duty Operations'
        };

        const missionName = missionNames[missionType] || 'Security Mission';
        this.handleCommand(`start ${missionName}`);
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
                        <button class="control-btn btn-info" onclick="app.handleDesktopCommandButton(this)">Report Incident</button>
                        <button class="control-btn btn-info" onclick="app.handleDesktopCommandButton(this)">Add Check</button>
                        <button class="control-btn btn-success" onclick="app.handleDesktopCommandButton(this)">Mission Report</button>
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
                                <span class="prompt">SIGSECSPEC></span>
                                <input type="text" id="consoleInput" placeholder="Enter command..." autocomplete="off">
                            </div>
                            <div class="console-hint">
                                Type 'help' for available commands. Press Enter to execute.
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
                this.consoleWrite(`Mission active: ${this.currentMission.type}`);
                this.consoleWrite('Console ready for commands. Type "help" for assistance.');
            }, 100);
        }
    }

    showLogsModal() {
        const modal = document.getElementById('logsModal');
        if (!modal) return;

        const logsList = document.getElementById('logsList');
        if (!logsList) return;

        if (this.missionLogs.length === 0) {
            logsList.innerHTML = '<p>No mission logs available.</p>';
        } else {
            logsList.innerHTML = this.missionLogs.map(log => `
                <div class="mission-log">
                    <div class="mission-log-header">
                        <div>
                            <div class="mission-log-title">${log.type || log.summary || 'Mission Report'}</div>
                            <div class="mission-log-date">${new Date(log.timestamp || log.startTime).toLocaleString()}</div>
                        </div>
                        <div class="mission-log-actions">
                            <button class="btn-small btn-info" onclick="app.viewMissionDetails('${log.id}')">View</button>
                            <button class="btn-small btn-secondary" onclick="app.copyMissionReport('${log.id}')">Copy</button>
                        </div>
                    </div>
                    ${log.details ? `<div class="mission-log-details">${log.details}</div>` : ''}
                </div>
            `).join('');
        }

        modal.style.display = 'block';
    }

    viewMissionDetails(missionId) {
        const mission = this.missionLogs.find(log => log.id === missionId);
        if (!mission) return;

        // Create detailed view modal
        const detailModal = document.createElement('div');
        detailModal.className = 'modal';
        detailModal.style.display = 'block';
        
        detailModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Mission Details</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="copy-area">
                        <strong>Mission ID:</strong> ${mission.id}<br>
                        <strong>Type:</strong> ${mission.type || mission.summary || 'General Mission'}<br>
                        <strong>Date/Time:</strong> ${new Date(mission.timestamp || mission.startTime).toLocaleString()}<br>
                        ${mission.endTime ? `<strong>End Time:</strong> ${new Date(mission.endTime).toLocaleString()}<br>` : ''}
                        ${mission.duration ? `<strong>Duration:</strong> ${mission.duration}<br>` : ''}
                        ${mission.details ? `<strong>Details:</strong> ${mission.details}<br>` : ''}
                        
                        ${mission.patrolStops && mission.patrolStops.length > 0 ? `
                            <br><strong>Patrol Stops:</strong><br>
                            ${mission.patrolStops.map(stop => 
                                `- ${stop.location} (${new Date(stop.arrivalTime).toLocaleTimeString()}${stop.duration ? `, ${stop.duration}` : ''})`
                            ).join('<br>')}
                        ` : ''}
                        
                        ${mission.incidents && mission.incidents.length > 0 ? `
                            <br><strong>Incidents:</strong><br>
                            ${mission.incidents.map(incident => 
                                `- ${incident.type} at ${incident.location}: ${incident.description}`
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

    copyMissionReport(missionId) {
        const mission = this.missionLogs.find(log => log.id === missionId);
        if (!mission) return;

        let reportText = `MISSION REPORT\n`;
        reportText += `================\n`;
        reportText += `Mission ID: ${mission.id}\n`;
        reportText += `Type: ${mission.type || mission.summary || 'General Mission'}\n`;
        reportText += `Date/Time: ${new Date(mission.timestamp || mission.startTime).toLocaleString()}\n`;
        
        if (mission.endTime) {
            reportText += `End Time: ${new Date(mission.endTime).toLocaleString()}\n`;
        }
        
        if (mission.duration) {
            reportText += `Duration: ${mission.duration}\n`;
        }
        
        if (mission.details) {
            reportText += `Details: ${mission.details}\n`;
        }
        
        if (mission.patrolStops && mission.patrolStops.length > 0) {
            reportText += `\nPATROL STOPS:\n`;
            mission.patrolStops.forEach(stop => {
                reportText += `- ${stop.location} (${new Date(stop.arrivalTime).toLocaleTimeString()}${stop.duration ? `, ${stop.duration}` : ''})\n`;
            });
        }
        
        if (mission.incidents && mission.incidents.length > 0) {
            reportText += `\nINCIDENTS:\n`;
            mission.incidents.forEach(incident => {
                reportText += `- ${incident.type} at ${incident.location}: ${incident.description}\n`;
            });
        }

        // Copy to clipboard
        navigator.clipboard.writeText(reportText).then(() => {
            this.showNotification('Mission report copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = reportText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Mission report copied to clipboard!', 'success');
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#d69e2e',
            info: '#3182ce'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showGuardProfile() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>👤 Guard Profile</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="popup-menu">
                    <div class="popup-menu-title">Security Specialist Profile</div>
                    
                    <div class="profile-info">
                        <div class="profile-section">
                            <h3>Personal Information</h3>
                            <div class="profile-grid">
                                <div class="profile-item">
                                    <strong>Name:</strong> ${this.guardProfile.firstName} ${this.guardProfile.lastName}
                                </div>
                                <div class="profile-item">
                                    <strong>Badge Number:</strong> ${this.guardProfile.badgeNumber}
                                </div>
                                <div class="profile-item">
                                    <strong>Employee ID:</strong> ${this.guardProfile.employeeId}
                                </div>
                                <div class="profile-item">
                                    <strong>Department:</strong> ${this.guardProfile.department}
                                </div>
                                <div class="profile-item">
                                    <strong>Supervisor:</strong> ${this.guardProfile.supervisor}
                                </div>
                                <div class="profile-item">
                                    <strong>Contact:</strong> ${this.guardProfile.contactNumber}
                                </div>
                                <div class="profile-item">
                                    <strong>Emergency Contact:</strong> ${this.guardProfile.emergencyContact}
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-section">
                            <h3>Certifications</h3>
                            <div class="certifications">
                                ${this.guardProfile.certifications && this.guardProfile.certifications.length > 0 ? 
                                    this.guardProfile.certifications.map(cert => `<span class="cert-badge">${cert}</span>`).join('') :
                                    '<span class="no-certs">No certifications on file</span>'
                                }
                            </div>
                        </div>
                        
                        ${this.guardProfile.notes ? `
                            <div class="profile-section">
                                <h3>Notes</h3>
                                <div class="profile-notes">${this.guardProfile.notes}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="menu-options">
                        <div class="menu-option-card" onclick="app.editGuardProfile()">
                            <div class="menu-option-icon">✏️</div>
                            <div class="menu-option-title">Edit Profile</div>
                            <div class="menu-option-desc">Update personal information and certifications</div>
                        </div>
                        
                        <div class="menu-option-card" onclick="app.showMyReports()">
                            <div class="menu-option-icon">📋</div>
                            <div class="menu-option-title">My Reports</div>
                            <div class="menu-option-desc">View all mission reports filed by you</div>
                        </div>
                        
                        <div class="menu-option-card" onclick="app.showContributionHistory()">
                            <div class="menu-option-icon">📝</div>
                            <div class="menu-option-title">Contributions</div>
                            <div class="menu-option-desc">View your POI details, BOLO details, and observations</div>
                        </div>
                        
                        <div class="menu-option-card" onclick="app.showLogsModal()">
                            <div class="menu-option-icon">📊</div>
                            <div class="menu-option-title">All Reports</div>
                            <div class="menu-option-desc">View all system reports and logs</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    editGuardProfile() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>✏️ Edit Profile</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="guardProfileForm">
                    <div class="profile-form-grid">
                        <div class="form-group">
                            <label for="firstName">First Name:</label>
                            <input type="text" id="firstName" value="${this.guardProfile.firstName}">
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name:</label>
                            <input type="text" id="lastName" value="${this.guardProfile.lastName}">
                        </div>
                        <div class="form-group">
                            <label for="badgeNumber">Badge Number:</label>
                            <input type="text" id="badgeNumber" value="${this.guardProfile.badgeNumber}">
                        </div>
                        <div class="form-group">
                            <label for="employeeId">Employee ID:</label>
                            <input type="text" id="employeeId" value="${this.guardProfile.employeeId}">
                        </div>
                        <div class="form-group">
                            <label for="department">Department:</label>
                            <input type="text" id="department" value="${this.guardProfile.department}">
                        </div>
                        <div class="form-group">
                            <label for="supervisor">Supervisor:</label>
                            <input type="text" id="supervisor" value="${this.guardProfile.supervisor}">
                        </div>
                        <div class="form-group">
                            <label for="contactNumber">Contact Number:</label>
                            <input type="tel" id="contactNumber" value="${this.guardProfile.contactNumber}">
                        </div>
                        <div class="form-group">
                            <label for="emergencyContact">Emergency Contact:</label>
                            <input type="tel" id="emergencyContact" value="${this.guardProfile.emergencyContact}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="certifications">Certifications (comma-separated):</label>
                        <input type="text" id="certifications" value="${this.guardProfile.certifications ? this.guardProfile.certifications.join(', ') : ''}" 
                               placeholder="e.g., CPR, First Aid, Security License">
                    </div>
                    
                    <div class="form-group">
                        <label for="profileNotes">Notes:</label>
                        <textarea id="profileNotes" rows="3" placeholder="Additional notes about yourself...">${this.guardProfile.notes}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.showGuardProfile()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Profile</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('guardProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileChanges();
        });

        modal.style.display = 'block';
    }

    saveProfileChanges() {
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            badgeNumber: document.getElementById('badgeNumber').value,
            employeeId: document.getElementById('employeeId').value,
            department: document.getElementById('department').value,
            supervisor: document.getElementById('supervisor').value,
            contactNumber: document.getElementById('contactNumber').value,
            emergencyContact: document.getElementById('emergencyContact').value,
            certifications: document.getElementById('certifications').value.split(',').map(cert => cert.trim()).filter(cert => cert),
            notes: document.getElementById('profileNotes').value
        };

        // Update the guard profile
        this.guardProfile = {
            ...this.guardProfile,
            ...formData,
            lastUpdated: new Date()
        };

        if (this.saveGuardProfile()) {
            this.showNotification('Profile updated successfully!', 'success');
            this.showGuardProfile(); // Go back to profile view
        }
    }

    showMyReports() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Filter mission logs by current guard
        const guardName = `${this.guardProfile.firstName} ${this.guardProfile.lastName}`.trim();
        const myReports = this.missionLogs.filter(log => 
            log.details && log.details.specialistName === guardName
        );

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>📋 My Mission Reports</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary" onclick="app.showGuardProfile()">← Back to Profile</button>
                </div>
                
                ${myReports.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <strong>Total Reports:</strong> ${myReports.length}
                    </div>
                    
                    ${myReports.map(log => `
                        <div class="mission-log">
                            <div class="mission-log-header">
                                <div class="mission-log-title">${log.type.charAt(0).toUpperCase() + log.type.slice(1)} - ${this.formatDateTime(log.startTime)}</div>
                                <div class="mission-log-actions">
                                    <button class="btn-small btn-primary" onclick="app.viewMissionDetails('${log.id}')">View Details</button>
                                    <button class="btn-small btn-secondary" onclick="app.copyMissionReport('${log.id}')">Copy Report</button>
                                </div>
                            </div>
                            <div class="mission-log-date">Duration: ${this.formatDateTime(log.startTime)} - ${this.formatDateTime(log.endTime)}</div>
                            <p><strong>Status:</strong> ${log.status}</p>
                            <p><strong>Incidents:</strong> ${log.incidents ? log.incidents.length : 0}</p>
                            <p><strong>Patrol Stops:</strong> ${log.patrolStops ? log.patrolStops.length : 0}</p>
                        </div>
                    `).join('')}
                ` : `
                    <div style="text-align: center; padding: 40px; color: var(--desktop-text-muted, var(--mobile-text-muted));">
                        <p>No mission reports found for ${guardName || 'current guard'}.</p>
                        <p style="margin-top: 10px; font-size: 14px;">Complete missions will appear here.</p>
                    </div>
                `}
            </div>
        `;

        modal.style.display = 'block';
    }

    showContributionHistory() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Get contributions from mission logs
        const guardName = `${this.guardProfile.firstName} ${this.guardProfile.lastName}`.trim();
        const contributions = [];
        
        // Search through all mission logs for contributions
        this.missionLogs.forEach(log => {
            if (log.incidents) {
                log.incidents.forEach(incident => {
                    if (incident.observer === guardName || incident.type === 'POI Update' || incident.type === 'BOLO Update') {
                        contributions.push({
                            type: incident.type,
                            description: incident.description,
                            date: incident.time,
                            mission: log.id,
                            details: incident.action
                        });
                    }
                });
            }
        });

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>📝 My Contributions</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary" onclick="app.showGuardProfile()">← Back to Profile</button>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p>Contributions include POI details, BOLO details, incident reports, and other observations.</p>
                    <strong>Total Contributions:</strong> ${contributions.length}
                </div>
                
                ${contributions.length > 0 ? `
                    ${contributions.map(contribution => `
                        <div class="mission-log">
                            <div class="mission-log-header">
                                <div class="mission-log-title">${contribution.type}</div>
                                <div class="mission-log-date">${this.formatDateTime(contribution.date)}</div>
                            </div>
                            <p><strong>Description:</strong> ${contribution.description}</p>
                            <p><strong>Details:</strong> ${contribution.details}</p>
                            <p style="font-size: 12px; color: var(--desktop-text-muted, var(--mobile-text-muted));">
                                <strong>Mission:</strong> ${contribution.mission}<br>
                                <strong>Observer:</strong> ${guardName}${this.guardProfile.badgeNumber ? ` (Badge: ${this.guardProfile.badgeNumber})` : ''}
                            </p>
                        </div>
                    `).join('')}
                ` : `
                    <div style="text-align: center; padding: 40px; color: var(--desktop-text-muted, var(--mobile-text-muted));">
                        <p>No contributions found.</p>
                        <p style="margin-top: 10px; font-size: 14px;">Add details to POIs/BOLOs or file incident reports to see them here.</p>
                    </div>
                `}
            </div>
        `;

        modal.style.display = 'block';
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    }

    // Data loading and saving methods
    loadMissionLogs() {
        const logs = localStorage.getItem('missionLogs');
        return logs ? JSON.parse(logs) : [];
    }

    saveMissionLogs() {
        localStorage.setItem('missionLogs', JSON.stringify(this.missionLogs));
    }

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
            firstName: 'Security',
            lastName: 'Officer',
            badgeNumber: 'S-7734',
            employeeId: 'EMP001',
            department: 'Security',
            supervisor: 'Supervisor Name',
            contactNumber: '(555) 123-4567',
            emergencyContact: '(555) 987-6543',
            certifications: ['Security License', 'CPR', 'First Aid'],
            notes: 'Dedicated security professional with extensive experience in patrol operations and incident response.'
        };
    }

    saveGuardProfile() {
        try {
            localStorage.setItem('guardProfile', JSON.stringify(this.guardProfile));
            return true;
        } catch (error) {
            console.error('Failed to save guard profile:', error);
            return false;
        }
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
            this.currentMission = data.mission;
            this.currentPatrolStops = data.patrolStops || [];
            this.currentIncidents = data.incidents || [];
            this.missionStartTime = data.missionStartTime ? new Date(data.missionStartTime) : null;
            this.isOnSite = data.isOnSite || false;
            this.currentSiteStartTime = data.currentSiteStartTime ? new Date(data.currentSiteStartTime) : null;
            this.currentPatrolStop = data.currentPatrolStop || null;
            
            this.updateDashboard();
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

// Initialize the app and expose to global scope for onclick handlers
window.app = new SecuritySpecialistApp();
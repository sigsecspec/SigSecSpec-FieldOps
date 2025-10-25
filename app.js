class SecuritySpecialistApp {
    constructor() {
        this.currentMission = null;
        this.missionLogs = this.loadMissionLogs();
        this.sites = this.loadSites();
        this.bolos = this.loadBolos();
        this.pois = this.loadPOIs();
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
    }

    isMobileDevice() {
        return window.innerWidth <= 1023;
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
            case 'add checkpoint':
                this.startPromptSequence('checkpoint', [
                    { prompt: 'checkpoint name:', key: 'name', required: true },
                    { prompt: 'status:', key: 'status', required: true },
                    { prompt: 'notes:', key: 'notes', required: false }
                ], (data) => {
                    this.executeConsoleCommand(`checkpoint ${data.name} ${data.status} ${data.notes || ''}`);
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

    startPromptSequence(commandName, prompts, callback) {
        this.currentPromptSequence = {
            commandName,
            prompts,
            callback,
            currentIndex: 0,
            data: {}
        };
        
        this.consoleWrite(`=== ${commandName.toUpperCase()} COMMAND ===`);
        this.consoleWrite('Fill in the following information (type after the colon and press Enter):');
        this.consoleWrite('');
        this.showNextPrompt();
    }

    showNextPrompt() {
        if (!this.currentPromptSequence) return;
        
        const sequence = this.currentPromptSequence;
        if (sequence.currentIndex >= sequence.prompts.length) {
            // All prompts completed, execute callback
            this.resetConsolePrompt();
            sequence.callback(sequence.data);
            this.currentPromptSequence = null;
            return;
        }
        
        const currentPrompt = sequence.prompts[sequence.currentIndex];
        this.currentPrompt = currentPrompt;
        
        // Show the prompt in console with clear formatting
        const promptText = currentPrompt.required ? 
            `${currentPrompt.prompt} (required)` : 
            `${currentPrompt.prompt} (optional - press Enter to skip)`;
        
        this.consoleWrite(promptText);
        
        // Update the console input prompt to show the current field
        this.updateConsolePrompt(currentPrompt.prompt);
        
        // Set up the input to handle this prompt
        this.setupPromptInput();
    }

    updateConsolePrompt(promptText) {
        const promptElement = document.querySelector('.console-input-row .prompt');
        if (promptElement) {
            promptElement.textContent = `${promptText}`;
        }
    }

    resetConsolePrompt() {
        const promptElement = document.querySelector('.console-input-row .prompt');
        if (promptElement) {
            promptElement.textContent = 'GUARD@SEC:~$';
        }
    }

    setupPromptInput() {
        const input = document.getElementById('consoleInput');
        if (!input) return;
        
        // Remove any existing prompt listeners
        if (this.promptKeyListener) {
            input.removeEventListener('keydown', this.promptKeyListener);
        }
        
        // Add new prompt listener
        this.promptKeyListener = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handlePromptInput(input.value.trim());
                input.value = '';
            }
        };
        
        input.addEventListener('keydown', this.promptKeyListener);
        input.focus();
    }

    handlePromptInput(value) {
        if (!this.currentPromptSequence || !this.currentPrompt) return;
        
        const sequence = this.currentPromptSequence;
        const prompt = this.currentPrompt;
        
        // Validate required fields
        if (prompt.required && !value) {
            this.consoleWrite(`ERROR: ${prompt.prompt} is required. Please enter a value.`);
            return;
        }
        
        // Store the value
        sequence.data[prompt.key] = value;
        
        // Show what was entered
        if (value) {
            this.consoleWrite(`✓ ${prompt.prompt} ${value}`);
        } else {
            this.consoleWrite(`✓ ${prompt.prompt} (skipped)`);
        }
        
        // Move to next prompt
        sequence.currentIndex++;
        this.currentPrompt = null;
        
        // Remove prompt listener and restore normal command handling
        const input = document.getElementById('consoleInput');
        if (input && this.promptKeyListener) {
            input.removeEventListener('keydown', this.promptKeyListener);
            this.promptKeyListener = null;
        }
        
        // If this was the last prompt, reset the console prompt
        if (sequence.currentIndex >= sequence.prompts.length) {
            this.resetConsolePrompt();
        }
        
        this.showNextPrompt();
    }
    
    addSecurityTerminalFeatures() {
        // Add timestamp for desktop toughbook style
        if (window.innerWidth >= 1024) {
            this.addTimestamp();
            this.addSystemStatus();
            setInterval(() => this.updateTimestamp(), 1000);
        }
    }
    
    addSystemStatus() {
        const status = document.createElement('div');
        status.id = 'systemStatus';
        status.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: var(--desktop-bg-primary);
            color: var(--desktop-success);
            padding: 5px 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid var(--desktop-border);
            border-radius: 2px;
            z-index: 1000;
            letter-spacing: 1px;
        `;
        status.innerHTML = '● SYSTEM ONLINE | DB CONNECTED';
        document.body.appendChild(status);
    }
    
    addTimestamp() {
        const timestamp = document.createElement('div');
        timestamp.id = 'securityTimestamp';
        timestamp.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--desktop-bg-primary);
            color: var(--desktop-success);
            padding: 5px 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid var(--desktop-border);
            border-radius: 2px;
            z-index: 1000;
            letter-spacing: 1px;
        `;
        document.body.appendChild(timestamp);
        this.updateTimestamp();
    }
    
    updateTimestamp() {
        const timestamp = document.getElementById('securityTimestamp');
        if (timestamp) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            const dateStr = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            timestamp.textContent = `${dateStr} ${timeStr} UTC`;
        }
    }

    bindEvents() {
        // Mission type selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mission-card')) {
                const missionType = e.target.closest('.mission-card').dataset.mission;
                this.startMissionType(missionType);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Desktop command button handling
        document.addEventListener('click', (e) => {
            if (!this.isMobileDevice() && e.target.classList.contains('control-btn')) {
                e.preventDefault();
                this.handleDesktopCommandButton(e.target);
            }
        });
    }

    bindDatabaseButtons() {
        // Navigation buttons - only bind if they exist (on main page)
        const viewLogsBtn = document.getElementById('viewLogsBtn');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => {
                this.showMissionLogs();
            });
        }
        
        const siteBtn = document.getElementById('siteManagerBtn');
        if (siteBtn) {
            siteBtn.addEventListener('click', () => {
                this.showSiteManager();
            });
        }
        
        const boloBtn = document.getElementById('boloBtn');
        if (boloBtn) {
            boloBtn.addEventListener('click', () => {
                this.showBoloBoard();
            });
        }
        
        const poiBtn = document.getElementById('poiBtn');
        if (poiBtn) {
            poiBtn.addEventListener('click', () => {
                this.showPOIBoard();
            });
        }
    }

    loadMainPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="main-screen">
                <div class="database-buttons">
                    <button id="viewLogsBtn" class="nav-btn">Database Records</button>
                    <button id="siteManagerBtn" class="nav-btn">Site Manager</button>
                    <button id="boloBtn" class="nav-btn">BOLO Board</button>
                    <button id="poiBtn" class="nav-btn">Person of Interest</button>
                </div>
                
                <div class="mission-selection">
                    <h2>Select Operation Type</h2>
                    <div class="mission-cards">
                        <div class="mission-card" data-mission="standing">
                            <div class="mission-icon">🛡️</div>
                            <h3>Fixed Post</h3>
                            <p>Stationary security assignment</p>
                        </div>
                        <div class="mission-card" data-mission="patrol">
                            <div class="mission-icon">🚗</div>
                            <h3>Mobile Patrol</h3>
                            <p>Vehicle patrol with checkpoint stops</p>
                        </div>
                        <div class="mission-card" data-mission="desk">
                            <div class="mission-icon">📋</div>
                            <h3>Desk Duty</h3>
                            <p>Administrative operations</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-bind the database button events since they're now on the main page
        this.bindDatabaseButtons();
    }

    startMissionType(type) {
        this.currentMission = {
            type: type,
            status: 'inactive',
            startTime: null,
            endTime: null,
            details: {},
            patrolStops: [],
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();

        if (type === 'patrol') {
            this.showPatrolDashboard();
        } else {
            this.showGenericDashboard(type);
        }
    }

    showPatrolDashboard() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div class="mission-info">
                        <h2>Mobile Patrol Operation</h2>
                        <div class="mission-status status-inactive" id="missionStatus">Inactive</div>
                    </div>
                    <button class="nav-btn" onclick="app.attemptNavigateHome()">← Back to Home</button>
                </div>

                <div class="dashboard-controls">
                    <button class="control-btn btn-primary" id="startMissionBtn" onclick="app.showStartMissionModal()">
                        Begin Operation
                    </button>
                    <button class="control-btn btn-success" id="onSiteBtn" onclick="app.showOnSiteModal()" disabled>
                        Arrive On Scene
                    </button>
                    <button class="control-btn btn-warning" id="offSiteBtn" onclick="app.confirmOffSite()" disabled>
                        Clear Scene
                    </button>
                    <button class="control-btn btn-primary" id="incidentReportBtn" onclick="app.showIncidentModal()" disabled>
                        Incident Report
                    </button>
                    <button class="control-btn btn-primary" id="checkpointBtn" onclick="app.showCheckpointModal()" disabled>
                        Add Checkpoint
                    </button>
                    <button class="control-btn btn-warning" id="boloListBtn" onclick="app.showCurrentLocationBolos()" disabled>
                        BOLO's (Location)
                    </button>
                    <button class="control-btn btn-warning" id="poiListBtn" onclick="app.showCurrentLocationPOIs()" disabled>
                        POI's (Location)
                    </button>
                    <button class="control-btn btn-warning" onclick="app.showMissionReportModal()" id="missionReportBtn" disabled>
                        Mission Report
                    </button>
                    <button class="control-btn btn-danger" id="endMissionBtn" onclick="app.confirmEndMission()" disabled>
                        End Mission
                    </button>
                </div>

                <div class="command-console">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-row">
                        <span class="prompt">GUARD@SEC:~$</span>
                        <input id="consoleInput" placeholder="Type command or 'help' for assistance" />
                    </div>
                </div>

                <div class="patrol-stops">
                    <h3>Patrol Stops</h3>
                    <div id="patrolStopsList"></div>
                </div>

                <div class="patrol-stops">
                    <h3>Incidents</h3>
                    <div id="incidentsList"></div>
                </div>
            </div>
        `;

        this.bindConsole();
    }

    showGenericDashboard(type) {
        const mainContent = document.getElementById('mainContent');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
        
        mainContent.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div class="mission-info">
                        <h2>${typeTitle} Operation</h2>
                        <div class="mission-status status-inactive" id="missionStatus">Inactive</div>
                    </div>
                    <button class="nav-btn" onclick="app.attemptNavigateHome()">← Back to Home</button>
                </div>

                <div class="dashboard-controls">
                    <button class="control-btn btn-primary" id="startMissionBtn" onclick="app.showStartMissionModal()">
                        Start Mission
                    </button>
                    <button class="control-btn btn-primary" id="incidentReportBtn" onclick="app.showIncidentModal()" disabled>
                        Incident Report
                    </button>
                    <button class="control-btn btn-warning" id="boloListBtn" onclick="app.showCurrentLocationBolos()" disabled>
                        BOLO's (Location)
                    </button>
                    <button class="control-btn btn-warning" id="poiListBtn" onclick="app.showCurrentLocationPOIs()" disabled>
                        POI's (Location)
                    </button>
                    <button class="control-btn btn-warning" onclick="app.showMissionReportModal()" id="missionReportBtn" disabled>
                        Mission Report
                    </button>
                    <button class="control-btn btn-danger" id="endMissionBtn" onclick="app.confirmEndMission()" disabled>
                        End Mission
                    </button>
                </div>

                <div class="command-console">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-row">
                        <span class="prompt">GUARD@SEC:~$</span>
                        <input id="consoleInput" placeholder="Type command or 'help' for assistance" />
                    </div>
                </div>

                <div class="patrol-stops">
                    <h3>Incidents</h3>
                    <div id="incidentsList"></div>
                </div>
            </div>
        `;

        this.bindConsole();
    }

    showStartMissionModal() {
        // Always show modal for button clicks (both desktop and mobile)
        this.showMobileStartMissionModal();
    }

    showMobileStartMissionModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Start Mission</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="startMissionForm">
                    <div class="form-group">
                        <label for="specialistName">Specialist Name:</label>
                        <input type="text" id="specialistName" required placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="missionStartTime">Start Time:</label>
                        <input type="datetime-local" id="missionStartTime" required>
                    </div>
                    <div class="form-group">
                        <label for="missionEndTime">End Time:</label>
                        <input type="datetime-local" id="missionEndTime" required>
                    </div>
                    <div class="form-group">
                        <label for="missionNotes">Mission Notes (optional):</label>
                        <textarea id="missionNotes" placeholder="Any special instructions or notes..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Start Mission</button>
                    </div>
                </form>
            </div>
        `;

        // Set default times
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        document.getElementById('missionStartTime').value = now.toISOString().slice(0, 16);
        document.getElementById('missionEndTime').value = endTime.toISOString().slice(0, 16);

        document.getElementById('startMissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileStartMission();
        });

        modal.style.display = 'block';
    }

    processMobileStartMission() {
        const form = document.getElementById('startMissionForm');
        const formData = new FormData(form);
        
        const specialistName = formData.get('specialistName');
        const startTime = new Date(formData.get('missionStartTime'));
        const endTime = new Date(formData.get('missionEndTime'));
        const notes = formData.get('missionNotes') || '';

        this.currentMission.status = 'active';
        this.currentMission.startTime = startTime;
        this.currentMission.endTime = endTime;
        this.currentMission.details = {
            specialistName: specialistName,
            patrolRoute: '',
            notes: notes
        };
        
        this.missionStartTime = startTime;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        document.getElementById('incidentReportBtn').disabled = false; // Enable incident report when mission starts
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        this.addNavigationWarning();
        this.closeModal();
        this.showNotification('Mission started successfully!');
        
        // Log to console as if command was executed
        this.consoleWrite(`Mission started for Specialist ${specialistName}`);
        this.consoleWrite(`Start time: ${startTime.toLocaleString()}`);
        this.consoleWrite(`Expected end time: ${endTime.toLocaleString()}`);
        if (notes) {
            this.consoleWrite(`Notes: ${notes}`);
        }
        this.consoleWrite('Mission status: ACTIVE');
    }

    startMission() {
        // This method is now called from console commands
        this.consoleWrite('Mission start configuration completed via console.');
    }

    startDetailedMission() {
        this.consoleWrite('=== DETAILED MISSION CONFIGURATION ===');
        this.consoleWrite('Starting step-by-step mission setup...');
        this.consoleWrite('');
        
        // Initialize mission details object
        this.pendingMissionDetails = {
            specialistName: '',
            startTime: new Date(),
            endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
            notes: '',
            currentStep: 'specialist'
        };
        
        this.askNextMissionQuestion();
    }

    askNextMissionQuestion() {
        if (!this.pendingMissionDetails) return;
        
        switch (this.pendingMissionDetails.currentStep) {
            case 'specialist':
                this.consoleWrite('Step 1 of 4: What is your specialist name?');
                this.consoleWrite('Type: specialist [your_name]');
                break;
            case 'start_time':
                this.consoleWrite('Step 2 of 4: Mission start time (optional - press Enter to use current time)');
                this.consoleWrite('Type: start_time [YYYY-MM-DD HH:MM] or press Enter to skip');
                break;
            case 'end_time':
                this.consoleWrite('Step 3 of 4: Mission end time (optional - press Enter for 8 hours from start)');
                this.consoleWrite('Type: end_time [YYYY-MM-DD HH:MM] or press Enter to skip');
                break;
            case 'notes':
                this.consoleWrite('Step 4 of 4: Mission notes (optional - press Enter to skip)');
                this.consoleWrite('Type: notes [your_notes] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('All details collected. Ready to start mission:');
                this.consoleWrite(`Specialist: ${this.pendingMissionDetails.specialistName}`);
                this.consoleWrite(`Start: ${this.pendingMissionDetails.startTime.toLocaleString()}`);
                this.consoleWrite(`End: ${this.pendingMissionDetails.endTime.toLocaleString()}`);
                this.consoleWrite(`Notes: ${this.pendingMissionDetails.notes || 'None'}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_start to begin mission');
                break;
        }
    }

    confirmStartMission() {
        if (!this.pendingMissionDetails) {
            this.consoleWrite('ERROR: No mission details configured. Use "start_detailed" first.');
            return;
        }

        if (!this.pendingMissionDetails.specialistName) {
            this.consoleWrite('ERROR: Specialist name is required. Use "specialist [name]" first.');
            return;
        }

        this.consoleWrite('=== CONFIRMING MISSION START ===');
        this.consoleWrite(`Specialist: ${this.pendingMissionDetails.specialistName}`);
        this.consoleWrite(`Start Time: ${this.pendingMissionDetails.startTime.toLocaleString()}`);
        this.consoleWrite(`End Time: ${this.pendingMissionDetails.endTime.toLocaleString()}`);
        this.consoleWrite(`Notes: ${this.pendingMissionDetails.notes || 'None'}`);
        this.consoleWrite('');

        // Start the mission
        this.currentMission.status = 'active';
        this.currentMission.startTime = this.pendingMissionDetails.startTime;
        this.currentMission.endTime = this.pendingMissionDetails.endTime;
        this.currentMission.details = {
            specialistName: this.pendingMissionDetails.specialistName,
            patrolRoute: '',
            notes: this.pendingMissionDetails.notes
        };
        
        this.missionStartTime = this.currentMission.startTime;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        document.getElementById('incidentReportBtn').disabled = false; // Enable incident report when mission starts
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        // Add navigation restriction indicator
        this.addNavigationWarning();
        
        this.consoleWrite('✓ Mission started successfully!');
        this.consoleWrite('✓ Navigation restrictions activated');
        this.consoleWrite('✓ System ready for operations');
        this.consoleWrite('');
        this.consoleWrite('Available commands: onsite, offsite, incident, checkpoint, report, end');
        
        // Clear pending details
        this.pendingMissionDetails = null;
    }

    processStepByStepStart(data) {
        // Parse the start and end times
        let startTime = new Date();
        let endTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours later

        if (data.startTime) {
            const parsedStart = new Date(data.startTime);
            if (!isNaN(parsedStart.getTime())) {
                startTime = parsedStart;
            }
        }

        if (data.endTime) {
            const parsedEnd = new Date(data.endTime);
            if (!isNaN(parsedEnd.getTime())) {
                endTime = parsedEnd;
            }
        }

        // Start the mission
        this.currentMission.status = 'active';
        this.currentMission.startTime = startTime;
        this.currentMission.endTime = endTime;
        this.currentMission.details = {
            specialistName: data.specialistName,
            patrolRoute: '',
            notes: data.notes || ''
        };

        this.missionStartTime = startTime;
        this.saveCurrentMission();

        // Update UI buttons
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        document.getElementById('incidentReportBtn').disabled = false;

        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }

        // Add navigation restriction indicator
        this.addNavigationWarning();

        this.consoleWrite('✓ Mission started successfully via step-by-step interface!');
        this.consoleWrite('✓ Navigation restrictions activated');
        this.consoleWrite('✓ System ready for operations');
        this.consoleWrite('');
        this.consoleWrite(`Specialist: ${data.specialistName}`);
        this.consoleWrite(`Start Time: ${startTime.toLocaleString()}`);
        this.consoleWrite(`End Time: ${endTime.toLocaleString()}`);
        if (data.notes) {
            this.consoleWrite(`Notes: ${data.notes}`);
        }
        this.consoleWrite('');
        this.consoleWrite('Available commands: onsite, offsite, incident, checkpoint, report, end');
    }

    showOnSiteModal() {
        if (this.currentMission.status !== 'active') {
            this.showNotification('Mission must be started first!', 'error');
            return;
        }

        // Check if mission report has been completed
        if (this.currentMission.report) {
            this.showNotification('Cannot go on site after mission report is completed!', 'error');
            return;
        }

        // Always show modal for button clicks
        this.showMobileOnSiteModal();
    }

    goOnSite() {
        if (this.currentMission.status !== 'active') {
            this.showNotification('Mission must be started first!', 'error');
            return;
        }

        // Check if mission report has been completed
        if (this.currentMission.report) {
            this.showNotification('Cannot go on site after mission report is completed!', 'error');
            return;
        }

        // For console commands: Use console prompts for desktop, modal for mobile
        if (this.isMobileDevice()) {
            this.showMobileOnSiteModal();
        } else {
            this.startPromptSequence('onsite', [
                { prompt: 'location:', key: 'location', required: true },
                { prompt: 'details:', key: 'details', required: false }
            ], (data) => {
                this.processOnSiteFromConsole(data);
            });
        }
    }

    showMobileOnSiteModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Build saved sites options
        const siteOptions = this.sites.map((s, idx) => `<option value="${idx}">${s.name} — ${s.address || s.details || ''}</option>`).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Go On Site</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="onSiteForm">
                    <div class="form-group">
                        <label for="siteSelect">Select Saved Site:</label>
                        <select id="siteSelect">
                            <option value="">-- Choose from Site Manager --</option>
                            ${siteOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="siteLocation">Location (override or manual):</label>
                        <input type="text" id="siteLocation" required placeholder="Name or address">
                    </div>
                    <div class="form-group">
                        <label for="siteArrivalTime">Arrival Time:</label>
                        <input type="datetime-local" id="siteArrivalTime" required>
                    </div>
                    <div class="form-group">
                        <label for="siteDetails">Site Details:</label>
                        <textarea id="siteDetails" placeholder="Describe the location, conditions, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Go On Site</button>
                    </div>
                </form>
            </div>
        `;

        // Prefill when selecting a saved site
        setTimeout(() => {
            const select = document.getElementById('siteSelect');
            const locInput = document.getElementById('siteLocation');
            const detailsInput = document.getElementById('siteDetails');
            if (select) {
                select.addEventListener('change', () => {
                    const idx = select.value;
                    if (idx !== '') {
                        const site = this.sites[Number(idx)];
                        locInput.value = site.name || site.address || '';
                        detailsInput.value = site.details || site.address || '';
                    }
                });
            }
        }, 0);

        // Set default time
        const now = new Date();
        document.getElementById('siteArrivalTime').value = now.toISOString().slice(0, 16);

        document.getElementById('onSiteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOnSite();
        });

        modal.style.display = 'block';
    }

    processOnSite() {
        const form = document.getElementById('onSiteForm');
        const formData = new FormData(form);
        
        this.isOnSite = true;
        this.currentSiteStartTime = new Date(formData.get('siteArrivalTime'));
        
        this.currentPatrolStop = {
            location: formData.get('siteLocation'),
            arrivalTime: this.currentSiteStartTime,
            departureTime: null,
            details: formData.get('siteDetails'),
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'On Site';
        document.getElementById('missionStatus').className = 'mission-status status-onsite';
        document.getElementById('onSiteBtn').disabled = true;
        document.getElementById('offSiteBtn').disabled = false;
        document.getElementById('checkpointBtn').disabled = false; // Enable checkpoint button when on site
        
        this.closeModal();
        this.showNotification('Now on site at ' + formData.get('siteLocation'));
        
        // Log to console as if command was executed
        this.consoleWrite(`Arrived on site: ${formData.get('siteLocation')}`);
        this.consoleWrite(`Arrival time: ${this.currentSiteStartTime.toLocaleString()}`);
        if (formData.get('siteDetails')) {
            this.consoleWrite(`Details: ${formData.get('siteDetails')}`);
        }
        this.consoleWrite('Status: ON SITE');
    }

    processOnSiteFromConsole(data) {
        this.isOnSite = true;
        this.currentSiteStartTime = new Date();
        
        this.currentPatrolStop = {
            location: data.location,
            arrivalTime: this.currentSiteStartTime,
            departureTime: null,
            details: data.details || '',
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();
        
        // Update UI
        const statusElement = document.getElementById('missionStatus');
        if (statusElement) {
            statusElement.textContent = 'On Site';
            statusElement.className = 'mission-status status-onsite';
        }
        
        const onSiteBtn = document.getElementById('onSiteBtn');
        const offSiteBtn = document.getElementById('offSiteBtn');
        const checkpointBtn = document.getElementById('checkpointBtn');
        const boloListBtn = document.getElementById('boloListBtn');
        const poiListBtn = document.getElementById('poiListBtn');
        if (onSiteBtn) onSiteBtn.disabled = true;
        if (offSiteBtn) offSiteBtn.disabled = false;
        if (checkpointBtn) checkpointBtn.disabled = false; // Enable checkpoint button when on site
        if (boloListBtn) boloListBtn.disabled = false; // Enable BOLO button when on site
        if (poiListBtn) poiListBtn.disabled = false; // Enable POI button when on site
        
        this.consoleWrite(`✓ Now on site at: ${data.location}`);
        this.consoleWrite(`✓ Arrival time: ${this.currentSiteStartTime.toLocaleString()}`);
        if (data.details) {
            this.consoleWrite(`✓ Details: ${data.details}`);
        }
        this.consoleWrite('');
        
        this.showNotification('Now on site at ' + data.location);
        this.updatePatrolStopsList();
    }

    goOffSite() {
        if (!this.isOnSite) {
            this.showNotification('Not currently on site!', 'error');
            return;
        }

        const departureTime = new Date();
        this.currentPatrolStop.departureTime = departureTime;
        
        // Add to patrol stops
        this.currentMission.patrolStops.push(this.currentPatrolStop);
        
        this.isOnSite = false;
        this.currentPatrolStop = null;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active (In Transit)';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('onSiteBtn').disabled = false;
        document.getElementById('offSiteBtn').disabled = true;
        document.getElementById('checkpointBtn').disabled = true; // Disable checkpoint button when off site
        
        // Disable BOLO and POI buttons when off site
        const boloListBtn = document.getElementById('boloListBtn');
        const poiListBtn = document.getElementById('poiListBtn');
        if (boloListBtn) boloListBtn.disabled = true;
        if (poiListBtn) poiListBtn.disabled = true;
        
        this.updatePatrolStopsList();
        this.showNotification('Left site - now in transit');
        
        // Log to console as if command was executed
        this.consoleWrite(`Departed site: ${this.currentMission.patrolStops[this.currentMission.patrolStops.length - 1].location}`);
        this.consoleWrite(`Departure time: ${departureTime.toLocaleString()}`);
        this.consoleWrite('Status: IN TRANSIT');
    }

    confirmOffSite() {
        if (!this.isOnSite) {
            this.showNotification('Not currently on site!', 'error');
            return;
        }

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Clear Scene</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to clear the scene and go off-site?</p>
                <p><strong>Current Location:</strong> ${this.currentPatrolStop?.location || 'Unknown'}</p>
                <p><strong>Time on Site:</strong> ${this.getTimeOnSite()}</p>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="button" class="btn-warning" onclick="app.processOffSite()">Clear Scene</button>
                </div>
            </div>
        `;

        this.bindModalEvents();
        modal.style.display = 'block';
    }

    processOffSite() {
        this.closeModal();
        this.goOffSite();
    }

    getTimeOnSite() {
        if (!this.currentSiteStartTime) return 'Unknown';
        const now = new Date();
        const diff = now - this.currentSiteStartTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    showIncidentModal() {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            this.showNotification('Mission must be started first!', 'error');
            return;
        }
        // Always show modal for button clicks
        this.showMobileIncidentModal();
    }

    showIncidentConsolePrompt() {
        // For console commands: Use console prompts for desktop, modal for mobile
        if (this.isMobileDevice()) {
            this.showMobileIncidentModal();
        } else {
            this.consoleWrite('=== INCIDENT REPORT CONSOLE ===');
            this.consoleWrite('Report an incident using console commands:');
            this.consoleWrite('');
            this.consoleWrite('Quick Report:');
            this.consoleWrite('  incident [type] [location] [description]');
            this.consoleWrite('');
            this.consoleWrite('Detailed Report:');
            this.consoleWrite('  incident_detailed - Start detailed incident report');
            this.consoleWrite('');
            this.consoleWrite('Available incident types:');
            this.consoleWrite('  Security Breach, Suspicious Activity, Equipment Issue');
            this.consoleWrite('  Medical Emergency, Fire/Safety, Theft, Vandalism, Other');
            this.consoleWrite('');
            this.consoleWrite('Type your command below:');
        }
    }

    showMobileIncidentModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Incident Report</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="incidentForm">
                    <div class="form-group">
                        <label for="incidentType">Incident Type:</label>
                        <select id="incidentType" required>
                            <option value="">Select incident type...</option>
                            <option value="Security Breach">Security Breach</option>
                            <option value="Suspicious Activity">Suspicious Activity</option>
                            <option value="Equipment Issue">Equipment Issue</option>
                            <option value="Medical Emergency">Medical Emergency</option>
                            <option value="Fire/Safety">Fire/Safety</option>
                            <option value="Theft">Theft</option>
                            <option value="Vandalism">Vandalism</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="incidentLocation">Location:</label>
                        <input type="text" id="incidentLocation" required placeholder="Where did this occur?">
                    </div>
                    <div class="form-group">
                        <label for="incidentDescription">Description:</label>
                        <textarea id="incidentDescription" required placeholder="Describe what happened..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="incidentAction">Action Taken (optional):</label>
                        <textarea id="incidentAction" placeholder="What action was taken?"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Report</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('incidentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileIncident();
        });

        modal.style.display = 'block';
    }

    processMobileIncident() {
        const form = document.getElementById('incidentForm');
        const formData = new FormData(form);
        
        const incident = {
            time: new Date(),
            type: formData.get('incidentType'),
            location: formData.get('incidentLocation'),
            description: formData.get('incidentDescription'),
            action: formData.get('incidentAction') || 'None specified'
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
        } else {
            this.currentMission.incidents.push(incident);
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.closeModal();
        this.showNotification('Incident report submitted successfully!');
        
        // Log to console as if command was executed
        this.consoleWrite(`Incident reported: ${incident.type}`);
        this.consoleWrite(`Location: ${incident.location}`);
        this.consoleWrite(`Time: ${incident.time.toLocaleString()}`);
        this.consoleWrite(`Description: ${incident.description}`);
        this.consoleWrite(`Action taken: ${incident.action}`);
        this.consoleWrite('Incident logged successfully');
    }

    addIncident() {
        // This method is now called from console commands
        this.consoleWrite('Incident report completed via console.');
    }

    startDetailedIncident() {
        this.consoleWrite('=== DETAILED INCIDENT REPORT ===');
        this.consoleWrite('Starting step-by-step incident report...');
        this.consoleWrite('');
        
        // Initialize incident details object
        this.pendingIncident = {
            type: '',
            location: '',
            description: '',
            action: 'None specified',
            currentStep: 'type'
        };
        
        this.askNextIncidentQuestion();
    }

    askNextIncidentQuestion() {
        if (!this.pendingIncident) return;
        
        switch (this.pendingIncident.currentStep) {
            case 'type':
                this.consoleWrite('Step 1 of 4: What type of incident is this?');
                this.consoleWrite('Available types: Security Breach, Suspicious Activity, Equipment Issue, Medical Emergency, Fire/Safety, Theft, Vandalism, Other');
                this.consoleWrite('Type: incident_type [type]');
                break;
            case 'location':
                this.consoleWrite('Step 2 of 4: Where did this incident occur?');
                this.consoleWrite('Type: incident_location [location]');
                break;
            case 'description':
                this.consoleWrite('Step 3 of 4: Please describe what happened:');
                this.consoleWrite('Type: incident_desc [description]');
                break;
            case 'action':
                this.consoleWrite('Step 4 of 4: What action was taken? (optional - press Enter to skip)');
                this.consoleWrite('Type: incident_action [action] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('Incident report ready for submission:');
                this.consoleWrite(`Type: ${this.pendingIncident.type}`);
                this.consoleWrite(`Location: ${this.pendingIncident.location}`);
                this.consoleWrite(`Description: ${this.pendingIncident.description}`);
                this.consoleWrite(`Action: ${this.pendingIncident.action}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_incident to submit report');
                break;
        }
    }

    confirmIncident() {
        if (!this.pendingIncident) {
            this.consoleWrite('ERROR: No incident details configured. Use "incident_detailed" first.');
            return;
        }

        if (!this.pendingIncident.type || !this.pendingIncident.location || !this.pendingIncident.description) {
            this.consoleWrite('ERROR: Type, location, and description are required.');
            this.consoleWrite('Use incident_type, incident_location, and incident_desc commands.');
            return;
        }

        this.consoleWrite('=== CONFIRMING INCIDENT REPORT ===');
        this.consoleWrite(`Type: ${this.pendingIncident.type}`);
        this.consoleWrite(`Location: ${this.pendingIncident.location}`);
        this.consoleWrite(`Description: ${this.pendingIncident.description}`);
        this.consoleWrite(`Action: ${this.pendingIncident.action}`);
        this.consoleWrite('');

        const incident = {
            time: new Date(),
            type: this.pendingIncident.type,
            location: this.pendingIncident.location,
            description: this.pendingIncident.description,
            action: this.pendingIncident.action
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
            this.consoleWrite('✓ Incident added to current patrol stop');
        } else {
            this.currentMission.incidents.push(incident);
            this.consoleWrite('✓ Incident added to general mission incidents');
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.consoleWrite('✓ Incident report submitted successfully!');
        
        // Clear pending incident
        this.pendingIncident = null;
    }

    // =====================
    // Site Manager
    // =====================
    loadSites() {
        try {
            const raw = localStorage.getItem('fieldOfficerSites');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error loading sites:', e);
            return [];
        }
    }

    saveSites() {
        try {
            localStorage.setItem('fieldOfficerSites', JSON.stringify(this.sites));
        } catch (e) {
            console.error('Error saving sites:', e);
        }
    }

    showSiteManager() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const rows = this.sites.map((s, i) => `
            <tr>
                <td>${s.name || ''}</td>
                <td>${s.address || ''}</td>
                <td>${s.details || ''}</td>
                <td>
                    <button class="btn-small btn-primary" data-edit="${i}">Edit</button>
                    <button class="btn-small btn-danger" data-del="${i}">Delete</button>
                </td>
            </tr>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Site Manager</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="siteForm" style="margin-bottom: 16px;">
                    <div class="form-group"><label for="siteName">Site Name</label><input id="siteName" required></div>
                    <div class="form-group"><label for="siteAddress">Address</label><input id="siteAddress"></div>
                    <div class="form-group"><label for="siteDesc">Details</label><textarea id="siteDesc"></textarea></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Save Site</button>
                    </div>
                </form>
                <div class="copy-area" style="max-height: 260px;">
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">Name</th>
                                <th style="text-align:left;">Address</th>
                                <th style="text-align:left;">Details</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="sitesTable">${rows || '<tr><td colspan="4">No sites saved.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // Handlers
        document.getElementById('siteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const site = {
                name: document.getElementById('siteName').value.trim(),
                address: document.getElementById('siteAddress').value.trim(),
                details: document.getElementById('siteDesc').value.trim()
            };
            this.sites.push(site);
            this.saveSites();
            this.showSiteManager();
            this.showNotification('Site saved');
        });

        modal.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-del'));
                this.sites.splice(idx, 1);
                this.saveSites();
                this.showSiteManager();
                this.showNotification('Site deleted');
            });
        });

        modal.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-edit'));
                const s = this.sites[idx];
                document.getElementById('siteName').value = s.name || '';
                document.getElementById('siteAddress').value = s.address || '';
                document.getElementById('siteDesc').value = s.details || '';
                // Replace submit to update instead of add
                const form = document.getElementById('siteForm');
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', (e2) => {
                    e2.preventDefault();
                    this.sites[idx] = {
                        name: document.getElementById('siteName').value.trim(),
                        address: document.getElementById('siteAddress').value.trim(),
                        details: document.getElementById('siteDesc').value.trim()
                    };
                    this.saveSites();
                    this.showSiteManager();
                    this.showNotification('Site updated');
                });
            });
        });
    }

    // =====================
    // BOLO Board (Person of Interest → BOLO)
    // =====================
    loadBolos() {
        try {
            const raw = localStorage.getItem('fieldOfficerBolos');
            const bolos = raw ? JSON.parse(raw) : [];
            
            // Ensure all BOLOs have IDs and migrate old data
            let nextId = this.getNextBoloId();
            let needsSave = false;
            
            bolos.forEach(bolo => {
                if (!bolo.id) {
                    bolo.id = nextId++;
                    needsSave = true;
                }
                if (!bolo.location) {
                    bolo.location = 'All Sites';
                    needsSave = true;
                }
            });
            
            if (needsSave) {
                this.saveBolos(bolos);
            }
            
            return bolos;
        } catch (e) {
            console.error('Error loading BOLOs:', e);
            return [];
        }
    }

    saveBolos(bolosData = null) {
        try {
            const dataToSave = bolosData || this.bolos;
            localStorage.setItem('fieldOfficerBolos', JSON.stringify(dataToSave));
            if (!bolosData) {
                // Also save the next ID counter
                localStorage.setItem('fieldOfficerBoloNextId', JSON.stringify(this.getNextBoloId()));
            }
        } catch (e) {
            console.error('Error saving BOLOs:', e);
        }
    }

    getNextBoloId() {
        try {
            const stored = localStorage.getItem('fieldOfficerBoloNextId');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Calculate next ID based on existing BOLOs
            const maxId = this.bolos.reduce((max, bolo) => {
                return Math.max(max, bolo.id || 0);
            }, 0);
            
            return maxId + 1;
        } catch (e) {
            console.error('Error getting next BOLO ID:', e);
            return 1;
        }
    }

    generateBoloId() {
        const nextId = this.getNextBoloId();
        localStorage.setItem('fieldOfficerBoloNextId', JSON.stringify(nextId + 1));
        return nextId;
    }

    showBoloBoard() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const rows = this.bolos.map((b, i) => `
            <tr>
                <td style="font-weight: bold; color: var(--desktop-accent, var(--mobile-accent));">${b.id || 'N/A'}</td>
                <td>${b.subject || ''}</td>
                <td>${b.type || ''}</td>
                <td>${b.location || 'All Sites'}</td>
                <td>${b.notes || ''}</td>
                <td style="font-size: 11px;">${this.formatDateTime(b.createdAt)}</td>
                <td>
                    <button class="btn-small btn-primary" data-edit-b="${i}">Edit</button>
                    <button class="btn-small btn-danger" data-del-b="${i}">Delete</button>
                </td>
            </tr>
        `).join('');

        // Get site options for dropdown
        const siteOptions = this.sites.map(site => 
            `<option value="${site.name}">${site.name}</option>`
        ).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>BOLO Board - Manage All BOLOs</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="boloForm" style="margin-bottom: 16px;">
                    <div class="form-group">
                        <label for="boloSubject">Subject (Name/Plate/Item)</label>
                        <input id="boloSubject" required placeholder="Enter subject name, license plate, or item description">
                    </div>
                    <div class="form-group">
                        <label for="boloType">Type</label>
                        <select id="boloType" required>
                            <option value="Person">Person</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Item">Item</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="boloLocation">Location</label>
                        <select id="boloLocation" required>
                            <option value="All Sites">All Sites</option>
                            ${siteOptions}
                            <option value="custom">Custom Location...</option>
                        </select>
                    </div>
                    <div class="form-group" id="customLocationGroup" style="display: none;">
                        <label for="boloCustomLocation">Custom Location</label>
                        <input id="boloCustomLocation" placeholder="Enter custom location name">
                    </div>
                    <div class="form-group">
                        <label for="boloNotes">Description/Notes</label>
                        <textarea id="boloNotes" placeholder="Detailed description, identifying features, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Add BOLO</button>
                    </div>
                </form>
                <div class="copy-area" style="max-height: 300px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: var(--desktop-bg-tertiary, var(--mobile-bg-tertiary));">
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">ID</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Subject</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Type</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Location</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Notes</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Created</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="boloTable">${rows || '<tr><td colspan="7" style="padding: 20px; text-align: center;">No BOLOs posted.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        // Handle custom location toggle
        document.getElementById('boloLocation').addEventListener('change', (e) => {
            const customGroup = document.getElementById('customLocationGroup');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
                document.getElementById('boloCustomLocation').required = true;
            } else {
                customGroup.style.display = 'none';
                document.getElementById('boloCustomLocation').required = false;
            }
        });

        modal.style.display = 'block';

        document.getElementById('boloForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            let location = document.getElementById('boloLocation').value;
            if (location === 'custom') {
                location = document.getElementById('boloCustomLocation').value.trim();
                if (!location) {
                    this.showNotification('Please enter a custom location name', 'error');
                    return;
                }
                // Auto-create new site if it doesn't exist
                if (!this.sites.find(s => s.name === location)) {
                    this.sites.push({
                        name: location,
                        address: 'Auto-created from BOLO',
                        details: 'Automatically created when adding BOLO'
                    });
                    this.saveSites();
                }
            }
            
            const bolo = {
                id: this.generateBoloId(),
                subject: document.getElementById('boloSubject').value.trim(),
                type: document.getElementById('boloType').value,
                location: location,
                notes: document.getElementById('boloNotes').value.trim(),
                createdAt: new Date().toISOString(),
                active: true
            };
            this.bolos.push(bolo);
            this.saveBolos();
            this.showBoloBoard();
            this.showNotification('BOLO added with ID #' + bolo.id);
        });

        modal.querySelectorAll('[data-del-b]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-del-b'));
                this.bolos.splice(idx, 1);
                this.saveBolos();
                this.showBoloBoard();
                this.showNotification('BOLO removed');
            });
        });

        modal.querySelectorAll('[data-edit-b]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-edit-b'));
                const b = this.bolos[idx];
                document.getElementById('boloSubject').value = b.subject || '';
                document.getElementById('boloType').value = b.type || 'Person';
                document.getElementById('boloLocation').value = b.location || 'All Sites';
                document.getElementById('boloNotes').value = b.notes || '';
                
                // Handle custom location display
                if (b.location && !this.sites.find(s => s.name === b.location) && b.location !== 'All Sites') {
                    document.getElementById('boloLocation').value = 'custom';
                    document.getElementById('customLocationGroup').style.display = 'block';
                    document.getElementById('boloCustomLocation').value = b.location;
                    document.getElementById('boloCustomLocation').required = true;
                }
                
                const form = document.getElementById('boloForm');
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                // Re-add custom location handler
                newForm.querySelector('#boloLocation').addEventListener('change', (e) => {
                    const customGroup = document.getElementById('customLocationGroup');
                    if (e.target.value === 'custom') {
                        customGroup.style.display = 'block';
                        document.getElementById('boloCustomLocation').required = true;
                    } else {
                        customGroup.style.display = 'none';
                        document.getElementById('boloCustomLocation').required = false;
                    }
                });
                
                newForm.addEventListener('submit', (e2) => {
                    e2.preventDefault();
                    
                    let location = document.getElementById('boloLocation').value;
                    if (location === 'custom') {
                        location = document.getElementById('boloCustomLocation').value.trim();
                        if (!location) {
                            this.showNotification('Please enter a custom location name', 'error');
                            return;
                        }
                        // Auto-create new site if it doesn't exist
                        if (!this.sites.find(s => s.name === location)) {
                            this.sites.push({
                                name: location,
                                address: 'Auto-created from BOLO',
                                details: 'Automatically created when editing BOLO'
                            });
                            this.saveSites();
                        }
                    }
                    
                    this.bolos[idx] = {
                        id: b.id, // Keep original ID - cannot be changed
                        subject: document.getElementById('boloSubject').value.trim(),
                        type: document.getElementById('boloType').value,
                        location: location,
                        notes: document.getElementById('boloNotes').value.trim(),
                        createdAt: b.createdAt,
                        active: b.active !== undefined ? b.active : true
                    };
                    this.saveBolos();
                    this.showBoloBoard();
                    this.showNotification('BOLO updated');
                });
            });
        });
    }

    // Enhanced BOLO functionality for current location
    showCurrentLocationBolos() {
        if (!this.isOnSite || !this.currentPatrolStop) {
            this.showNotification('Must be on site to view location-specific BOLOs!', 'error');
            return;
        }

        const currentLocation = this.currentPatrolStop.location;
        
        // Filter BOLOs by current location or show all active BOLOs
        const locationBolos = this.bolos.filter(bolo => 
            bolo.active !== false && (
                !bolo.location || 
                bolo.location.toLowerCase().includes(currentLocation.toLowerCase()) ||
                currentLocation.toLowerCase().includes(bolo.location?.toLowerCase() || '')
            )
        );

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        // Create Excel-like table with enhanced styling
        const tableRows = locationBolos.map((bolo, i) => `
            <tr style="border-bottom: 1px solid var(--desktop-border, var(--mobile-border));">
                <td style="padding: 8px; font-weight: bold;">${bolo.id || (i + 1)}</td>
                <td style="padding: 8px;">${bolo.subject || 'N/A'}</td>
                <td style="padding: 8px;">${bolo.type || 'Person'}</td>
                <td style="padding: 8px;">${bolo.description || bolo.notes || 'No description'}</td>
                <td style="padding: 8px;">${bolo.priority || 'Medium'}</td>
                <td style="padding: 8px; font-size: 11px;">${this.formatDateTime(bolo.createdAt || new Date())}</td>
                <td style="padding: 8px;">
                    <span style="padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; 
                          background: ${bolo.active !== false ? 'var(--desktop-success, var(--mobile-success))' : 'var(--desktop-danger, var(--mobile-danger))'}; 
                          color: white;">
                        ${bolo.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </td>
            </tr>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>🚨 BOLO ALERTS - ${currentLocation.toUpperCase()}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px; padding: 12px; background: var(--desktop-bg-tertiary, var(--mobile-bg-tertiary)); border-radius: 4px;">
                    <strong>Current Location:</strong> ${currentLocation}<br>
                    <strong>On Site Since:</strong> ${this.currentSiteStartTime ? this.currentSiteStartTime.toLocaleString() : 'Unknown'}<br>
                    <strong>Active BOLOs:</strong> ${locationBolos.length}
                </div>
                
                <div style="overflow-x: auto; max-height: 400px; border: 1px solid var(--desktop-border, var(--mobile-border)); border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead style="background: var(--desktop-bg-secondary, var(--mobile-bg-secondary)); position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">ID</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Subject</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Type</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Description</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Priority</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Created</th>
                                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid var(--desktop-border, var(--mobile-border)); font-weight: bold;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: var(--desktop-text-muted, var(--mobile-text-muted));">No active BOLOs for this location</td></tr>'}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 16px; padding: 8px; background: var(--desktop-bg-primary, var(--mobile-bg-primary)); border-radius: 4px; font-size: 11px;">
                    <strong>Console Command:</strong> Type "bolos" to view all system BOLOs or "bolo [subject] [description]" to create new BOLO
                </div>
            </div>
        `;

        modal.style.display = 'block';
        
        // Also log to console
        this.consoleWrite(`=== LOCATION-SPECIFIC BOLO ALERTS ===`);
        this.consoleWrite(`Current Location: ${currentLocation}`);
        this.consoleWrite(`Active BOLOs Found: ${locationBolos.length}`);
        this.consoleWrite('');
        
        if (locationBolos.length > 0) {
            locationBolos.forEach((bolo, idx) => {
                this.consoleWrite(`[${idx + 1}] ID: ${bolo.id || 'N/A'} | ${bolo.type || 'Person'}: ${bolo.subject || 'Unknown'}`);
                if (bolo.description || bolo.notes) {
                    this.consoleWrite(`    Description: ${bolo.description || bolo.notes}`);
                }
                this.consoleWrite(`    Priority: ${bolo.priority || 'Medium'} | Status: ${bolo.active !== false ? 'ACTIVE' : 'INACTIVE'}`);
                this.consoleWrite('');
            });
        } else {
            this.consoleWrite('No active BOLOs found for current location.');
        }
        
        this.consoleWrite('BOLO display opened in modal window.');
    }

    // =====================
    // Person of Interest (POI) System
    // =====================
    loadPOIs() {
        try {
            const raw = localStorage.getItem('fieldOfficerPOIs');
            const pois = raw ? JSON.parse(raw) : [];
            
            // Ensure all POIs have IDs and migrate old data
            let nextId = this.getNextPOIId();
            let needsSave = false;
            
            pois.forEach(poi => {
                if (!poi.id) {
                    poi.id = nextId++;
                    needsSave = true;
                }
                if (!poi.locations) {
                    poi.locations = poi.location ? [poi.location] : ['All Sites'];
                    needsSave = true;
                }
                if (!poi.status) {
                    poi.status = 'Active';
                    needsSave = true;
                }
            });
            
            if (needsSave) {
                this.savePOIs(pois);
            }
            
            return pois;
        } catch (e) {
            console.error('Error loading POIs:', e);
            return [];
        }
    }

    savePOIs(poisData = null) {
        try {
            const dataToSave = poisData || this.pois;
            localStorage.setItem('fieldOfficerPOIs', JSON.stringify(dataToSave));
            if (!poisData) {
                localStorage.setItem('fieldOfficerPOINextId', JSON.stringify(this.getNextPOIId()));
            }
        } catch (e) {
            console.error('Error saving POIs:', e);
        }
    }

    getNextPOIId() {
        try {
            const stored = localStorage.getItem('fieldOfficerPOINextId');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Calculate next ID based on existing POIs
            const maxId = this.pois.reduce((max, poi) => {
                return Math.max(max, poi.id || 0);
            }, 0);
            
            return maxId + 1;
        } catch (e) {
            console.error('Error getting next POI ID:', e);
            return 1;
        }
    }

    generatePOIId() {
        const nextId = this.getNextPOIId();
        localStorage.setItem('fieldOfficerPOINextId', JSON.stringify(nextId + 1));
        return nextId;
    }

    showPOIBoard() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const rows = this.pois.map((p, i) => `
            <tr>
                <td style="font-weight: bold; color: var(--desktop-accent, var(--mobile-accent));">${p.id || 'N/A'}</td>
                <td>${p.firstName || ''}</td>
                <td>${p.lastName || ''}</td>
                <td>${p.status || 'Active'}</td>
                <td>${(p.locations || []).join(', ')}</td>
                <td>${p.notes || ''}</td>
                <td style="font-size: 11px;">${this.formatDateTime(p.createdAt)}</td>
                <td>
                    <button class="btn-small btn-primary" data-edit-p="${i}">Edit</button>
                    <button class="btn-small btn-danger" data-del-p="${i}">Delete</button>
                </td>
            </tr>
        `).join('');

        // Get site options for dropdown
        const siteOptions = this.sites.map(site => 
            `<option value="${site.name}">${site.name}</option>`
        ).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Person of Interest (POI) Database</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="poiForm" style="margin-bottom: 16px;">
                    <div class="form-group">
                        <label for="poiFirstName">First Name</label>
                        <input id="poiFirstName" required placeholder="Enter first name">
                    </div>
                    <div class="form-group">
                        <label for="poiLastName">Last Name</label>
                        <input id="poiLastName" required placeholder="Enter last name">
                    </div>
                    <div class="form-group">
                        <label for="poiStatus">Status</label>
                        <select id="poiStatus" required>
                            <option value="Banned">Banned</option>
                            <option value="Warned">Warned</option>
                            <option value="Talked To">Talked To</option>
                            <option value="Continuous Problem">Continuous Problem</option>
                            <option value="Watch List">Watch List</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="poiLocations">Locations (hold Ctrl/Cmd for multiple)</label>
                        <select id="poiLocations" multiple style="height: 100px;">
                            <option value="All Sites">All Sites</option>
                            ${siteOptions}
                        </select>
                        <small style="color: var(--desktop-text-muted, var(--mobile-text-muted));">Select multiple locations where this person has been encountered</small>
                    </div>
                    <div class="form-group">
                        <label for="poiNotes">Description/Notes</label>
                        <textarea id="poiNotes" placeholder="Physical description, incidents, behavior patterns, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Add POI</button>
                    </div>
                </form>
                <div class="copy-area" style="max-height: 300px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: var(--desktop-bg-tertiary, var(--mobile-bg-tertiary));">
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">ID</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">First Name</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Last Name</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Status</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Locations</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Notes</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Created</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="poiTable">${rows || '<tr><td colspan="8" style="padding: 20px; text-align: center;">No POIs recorded.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        document.getElementById('poiForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const selectedLocations = Array.from(document.getElementById('poiLocations').selectedOptions)
                .map(option => option.value);
            
            if (selectedLocations.length === 0) {
                this.showNotification('Please select at least one location', 'error');
                return;
            }
            
            const poi = {
                id: this.generatePOIId(),
                firstName: document.getElementById('poiFirstName').value.trim(),
                lastName: document.getElementById('poiLastName').value.trim(),
                status: document.getElementById('poiStatus').value,
                locations: selectedLocations,
                notes: document.getElementById('poiNotes').value.trim(),
                createdAt: new Date().toISOString()
            };
            
            this.pois.push(poi);
            this.savePOIs();
            this.showPOIBoard();
            this.showNotification(`POI added: ${poi.firstName} ${poi.lastName} (ID #${poi.id})`);
        });

        modal.querySelectorAll('[data-del-p]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-del-p'));
                const poi = this.pois[idx];
                if (confirm(`Delete POI: ${poi.firstName} ${poi.lastName}?`)) {
                    this.pois.splice(idx, 1);
                    this.savePOIs();
                    this.showPOIBoard();
                    this.showNotification('POI deleted');
                }
            });
        });

        modal.querySelectorAll('[data-edit-p]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-edit-p'));
                const p = this.pois[idx];
                document.getElementById('poiFirstName').value = p.firstName || '';
                document.getElementById('poiLastName').value = p.lastName || '';
                document.getElementById('poiStatus').value = p.status || 'Active';
                document.getElementById('poiNotes').value = p.notes || '';
                
                // Select multiple locations
                const locationSelect = document.getElementById('poiLocations');
                Array.from(locationSelect.options).forEach(option => {
                    option.selected = (p.locations || []).includes(option.value);
                });
                
                const form = document.getElementById('poiForm');
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                newForm.addEventListener('submit', (e2) => {
                    e2.preventDefault();
                    
                    const selectedLocations = Array.from(document.getElementById('poiLocations').selectedOptions)
                        .map(option => option.value);
                    
                    if (selectedLocations.length === 0) {
                        this.showNotification('Please select at least one location', 'error');
                        return;
                    }
                    
                    this.pois[idx] = {
                        id: p.id, // Keep original ID - cannot be changed
                        firstName: document.getElementById('poiFirstName').value.trim(),
                        lastName: document.getElementById('poiLastName').value.trim(),
                        status: document.getElementById('poiStatus').value,
                        locations: selectedLocations,
                        notes: document.getElementById('poiNotes').value.trim(),
                        createdAt: p.createdAt
                    };
                    
                    this.savePOIs();
                    this.showPOIBoard();
                    this.showNotification('POI updated');
                });
            });
        });
    }

    showCurrentLocationPOIs() {
        if (!this.isOnSite || !this.currentPatrolStop) {
            this.showNotification('Must be on site to view location-specific POIs!', 'error');
            return;
        }

        const currentLocation = this.currentPatrolStop.location;
        
        // Filter POIs by current location
        const locationPOIs = this.pois.filter(poi => 
            poi.locations && (
                poi.locations.includes('All Sites') ||
                poi.locations.some(loc => 
                    loc.toLowerCase().includes(currentLocation.toLowerCase()) ||
                    currentLocation.toLowerCase().includes(loc.toLowerCase())
                )
            )
        );

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const tableRows = locationPOIs.map((poi, i) => `
            <tr style="border-bottom: 1px solid var(--desktop-border, var(--mobile-border));">
                <td style="padding: 8px; font-weight: bold;">${poi.id || (i + 1)}</td>
                <td style="padding: 8px;">${poi.firstName || 'N/A'}</td>
                <td style="padding: 8px;">${poi.lastName || 'N/A'}</td>
                <td style="padding: 8px;">
                    <span style="padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; 
                          background: ${this.getPOIStatusColor(poi.status)}; color: white;">
                        ${poi.status || 'Active'}
                    </span>
                </td>
                <td style="padding: 8px;">${(poi.locations || []).join(', ')}</td>
                <td style="padding: 8px;">${poi.notes || 'No description'}</td>
                <td style="padding: 8px; font-size: 11px;">${this.formatDateTime(poi.createdAt || new Date())}</td>
            </tr>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>👤 POI ALERTS - ${currentLocation.toUpperCase()}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px; padding: 12px; background: var(--desktop-bg-tertiary, var(--mobile-bg-tertiary)); border-radius: 4px;">
                    <strong>Current Location:</strong> ${currentLocation}<br>
                    <strong>On Site Since:</strong> ${this.currentSiteStartTime ? this.currentSiteStartTime.toLocaleString() : 'Unknown'}<br>
                    <strong>POIs for Location:</strong> ${locationPOIs.length}
                </div>
                
                <div style="overflow-x: auto; max-height: 400px; border: 1px solid var(--desktop-border, var(--mobile-border)); border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: var(--desktop-bg-tertiary, var(--mobile-bg-tertiary));">
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">ID</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">First Name</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Last Name</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Status</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Locations</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Notes</th>
                                <th style="padding: 8px; border: 1px solid var(--desktop-border, var(--mobile-border));">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: var(--desktop-text-muted, var(--mobile-text-muted));">No POIs found for this location</td></tr>'}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 16px; padding: 8px; background: var(--desktop-bg-primary, var(--mobile-bg-primary)); border-radius: 4px; font-size: 11px;">
                    <strong>Console Command:</strong> Type "pois" to view all POIs or manage POI database from main menu
                </div>
            </div>
        `;

        modal.style.display = 'block';
        
        // Also log to console
        this.consoleWrite(`=== LOCATION-SPECIFIC POI ALERTS ===`);
        this.consoleWrite(`Current Location: ${currentLocation}`);
        this.consoleWrite(`POIs Found: ${locationPOIs.length}`);
        this.consoleWrite('');
        
        if (locationPOIs.length > 0) {
            locationPOIs.forEach((poi, idx) => {
                this.consoleWrite(`[${idx + 1}] ID: ${poi.id || 'N/A'} | ${poi.firstName} ${poi.lastName}`);
                this.consoleWrite(`    Status: ${poi.status || 'Active'} | Locations: ${(poi.locations || []).join(', ')}`);
                if (poi.notes) {
                    this.consoleWrite(`    Notes: ${poi.notes}`);
                }
                this.consoleWrite('');
            });
        } else {
            this.consoleWrite('No POIs found for current location.');
        }
        
        this.consoleWrite('POI display opened in modal window.');
    }

    getPOIStatusColor(status) {
        switch(status) {
            case 'Banned': return '#ff3333';
            case 'Warned': return '#ffaa00';
            case 'Continuous Problem': return '#ff6b35';
            case 'Watch List': return '#3182ce';
            case 'Talked To': return '#38a169';
            case 'Inactive': return '#888888';
            default: return '#38a169';
        }
    }

    // =====================
    // Command Console
    // =====================
    bindConsole() {
        const input = document.getElementById('consoleInput');
        if (!input) return;
        
        // Initialize command history with persistence
        this.loadCommandHistory();
        this.historyIndex = -1;
        
        input.addEventListener('keydown', (e) => {
            // Check if we're in prompt mode or step-by-step mode
            if ((this.currentPromptSequence && this.promptKeyListener) || 
                (this.currentStepByStep && !this.currentStepByStep.cancelled)) {
                // Let the respective handler deal with it
                return;
            }
            
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    // Add to history and save
                    this.commandHistory.unshift(cmd);
                    // Keep only last 50 commands
                    if (this.commandHistory.length > 50) {
                        this.commandHistory = this.commandHistory.slice(0, 50);
                    }
                    this.saveCommandHistory();
                    this.historyIndex = -1;
                    this.clearHistoryIndicator();
                    this.handleCommand(cmd);
                }
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.commandHistory[this.historyIndex] || '';
                    // Show history indicator
                    this.showHistoryIndicator(this.historyIndex + 1, this.commandHistory.length);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.commandHistory[this.historyIndex] || '';
                    this.showHistoryIndicator(this.historyIndex + 1, this.commandHistory.length);
                } else if (this.historyIndex === 0) {
                    this.historyIndex = -1;
                    input.value = '';
                    this.clearHistoryIndicator();
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autoComplete(input);
            }
        });
        
        // Professional startup message
        this.consoleWrite('=== PROFESSIONAL GUARD SYSTEM v2.1 ===');
        this.consoleWrite('🚔 SECURE TERMINAL INITIALIZED');
        this.consoleWrite('');
        this.consoleWrite('✓ Database connection: ACTIVE');
        this.consoleWrite('✓ Communication systems: ONLINE');
        this.consoleWrite('✓ GPS tracking: ENABLED');
        this.consoleWrite('✓ Emergency protocols: LOADED');
        this.consoleWrite('✓ Command history: LOADED (' + this.commandHistory.length + ' previous commands)');
        this.consoleWrite('');
        this.consoleWrite('Type "help" for command reference');
        this.consoleWrite('Professional format: start [06:00] [am] end [14:00] [pm] [assignment]');
        this.consoleWrite('Quick commands: radio, backup, bolo, patrol');
        this.consoleWrite('Navigation: ↑/↓ arrows for command history, TAB for autocomplete');
        this.consoleWrite('');
        this.consoleWrite('System ready for operations...');
    }

    autoComplete(input) {
        const value = input.value.toLowerCase();
        const commands = ['help', 'start', 'onsite', 'offsite', 'incident', 'checkpoint', 'report', 'end', 'sites', 'bolos', 'bolo', 'pois', 'poi', 'patrol', 'radio', 'backup', 'code', 'logs', 'status', 'time', 'clear', 'home'];
        
        const matches = commands.filter(cmd => cmd.startsWith(value));
        if (matches.length === 1) {
            input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            this.consoleWrite(`Available: ${matches.join(', ')}`);
        }
    }

    // Command history persistence
    loadCommandHistory() {
        try {
            const saved = localStorage.getItem('guardSystemCommandHistory');
            this.commandHistory = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading command history:', e);
            this.commandHistory = [];
        }
    }

    saveCommandHistory() {
        try {
            localStorage.setItem('guardSystemCommandHistory', JSON.stringify(this.commandHistory));
        } catch (e) {
            console.error('Error saving command history:', e);
        }
    }

    // History navigation indicators
    showHistoryIndicator(current, total) {
        let indicator = document.getElementById('historyIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'historyIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 50px;
                right: 20px;
                background: var(--desktop-bg-secondary, var(--mobile-bg-secondary));
                color: var(--desktop-text-muted, var(--mobile-text-muted));
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-family: 'Courier New', monospace;
                border: 1px solid var(--desktop-border, var(--mobile-border));
                z-index: 1000;
                opacity: 0.8;
            `;
            document.body.appendChild(indicator);
        }
        indicator.textContent = `History: ${current}/${total}`;
        indicator.style.display = 'block';
    }

    clearHistoryIndicator() {
        const indicator = document.getElementById('historyIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    consoleWrite(text, type = 'info') {
        const out = document.getElementById('consoleOutput');
        if (!out) return;
        
        const line = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        // Add styling based on type
        line.className = `console-line console-${type}`;
        
        if (text.startsWith('$')) {
            // Command input
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-command">${text}</span>`;
        } else if (text.startsWith('ERROR:')) {
            // Error message
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-error">${text}</span>`;
        } else if (text.startsWith('WARNING:')) {
            // Warning message
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-warning">${text}</span>`;
        } else if (text.startsWith('===')) {
            // System message
            line.innerHTML = `<span class="console-system">${text}</span>`;
        } else {
            // Regular output
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-output-text">${text}</span>`;
        }
        
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
    }

    handleCommand(raw) {
        const [cmd, ...args] = raw.split(/\s+/);
        const a = args.join(' ');
        this.consoleWrite(`$ ${raw}`);
        switch ((cmd || '').toLowerCase()) {
            case 'help':
                this.consoleWrite('=== PROFESSIONAL GUARD SYSTEM COMMANDS ===');
                this.consoleWrite('');
                this.consoleWrite('NAVIGATION:');
                this.consoleWrite('  ↑/↓ arrows - Browse command history');
                this.consoleWrite('  TAB - Auto-complete commands');
                this.consoleWrite('  ENTER - Execute command or complete step');
                this.consoleWrite('  TAB (during step-by-step) - Cancel current command');
                this.consoleWrite('');
                this.consoleWrite('MISSION CONTROL:');
                this.consoleWrite('  start [HH:MM] [am/pm] end [HH:MM] [am/pm] [details] - Start shift');
                this.consoleWrite('  start [officer_name] - Quick start mission');
                this.consoleWrite('  end - End current shift/mission');
                this.consoleWrite('  status - Show current mission status');
                this.consoleWrite('');
                this.consoleWrite('SITE OPERATIONS:');
                this.consoleWrite('  onsite [location] - Arrive at location (step-by-step mode)');
                this.consoleWrite('  offsite - Depart current location');
                this.consoleWrite('  patrol [location] - Begin patrol route');
                this.consoleWrite('  checkpoint [name] [status] - Log checkpoint (step-by-step mode)');
                this.consoleWrite('');
                this.consoleWrite('INCIDENT REPORTING:');
                this.consoleWrite('  incident [type] [location] [description] - Report incident (step-by-step mode)');
                this.consoleWrite('  bolo [subject] [description] - Create BOLO alert');
                this.consoleWrite('  poi [firstName] [lastName] [status] - Add Person of Interest');
                this.consoleWrite('  report [summary] - Generate report (step-by-step mode)');
                this.consoleWrite('');
                this.consoleWrite('COMMUNICATION:');
                this.consoleWrite('  radio [message] - Radio check with dispatch');
                this.consoleWrite('  backup - Request emergency backup');
                this.consoleWrite('  code [code] - Look up security/police codes');
                this.consoleWrite('');
                this.consoleWrite('SYSTEM UTILITIES:');
                this.consoleWrite('  sites - List saved sites');
                this.consoleWrite('  bolos - List active BOLOs (all locations)');
                this.consoleWrite('  pois - List all Persons of Interest');
                this.consoleWrite('  logs - View mission history');
                this.consoleWrite('  time - Show current time');
                this.consoleWrite('  clear - Clear console');
                this.consoleWrite('');
                this.consoleWrite('STEP-BY-STEP COMMANDS:');
                this.consoleWrite('  Commands marked with (step-by-step mode) will guide you through');
                this.consoleWrite('  each required field. Use ENTER to complete each step, TAB to cancel.');
                this.consoleWrite('');
                this.consoleWrite('EXAMPLES:');
                this.consoleWrite('  start 06:00 am end 14:00 pm Perimeter patrol');
                this.consoleWrite('  onsite (will prompt for location and details)');
                this.consoleWrite('  incident (will prompt for type, location, description, action)');
                this.consoleWrite('  bolo John Doe Wanted for questioning - white male 5ft 10in');
                this.consoleWrite('  patrol Building A - Conducting security sweep');
                break;
            case 'start':
                if (args.length > 0) {
                    // Check if it's the professional format: start [time] [am/pm] end [time] [am/pm] [details]
                    if (this.isProfessionalTimeFormat(args)) {
                        this.handleProfessionalStart(args);
                    } else {
                        this.quickStartMission(a);
                    }
                } else {
                    // Use step-by-step interface for detailed mission start
                    this.startStepByStepCommand('start', [
                        { prompt: 'Specialist Name', key: 'specialistName', required: true },
                        { prompt: 'Start Time (YYYY-MM-DD HH:MM or leave blank for now)', key: 'startTime', required: false },
                        { prompt: 'End Time (YYYY-MM-DD HH:MM or leave blank for 8 hours)', key: 'endTime', required: false },
                        { prompt: 'Mission Notes', key: 'notes', required: false }
                    ], (data) => {
                        this.processStepByStepStart(data);
                    });
                }
                break;
            case 'start_detailed':
                this.startDetailedMission();
                break;
            case 'specialist':
                if (args.length > 0) {
                    this.pendingMissionDetails = this.pendingMissionDetails || {};
                    this.pendingMissionDetails.specialistName = a;
                    this.consoleWrite(`✓ Specialist name set: ${a}`);
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'start_time';
                    this.askNextMissionQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide specialist name. Usage: specialist [name]');
                }
                break;
            case 'start_time':
                if (args.length > 0) {
                    const timeStr = a;
                    const startTime = new Date(timeStr);
                    if (isNaN(startTime.getTime())) {
                        this.consoleWrite('ERROR: Invalid date format. Use YYYY-MM-DD HH:MM');
                    } else {
                        this.pendingMissionDetails = this.pendingMissionDetails || {};
                        this.pendingMissionDetails.startTime = startTime;
                        this.consoleWrite(`✓ Start time set: ${startTime.toLocaleString()}`);
                        this.consoleWrite('');
                        this.pendingMissionDetails.currentStep = 'end_time';
                        this.askNextMissionQuestion();
                    }
                } else {
                    // Skip to next step if no time provided
                    this.consoleWrite('✓ Using current time as start time');
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'end_time';
                    this.askNextMissionQuestion();
                }
                break;
            case 'end_time':
                if (args.length > 0) {
                    const timeStr = a;
                    const endTime = new Date(timeStr);
                    if (isNaN(endTime.getTime())) {
                        this.consoleWrite('ERROR: Invalid date format. Use YYYY-MM-DD HH:MM');
                    } else {
                        this.pendingMissionDetails = this.pendingMissionDetails || {};
                        this.pendingMissionDetails.endTime = endTime;
                        this.consoleWrite(`✓ End time set: ${endTime.toLocaleString()}`);
                        this.consoleWrite('');
                        this.pendingMissionDetails.currentStep = 'notes';
                        this.askNextMissionQuestion();
                    }
                } else {
                    // Skip to next step if no time provided
                    this.consoleWrite('✓ Using default end time (8 hours from start)');
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'notes';
                    this.askNextMissionQuestion();
                }
                break;
            case 'notes':
                if (args.length > 0) {
                    this.pendingMissionDetails = this.pendingMissionDetails || {};
                    this.pendingMissionDetails.notes = a;
                    this.consoleWrite(`✓ Notes set: ${a}`);
                } else {
                    this.consoleWrite('✓ No notes added');
                }
                this.consoleWrite('');
                this.pendingMissionDetails.currentStep = 'confirm';
                this.askNextMissionQuestion();
                break;
            case 'confirm_start':
                this.confirmStartMission();
                break;
            case 'cancel':
                this.pendingMissionDetails = null;
                this.consoleWrite('Mission start cancelled. System remains inactive.');
                break;
            case 'onsite':
                if (args.length > 0) {
                    this.quickGoOnSite(a);
                } else {
                    this.goOnSite();
                    this.consoleWrite('Opening Go On Site form...');
                }
                break;
            case 'offsite':
                this.goOffSite();
                this.consoleWrite('Processing off-site...');
                break;
            case 'incident':
                if (args.length >= 3) {
                    this.quickIncident(args);
                } else {
                    this.showIncidentConsolePrompt();
                }
                break;
            case 'incident_detailed':
                this.startDetailedIncident();
                break;
            case 'incident_type':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.type = a;
                    this.consoleWrite(`✓ Incident type set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'location';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide incident type. Usage: incident_type [type]');
                }
                break;
            case 'incident_location':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.location = a;
                    this.consoleWrite(`✓ Location set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'description';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide location. Usage: incident_location [location]');
                }
                break;
            case 'incident_desc':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.description = a;
                    this.consoleWrite(`✓ Description set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'action';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide description. Usage: incident_desc [description]');
                }
                break;
            case 'incident_action':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.action = a;
                    this.consoleWrite(`✓ Action set: ${a}`);
                } else {
                    this.consoleWrite('✓ No action specified');
                }
                this.consoleWrite('');
                this.pendingIncident.currentStep = 'confirm';
                this.askNextIncidentQuestion();
                break;
            case 'confirm_incident':
                this.confirmIncident();
                break;
            case 'checkpoint':
                if (args.length >= 2) {
                    this.quickCheckpoint(args);
                } else {
                    this.showCheckpointConsolePrompt();
                }
                break;
            case 'report':
                if (args.length > 0) {
                    this.quickReport(a);
                } else {
                    this.showMissionReportConsolePrompt();
                }
                break;
            case 'report_detailed':
                this.startDetailedReport();
                break;
            case 'report_summary':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.summary = a;
                    this.consoleWrite(`✓ Summary set: ${a}`);
                    this.consoleWrite('');
                    this.pendingReport.currentStep = 'observations';
                    this.askNextReportQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide summary. Usage: report_summary [summary]');
                }
                break;
            case 'report_obs':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.observations = a;
                    this.consoleWrite(`✓ Observations set: ${a}`);
                } else {
                    this.consoleWrite('✓ No observations added');
                }
                this.consoleWrite('');
                this.pendingReport.currentStep = 'recommendations';
                this.askNextReportQuestion();
                break;
            case 'report_rec':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.recommendations = a;
                    this.consoleWrite(`✓ Recommendations set: ${a}`);
                } else {
                    this.consoleWrite('✓ No recommendations added');
                }
                this.consoleWrite('');
                this.pendingReport.currentStep = 'confirm';
                this.askNextReportQuestion();
                break;
            case 'confirm_report':
                this.confirmReport();
                break;
            case 'end':
                this.endMission();
                this.consoleWrite('Attempting to end mission...');
                break;
            case 'sites':
                this.listSites();
                break;
            case 'bolo':
                if (args.length >= 2) {
                    this.quickBolo(args);
                } else {
                    this.showBoloModal();
                }
                break;
            case 'bolos':
                this.listBolos();
                break;
            case 'poi':
                if (args.length >= 2) {
                    this.quickPOI(args);
                } else {
                    this.showPOIModal();
                }
                break;
            case 'pois':
                this.listPOIs();
                break;
            case 'logs':
                this.showMissionLogs();
                this.consoleWrite('Opening Mission Logs...');
                break;
            case 'status':
                this.showStatus();
                break;
            case 'time':
                this.showTime();
                break;
            case 'patrol':
                if (args.length > 0) {
                    this.quickPatrol(a);
                } else {
                    this.consoleWrite('ERROR: Please specify patrol location. Usage: patrol [location]');
                }
                break;
            case 'clear':
                this.clearConsole();
                break;
            case 'radio':
                if (args.length > 0) {
                    this.mockRadioCheck(a);
                } else {
                    this.consoleWrite('ERROR: Please specify radio check message. Usage: radio [message]');
                }
                break;
            case 'backup':
                this.requestBackup();
                break;
            case 'code':
                if (args.length > 0) {
                    this.handleSecurityCode(args[0]);
                } else {
                    this.consoleWrite('ERROR: Please specify security code. Usage: code [code]');
                }
                break;
            case 'home':
                this.attemptNavigateHome();
                this.consoleWrite('Navigating to home...');
                break;
            default:
                this.consoleWrite(`Unknown command: ${cmd}. Type "help" for available commands.`);
        }
    }

    // =====================
    // Professional Guard System Functions
    // =====================
    isProfessionalTimeFormat(args) {
        // Check if format matches: [time] [am/pm] end [time] [am/pm] [details...]
        return args.length >= 4 && 
               args[1] && (args[1].toLowerCase() === 'am' || args[1].toLowerCase() === 'pm') &&
               args[2] && args[2].toLowerCase() === 'end' &&
               args[4] && (args[4].toLowerCase() === 'am' || args[4].toLowerCase() === 'pm');
    }

    handleProfessionalStart(args) {
        if (this.currentMission && this.currentMission.status === 'active') {
            this.consoleWrite('ERROR: Mission already active. End current mission first.');
            return;
        }

        try {
            // Parse start time: args[0] args[1] (e.g., "06:00" "am")
            const startTimeStr = this.parseTime(args[0], args[1]);
            // Parse end time: args[3] args[4] (e.g., "14:00" "pm") 
            const endTimeStr = this.parseTime(args[3], args[4]);
            
            // Get details (everything after the end time)
            const details = args.slice(5).join(' ') || 'Standard patrol duty';
            
            const today = new Date();
            const startTime = new Date(`${today.toDateString()} ${startTimeStr}`);
            const endTime = new Date(`${today.toDateString()} ${endTimeStr}`);
            
            // If end time is before start time, assume it's next day
            if (endTime <= startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }
            
            this.currentMission = {
                type: this.currentMission?.type || 'patrol',
                status: 'active',
                startTime: startTime,
                endTime: endTime,
                details: {
                    specialistName: 'Officer ' + (Math.floor(Math.random() * 9000) + 1000), // Random badge number
                    patrolRoute: details,
                    notes: 'Professional shift - ' + details
                },
                patrolStops: [],
                incidents: [],
                checkpoints: []
            };

            this.missionStartTime = startTime;
            this.saveCurrentMission();
            
            // Update UI
            document.getElementById('missionStatus').textContent = 'Active';
            document.getElementById('missionStatus').className = 'mission-status status-active';
            document.getElementById('startMissionBtn').disabled = true;
            document.getElementById('missionReportBtn').disabled = false;
            document.getElementById('endMissionBtn').disabled = false;
            document.getElementById('incidentReportBtn').disabled = false; // Enable incident report when mission starts
            
            if (this.currentMission.type === 'patrol') {
                document.getElementById('onSiteBtn').disabled = false;
            }
            
            this.addNavigationWarning();
            
            this.consoleWrite('=== PROFESSIONAL SHIFT INITIATED ===');
            this.consoleWrite(`✓ Officer: ${this.currentMission.details.specialistName}`);
            this.consoleWrite(`✓ Start: ${startTime.toLocaleString()}`);
            this.consoleWrite(`✓ End: ${endTime.toLocaleString()}`);
            this.consoleWrite(`✓ Duration: ${Math.round((endTime - startTime) / (1000 * 60 * 60))} hours`);
            this.consoleWrite(`✓ Assignment: ${details}`);
            this.consoleWrite('✓ System operational - All protocols active');
            this.consoleWrite('');
            this.consoleWrite('READY FOR DUTY - Use commands for operations');
            
        } catch (error) {
            this.consoleWrite('ERROR: Invalid time format. Use: start [HH:MM] [am/pm] end [HH:MM] [am/pm] [details]');
            this.consoleWrite('Example: start 06:00 am end 14:00 pm Perimeter security patrol');
        }
    }

    parseTime(timeStr, meridiem) {
        // Convert 24-hour format if needed
        let [hours, minutes] = timeStr.split(':').map(Number);
        
        if (meridiem.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    // =====================
    // Interactive Button Prompt System
    // =====================
    showInteractivePrompt(action) {
        this.currentPromptAction = action;
        this.promptStep = 0;
        this.promptData = {};
        
        // Clear console and show professional prompt
        const output = document.getElementById('consoleOutput');
        if (output) {
            output.innerHTML = '';
        }
        
        this.consoleWrite('=== PROFESSIONAL GUARD SYSTEM ===');
        this.consoleWrite('');
        
        switch (action) {
            case 'startMission':
                this.consoleWrite('🚔 MISSION START PROTOCOL');
                this.consoleWrite('Press Enter to Start Mission');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'onSite':
                this.consoleWrite('📍 ARRIVE ON SCENE PROTOCOL');
                this.consoleWrite('Press Enter to Arrive On Scene');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'offSite':
                this.consoleWrite('🚗 CLEAR SCENE PROTOCOL');
                this.consoleWrite('Press Enter to Clear Scene');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'incident':
                this.consoleWrite('⚠️ INCIDENT REPORT PROTOCOL');
                this.consoleWrite('Press Enter to Begin Incident Report');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'checkpoint':
                this.consoleWrite('📋 CHECKPOINT LOG PROTOCOL');
                this.consoleWrite('Press Enter to Add Checkpoint');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'report':
                this.consoleWrite('📄 MISSION REPORT PROTOCOL');
                this.consoleWrite('Press Enter to Generate Report');
                this.consoleWrite('Press ESC to Cancel');
                break;
            case 'endMission':
                this.consoleWrite('🛑 END MISSION PROTOCOL');
                this.consoleWrite('Press Enter to End Mission');
                this.consoleWrite('Press ESC to Cancel');
                break;
        }
        
        this.consoleWrite('');
        this.consoleWrite('Waiting for input...');
        
        // Set up keyboard listener for this prompt
        this.setupPromptKeyListener();
    }

    setupPromptKeyListener() {
        // Remove existing listener if any
        if (this.promptKeyListener) {
            document.removeEventListener('keydown', this.promptKeyListener);
        }
        
        this.promptKeyListener = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handlePromptEnter();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.handlePromptEscape();
            }
        };
        
        document.addEventListener('keydown', this.promptKeyListener);
    }

    handlePromptEnter() {
        if (!this.currentPromptAction) return;
        
        this.consoleWrite('✓ CONFIRMED - Processing...');
        this.consoleWrite('');
        
        // Remove the key listener
        if (this.promptKeyListener) {
            document.removeEventListener('keydown', this.promptKeyListener);
            this.promptKeyListener = null;
        }
        
        // Execute the action based on current prompt
        switch (this.currentPromptAction) {
            case 'startMission':
                this.consoleWrite('🚔 INITIATING MISSION START SEQUENCE...');
                this.showStartMissionModal();
                break;
            case 'onSite':
                this.consoleWrite('📍 PROCESSING ARRIVAL ON SCENE...');
                this.goOnSite();
                break;
            case 'offSite':
                this.consoleWrite('🚗 PROCESSING SCENE CLEARANCE...');
                this.goOffSite();
                break;
            case 'incident':
                this.consoleWrite('⚠️ OPENING INCIDENT REPORT SYSTEM...');
                this.showIncidentModal();
                break;
            case 'checkpoint':
                this.consoleWrite('📋 ACCESSING CHECKPOINT LOG...');
                this.showCheckpointModal();
                break;
            case 'report':
                this.consoleWrite('📄 GENERATING MISSION REPORT...');
                this.showMissionReportModal();
                break;
            case 'endMission':
                this.consoleWrite('🛑 INITIATING MISSION END SEQUENCE...');
                this.endMission();
                break;
        }
        
        this.currentPromptAction = null;
    }

    handlePromptEscape() {
        if (!this.currentPromptAction) return;
        
        this.consoleWrite('❌ OPERATION CANCELLED');
        this.consoleWrite('');
        this.consoleWrite('System ready for next command...');
        
        // Remove the key listener
        if (this.promptKeyListener) {
            document.removeEventListener('keydown', this.promptKeyListener);
            this.promptKeyListener = null;
        }
        
        this.currentPromptAction = null;
    }

    // =====================
    // Quick Console Commands (No Popups)
    // =====================
    quickStartMission(specialistName) {
        if (this.currentMission && this.currentMission.status === 'active') {
            this.consoleWrite('ERROR: Mission already active. End current mission first.');
            return;
        }
        
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        this.currentMission = {
            type: this.currentMission?.type || 'patrol',
            status: 'active',
            startTime: now,
            endTime: endTime,
            details: {
                specialistName: specialistName,
                patrolRoute: '',
                notes: 'Started via console'
            },
            patrolStops: [],
            incidents: [],
            checkpoints: []
        };
        
        this.missionStartTime = now;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        document.getElementById('incidentReportBtn').disabled = false; // Enable incident report when mission starts
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        this.addNavigationWarning();
        this.consoleWrite(`Mission started for Specialist ${specialistName}`);
        this.consoleWrite(`Expected end time: ${endTime.toLocaleString()}`);
    }

    quickGoOnSite(location) {
        if (this.currentMission?.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be started first!');
            return;
        }

        if (this.currentMission.report) {
            this.consoleWrite('ERROR: Cannot go on site after mission report is completed!');
            return;
        }

        if (this.isOnSite) {
            this.consoleWrite('ERROR: Already on site. Use "offsite" first.');
            return;
        }

        const now = new Date();
        this.isOnSite = true;
        this.currentSiteStartTime = now;
        
        this.currentPatrolStop = {
            location: location,
            arrivalTime: now,
            departureTime: null,
            details: 'Arrived via console',
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'On Site';
        document.getElementById('missionStatus').className = 'mission-status status-onsite';
        document.getElementById('onSiteBtn').disabled = true;
        document.getElementById('offSiteBtn').disabled = false;
        document.getElementById('checkpointBtn').disabled = false; // Enable checkpoint button when on site
        
        this.consoleWrite(`Now on site at: ${location}`);
        this.consoleWrite(`Arrival time: ${now.toLocaleString()}`);
    }

    quickIncident(args) {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to report incidents!');
            return;
        }

        const [type, location, ...descParts] = args;
        const description = descParts.join(' ');
        
        const incident = {
            time: new Date(),
            type: type,
            location: location,
            description: description,
            action: 'Reported via console'
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
        } else {
            this.currentMission.incidents.push(incident);
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.consoleWrite(`Incident reported: ${type} at ${location}`);
        this.consoleWrite(`Description: ${description}`);
    }

    quickCheckpoint(args) {
        if (!this.isOnSite) {
            this.consoleWrite('ERROR: Must be on site to add checkpoint!');
            return;
        }

        const [name, status, ...detailsParts] = args;
        const details = detailsParts.join(' ') || 'Added via console';
        
        const checkpoint = {
            time: new Date(),
            name: name,
            status: status,
            details: details
        };

        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.checkpoints.push(checkpoint);
        } else {
            this.currentMission.checkpoints.push(checkpoint);
        }
        this.saveCurrentMission();

        this.consoleWrite(`Checkpoint added: ${name} - Status: ${status}`);
        if (details) this.consoleWrite(`Details: ${details}`);
    }

    quickReport(summary) {
        if (this.currentMission?.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to create report!');
            return;
        }

        this.currentMission.report = {
            summary: summary,
            observations: 'Completed via console',
            recommendations: '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
            if (this.isOnSite) {
                this.consoleWrite('WARNING: Mission report completed. Please leave site to end mission.');
            }
        }

        this.consoleWrite('Mission report saved successfully!');
        this.consoleWrite(`Summary: ${summary}`);
    }

    listSites() {
        if (this.sites.length === 0) {
            this.consoleWrite('No saved sites found.');
            return;
        }
        
        this.consoleWrite('Saved Sites:');
        this.sites.forEach((site, idx) => {
            this.consoleWrite(`  ${idx + 1}. ${site.name} - ${site.address || site.details || 'No details'}`);
        });
    }

    listBolos() {
        if (this.bolos.length === 0) {
            this.consoleWrite('No active BOLOs.');
            return;
        }
        
        this.consoleWrite('Active BOLOs:');
        this.bolos.forEach((bolo, idx) => {
            this.consoleWrite(`  ${idx + 1}. ${bolo.type}: ${bolo.subject}`);
            if (bolo.notes) this.consoleWrite(`     Notes: ${bolo.notes}`);
        });
    }

    quickPOI(args) {
        const [firstName, lastName, ...statusParts] = args;
        const status = statusParts.join(' ') || 'Active';
        
        const poi = {
            id: this.generatePOIId(),
            firstName: firstName,
            lastName: lastName,
            status: status,
            locations: ['All Sites'],
            notes: 'Added via console',
            createdAt: new Date().toISOString()
        };
        
        this.pois.push(poi);
        this.savePOIs();
        
        this.consoleWrite(`POI added: ${firstName} ${lastName} (ID #${poi.id})`);
        this.consoleWrite(`Status: ${status}`);
        this.consoleWrite(`Locations: All Sites`);
    }

    showPOIModal() {
        this.consoleWrite('Opening POI management interface...');
        this.showPOIBoard();
    }

    listPOIs() {
        this.consoleWrite('=== PERSON OF INTEREST DATABASE ===');
        this.consoleWrite(`Total POIs: ${this.pois.length}`);
        this.consoleWrite('');
        
        if (this.pois.length === 0) {
            this.consoleWrite('No POIs in database.');
            return;
        }
        
        this.pois.forEach((poi, idx) => {
            this.consoleWrite(`[${idx + 1}] ID: ${poi.id} | ${poi.firstName} ${poi.lastName}`);
            this.consoleWrite(`    Status: ${poi.status}`);
            this.consoleWrite(`    Locations: ${(poi.locations || []).join(', ')}`);
            if (poi.notes) {
                this.consoleWrite(`    Notes: ${poi.notes}`);
            }
            this.consoleWrite(`    Created: ${this.formatDateTime(poi.createdAt)}`);
            this.consoleWrite('');
        });
        
        this.consoleWrite('POI list displayed.');
    }

    quickBolo(args) {
        const [subject, ...descParts] = args;
        const description = descParts.join(' ');
        
        const bolo = {
            id: Date.now(),
            subject: subject,
            type: 'Person', // Default type
            description: description,
            priority: 'Medium',
            notes: 'Created via console',
            createdAt: new Date(),
            active: true
        };
        
        this.bolos.push(bolo);
        this.saveBolos();
        
        this.consoleWrite('=== BOLO ALERT CREATED ===');
        this.consoleWrite(`✓ Subject: ${subject}`);
        this.consoleWrite(`✓ Description: ${description}`);
        this.consoleWrite(`✓ Alert ID: ${bolo.id}`);
        this.consoleWrite('✓ All units notified');
        this.consoleWrite('');
        this.consoleWrite('BOLO is now active in system');
    }

    quickPatrol(location) {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to begin patrol!');
            return;
        }
        
        this.consoleWrite('=== PATROL ROUTE INITIATED ===');
        this.consoleWrite(`✓ Patrol Location: ${location}`);
        this.consoleWrite(`✓ Route Status: Active`);
        this.consoleWrite(`✓ Time Started: ${new Date().toLocaleString()}`);
        this.consoleWrite('');
        this.consoleWrite('Patrol route logged. Use "onsite" command when arriving at checkpoints.');
        
        // Update mission notes
        if (this.currentMission.details) {
            this.currentMission.details.patrolRoute = location;
            this.saveCurrentMission();
        }
    }

    listActiveBOLOs() {
        const activeBOLOs = this.bolos.filter(bolo => bolo.active);
        
        if (activeBOLOs.length === 0) {
            this.consoleWrite('=== ACTIVE BOLO ALERTS ===');
            this.consoleWrite('No active BOLOs at this time.');
            return;
        }
        
        this.consoleWrite('=== ACTIVE BOLO ALERTS ===');
        this.consoleWrite('');
        
        activeBOLOs.forEach((bolo, idx) => {
            this.consoleWrite(`[${idx + 1}] ALERT ID: ${bolo.id}`);
            this.consoleWrite(`    Subject: ${bolo.subject}`);
            this.consoleWrite(`    Type: ${bolo.type}`);
            this.consoleWrite(`    Description: ${bolo.description || 'No description'}`);
            this.consoleWrite(`    Priority: ${bolo.priority}`);
            this.consoleWrite(`    Created: ${this.formatDateTime(bolo.createdAt)}`);
            this.consoleWrite('');
        });
        
        this.consoleWrite(`Total Active BOLOs: ${activeBOLOs.length}`);
    }

    mockRadioCheck(message) {
        this.consoleWrite('=== RADIO TRANSMISSION ===');
        this.consoleWrite(`📡 Transmitting: "${message}"`);
        this.consoleWrite('📡 Signal strength: Strong');
        
        // Simulate radio response delay
        setTimeout(() => {
            this.consoleWrite('📡 Dispatch: "Copy that, message received loud and clear"');
            this.consoleWrite('📡 Radio check complete - Channel clear');
        }, 1500);
    }

    requestBackup() {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Must be on active mission to request backup!');
            return;
        }
        
        this.consoleWrite('🚨 BACKUP REQUEST INITIATED 🚨');
        this.consoleWrite('');
        this.consoleWrite('✓ Emergency signal transmitted');
        this.consoleWrite('✓ GPS coordinates sent to dispatch');
        this.consoleWrite('✓ All available units notified');
        this.consoleWrite('');
        
        // Simulate dispatch response
        setTimeout(() => {
            this.consoleWrite('📡 Dispatch: "Unit 23 and Unit 47 responding to your location"');
            this.consoleWrite('📡 Dispatch: "ETA 5 minutes - maintain position"');
        }, 2000);
    }

    handleSecurityCode(code) {
        const validCodes = {
            '10-4': 'Message received and understood',
            '10-20': 'What is your location?',
            '10-33': 'Emergency traffic - clear the channel',
            '10-54': 'Possible break-in',
            '10-78': 'Need assistance',
            '10-99': 'Emergency - officer needs help',
            'code-1': 'Respond when convenient',
            'code-2': 'Respond immediately',
            'code-3': 'Emergency response - lights and sirens'
        };
        
        const meaning = validCodes[code.toLowerCase()];
        
        if (meaning) {
            this.consoleWrite('=== SECURITY CODE LOOKUP ===');
            this.consoleWrite(`Code: ${code.toUpperCase()}`);
            this.consoleWrite(`Meaning: ${meaning}`);
            this.consoleWrite('✓ Code verified in system database');
        } else {
            this.consoleWrite('=== SECURITY CODE LOOKUP ===');
            this.consoleWrite(`Code: ${code.toUpperCase()}`);
            this.consoleWrite('❌ Code not found in database');
            this.consoleWrite('');
            this.consoleWrite('Common codes: 10-4, 10-20, 10-33, 10-54, 10-78, 10-99');
            this.consoleWrite('             code-1, code-2, code-3');
        }
    }

    showStatus() {
        if (!this.currentMission) {
            this.consoleWrite('No active mission.');
            return;
        }
        
        this.consoleWrite('Mission Status:');
        this.consoleWrite(`  Type: ${this.currentMission.type}`);
        this.consoleWrite(`  Status: ${this.currentMission.status}`);
        this.consoleWrite(`  Specialist: ${this.currentMission.details?.specialistName || 'Unknown'}`);
        this.consoleWrite(`  Started: ${this.formatDateTime(this.currentMission.startTime)}`);
        
        if (this.isOnSite && this.currentPatrolStop) {
            this.consoleWrite(`  Current Location: ${this.currentPatrolStop.location}`);
            this.consoleWrite(`  On Site Since: ${this.formatDateTime(this.currentPatrolStop.arrivalTime)}`);
        }
        
        this.consoleWrite(`  Incidents: ${this.currentMission.incidents?.length || 0}`);
        this.consoleWrite(`  Patrol Stops: ${this.currentMission.patrolStops?.length || 0}`);
    }

    showTime() {
        const now = new Date();
        this.consoleWrite(`Current Time: ${now.toLocaleString()}`);
        this.consoleWrite(`UTC: ${now.toISOString()}`);
    }

    clearConsole() {
        const out = document.getElementById('consoleOutput');
        if (out) {
            out.innerHTML = '';
            this.consoleWrite('Console cleared. Type "help" for available commands.');
        }
    }

    showCheckpointModal() {
        if (!this.isOnSite) {
            this.showNotification('Must be on site to add checkpoint!', 'error');
            return;
        }

        // Always show modal for button clicks
        this.showMobileCheckpointModal();
    }

    showCheckpointConsolePrompt() {
        if (!this.isOnSite) {
            this.showNotification('Must be on site to add checkpoint!', 'error');
            return;
        }

        // For console commands: Use console prompts for desktop, modal for mobile
        if (this.isMobileDevice()) {
            this.showMobileCheckpointModal();
        } else {
            this.startPromptSequence('checkpoint', [
                { prompt: 'checkpoint name:', key: 'name', required: true },
                { prompt: 'status:', key: 'status', required: true },
                { prompt: 'notes:', key: 'notes', required: false }
            ], (data) => {
                this.processCheckpointFromConsole(data);
            });
        }
        this.consoleWrite('Opening Add Checkpoint form...');
    }

    showMobileCheckpointModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Add Checkpoint</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="checkpointForm">
                    <div class="form-group">
                        <label for="checkpointTime">Checkpoint Time:</label>
                        <input type="datetime-local" id="checkpointTime" required>
                    </div>
                    <div class="form-group">
                        <label for="checkpointName">Checkpoint Name:</label>
                        <input type="text" id="checkpointName" required placeholder="e.g., Main Entrance, Parking Lot A">
                    </div>
                    <div class="form-group">
                        <label for="checkpointStatus">Status:</label>
                        <select id="checkpointStatus" required>
                            <option value="Normal">Normal</option>
                            <option value="Attention Required">Attention Required</option>
                            <option value="Issue Found">Issue Found</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="checkpointDetails">Details:</label>
                        <textarea id="checkpointDetails" placeholder="Checkpoint details, observations, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Checkpoint</button>
                    </div>
                </form>
            </div>
        `;

        // Set default time
        const now = new Date();
        document.getElementById('checkpointTime').value = now.toISOString().slice(0, 16);

        document.getElementById('checkpointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCheckpoint();
        });

        modal.style.display = 'block';
    }

    addCheckpoint() {
        const form = document.getElementById('checkpointForm');
        const formData = new FormData(form);
        
        const checkpoint = {
            time: new Date(formData.get('checkpointTime')),
            name: formData.get('checkpointName'),
            status: formData.get('checkpointStatus'),
            details: formData.get('checkpointDetails') || ''
        };

        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.checkpoints.push(checkpoint);
        } else {
            this.currentMission.checkpoints.push(checkpoint);
        }
        this.saveCurrentMission();

        this.closeModal();
        this.showNotification('Checkpoint added successfully!');
        
        // Log to console as if command was executed
        this.consoleWrite(`Checkpoint logged: ${checkpoint.name}`);
        this.consoleWrite(`Status: ${checkpoint.status}`);
        this.consoleWrite(`Time: ${checkpoint.time.toLocaleString()}`);
        if (checkpoint.details) {
            this.consoleWrite(`Details: ${checkpoint.details}`);
        }
        this.consoleWrite('Checkpoint saved successfully');
    }

    processCheckpointFromConsole(data) {
        const checkpoint = {
            time: new Date(),
            name: data.name,
            status: data.status,
            details: data.notes || ''
        };

        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.checkpoints.push(checkpoint);
            this.consoleWrite(`✓ Checkpoint added to current patrol stop`);
        } else {
            this.currentMission.checkpoints.push(checkpoint);
            this.consoleWrite(`✓ Checkpoint added to mission log`);
        }
        this.saveCurrentMission();

        this.consoleWrite(`✓ Checkpoint: ${data.name}`);
        this.consoleWrite(`✓ Status: ${data.status}`);
        this.consoleWrite(`✓ Time: ${checkpoint.time.toLocaleString()}`);
        if (data.notes) {
            this.consoleWrite(`✓ Notes: ${data.notes}`);
        }
        this.consoleWrite('');

        this.showNotification('Checkpoint added successfully!');
    }

    showMissionReportModal() {
        if (this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to create report!');
            return;
        }

        // Always show modal for button clicks
        this.showMobileMissionReportModal();
    }

    showMissionReportConsolePrompt() {
        if (this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to create report!');
            return;
        }

        // For console commands: Use console prompts for desktop, modal for mobile
        if (this.isMobileDevice()) {
            this.showMobileMissionReportModal();
        } else {
            this.consoleWrite('=== MISSION REPORT CONSOLE ===');
            this.consoleWrite('Create mission report using console commands:');
            this.consoleWrite('');
            this.consoleWrite('Quick Report:');
            this.consoleWrite('  report [summary] - Quick report with summary only');
            this.consoleWrite('');
            this.consoleWrite('Detailed Report:');
            this.consoleWrite('  report_detailed - Start detailed mission report');
            this.consoleWrite('');
            this.consoleWrite('Type your command below:');
        }
    }

    showMobileMissionReportModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Report</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="missionReportForm">
                    <div class="form-group">
                        <label for="reportSummary">Mission Summary (required):</label>
                        <textarea id="reportSummary" required placeholder="Provide a summary of the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportObservations">Key Observations (optional):</label>
                        <textarea id="reportObservations" placeholder="Any notable observations during the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportRecommendations">Recommendations (optional):</label>
                        <textarea id="reportRecommendations" placeholder="Any recommendations for future missions..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Report</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('missionReportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileMissionReport();
        });

        modal.style.display = 'block';
    }

    processMobileMissionReport() {
        const form = document.getElementById('missionReportForm');
        const formData = new FormData(form);
        
        this.currentMission.report = {
            summary: formData.get('reportSummary'),
            observations: formData.get('reportObservations') || '',
            recommendations: formData.get('reportRecommendations') || '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
        }

        this.closeModal();
        this.showNotification('Mission report saved successfully!');
        
        // Log to console as if command was executed
        this.consoleWrite('Mission report completed successfully');
        this.consoleWrite(`Summary: ${this.currentMission.report.summary}`);
        if (this.currentMission.report.observations) {
            this.consoleWrite(`Observations: ${this.currentMission.report.observations}`);
        }
        if (this.currentMission.report.recommendations) {
            this.consoleWrite(`Recommendations: ${this.currentMission.report.recommendations}`);
        }
        this.consoleWrite(`Completed at: ${this.currentMission.report.completedAt.toLocaleString()}`);
        this.consoleWrite('Report saved - ready to end mission');
    }

    saveMissionReport() {
        // This method is now called from console commands
        this.consoleWrite('Mission report completed via console.');
    }

    startDetailedReport() {
        this.consoleWrite('=== DETAILED MISSION REPORT ===');
        this.consoleWrite('Starting step-by-step mission report...');
        this.consoleWrite('');
        
        // Initialize report details object
        this.pendingReport = {
            summary: '',
            observations: '',
            recommendations: '',
            currentStep: 'summary'
        };
        
        this.askNextReportQuestion();
    }

    askNextReportQuestion() {
        if (!this.pendingReport) return;
        
        switch (this.pendingReport.currentStep) {
            case 'summary':
                this.consoleWrite('Step 1 of 3: Please provide a mission summary (required):');
                this.consoleWrite('Type: report_summary [your summary]');
                break;
            case 'observations':
                this.consoleWrite('Step 2 of 3: Key observations during the mission (optional - press Enter to skip):');
                this.consoleWrite('Type: report_obs [observations] or press Enter to skip');
                break;
            case 'recommendations':
                this.consoleWrite('Step 3 of 3: Any recommendations for future missions (optional - press Enter to skip):');
                this.consoleWrite('Type: report_rec [recommendations] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('Mission report ready for submission:');
                this.consoleWrite(`Summary: ${this.pendingReport.summary}`);
                this.consoleWrite(`Observations: ${this.pendingReport.observations || 'None'}`);
                this.consoleWrite(`Recommendations: ${this.pendingReport.recommendations || 'None'}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_report to save report');
                break;
        }
    }

    confirmReport() {
        if (!this.pendingReport) {
            this.consoleWrite('ERROR: No report details configured. Use "report_detailed" first.');
            return;
        }

        if (!this.pendingReport.summary) {
            this.consoleWrite('ERROR: Summary is required. Use "report_summary [summary]" first.');
            return;
        }

        this.consoleWrite('=== CONFIRMING MISSION REPORT ===');
        this.consoleWrite(`Summary: ${this.pendingReport.summary}`);
        this.consoleWrite(`Observations: ${this.pendingReport.observations || 'None'}`);
        this.consoleWrite(`Recommendations: ${this.pendingReport.recommendations || 'None'}`);
        this.consoleWrite('');

        this.currentMission.report = {
            summary: this.pendingReport.summary,
            observations: this.pendingReport.observations || '',
            recommendations: this.pendingReport.recommendations || '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
            // If currently on site, force them to leave
            if (this.isOnSite) {
                this.consoleWrite('WARNING: Mission report completed. Please leave site to end mission.');
            }
        }

        this.consoleWrite('✓ Mission report saved successfully!');
        this.consoleWrite('✓ Cannot visit new sites after report completion');
        
        // Clear pending report
        this.pendingReport = null;
    }

    confirmEndMission() {
        if (!this.currentMission.report) {
            this.showNotification('Mission report must be completed before ending mission!', 'error');
            return;
        }

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const now = new Date();
        const expectedEndTime = new Date(this.currentMission.endTime);
        const timeDiff = (expectedEndTime - now) / (1000 * 60); // minutes
        const isEarly = timeDiff > 15;
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>End Mission</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to end the current mission?</p>
                <p><strong>Mission Type:</strong> ${this.currentMission.type}</p>
                <p><strong>Specialist:</strong> ${this.currentMission.details.specialistName}</p>
                <p><strong>Start Time:</strong> ${new Date(this.currentMission.startTime).toLocaleString()}</p>
                <p><strong>Expected End:</strong> ${expectedEndTime.toLocaleString()}</p>
                ${isEarly ? '<p style="color: orange;"><strong>Warning:</strong> Ending more than 15 minutes early</p>' : ''}
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="button" class="btn-danger" onclick="app.processEndMission()">End Mission</button>
                </div>
            </div>
        `;

        this.bindModalEvents();
        modal.style.display = 'block';
    }

    processEndMission() {
        this.closeModal();
        this.endMission();
    }

    endMission() {
        if (!this.currentMission.report) {
            this.showNotification('Mission report must be completed before ending mission!', 'error');
            return;
        }

        const now = new Date();
        const expectedEndTime = new Date(this.currentMission.endTime);
        const timeDiff = (expectedEndTime - now) / (1000 * 60); // minutes

        if (timeDiff > 15) {
            this.showEarlyEndModal();
            return;
        }

        this.completeMission();
    }

    showEarlyEndModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Early Mission End</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Warning:</strong> You are ending the mission more than 15 minutes early.</p>
                <form id="earlyEndForm">
                    <div class="form-group">
                        <label for="earlyEndReason">Reason for Early End:</label>
                        <textarea id="earlyEndReason" required placeholder="Explain why the mission is ending early..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="hasReplacement">Do you have cover/replacement?</label>
                        <select id="hasReplacement" required>
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div class="form-group" id="replacementDetails" style="display: none;">
                        <label for="replacementInfo">Replacement Details:</label>
                        <textarea id="replacementInfo" placeholder="Who is covering and when..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-danger">End Mission Early</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('hasReplacement').addEventListener('change', (e) => {
            const replacementDetails = document.getElementById('replacementDetails');
            if (e.target.value === 'yes') {
                replacementDetails.style.display = 'block';
            } else {
                replacementDetails.style.display = 'none';
            }
        });

        document.getElementById('earlyEndForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processEarlyEnd();
        });

        modal.style.display = 'block';
    }

    processEarlyEnd() {
        const form = document.getElementById('earlyEndForm');
        const formData = new FormData(form);
        
        this.currentMission.earlyEnd = {
            reason: formData.get('earlyEndReason'),
            hasReplacement: formData.get('hasReplacement') === 'yes',
            replacementInfo: formData.get('replacementInfo') || ''
        };
        this.saveCurrentMission();

        this.completeMission();
    }

    completeMission() {
        // If currently on site, automatically go off site
        if (this.isOnSite) {
            this.currentPatrolStop.departureTime = new Date();
            this.currentMission.patrolStops.push(this.currentPatrolStop);
            this.isOnSite = false;
        }

        this.currentMission.status = 'completed';
        this.currentMission.actualEndTime = new Date();
        
        // Generate mission ID
        const missionId = 'M' + Date.now();
        this.currentMission.id = missionId;
        
        // Save to mission logs
        this.missionLogs.push({ ...this.currentMission });
        this.saveMissionLogs();
        
        // Clear current mission from storage
        this.clearCurrentMission();
        
        // Remove navigation restriction indicator
        this.removeNavigationWarning();
        
        // Force system to inactive state
        this.currentMission = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.missionStartTime = null;
        
        // Reset button states
        document.getElementById('incidentReportBtn').disabled = true;
        document.getElementById('checkpointBtn').disabled = true;
        
        this.closeModal();
        this.showNotification('Mission completed successfully! System reset to inactive. Navigation restrictions removed.');
        
        // Log to console as if command was executed
        this.consoleWrite(`Mission ${missionId} completed successfully`);
        this.consoleWrite(`End time: ${this.currentMission.actualEndTime.toLocaleString()}`);
        this.consoleWrite(`Specialist: ${this.currentMission.details.specialistName}`);
        this.consoleWrite('Status: COMPLETED');
        this.consoleWrite('System reset to inactive state');
        
        // Return to main page to allow new mission start
        setTimeout(() => {
            this.loadMainPage();
        }, 1000);
    }

    showMissionSummary() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const missionReport = this.generateMissionReport(this.currentMission);
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Completed</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Mission ID:</strong> ${this.currentMission.id}</p>
                <p><strong>Type:</strong> ${this.currentMission.type.charAt(0).toUpperCase() + this.currentMission.type.slice(1)}</p>
                <p><strong>Duration:</strong> ${this.formatDuration(this.currentMission.startTime, this.currentMission.actualEndTime)}</p>
                
                <div class="copy-area" id="missionReportText">${missionReport}</div>
                
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="app.copyToClipboard('missionReportText')">Copy Report</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal(); app.attemptNavigateHome();">Return to Home</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    showMissionLogs() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        let logsHtml = '';
        
        if (this.missionLogs.length === 0) {
            logsHtml = '<p>No mission logs found.</p>';
        } else {
            this.missionLogs.forEach(log => {
                logsHtml += `
                    <div class="mission-log">
                        <div class="mission-log-header">
                            <div class="mission-log-title">${log.id} - ${log.type.charAt(0).toUpperCase() + log.type.slice(1)} Mission</div>
                            <div class="mission-log-date">${this.formatDate(log.startTime)}</div>
                        </div>
                        <p><strong>Specialist:</strong> ${log.details.specialistName}</p>
                        <p><strong>Duration:</strong> ${this.formatDuration(log.startTime, log.actualEndTime)}</p>
                        <div class="mission-log-actions">
                            <button class="btn-small btn-primary" onclick="app.viewMissionDetails('${log.id}')">View Details</button>
                            <button class="btn-small btn-secondary" onclick="app.copyMissionReport('${log.id}')">Copy Report</button>
                        </div>
                    </div>
                `;
            });
        }
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Logs</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                ${logsHtml}
            </div>
        `;

        modal.style.display = 'block';
    }

    viewMissionDetails(missionId) {
        const mission = this.missionLogs.find(m => m.id === missionId);
        if (!mission) return;

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const missionReport = this.generateMissionReport(mission);
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Details - ${mission.id}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="copy-area" id="missionDetailsText">${missionReport}</div>
                
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="app.copyToClipboard('missionDetailsText')">Copy Report</button>
                    <button type="button" class="btn-secondary" onclick="app.showMissionLogs()">← Back to Logs</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    copyMissionReport(missionId) {
        const mission = this.missionLogs.find(m => m.id === missionId);
        if (!mission) return;

        const report = this.generateMissionReport(mission);
        navigator.clipboard.writeText(report).then(() => {
            this.showNotification('Mission report copied to clipboard!');
        });
    }

    generateMissionReport(mission) {
        let report = `FIELD OFFICER MISSION REPORT
========================================

Mission ID: ${mission.id}
Mission Type: ${mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}
Specialist: ${mission.details.specialistName}
Start Time: ${this.formatDateTime(mission.startTime)}
End Time: ${this.formatDateTime(mission.actualEndTime)}
Duration: ${this.formatDuration(mission.startTime, mission.actualEndTime)}

`;

        if (mission.earlyEnd) {
            report += `EARLY END NOTICE:
Reason: ${mission.earlyEnd.reason}
Replacement: ${mission.earlyEnd.hasReplacement ? 'Yes' : 'No'}
${mission.earlyEnd.replacementInfo ? 'Replacement Details: ' + mission.earlyEnd.replacementInfo : ''}

`;
        }

        if (mission.details.patrolRoute) {
            report += `PATROL ROUTE:
${mission.details.patrolRoute}

`;
        }

        if (mission.details.notes) {
            report += `MISSION NOTES:
${mission.details.notes}

`;
        }

        if (mission.patrolStops && mission.patrolStops.length > 0) {
            report += `PATROL STOPS:
`;
            mission.patrolStops.forEach((stop, index) => {
                report += `
${index + 1}. ${stop.location}
   Arrival: ${this.formatDateTime(stop.arrivalTime)}
   Departure: ${this.formatDateTime(stop.departureTime)}
   Duration: ${this.formatDuration(stop.arrivalTime, stop.departureTime)}
   Details: ${stop.details || 'None'}
`;

                if (stop.checkpoints && stop.checkpoints.length > 0) {
                    report += `   Checkpoints:
`;
                    stop.checkpoints.forEach(checkpoint => {
                        report += `   - ${this.formatDateTime(checkpoint.time)}: ${checkpoint.name} (${checkpoint.status})
     ${checkpoint.details || 'No additional details'}
`;
                    });
                }

                if (stop.incidents && stop.incidents.length > 0) {
                    report += `   Incidents:
`;
                    stop.incidents.forEach(incident => {
                        report += `   - ${this.formatDateTime(incident.time)}: ${incident.type} at ${incident.location}
     Description: ${incident.description}
     Action Taken: ${incident.action}
`;
                    });
                }
            });
        }

        if (mission.incidents && mission.incidents.length > 0) {
            report += `
GENERAL INCIDENTS:
`;
            mission.incidents.forEach((incident, index) => {
                report += `
${index + 1}. ${incident.type} - ${this.formatDateTime(incident.time)}
   Location: ${incident.location}
   Description: ${incident.description}
   Action Taken: ${incident.action}
`;
            });
        }

        if (mission.checkpoints && mission.checkpoints.length > 0) {
            report += `
GENERAL CHECKPOINTS:
`;
            mission.checkpoints.forEach((checkpoint, index) => {
                report += `
${index + 1}. ${checkpoint.name} - ${this.formatDateTime(checkpoint.time)}
   Status: ${checkpoint.status}
   Details: ${checkpoint.details || 'None'}
`;
            });
        }

        if (mission.report) {
            report += `
MISSION REPORT:
Summary: ${mission.report.summary}

Key Observations: ${mission.report.observations || 'None'}

Recommendations: ${mission.report.recommendations || 'None'}

Report Completed: ${this.formatDateTime(mission.report.completedAt)}
`;
        }

        report += `
========================================
Report Generated: ${this.formatDateTime(new Date())}`;

        return report;
    }

    updatePatrolStopsList() {
        const list = document.getElementById('patrolStopsList');
        if (!list) return;

        let html = '';
        this.currentMission.patrolStops.forEach((stop, index) => {
            html += `
                <div class="patrol-stop">
                    <div class="patrol-stop-header">
                        <div class="patrol-stop-time">${this.formatDateTime(stop.arrivalTime)} - ${this.formatDateTime(stop.departureTime)}</div>
                        <div class="patrol-stop-location">${stop.location}</div>
                    </div>
                    <p>${stop.details || 'No details'}</p>
                    ${stop.incidents.length > 0 ? `<p><strong>Incidents:</strong> ${stop.incidents.length}</p>` : ''}
                    ${stop.checkpoints.length > 0 ? `<p><strong>Checkpoints:</strong> ${stop.checkpoints.length}</p>` : ''}
                </div>
            `;
        });

        list.innerHTML = html || '<p>No patrol stops recorded yet.</p>';
    }

    updateIncidentsList() {
        const list = document.getElementById('incidentsList');
        if (!list) return;

        let html = '';
        
        // Show general incidents
        this.currentMission.incidents.forEach(incident => {
            html += `
                <div class="patrol-stop">
                    <div class="patrol-stop-header">
                        <div class="patrol-stop-time">${this.formatDateTime(incident.time)}</div>
                        <div class="patrol-stop-location">${incident.location}</div>
                    </div>
                    <p><strong>${incident.type}</strong></p>
                    <p>${incident.description}</p>
                    <p><strong>Action:</strong> ${incident.action}</p>
                </div>
            `;
        });

        list.innerHTML = html || '<p>No incidents recorded yet.</p>';
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copied to clipboard!');
        });
    }

    closeModal() {
        const modal = document.getElementById('logsModal');
        modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    formatDateTime(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }

    formatDuration(start, end) {
        if (!start || !end) return 'N/A';
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    loadMissionLogs() {
        try {
            const saved = localStorage.getItem('fieldOfficerMissionLogs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading mission logs:', e);
            this.showNotification('Error loading mission logs', 'error');
            return [];
        }
    }

    saveMissionLogs() {
        try {
            localStorage.setItem('fieldOfficerMissionLogs', JSON.stringify(this.missionLogs));
            return true;
        } catch (e) {
            console.error('Error saving mission logs:', e);
            if (e.name === 'QuotaExceededError') {
                this.showNotification('Storage full! Please clear old mission logs.', 'error');
                // Try to save to sessionStorage as emergency backup
                try {
                    sessionStorage.setItem('fieldOfficerMissionLogs_backup', JSON.stringify(this.missionLogs));
                    this.showNotification('Emergency backup created in session storage', 'error');
                } catch (e2) {
                    console.error('Emergency backup failed:', e2);
                }
            } else {
                this.showNotification('Error saving mission logs', 'error');
            }
            return false;
        }
    }

    saveCurrentMission() {
        if (this.currentMission) {
            const missionState = {
                currentMission: this.currentMission,
                isOnSite: this.isOnSite,
                currentSiteStartTime: this.currentSiteStartTime,
                currentPatrolStop: this.currentPatrolStop,
                missionStartTime: this.missionStartTime,
                savedAt: new Date().toISOString()
            };
            try {
                localStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                // Also save to sessionStorage as redundant backup
                sessionStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                this.showAutoSaveIndicator();
                return true;
            } catch (e) {
                console.error('Error saving current mission:', e);
                if (e.name === 'QuotaExceededError') {
                    this.showNotification('Storage full! Mission data may not be saved.', 'error');
                    // Try at least sessionStorage
                    try {
                        sessionStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                    } catch (e2) {
                        console.error('sessionStorage also full:', e2);
                    }
                } else {
                    this.showNotification('Error saving mission. Please try again.', 'error');
                }
                return false;
            }
        }
    }

    restoreCurrentMission() {
        let saved = localStorage.getItem('fieldOfficerCurrentMission');
        // Try sessionStorage backup if localStorage fails
        if (!saved) {
            saved = sessionStorage.getItem('fieldOfficerCurrentMission');
            if (saved) {
                console.log('Restored from sessionStorage backup');
            }
        }
        
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentMission = state.currentMission;
                this.isOnSite = state.isOnSite;
                this.currentSiteStartTime = state.currentSiteStartTime ? new Date(state.currentSiteStartTime) : null;
                this.currentPatrolStop = state.currentPatrolStop;
                this.missionStartTime = state.missionStartTime ? new Date(state.missionStartTime) : null;
                
                // Convert date strings back to Date objects
                if (this.currentMission.startTime) {
                    this.currentMission.startTime = new Date(this.currentMission.startTime);
                }
                if (this.currentMission.endTime) {
                    this.currentMission.endTime = new Date(this.currentMission.endTime);
                }
                
                // Restore the appropriate dashboard
                if (this.currentMission.type === 'patrol') {
                    this.showPatrolDashboard();
                    this.updatePatrolStopsList();
                } else {
                    this.showGenericDashboard(this.currentMission.type);
                }
                this.updateIncidentsList();
                
                // Restore UI state
                if (this.currentMission.status === 'active') {
                    document.getElementById('missionStatus').textContent = this.isOnSite ? 'On Site' : 'Active';
                    document.getElementById('missionStatus').className = this.isOnSite ? 'mission-status status-onsite' : 'mission-status status-active';
                    document.getElementById('startMissionBtn').disabled = true;
                    document.getElementById('missionReportBtn').disabled = false;
                    document.getElementById('endMissionBtn').disabled = false;
                    document.getElementById('incidentReportBtn').disabled = false; // Enable incident report when mission is active
                    document.getElementById('checkpointBtn').disabled = !this.isOnSite; // Enable checkpoint only when on site
                    
                    // Enable BOLO and POI buttons only when on site
                    const boloListBtn = document.getElementById('boloListBtn');
                    const poiListBtn = document.getElementById('poiListBtn');
                    if (boloListBtn) boloListBtn.disabled = !this.isOnSite;
                    if (poiListBtn) poiListBtn.disabled = !this.isOnSite;
                    
                    if (this.currentMission.type === 'patrol') {
                        document.getElementById('onSiteBtn').disabled = this.isOnSite || !!this.currentMission.report;
                        document.getElementById('offSiteBtn').disabled = !this.isOnSite;
                    }
                    
                    // Restore navigation warning for active missions
                    this.addNavigationWarning();
                }
                
                const savedAt = state.savedAt ? new Date(state.savedAt).toLocaleString() : 'unknown time';
                this.showNotification(`Restored mission from ${savedAt}`, 'success');
            } catch (e) {
                console.error('Error restoring mission:', e);
                this.showNotification('Error restoring mission data', 'error');
                // Don't delete backup data in case of parsing error
                try {
                    localStorage.removeItem('fieldOfficerCurrentMission');
                } catch (e2) {
                    console.error('Error clearing corrupted data:', e2);
                }
            }
        }
    }

    clearCurrentMission() {
        try {
            localStorage.removeItem('fieldOfficerCurrentMission');
            sessionStorage.removeItem('fieldOfficerCurrentMission');
        } catch (e) {
            console.error('Error clearing current mission:', e);
        }
        
        // Remove navigation warning
        this.removeNavigationWarning();
        
        // Force complete reset to inactive state
        this.currentMission = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.missionStartTime = null;
        
        // Clear any auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    showAutoSaveIndicator() {
        // Remove any existing indicator
        const existing = document.querySelector('.autosave-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = '✓ Saved';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 1500);
    }

    startAutoSave() {
        // Auto-save every 30 seconds as a backup
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Auto-save triggered at', new Date().toISOString());
            }
        }, 30000); // 30 seconds
    }

    addNavigationPrevention() {
        // Prevent browser back button during active missions
        window.addEventListener('popstate', (e) => {
            if (this.isMissionActive()) {
                // Push the current state back to prevent navigation
                history.pushState(null, null, window.location.href);
                this.showNavigationBlockedNotification();
            }
        });

        // Push initial state to enable popstate detection
        history.pushState(null, null, window.location.href);
    }

    attemptNavigateHome() {
        if (this.isMissionActive()) {
            this.showNavigationConfirmDialog();
        } else {
            this.loadMainPage();
        }
    }

    isMissionActive() {
        return this.currentMission && this.currentMission.status === 'active';
    }

    showNavigationBlockedNotification() {
        this.showNotification('Navigation blocked: Active mission in progress. Complete or end mission first.', 'error');
    }

    showNavigationConfirmDialog() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>⚠️ Active Mission Warning</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚨</div>
                    <h3 style="color: #ff3333; margin-bottom: 16px;">MISSION IN PROGRESS</h3>
                    <p><strong>You have an active mission that has not been completed.</strong></p>
                    <p>Leaving now may result in data loss and incomplete mission records.</p>
                </div>
                
                <div style="background: rgba(255, 51, 51, 0.1); border: 1px solid #ff3333; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p><strong>Current Mission Status:</strong></p>
                    <p>• Type: ${this.currentMission.type.charAt(0).toUpperCase() + this.currentMission.type.slice(1)}</p>
                    <p>• Status: ${this.currentMission.status}</p>
                    <p>• Started: ${this.formatDateTime(this.currentMission.startTime)}</p>
                    ${this.isOnSite ? '<p>• Currently on site</p>' : ''}
                </div>
                
                <p style="margin-top: 16px;"><strong>Recommended actions:</strong></p>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Complete your mission report</li>
                    <li>End the mission properly</li>
                    <li>Ensure all data is saved</li>
                </ul>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Stay on Mission</button>
                    <button type="button" class="btn-danger" onclick="app.forceNavigateHome()">Force Exit (Not Recommended)</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    forceNavigateHome() {
        // Show final warning and save data
        if (this.currentMission && this.currentMission.status === 'active') {
            this.saveCurrentMission();
            this.showNotification('Mission data saved. Please resume mission as soon as possible.', 'warning');
        }
        this.closeModal();
        this.loadMainPage();
    }

    addNavigationWarning() {
        // Remove existing warning if present
        this.removeNavigationWarning();
        
        const warning = document.createElement('div');
        warning.id = 'navigationWarning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff3333;
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            z-index: 10001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease-out;
        `;
        warning.innerHTML = '🚨 MISSION ACTIVE - NAVIGATION RESTRICTED 🚨';
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        // Adjust main content to account for warning bar
        document.body.style.paddingTop = '40px';
    }

    removeNavigationWarning() {
        const warning = document.getElementById('navigationWarning');
        if (warning) {
            warning.remove();
        }
        document.body.style.paddingTop = '0';
    }

    addBeforeUnloadListener() {
        // Save data and warn before page closes/refreshes during active missions
        window.addEventListener('beforeunload', (e) => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved before page unload');
                
                // Show browser warning for active missions
                const message = 'You have an active mission in progress. Leaving may result in data loss.';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });
        
        // Also listen for visibility change (when app goes to background on mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved on visibility change');
            }
        });
        
        // Listen for page hide event (more reliable on mobile)
        window.addEventListener('pagehide', (e) => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved on page hide');
            }
        });
    }
}

// Initialize the app
const app = new SecuritySpecialistApp();
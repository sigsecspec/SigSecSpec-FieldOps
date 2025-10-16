// Field Officer Mission Log App
class MissionLogApp {
    constructor() {
        this.currentMission = null;
        this.missionLogs = this.loadMissionLogs();
        this.currentPatrolStops = [];
        this.currentSite = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mission type selection
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const missionType = e.currentTarget.dataset.mission;
                this.selectMissionType(missionType);
            });
        });

        // Navigation
        document.getElementById('viewLogsBtn').addEventListener('click', () => {
            this.showMissionLogs();
        });

        document.getElementById('backToMainBtn').addEventListener('click', () => {
            this.backToMain();
        });

        // Mission controls
        this.initializeMissionControls();

        // Modal close
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    initializeMissionControls() {
        // Standing mission controls
        document.getElementById('startStandingBtn').addEventListener('click', () => {
            this.startMission('standing');
        });

        document.getElementById('endStandingBtn').addEventListener('click', () => {
            this.endMission();
        });

        // Patrol mission controls
        document.getElementById('startPatrolBtn').addEventListener('click', () => {
            this.showStartMissionModal('patrol');
        });

        document.getElementById('endPatrolBtn').addEventListener('click', () => {
            this.endMission();
        });

        document.getElementById('onSiteBtn').addEventListener('click', () => {
            this.showOnSiteModal();
        });

        document.getElementById('offSiteBtn').addEventListener('click', () => {
            this.goOffSite();
        });

        document.getElementById('incidentReportBtn').addEventListener('click', () => {
            this.showIncidentReportModal();
        });

        document.getElementById('missionReportBtn').addEventListener('click', () => {
            this.showMissionReportModal();
        });

        // Desk mission controls
        document.getElementById('startDeskBtn').addEventListener('click', () => {
            this.startMission('desk');
        });

        document.getElementById('endDeskBtn').addEventListener('click', () => {
            this.endMission();
        });
    }

    selectMissionType(type) {
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('missionLogsList').classList.add('hidden');
        
        const dashboards = ['standingDashboard', 'patrolDashboard', 'deskDashboard'];
        dashboards.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        document.getElementById(`${type}Dashboard`).classList.remove('hidden');
    }

    backToMain() {
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('missionLogsList').classList.add('hidden');
        
        const dashboards = ['standingDashboard', 'patrolDashboard', 'deskDashboard'];
        dashboards.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }

    startMission(type) {
        if (type === 'patrol') {
            this.showStartMissionModal(type);
            return;
        }

        const mission = {
            id: Date.now(),
            type: type,
            startTime: new Date(),
            endTime: null,
            officerName: '',
            activities: [],
            patrolStops: [],
            incidents: [],
            missionReport: null,
            status: 'active'
        };

        this.currentMission = mission;
        this.updateMissionDisplay();
        
        // Show appropriate controls
        document.getElementById(`start${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).classList.add('hidden');
        document.getElementById(`end${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).classList.remove('hidden');
        
        if (type === 'patrol') {
            document.getElementById('onSiteBtn').classList.remove('hidden');
            document.getElementById('incidentReportBtn').classList.remove('hidden');
            document.getElementById('missionReportBtn').classList.remove('hidden');
        }

        this.addActivity(`${type.charAt(0).toUpperCase() + type.slice(1)} mission started`);
    }

    showStartMissionModal(type) {
        const modalContent = `
            <div class="modal-header">
                <h3>Start ${type.charAt(0).toUpperCase() + type.slice(1)} Mission</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="startMissionForm">
                <div class="form-group">
                    <label for="officerName">Officer Name:</label>
                    <input type="text" id="officerName" required>
                </div>
                <div class="form-group">
                    <label for="missionName">Mission Name:</label>
                    <input type="text" id="missionName" required>
                </div>
                <div class="form-group">
                    <label for="startTime">Start Time:</label>
                    <input type="datetime-local" id="startTime" required>
                </div>
                <div class="form-group">
                    <label for="endTime">Scheduled End Time:</label>
                    <input type="datetime-local" id="endTime" required>
                </div>
                <div class="form-group">
                    <label for="patrolStops">Patrol Stops (optional, one per line):</label>
                    <textarea id="patrolStops" placeholder="Enter patrol stops, one per line"></textarea>
                </div>
                <div class="form-group">
                    <label for="missionDetails">Mission Details:</label>
                    <textarea id="missionDetails" placeholder="Enter mission details"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Start Mission</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        // Set default times
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        document.getElementById('startTime').value = this.formatDateTimeLocal(now);
        document.getElementById('endTime').value = this.formatDateTimeLocal(endTime);

        document.getElementById('startMissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStartMissionForm(type);
        });
    }

    handleStartMissionForm(type) {
        const formData = new FormData(document.getElementById('startMissionForm'));
        const patrolStopsText = document.getElementById('patrolStops').value;
        const patrolStops = patrolStopsText ? patrolStopsText.split('\n').filter(stop => stop.trim()) : [];

        const mission = {
            id: Date.now(),
            type: type,
            name: document.getElementById('missionName').value,
            officerName: document.getElementById('officerName').value,
            startTime: new Date(document.getElementById('startTime').value),
            scheduledEndTime: new Date(document.getElementById('endTime').value),
            endTime: null,
            details: document.getElementById('missionDetails').value,
            activities: [],
            patrolStops: patrolStops.map(stop => ({
                location: stop.trim(),
                status: 'pending',
                arrivalTime: null,
                departureTime: null,
                checkpoints: [],
                incidents: [],
                notes: ''
            })),
            incidents: [],
            missionReport: null,
            status: 'active'
        };

        this.currentMission = mission;
        this.currentPatrolStops = [...mission.patrolStops];
        this.closeModal();
        this.updateMissionDisplay();
        
        // Show patrol controls
        document.getElementById('startPatrolBtn').classList.add('hidden');
        document.getElementById('endPatrolBtn').classList.remove('hidden');
        document.getElementById('onSiteBtn').classList.remove('hidden');
        document.getElementById('incidentReportBtn').classList.remove('hidden');
        document.getElementById('missionReportBtn').classList.remove('hidden');

        this.addActivity(`Patrol mission "${mission.name}" started`);
    }

    showOnSiteModal() {
        const availableStops = this.currentPatrolStops.filter(stop => stop.status === 'pending');
        
        const stopsOptions = availableStops.map(stop => 
            `<option value="${stop.location}">${stop.location}</option>`
        ).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Go On Site</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="onSiteForm">
                <div class="form-group">
                    <label for="siteLocation">Location:</label>
                    <select id="siteLocation" required>
                        <option value="">Select a location</option>
                        ${stopsOptions}
                        <option value="other">Other Location</option>
                    </select>
                </div>
                <div class="form-group hidden" id="customLocationGroup">
                    <label for="customLocation">Custom Location:</label>
                    <input type="text" id="customLocation">
                </div>
                <div class="form-group">
                    <label for="siteDetails">Details:</label>
                    <textarea id="siteDetails" placeholder="Enter site details"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Go On Site</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        document.getElementById('siteLocation').addEventListener('change', (e) => {
            const customGroup = document.getElementById('customLocationGroup');
            if (e.target.value === 'other') {
                customGroup.classList.remove('hidden');
                document.getElementById('customLocation').required = true;
            } else {
                customGroup.classList.add('hidden');
                document.getElementById('customLocation').required = false;
            }
        });

        document.getElementById('onSiteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOnSiteForm();
        });
    }

    handleOnSiteForm() {
        const locationSelect = document.getElementById('siteLocation').value;
        const customLocation = document.getElementById('customLocation').value;
        const location = locationSelect === 'other' ? customLocation : locationSelect;
        const details = document.getElementById('siteDetails').value;

        this.currentSite = {
            location: location,
            arrivalTime: new Date(),
            details: details,
            checkpoints: [],
            incidents: [],
            updates: []
        };

        // Update patrol stop if it's a scheduled stop
        const stopIndex = this.currentPatrolStops.findIndex(stop => stop.location === location);
        if (stopIndex !== -1) {
            this.currentPatrolStops[stopIndex].status = 'active';
            this.currentPatrolStops[stopIndex].arrivalTime = new Date();
        }

        this.closeModal();
        this.updateMissionDisplay();
        
        // Update controls
        document.getElementById('onSiteBtn').classList.add('hidden');
        document.getElementById('offSiteBtn').classList.remove('hidden');

        this.addActivity(`Arrived at ${location}`);
    }

    goOffSite() {
        if (!this.currentSite) return;

        const departureTime = new Date();
        this.currentSite.departureTime = departureTime;

        // Update patrol stop if it's a scheduled stop
        const stopIndex = this.currentPatrolStops.findIndex(stop => stop.location === this.currentSite.location);
        if (stopIndex !== -1) {
            this.currentPatrolStops[stopIndex].status = 'completed';
            this.currentPatrolStops[stopIndex].departureTime = departureTime;
            this.currentPatrolStops[stopIndex].checkpoints = [...this.currentSite.checkpoints];
            this.currentPatrolStops[stopIndex].incidents = [...this.currentSite.incidents];
            this.currentPatrolStops[stopIndex].notes = this.currentSite.details;
        }

        this.addActivity(`Left ${this.currentSite.location} (Duration: ${this.calculateDuration(this.currentSite.arrivalTime, departureTime)})`);
        
        this.currentSite = null;
        this.updateMissionDisplay();
        
        // Update controls
        document.getElementById('onSiteBtn').classList.remove('hidden');
        document.getElementById('offSiteBtn').classList.add('hidden');
    }

    showIncidentReportModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>Incident Report</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="incidentForm">
                <div class="form-group">
                    <label for="incidentType">Incident Type:</label>
                    <select id="incidentType" required>
                        <option value="">Select incident type</option>
                        <option value="security">Security Breach</option>
                        <option value="medical">Medical Emergency</option>
                        <option value="fire">Fire/Safety</option>
                        <option value="theft">Theft/Vandalism</option>
                        <option value="disturbance">Disturbance</option>
                        <option value="maintenance">Maintenance Issue</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="incidentLocation">Location:</label>
                    <input type="text" id="incidentLocation" value="${this.currentSite ? this.currentSite.location : ''}" required>
                </div>
                <div class="form-group">
                    <label for="incidentTime">Time:</label>
                    <input type="datetime-local" id="incidentTime" required>
                </div>
                <div class="form-group">
                    <label for="incidentDescription">Description:</label>
                    <textarea id="incidentDescription" placeholder="Detailed description of the incident" required></textarea>
                </div>
                <div class="form-group">
                    <label for="incidentAction">Action Taken:</label>
                    <textarea id="incidentAction" placeholder="Actions taken to address the incident"></textarea>
                </div>
                <div class="form-group">
                    <label for="incidentSeverity">Severity:</label>
                    <select id="incidentSeverity" required>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">File Report</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        // Set current time
        document.getElementById('incidentTime').value = this.formatDateTimeLocal(new Date());

        document.getElementById('incidentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleIncidentForm();
        });
    }

    handleIncidentForm() {
        const incident = {
            id: Date.now(),
            type: document.getElementById('incidentType').value,
            location: document.getElementById('incidentLocation').value,
            time: new Date(document.getElementById('incidentTime').value),
            description: document.getElementById('incidentDescription').value,
            actionTaken: document.getElementById('incidentAction').value,
            severity: document.getElementById('incidentSeverity').value,
            reportedBy: this.currentMission.officerName
        };

        this.currentMission.incidents.push(incident);

        // Add to current site if on site
        if (this.currentSite) {
            this.currentSite.incidents.push(incident);
        }

        this.closeModal();
        this.updateMissionDisplay();
        this.addActivity(`Incident report filed: ${incident.type} at ${incident.location}`);
    }

    showMissionReportModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>Mission Report</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="missionReportForm">
                <div class="form-group">
                    <label for="reportSummary">Mission Summary:</label>
                    <textarea id="reportSummary" placeholder="Overall mission summary" required></textarea>
                </div>
                <div class="form-group">
                    <label for="reportObjectives">Objectives Met:</label>
                    <textarea id="reportObjectives" placeholder="List objectives that were met"></textarea>
                </div>
                <div class="form-group">
                    <label for="reportIssues">Issues Encountered:</label>
                    <textarea id="reportIssues" placeholder="Any issues or challenges faced"></textarea>
                </div>
                <div class="form-group">
                    <label for="reportRecommendations">Recommendations:</label>
                    <textarea id="reportRecommendations" placeholder="Recommendations for future missions"></textarea>
                </div>
                <div class="form-group">
                    <label for="reportNotes">Additional Notes:</label>
                    <textarea id="reportNotes" placeholder="Any additional notes or observations"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Report</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        document.getElementById('missionReportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMissionReportForm();
        });
    }

    handleMissionReportForm() {
        const report = {
            summary: document.getElementById('reportSummary').value,
            objectives: document.getElementById('reportObjectives').value,
            issues: document.getElementById('reportIssues').value,
            recommendations: document.getElementById('reportRecommendations').value,
            notes: document.getElementById('reportNotes').value,
            completedAt: new Date()
        };

        this.currentMission.missionReport = report;
        this.closeModal();
        this.updateMissionDisplay();
        this.addActivity('Mission report completed');
    }

    endMission() {
        if (!this.currentMission) return;

        const now = new Date();
        const scheduledEnd = this.currentMission.scheduledEndTime;
        const isEarlyEnd = scheduledEnd && now < new Date(scheduledEnd.getTime() - 15 * 60 * 1000);

        if (isEarlyEnd) {
            this.showEarlyEndModal();
            return;
        }

        if (this.currentMission.type === 'patrol' && !this.currentMission.missionReport) {
            alert('Mission report is required before ending patrol mission.');
            this.showMissionReportModal();
            return;
        }

        this.completeMission();
    }

    showEarlyEndModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>Early Mission End</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <p>You are ending the mission more than 15 minutes early. Please provide a reason.</p>
            <form id="earlyEndForm">
                <div class="form-group">
                    <label for="earlyEndReason">Reason for Early End:</label>
                    <textarea id="earlyEndReason" placeholder="Explain why the mission is ending early" required></textarea>
                </div>
                <div class="form-group">
                    <label for="hasCover">Do you have cover/replacement?</label>
                    <select id="hasCover" required>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="coverDetails">Cover/Replacement Details:</label>
                    <textarea id="coverDetails" placeholder="Provide details about cover or replacement"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">End Mission Early</button>
                </div>
            </form>
        `;

        this.showModal(modalContent);

        document.getElementById('earlyEndForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEarlyEndForm();
        });
    }

    handleEarlyEndForm() {
        const earlyEndInfo = {
            reason: document.getElementById('earlyEndReason').value,
            hasCover: document.getElementById('hasCover').value,
            coverDetails: document.getElementById('coverDetails').value,
            endTime: new Date()
        };

        this.currentMission.earlyEnd = earlyEndInfo;
        this.closeModal();
        this.completeMission();
    }

    completeMission() {
        this.currentMission.endTime = new Date();
        this.currentMission.status = 'completed';
        this.currentMission.patrolStops = this.currentPatrolStops;

        // Add final activity
        this.addActivity(`Mission ended at ${this.formatTime(this.currentMission.endTime)}`);

        // Save to mission logs
        this.missionLogs.push(this.currentMission);
        this.saveMissionLogs();

        // Reset UI
        this.resetMissionUI();
        
        // Show completion message with copy option
        this.showMissionCompletionModal();
    }

    showMissionCompletionModal() {
        const report = this.generateMissionReport(this.currentMission);
        
        const modalContent = `
            <div class="modal-header">
                <h3>Mission Completed</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <p>Mission has been completed and saved. You can copy the report below:</p>
            <div class="form-group">
                <label>Mission Report:</label>
                <textarea id="completedMissionReport" readonly style="height: 300px;">${report}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-primary" onclick="app.copyReport()">Copy Report</button>
                <button type="button" class="btn-secondary" onclick="app.closeModal()">Close</button>
            </div>
        `;

        this.showModal(modalContent);
    }

    resetMissionUI() {
        const missionType = this.currentMission.type;
        
        // Reset controls
        document.getElementById(`start${missionType.charAt(0).toUpperCase() + missionType.slice(1)}Btn`).classList.remove('hidden');
        document.getElementById(`end${missionType.charAt(0).toUpperCase() + missionType.slice(1)}Btn`).classList.add('hidden');
        
        if (missionType === 'patrol') {
            document.getElementById('onSiteBtn').classList.add('hidden');
            document.getElementById('offSiteBtn').classList.add('hidden');
            document.getElementById('incidentReportBtn').classList.add('hidden');
            document.getElementById('missionReportBtn').classList.add('hidden');
        }

        // Clear mission content
        document.getElementById(`${missionType}Content`).innerHTML = '';
        
        // Reset variables
        this.currentMission = null;
        this.currentPatrolStops = [];
        this.currentSite = null;
    }

    updateMissionDisplay() {
        if (!this.currentMission) return;

        const contentDiv = document.getElementById(`${this.currentMission.type}Content`);
        contentDiv.innerHTML = this.generateMissionDisplayHTML();
    }

    generateMissionDisplayHTML() {
        const mission = this.currentMission;
        let html = `
            <div class="mission-info">
                <h3>Mission Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Officer:</label>
                        <span>${mission.officerName || 'Not specified'}</span>
                    </div>
                    <div class="info-item">
                        <label>Mission Type:</label>
                        <span>${mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}</span>
                    </div>
                    <div class="info-item">
                        <label>Start Time:</label>
                        <span>${this.formatDateTime(mission.startTime)}</span>
                    </div>
                    <div class="info-item">
                        <label>Status:</label>
                        <span class="status-indicator ${mission.status}"></span>
                        ${mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                    </div>
                </div>
            </div>
        `;

        if (mission.type === 'patrol') {
            html += this.generatePatrolDisplayHTML();
        }

        html += this.generateActivityLogHTML();

        return html;
    }

    generatePatrolDisplayHTML() {
        let html = '';

        if (this.currentSite) {
            html += `
                <div class="mission-info">
                    <h3>Current Site</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Location:</label>
                            <span>${this.currentSite.location}</span>
                        </div>
                        <div class="info-item">
                            <label>Arrival Time:</label>
                            <span>${this.formatDateTime(this.currentSite.arrivalTime)}</span>
                        </div>
                        <div class="info-item">
                            <label>Duration:</label>
                            <span>${this.calculateDuration(this.currentSite.arrivalTime, new Date())}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.currentPatrolStops.length > 0) {
            html += `
                <div class="patrol-stops">
                    <h3>Patrol Stops</h3>
            `;

            this.currentPatrolStops.forEach(stop => {
                html += `
                    <div class="patrol-stop ${stop.status === 'active' ? 'active' : ''}">
                        <div class="stop-header">
                            <span class="stop-location">${stop.location}</span>
                            <span class="stop-status ${stop.status}">${stop.status}</span>
                        </div>
                        ${stop.arrivalTime ? `<p><strong>Arrival:</strong> ${this.formatDateTime(stop.arrivalTime)}</p>` : ''}
                        ${stop.departureTime ? `<p><strong>Departure:</strong> ${this.formatDateTime(stop.departureTime)}</p>` : ''}
                        ${stop.notes ? `<p><strong>Notes:</strong> ${stop.notes}</p>` : ''}
                    </div>
                `;
            });

            html += '</div>';
        }

        return html;
    }

    generateActivityLogHTML() {
        const activities = this.currentMission.activities;
        
        let html = `
            <div class="activity-log">
                <h3>Activity Log</h3>
        `;

        if (activities.length === 0) {
            html += '<p>No activities logged yet.</p>';
        } else {
            activities.forEach(activity => {
                html += `
                    <div class="activity-item">
                        <div class="activity-time">${this.formatDateTime(activity.time)}</div>
                        <div class="activity-description">${activity.description}</div>
                    </div>
                `;
            });
        }

        html += '</div>';
        return html;
    }

    addActivity(description) {
        if (!this.currentMission) return;

        this.currentMission.activities.push({
            time: new Date(),
            description: description
        });

        this.updateMissionDisplay();
    }

    showMissionLogs() {
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('missionLogsList').classList.remove('hidden');
        
        const dashboards = ['standingDashboard', 'patrolDashboard', 'deskDashboard'];
        dashboards.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        this.populateMissionLogs();
    }

    populateMissionLogs() {
        const container = document.getElementById('logsContainer');
        
        if (this.missionLogs.length === 0) {
            container.innerHTML = '<p>No mission logs found.</p>';
            return;
        }

        let html = '';
        this.missionLogs.forEach(log => {
            const duration = log.endTime ? this.calculateDuration(log.startTime, log.endTime) : 'Ongoing';
            html += `
                <div class="log-item" onclick="app.viewMissionLog(${log.id})">
                    <div class="log-header">
                        <span class="log-title">${log.name || log.type.charAt(0).toUpperCase() + log.type.slice(1)} Mission</span>
                        <span class="log-date">${this.formatDate(log.startTime)}</span>
                    </div>
                    <div class="log-summary">
                        <p><strong>Officer:</strong> ${log.officerName || 'Unknown'}</p>
                        <p><strong>Duration:</strong> ${duration}</p>
                        <p><strong>Status:</strong> ${log.status}</p>
                        ${log.incidents.length > 0 ? `<p><strong>Incidents:</strong> ${log.incidents.length}</p>` : ''}
                    </div>
                    <button class="copy-btn" onclick="event.stopPropagation(); app.copyMissionLog(${log.id})">Copy Report</button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    viewMissionLog(logId) {
        const log = this.missionLogs.find(l => l.id === logId);
        if (!log) return;

        const report = this.generateMissionReport(log);
        
        const modalContent = `
            <div class="modal-header">
                <h3>Mission Log - ${log.name || log.type.charAt(0).toUpperCase() + log.type.slice(1)}</h3>
                <button class="close-btn" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="form-group">
                <textarea readonly style="height: 400px; width: 100%;">${report}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-primary" onclick="app.copyMissionLogFromModal(${logId})">Copy Report</button>
                <button type="button" class="btn-secondary" onclick="app.closeModal()">Close</button>
            </div>
        `;

        this.showModal(modalContent);
    }

    copyMissionLog(logId) {
        const log = this.missionLogs.find(l => l.id === logId);
        if (!log) return;

        const report = this.generateMissionReport(log);
        this.copyToClipboard(report);
    }

    copyMissionLogFromModal(logId) {
        this.copyMissionLog(logId);
        this.closeModal();
    }

    copyReport() {
        const reportText = document.getElementById('completedMissionReport').value;
        this.copyToClipboard(reportText);
    }

    generateMissionReport(mission) {
        let report = `FIELD OFFICER MISSION REPORT\n`;
        report += `${'='.repeat(50)}\n\n`;
        
        report += `Mission Type: ${mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}\n`;
        report += `Mission Name: ${mission.name || 'N/A'}\n`;
        report += `Officer: ${mission.officerName || 'Not specified'}\n`;
        report += `Start Time: ${this.formatDateTime(mission.startTime)}\n`;
        report += `End Time: ${mission.endTime ? this.formatDateTime(mission.endTime) : 'Ongoing'}\n`;
        
        if (mission.endTime) {
            report += `Duration: ${this.calculateDuration(mission.startTime, mission.endTime)}\n`;
        }
        
        report += `Status: ${mission.status}\n\n`;

        if (mission.details) {
            report += `Mission Details:\n${mission.details}\n\n`;
        }

        if (mission.earlyEnd) {
            report += `EARLY END INFORMATION:\n`;
            report += `Reason: ${mission.earlyEnd.reason}\n`;
            report += `Has Cover: ${mission.earlyEnd.hasCover}\n`;
            report += `Cover Details: ${mission.earlyEnd.coverDetails}\n\n`;
        }

        if (mission.type === 'patrol' && mission.patrolStops.length > 0) {
            report += `PATROL STOPS:\n`;
            report += `${'-'.repeat(30)}\n`;
            
            mission.patrolStops.forEach((stop, index) => {
                report += `${index + 1}. ${stop.location}\n`;
                report += `   Status: ${stop.status}\n`;
                if (stop.arrivalTime) {
                    report += `   Arrival: ${this.formatDateTime(stop.arrivalTime)}\n`;
                }
                if (stop.departureTime) {
                    report += `   Departure: ${this.formatDateTime(stop.departureTime)}\n`;
                    report += `   Duration: ${this.calculateDuration(stop.arrivalTime, stop.departureTime)}\n`;
                }
                if (stop.notes) {
                    report += `   Notes: ${stop.notes}\n`;
                }
                if (stop.checkpoints.length > 0) {
                    report += `   Checkpoints:\n`;
                    stop.checkpoints.forEach(checkpoint => {
                        report += `     - ${checkpoint.name}: ${checkpoint.details}\n`;
                    });
                }
                report += `\n`;
            });
        }

        if (mission.incidents.length > 0) {
            report += `INCIDENT REPORTS:\n`;
            report += `${'-'.repeat(30)}\n`;
            
            mission.incidents.forEach((incident, index) => {
                report += `${index + 1}. ${incident.type.toUpperCase()} - ${incident.location}\n`;
                report += `   Time: ${this.formatDateTime(incident.time)}\n`;
                report += `   Severity: ${incident.severity.toUpperCase()}\n`;
                report += `   Description: ${incident.description}\n`;
                if (incident.actionTaken) {
                    report += `   Action Taken: ${incident.actionTaken}\n`;
                }
                report += `   Reported By: ${incident.reportedBy}\n\n`;
            });
        }

        if (mission.activities.length > 0) {
            report += `ACTIVITY LOG:\n`;
            report += `${'-'.repeat(30)}\n`;
            
            mission.activities.forEach(activity => {
                report += `${this.formatDateTime(activity.time)} - ${activity.description}\n`;
            });
            report += `\n`;
        }

        if (mission.missionReport) {
            const mr = mission.missionReport;
            report += `MISSION REPORT:\n`;
            report += `${'-'.repeat(30)}\n`;
            report += `Summary: ${mr.summary}\n\n`;
            if (mr.objectives) {
                report += `Objectives Met: ${mr.objectives}\n\n`;
            }
            if (mr.issues) {
                report += `Issues Encountered: ${mr.issues}\n\n`;
            }
            if (mr.recommendations) {
                report += `Recommendations: ${mr.recommendations}\n\n`;
            }
            if (mr.notes) {
                report += `Additional Notes: ${mr.notes}\n\n`;
            }
        }

        report += `Report Generated: ${this.formatDateTime(new Date())}\n`;
        report += `${'='.repeat(50)}`;

        return report;
    }

    showModal(content) {
        document.getElementById('modalContent').innerHTML = content;
        document.getElementById('modalOverlay').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
    }

    // Utility functions
    formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString();
    }

    formatDateTimeLocal(date) {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    calculateDuration(start, end) {
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Report copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Report copied to clipboard!');
        });
    }

    // Local storage functions
    saveMissionLogs() {
        localStorage.setItem('fieldOfficerMissionLogs', JSON.stringify(this.missionLogs));
    }

    loadMissionLogs() {
        const logs = localStorage.getItem('fieldOfficerMissionLogs');
        return logs ? JSON.parse(logs) : [];
    }
}

// Global functions for onclick handlers
function backToMain() {
    app.backToMain();
}

// Initialize the app
const app = new MissionLogApp();
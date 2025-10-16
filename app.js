// Field Officer App - Main Application Logic
class FieldOfficerApp {
    constructor() {
        this.currentMission = null;
        this.currentMissionType = null;
        this.patrolStops = [];
        this.incidents = [];
        this.missionLogs = [];
        this.isOnSite = false;
        this.currentLocation = null;
        this.personsOfInterest = [];
        this.sites = [];
        
        this.initializeApp();
        this.loadData();
        this.setupEventListeners();
        this.updateTime();
    }

    initializeApp() {
        // Check if profile exists, if not show profile modal
        const profile = this.getProfile();
        if (!profile.name) {
            this.showModal('profile-modal');
        } else {
            this.updateProfileDisplay();
        }
    }

    loadData() {
        // Load data from localStorage
        const savedMissionLogs = localStorage.getItem('missionLogs');
        if (savedMissionLogs) {
            this.missionLogs = JSON.parse(savedMissionLogs);
        }

        const savedCurrentMission = localStorage.getItem('currentMission');
        if (savedCurrentMission) {
            this.currentMission = JSON.parse(savedCurrentMission);
            this.resumeMission();
        }

        const savedPOI = localStorage.getItem('personsOfInterest');
        if (savedPOI) {
            this.personsOfInterest = JSON.parse(savedPOI);
        }

        const savedSites = localStorage.getItem('sites');
        if (savedSites) {
            this.sites = JSON.parse(savedSites);
        }
    }

    saveData() {
        localStorage.setItem('missionLogs', JSON.stringify(this.missionLogs));
        localStorage.setItem('personsOfInterest', JSON.stringify(this.personsOfInterest));
        localStorage.setItem('sites', JSON.stringify(this.sites));
        if (this.currentMission) {
            localStorage.setItem('currentMission', JSON.stringify(this.currentMission));
        } else {
            localStorage.removeItem('currentMission');
        }
    }

    getProfile() {
        const profile = localStorage.getItem('officerProfile');
        return profile ? JSON.parse(profile) : {};
    }

    saveProfile(profileData) {
        localStorage.setItem('officerProfile', JSON.stringify(profileData));
    }

    updateProfileDisplay() {
        const profile = this.getProfile();
        document.getElementById('guard-name').textContent = profile.name || 'Officer Name';
    }

    setupEventListeners() {
        // Profile management
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.showProfileModal();
        });

        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileData();
        });

        document.getElementById('cancel-profile').addEventListener('click', () => {
            this.hideModal('profile-modal');
        });

        // Mission selection
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const missionType = card.dataset.mission;
                this.selectMissionType(missionType);
            });
        });

        // View logs
        document.getElementById('view-logs-btn').addEventListener('click', () => {
            this.showMissionLogsPage();
        });

        // POI Management
        document.getElementById('poi-management-btn').addEventListener('click', () => {
            this.showPOIManagementPage();
        });

        // Sites Management
        document.getElementById('sites-management-btn').addEventListener('click', () => {
            this.showSitesManagementPage();
        });

        // Back to main dashboard buttons
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        document.getElementById('back-to-main-poi-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        document.getElementById('back-to-main-sites-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        document.getElementById('back-to-main-patrol-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        document.getElementById('back-to-main-standing-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        document.getElementById('back-to-main-desk-btn').addEventListener('click', () => {
            this.showMainDashboard();
        });

        // Patrol mission controls
        document.getElementById('start-mission-btn').addEventListener('click', () => {
            this.showMissionStartModal();
        });

        document.getElementById('end-mission-btn').addEventListener('click', () => {
            this.endMission();
        });

        document.getElementById('mission-report-btn').addEventListener('click', () => {
            this.generateMissionReport();
        });

        document.getElementById('on-site-btn').addEventListener('click', () => {
            this.goOnSite();
        });

        document.getElementById('off-site-btn').addEventListener('click', () => {
            this.goOffSite();
        });

        document.getElementById('incident-report-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        // Standing mission controls
        document.getElementById('start-standing-btn').addEventListener('click', () => {
            this.startStandingMission();
        });

        document.getElementById('end-standing-btn').addEventListener('click', () => {
            this.endStandingMission();
        });

        document.getElementById('standing-incident-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        document.getElementById('standing-report-btn').addEventListener('click', () => {
            this.generateStandingReport();
        });

        // Desk mission controls
        document.getElementById('start-desk-btn').addEventListener('click', () => {
            this.startDeskMission();
        });

        document.getElementById('end-desk-btn').addEventListener('click', () => {
            this.endDeskMission();
        });

        document.getElementById('desk-incident-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        document.getElementById('desk-report-btn').addEventListener('click', () => {
            this.generateDeskReport();
        });

        // Mission start modal
        document.getElementById('mission-start-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startPatrolMission();
        });

        document.getElementById('cancel-mission-start').addEventListener('click', () => {
            this.hideModal('mission-start-modal');
        });

        // Location modal
        document.getElementById('location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitLocation();
        });

        document.getElementById('cancel-location').addEventListener('click', () => {
            this.hideModal('location-modal');
        });

        // Incident modal
        document.getElementById('incident-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIncident();
        });

        document.getElementById('cancel-incident').addEventListener('click', () => {
            this.hideModal('incident-modal');
        });

        // Report modal
        document.getElementById('copy-report-btn').addEventListener('click', () => {
            this.copyReport();
        });

        document.getElementById('save-report-btn').addEventListener('click', () => {
            this.saveReport();
        });

        document.getElementById('close-report-btn').addEventListener('click', () => {
            this.hideModal('mission-report-modal');
        });

        // Early end modal
        document.getElementById('early-end-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmEarlyEnd();
        });

        document.getElementById('cancel-early-end').addEventListener('click', () => {
            this.hideModal('early-end-modal');
        });

        // POI Modal
        document.getElementById('add-poi-btn').addEventListener('click', () => {
            this.showAddPOIModal();
        });

        document.getElementById('poi-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPOI();
        });

        document.getElementById('cancel-poi').addEventListener('click', () => {
            this.hideModal('poi-modal');
        });

        // Sites Modal
        document.getElementById('add-site-btn').addEventListener('click', () => {
            this.showAddSiteModal();
        });

        document.getElementById('sites-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSite();
        });

        document.getElementById('cancel-sites').addEventListener('click', () => {
            this.hideModal('sites-modal');
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showProfileModal() {
        const profile = this.getProfile();
        document.getElementById('officer-name').value = profile.name || '';
        document.getElementById('badge-number').value = profile.badgeNumber || '';
        document.getElementById('department').value = profile.department || '';
        document.getElementById('supervisor').value = profile.supervisor || '';
        this.showModal('profile-modal');
    }

    saveProfileData() {
        const profileData = {
            name: document.getElementById('officer-name').value,
            badgeNumber: document.getElementById('badge-number').value,
            department: document.getElementById('department').value,
            supervisor: document.getElementById('supervisor').value
        };
        
        this.saveProfile(profileData);
        this.updateProfileDisplay();
        this.hideModal('profile-modal');
    }

    selectMissionType(type) {
        this.currentMissionType = type;
        
        // Hide mission selection
        document.getElementById('mission-selection').classList.add('hidden');
        
        // Show appropriate dashboard
        document.getElementById(`${type}-dashboard`).classList.remove('hidden');
        
        if (type === 'patrol') {
            this.initializePatrolDashboard();
        }
    }

    initializePatrolDashboard() {
        this.updatePatrolStatus();
    }

    showMissionStartModal() {
        // Set default times
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        document.getElementById('start-time').value = this.formatDateTimeLocal(now);
        document.getElementById('end-time').value = this.formatDateTimeLocal(endTime);
        
        this.showModal('mission-start-modal');
    }

    startPatrolMission() {
        const profile = this.getProfile();
        const missionData = {
            id: Date.now(),
            type: 'patrol',
            name: document.getElementById('mission-name').value,
            startTime: new Date(document.getElementById('start-time').value),
            expectedEndTime: new Date(document.getElementById('end-time').value),
            plannedStops: document.getElementById('patrol-stops').value,
            details: document.getElementById('mission-details').value,
            officer: profile,
            patrolStops: [],
            incidents: [],
            status: 'active',
            actualStartTime: new Date()
        };

        this.currentMission = missionData;
        this.patrolStops = [];
        this.incidents = [];
        
        this.updatePatrolStatus();
        this.addPatrolLogEntry(`Mission started: ${missionData.name}`, 'mission-start');
        
        this.hideModal('mission-start-modal');
        this.saveData();
    }

    updatePatrolStatus() {
        const statusElement = document.getElementById('mission-status');
        const controlsElement = document.getElementById('patrol-controls');
        
        if (this.currentMission && this.currentMission.status === 'active') {
            statusElement.textContent = `Mission Active: ${this.currentMission.name}`;
            statusElement.parentElement.classList.add('active');
            
            document.getElementById('start-mission-btn').classList.add('hidden');
            document.getElementById('end-mission-btn').classList.remove('hidden');
            document.getElementById('mission-report-btn').classList.remove('hidden');
            controlsElement.classList.remove('hidden');
            
            this.updateActivityStatus();
        } else {
            statusElement.textContent = 'Mission Not Started';
            statusElement.parentElement.classList.remove('active');
        }
    }

    updateActivityStatus() {
        const activityElement = document.getElementById('activity-status');
        
        if (this.isOnSite && this.currentLocation) {
            activityElement.textContent = `On-site at: ${this.currentLocation.name}`;
            activityElement.className = 'status-active';
        } else if (this.currentMission) {
            activityElement.textContent = 'In transit';
            activityElement.className = 'status-warning';
        } else {
            activityElement.textContent = 'No active patrol';
            activityElement.className = 'status-inactive';
        }
    }

    goOnSite() {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            alert('Please start a mission first');
            return;
        }
        
        document.getElementById('location-modal-title').textContent = 'Go On-Site';
        document.getElementById('location-submit').textContent = 'Go On-Site';
        document.getElementById('location-name').value = '';
        document.getElementById('location-details').value = '';
        document.getElementById('checkpoint-name').value = '';
        document.getElementById('checkpoint-details').value = '';
        
        // Populate sites dropdown
        const locationSelect = document.getElementById('location-select');
        locationSelect.innerHTML = '<option value="">Or select from sites...</option>';
        this.sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.name;
            option.textContent = `${site.name} (${site.type})`;
            locationSelect.appendChild(option);
        });
        
        // Add event listener for site selection
        locationSelect.onchange = (e) => {
            if (e.target.value) {
                document.getElementById('location-name').value = e.target.value;
                const selectedSite = this.sites.find(site => site.name === e.target.value);
                if (selectedSite && selectedSite.notes) {
                    document.getElementById('location-details').value = selectedSite.notes;
                }
            }
        };
        
        this.showModal('location-modal');
    }

    goOffSite() {
        if (!this.isOnSite) {
            alert('You are not currently on-site');
            return;
        }
        
        // Log leaving the site
        this.addPatrolLogEntry(`Left site: ${this.currentLocation.name}`, 'site-leave');
        
        // Add patrol stop to mission
        const patrolStop = {
            ...this.currentLocation,
            endTime: new Date(),
            duration: new Date() - this.currentLocation.startTime
        };
        
        this.currentMission.patrolStops.push(patrolStop);
        
        this.isOnSite = false;
        this.currentLocation = null;
        
        document.getElementById('on-site-btn').classList.remove('hidden');
        document.getElementById('off-site-btn').classList.add('hidden');
        
        this.updateActivityStatus();
        this.saveData();
    }

    submitLocation() {
        const locationData = {
            name: document.getElementById('location-name').value,
            details: document.getElementById('location-details').value,
            checkpoint: document.getElementById('checkpoint-name').value,
            checkpointDetails: document.getElementById('checkpoint-details').value,
            startTime: new Date()
        };

        this.currentLocation = locationData;
        this.isOnSite = true;
        
        this.addPatrolLogEntry(`Arrived at: ${locationData.name}`, 'site-arrival');
        
        if (locationData.checkpoint) {
            this.addPatrolLogEntry(`Checkpoint: ${locationData.checkpoint} - ${locationData.checkpointDetails}`, 'checkpoint');
        }
        
        document.getElementById('on-site-btn').classList.add('hidden');
        document.getElementById('off-site-btn').classList.remove('hidden');
        
        this.updateActivityStatus();
        this.hideModal('location-modal');
        this.saveData();
    }

    showIncidentModal() {
        // Set current time
        document.getElementById('incident-time').value = this.formatDateTimeLocal(new Date());
        
        // Set current location if on-site
        if (this.isOnSite && this.currentLocation) {
            document.getElementById('incident-location').value = this.currentLocation.name;
        } else {
            document.getElementById('incident-location').value = '';
        }
        
        // Clear form
        document.getElementById('incident-type').value = '';
        document.getElementById('incident-description').value = '';
        document.getElementById('incident-action').value = '';
        
        this.showModal('incident-modal');
    }

    submitIncident() {
        const incidentData = {
            id: Date.now(),
            type: document.getElementById('incident-type').value,
            location: document.getElementById('incident-location').value,
            time: new Date(document.getElementById('incident-time').value),
            description: document.getElementById('incident-description').value,
            action: document.getElementById('incident-action').value,
            reportedBy: this.getProfile(),
            missionId: this.currentMission ? this.currentMission.id : null
        };

        this.incidents.push(incidentData);
        
        if (this.currentMission) {
            this.currentMission.incidents.push(incidentData);
        }
        
        this.addPatrolLogEntry(`Incident reported: ${incidentData.type} at ${incidentData.location}`, 'incident');
        
        this.hideModal('incident-modal');
        this.saveData();
    }

    addPatrolLogEntry(content, type = 'general') {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('patrol-entries').appendChild(logEntry);
    }

    endMission() {
        if (!this.currentMission) return;
        
        const now = new Date();
        const expectedEnd = new Date(this.currentMission.expectedEndTime);
        const timeDiff = expectedEnd - now;
        
        // Check if ending 15+ minutes early
        if (timeDiff > 15 * 60 * 1000) {
            this.showModal('early-end-modal');
            return;
        }
        
        this.completeMission();
    }

    confirmEarlyEnd() {
        const reason = document.getElementById('early-reason').value;
        const replacement = document.getElementById('replacement-info').value;
        
        this.currentMission.earlyEnd = {
            reason: reason,
            replacement: replacement,
            actualEndTime: new Date()
        };
        
        this.hideModal('early-end-modal');
        this.completeMission();
    }

    completeMission() {
        if (this.isOnSite) {
            this.goOffSite();
        }
        
        this.currentMission.status = 'completed';
        this.currentMission.actualEndTime = new Date();
        
        // Save to mission logs
        this.missionLogs.push(this.currentMission);
        
        this.addPatrolLogEntry('Mission completed', 'mission-end');
        
        // Reset state
        this.currentMission = null;
        this.patrolStops = [];
        this.incidents = [];
        this.isOnSite = false;
        this.currentLocation = null;
        
        // Update UI
        this.updatePatrolStatus();
        
        // Show mission selection again
        document.getElementById('patrol-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
        
        this.saveData();
        
        alert('Mission completed successfully!');
    }

    generateMissionReport() {
        if (!this.currentMission) return;
        
        const profile = this.getProfile();
        const mission = this.currentMission;
        
        let report = `FIELD OFFICER MISSION REPORT\n`;
        report += `=====================================\n\n`;
        report += `Officer: ${profile.name}\n`;
        report += `Badge Number: ${profile.badgeNumber}\n`;
        report += `Department: ${profile.department}\n`;
        report += `Supervisor: ${profile.supervisor}\n\n`;
        
        report += `MISSION DETAILS\n`;
        report += `---------------\n`;
        report += `Mission Name: ${mission.name}\n`;
        report += `Mission Type: ${mission.type.toUpperCase()}\n`;
        report += `Start Time: ${mission.actualStartTime.toLocaleString()}\n`;
        report += `Expected End: ${mission.expectedEndTime.toLocaleString()}\n`;
        
        if (mission.actualEndTime) {
            report += `Actual End: ${mission.actualEndTime.toLocaleString()}\n`;
        }
        
        report += `Status: ${mission.status.toUpperCase()}\n\n`;
        
        if (mission.details) {
            report += `Mission Details: ${mission.details}\n\n`;
        }
        
        if (mission.plannedStops) {
            report += `Planned Stops:\n${mission.plannedStops}\n\n`;
        }
        
        if (mission.patrolStops && mission.patrolStops.length > 0) {
            report += `PATROL STOPS\n`;
            report += `------------\n`;
            mission.patrolStops.forEach((stop, index) => {
                report += `${index + 1}. ${stop.name}\n`;
                report += `   Arrival: ${stop.startTime.toLocaleString()}\n`;
                if (stop.endTime) {
                    report += `   Departure: ${stop.endTime.toLocaleString()}\n`;
                    report += `   Duration: ${Math.round(stop.duration / 60000)} minutes\n`;
                }
                if (stop.details) {
                    report += `   Details: ${stop.details}\n`;
                }
                if (stop.checkpoint) {
                    report += `   Checkpoint: ${stop.checkpoint}\n`;
                    if (stop.checkpointDetails) {
                        report += `   Checkpoint Details: ${stop.checkpointDetails}\n`;
                    }
                }
                report += `\n`;
            });
        }
        
        if (mission.incidents && mission.incidents.length > 0) {
            report += `INCIDENTS\n`;
            report += `---------\n`;
            mission.incidents.forEach((incident, index) => {
                report += `${index + 1}. ${incident.type.toUpperCase()}\n`;
                report += `   Location: ${incident.location}\n`;
                report += `   Time: ${incident.time.toLocaleString()}\n`;
                report += `   Description: ${incident.description}\n`;
                if (incident.action) {
                    report += `   Action Taken: ${incident.action}\n`;
                }
                report += `\n`;
            });
        }
        
        if (mission.earlyEnd) {
            report += `EARLY END DETAILS\n`;
            report += `-----------------\n`;
            report += `Reason: ${mission.earlyEnd.reason}\n`;
            report += `Replacement Info: ${mission.earlyEnd.replacement}\n`;
            report += `End Time: ${mission.earlyEnd.actualEndTime.toLocaleString()}\n\n`;
        }
        
        report += `Report Generated: ${new Date().toLocaleString()}\n`;
        report += `Generated by: Field Officer App v1.0\n`;
        
        document.getElementById('generated-report').textContent = report;
        this.showModal('mission-report-modal');
    }

    copyReport() {
        const reportText = document.getElementById('generated-report').textContent;
        navigator.clipboard.writeText(reportText).then(() => {
            alert('Report copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = reportText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Report copied to clipboard!');
        });
    }

    saveReport() {
        // Save current report to mission logs if not already saved
        if (this.currentMission && !this.missionLogs.find(log => log.id === this.currentMission.id)) {
            const missionCopy = { ...this.currentMission };
            missionCopy.report = document.getElementById('generated-report').textContent;
            this.missionLogs.push(missionCopy);
            this.saveData();
        }
        alert('Report saved successfully!');
    }

    showMainDashboard() {
        // Hide all pages
        document.getElementById('mission-logs-page').classList.add('hidden');
        document.getElementById('poi-management-page').classList.add('hidden');
        document.getElementById('sites-management-page').classList.add('hidden');
        document.getElementById('patrol-dashboard').classList.add('hidden');
        document.getElementById('standing-dashboard').classList.add('hidden');
        document.getElementById('desk-dashboard').classList.add('hidden');
        
        // Show mission selection
        document.getElementById('mission-selection').classList.remove('hidden');
    }

    showMissionLogsPage() {
        // Hide mission selection and show logs page
        document.getElementById('mission-selection').classList.add('hidden');
        document.getElementById('mission-logs-page').classList.remove('hidden');
        
        this.populateMissionLogs();
    }

    populateMissionLogs() {
        const container = document.getElementById('logs-container');
        
        if (this.missionLogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Mission Logs</h3>
                    <p>No completed missions found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.missionLogs.map((log, index) => `
            <div class="log-card">
                <div class="log-card-header">
                    <div>
                        <div class="log-card-title">${log.name} (${log.type.toUpperCase()})</div>
                        <div class="log-card-date">${log.actualStartTime ? new Date(log.actualStartTime).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div class="log-card-actions">
                        <button class="btn btn-primary btn-small" onclick="app.viewMissionReport(${index})">View Report</button>
                        <button class="btn btn-success btn-small" onclick="app.copyMissionReport(${index})">Copy Report</button>
                    </div>
                </div>
                <div class="log-card-details">
                    <strong>Status:</strong> ${log.status}<br>
                    <strong>Start:</strong> ${log.actualStartTime ? new Date(log.actualStartTime).toLocaleString() : 'N/A'}<br>
                    <strong>End:</strong> ${log.actualEndTime ? new Date(log.actualEndTime).toLocaleString() : 'Ongoing'}
                </div>
                <div class="log-card-stats">
                    <div class="log-stat">
                        <div class="log-stat-number">${log.patrolStops ? log.patrolStops.length : 0}</div>
                        <div class="log-stat-label">Stops</div>
                    </div>
                    <div class="log-stat">
                        <div class="log-stat-number">${log.incidents ? log.incidents.length : 0}</div>
                        <div class="log-stat-label">Incidents</div>
                    </div>
                    <div class="log-stat">
                        <div class="log-stat-number">${log.actualEndTime && log.actualStartTime ? Math.round((new Date(log.actualEndTime) - new Date(log.actualStartTime)) / (1000 * 60 * 60)) : 0}</div>
                        <div class="log-stat-label">Hours</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewMissionReport(index) {
        const log = this.missionLogs[index];
        const report = this.generateReportForLog(log);
        
        document.getElementById('generated-report').textContent = report;
        this.showModal('mission-report-modal');
    }

    copyMissionReport(index) {
        const log = this.missionLogs[index];
        const report = this.generateReportForLog(log);
        
        navigator.clipboard.writeText(report).then(() => {
            alert('Mission report copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = report;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Mission report copied to clipboard!');
        });
    }

    generateReportForLog(log) {
        const profile = log.officer || this.getProfile();
        
        let report = `FIELD OFFICER MISSION REPORT\n`;
        report += `=====================================\n\n`;
        report += `Officer: ${profile.name}\n`;
        report += `Badge Number: ${profile.badgeNumber}\n`;
        report += `Department: ${profile.department}\n`;
        report += `Supervisor: ${profile.supervisor}\n\n`;
        
        report += `MISSION DETAILS\n`;
        report += `---------------\n`;
        report += `Mission Name: ${log.name}\n`;
        report += `Mission Type: ${log.type.toUpperCase()}\n`;
        report += `Start Time: ${log.actualStartTime ? new Date(log.actualStartTime).toLocaleString() : 'N/A'}\n`;
        report += `Expected End: ${log.expectedEndTime ? new Date(log.expectedEndTime).toLocaleString() : 'N/A'}\n`;
        
        if (log.actualEndTime) {
            report += `Actual End: ${new Date(log.actualEndTime).toLocaleString()}\n`;
        }
        
        report += `Status: ${log.status.toUpperCase()}\n\n`;
        
        if (log.details) {
            report += `Mission Details: ${log.details}\n\n`;
        }
        
        if (log.plannedStops) {
            report += `Planned Stops:\n${log.plannedStops}\n\n`;
        }
        
        if (log.patrolStops && log.patrolStops.length > 0) {
            report += `PATROL STOPS\n`;
            report += `------------\n`;
            log.patrolStops.forEach((stop, index) => {
                report += `${index + 1}. ${stop.name}\n`;
                report += `   Arrival: ${new Date(stop.startTime).toLocaleString()}\n`;
                if (stop.endTime) {
                    report += `   Departure: ${new Date(stop.endTime).toLocaleString()}\n`;
                    report += `   Duration: ${Math.round(stop.duration / 60000)} minutes\n`;
                }
                if (stop.details) {
                    report += `   Details: ${stop.details}\n`;
                }
                if (stop.checkpoint) {
                    report += `   Checkpoint: ${stop.checkpoint}\n`;
                    if (stop.checkpointDetails) {
                        report += `   Checkpoint Details: ${stop.checkpointDetails}\n`;
                    }
                }
                report += `\n`;
            });
        }
        
        if (log.incidents && log.incidents.length > 0) {
            report += `INCIDENTS\n`;
            report += `---------\n`;
            log.incidents.forEach((incident, index) => {
                report += `${index + 1}. ${incident.type.toUpperCase()}\n`;
                report += `   Location: ${incident.location}\n`;
                report += `   Time: ${new Date(incident.time).toLocaleString()}\n`;
                report += `   Description: ${incident.description}\n`;
                if (incident.action) {
                    report += `   Action Taken: ${incident.action}\n`;
                }
                report += `\n`;
            });
        }
        
        if (log.earlyEnd) {
            report += `EARLY END DETAILS\n`;
            report += `-----------------\n`;
            report += `Reason: ${log.earlyEnd.reason}\n`;
            report += `Replacement Info: ${log.earlyEnd.replacement}\n`;
            report += `End Time: ${new Date(log.earlyEnd.actualEndTime).toLocaleString()}\n\n`;
        }
        
        report += `Report Generated: ${new Date().toLocaleString()}\n`;
        report += `Generated by: Field Officer App v1.0\n`;
        
        return report;
    }

    // Standing and Desk mission methods (simplified versions)
    startStandingMission() {
        const profile = this.getProfile();
        this.currentMission = {
            id: Date.now(),
            type: 'standing',
            name: 'Standing Guard Duty',
            startTime: new Date(),
            officer: profile,
            incidents: [],
            status: 'active'
        };
        
        document.getElementById('standing-mission-status').textContent = 'Standing Duty Active';
        document.getElementById('start-standing-btn').classList.add('hidden');
        document.getElementById('end-standing-btn').classList.remove('hidden');
        document.getElementById('standing-report-btn').classList.remove('hidden');
        
        this.addStandingLogEntry('Standing duty started');
        this.saveData();
    }

    endStandingMission() {
        if (this.currentMission) {
            this.currentMission.status = 'completed';
            this.currentMission.endTime = new Date();
            this.missionLogs.push(this.currentMission);
            this.currentMission = null;
        }
        
        document.getElementById('standing-mission-status').textContent = 'Mission Not Started';
        document.getElementById('start-standing-btn').classList.remove('hidden');
        document.getElementById('end-standing-btn').classList.add('hidden');
        document.getElementById('standing-report-btn').classList.add('hidden');
        
        this.addStandingLogEntry('Standing duty ended');
        this.saveData();
        
        // Return to mission selection
        document.getElementById('standing-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
    }

    generateStandingReport() {
        // Similar to patrol report but for standing duty
        this.generateMissionReport();
    }

    addStandingLogEntry(content) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('standing-entries').appendChild(logEntry);
    }

    startDeskMission() {
        const profile = this.getProfile();
        this.currentMission = {
            id: Date.now(),
            type: 'desk',
            name: 'Desk Duty',
            startTime: new Date(),
            officer: profile,
            incidents: [],
            status: 'active'
        };
        
        document.getElementById('desk-mission-status').textContent = 'Desk Duty Active';
        document.getElementById('start-desk-btn').classList.add('hidden');
        document.getElementById('end-desk-btn').classList.remove('hidden');
        document.getElementById('desk-report-btn').classList.remove('hidden');
        
        this.addDeskLogEntry('Desk duty started');
        this.saveData();
    }

    endDeskMission() {
        if (this.currentMission) {
            this.currentMission.status = 'completed';
            this.currentMission.endTime = new Date();
            this.missionLogs.push(this.currentMission);
            this.currentMission = null;
        }
        
        document.getElementById('desk-mission-status').textContent = 'Mission Not Started';
        document.getElementById('start-desk-btn').classList.remove('hidden');
        document.getElementById('end-desk-btn').classList.add('hidden');
        document.getElementById('desk-report-btn').classList.add('hidden');
        
        this.addDeskLogEntry('Desk duty ended');
        this.saveData();
        
        // Return to mission selection
        document.getElementById('desk-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
    }

    generateDeskReport() {
        // Similar to patrol report but for desk duty
        this.generateMissionReport();
    }

    addDeskLogEntry(content) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('desk-entries').appendChild(logEntry);
    }

    resumeMission() {
        if (this.currentMission) {
            this.selectMissionType(this.currentMission.type);
            if (this.currentMission.type === 'patrol') {
                this.updatePatrolStatus();
            }
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString();
        
        document.getElementById('current-time').textContent = timeString;
        document.getElementById('standing-current-time').textContent = timeString;
        document.getElementById('desk-current-time').textContent = timeString;
        
        // Update every second
        setTimeout(() => this.updateTime(), 1000);
    }

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // POI Management Methods
    showPOIManagementPage() {
        document.getElementById('mission-selection').classList.add('hidden');
        document.getElementById('poi-management-page').classList.remove('hidden');
        
        this.populatePOIList();
    }

    populatePOIList() {
        const container = document.getElementById('poi-list');
        
        if (this.personsOfInterest.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Persons Of Interest</h3>
                    <p>No POI records found. Click "Add POI" to create the first entry.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.personsOfInterest.map((poi, index) => `
            <div class="poi-card">
                <div class="poi-card-header">
                    <div>
                        <div class="poi-name">${poi.name}</div>
                        <div class="poi-reason">${poi.reason.charAt(0).toUpperCase() + poi.reason.slice(1)}</div>
                    </div>
                    <div class="poi-alert-level alert-${poi.alertLevel}">${poi.alertLevel.toUpperCase()}</div>
                </div>
                <div class="poi-description">
                    <strong>Description:</strong> ${poi.description || 'No description provided'}<br>
                    <strong>Notes:</strong> ${poi.notes || 'No additional notes'}
                </div>
                <div class="poi-actions">
                    <button class="btn btn-warning btn-small" onclick="app.editPOI(${index})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="app.deletePOI(${index})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    showAddPOIModal() {
        document.getElementById('poi-modal-title').textContent = 'Add Person Of Interest';
        document.getElementById('poi-submit-btn').textContent = 'Add POI';
        
        // Clear form
        document.getElementById('poi-name').value = '';
        document.getElementById('poi-description').value = '';
        document.getElementById('poi-reason').value = '';
        document.getElementById('poi-notes').value = '';
        document.getElementById('poi-alert-level').value = 'low';
        
        // Remove edit mode data attribute
        document.getElementById('poi-form').removeAttribute('data-edit-index');
        
        this.showModal('poi-modal');
    }

    editPOI(index) {
        const poi = this.personsOfInterest[index];
        
        document.getElementById('poi-modal-title').textContent = 'Edit Person Of Interest';
        document.getElementById('poi-submit-btn').textContent = 'Update POI';
        
        // Fill form with existing data
        document.getElementById('poi-name').value = poi.name;
        document.getElementById('poi-description').value = poi.description || '';
        document.getElementById('poi-reason').value = poi.reason;
        document.getElementById('poi-notes').value = poi.notes || '';
        document.getElementById('poi-alert-level').value = poi.alertLevel;
        
        // Set edit mode
        document.getElementById('poi-form').setAttribute('data-edit-index', index);
        
        this.showModal('poi-modal');
    }

    submitPOI() {
        const form = document.getElementById('poi-form');
        const editIndex = form.getAttribute('data-edit-index');
        
        const poiData = {
            id: editIndex !== null ? this.personsOfInterest[editIndex].id : Date.now(),
            name: document.getElementById('poi-name').value,
            description: document.getElementById('poi-description').value,
            reason: document.getElementById('poi-reason').value,
            notes: document.getElementById('poi-notes').value,
            alertLevel: document.getElementById('poi-alert-level').value,
            createdAt: editIndex !== null ? this.personsOfInterest[editIndex].createdAt : new Date(),
            updatedAt: new Date(),
            createdBy: this.getProfile()
        };

        if (editIndex !== null) {
            // Update existing POI
            this.personsOfInterest[editIndex] = poiData;
        } else {
            // Add new POI
            this.personsOfInterest.push(poiData);
        }
        
        this.saveData();
        this.populatePOIList();
        this.hideModal('poi-modal');
        
        const action = editIndex !== null ? 'updated' : 'added';
        alert(`Person of Interest ${action} successfully!`);
    }

    deletePOI(index) {
        const poi = this.personsOfInterest[index];
        if (confirm(`Are you sure you want to remove ${poi.name} from the POI list?`)) {
            this.personsOfInterest.splice(index, 1);
            this.saveData();
            this.populatePOIList();
            alert('Person of Interest removed successfully!');
        }
    }

    // Sites Management Methods
    showSitesManagementPage() {
        document.getElementById('mission-selection').classList.add('hidden');
        document.getElementById('sites-management-page').classList.remove('hidden');
        
        this.populateSitesList();
    }

    populateSitesList() {
        const container = document.getElementById('sites-list');
        
        if (this.sites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Sites</h3>
                    <p>No site records found. Click "Add Site" to create the first entry.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.sites.map((site, index) => `
            <div class="site-card">
                <div class="site-card-header">
                    <div>
                        <div class="site-name">${site.name}</div>
                        <div class="site-type">${site.type.charAt(0).toUpperCase() + site.type.slice(1)}</div>
                    </div>
                </div>
                <div class="site-details">
                    <strong>Address:</strong> ${site.address || 'No address provided'}<br>
                    <strong>Contact:</strong> ${site.contact || 'No contact provided'}<br>
                    <strong>Access:</strong> ${site.access || 'No access instructions'}<br>
                    <strong>Notes:</strong> ${site.notes || 'No additional notes'}
                </div>
                <div class="site-actions">
                    <button class="btn btn-warning btn-small" onclick="app.editSite(${index})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="app.deleteSite(${index})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    showAddSiteModal() {
        document.getElementById('sites-modal-title').textContent = 'Add Site';
        document.getElementById('sites-submit-btn').textContent = 'Add Site';
        
        // Clear form
        document.getElementById('site-name').value = '';
        document.getElementById('site-address').value = '';
        document.getElementById('site-type').value = '';
        document.getElementById('site-contact').value = '';
        document.getElementById('site-access').value = '';
        document.getElementById('site-notes').value = '';
        
        // Remove edit mode data attribute
        document.getElementById('sites-form').removeAttribute('data-edit-index');
        
        this.showModal('sites-modal');
    }

    editSite(index) {
        const site = this.sites[index];
        
        document.getElementById('sites-modal-title').textContent = 'Edit Site';
        document.getElementById('sites-submit-btn').textContent = 'Update Site';
        
        // Fill form with existing data
        document.getElementById('site-name').value = site.name;
        document.getElementById('site-address').value = site.address || '';
        document.getElementById('site-type').value = site.type;
        document.getElementById('site-contact').value = site.contact || '';
        document.getElementById('site-access').value = site.access || '';
        document.getElementById('site-notes').value = site.notes || '';
        
        // Set edit mode
        document.getElementById('sites-form').setAttribute('data-edit-index', index);
        
        this.showModal('sites-modal');
    }

    submitSite() {
        const form = document.getElementById('sites-form');
        const editIndex = form.getAttribute('data-edit-index');
        
        const siteData = {
            id: editIndex !== null ? this.sites[editIndex].id : Date.now(),
            name: document.getElementById('site-name').value,
            address: document.getElementById('site-address').value,
            type: document.getElementById('site-type').value,
            contact: document.getElementById('site-contact').value,
            access: document.getElementById('site-access').value,
            notes: document.getElementById('site-notes').value,
            createdAt: editIndex !== null ? this.sites[editIndex].createdAt : new Date(),
            updatedAt: new Date(),
            createdBy: this.getProfile()
        };

        if (editIndex !== null) {
            // Update existing site
            this.sites[editIndex] = siteData;
        } else {
            // Add new site
            this.sites.push(siteData);
        }
        
        this.saveData();
        this.populateSitesList();
        this.hideModal('sites-modal');
        
        const action = editIndex !== null ? 'updated' : 'added';
        alert(`Site ${action} successfully!`);
    }

    deleteSite(index) {
        const site = this.sites[index];
        if (confirm(`Are you sure you want to remove ${site.name} from the sites list?`)) {
            this.sites.splice(index, 1);
            this.saveData();
            this.populateSitesList();
            alert('Site removed successfully!');
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FieldOfficerApp();
});
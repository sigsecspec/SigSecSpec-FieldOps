# SigSecSpec - Signature Security Specialist Database

A comprehensive web application for security specialists to log their shift activities during Fixed Post, Mobile Patrol, or Desk Duty missions.

## Features

### Mission Types
- **Fixed Post**: Stationary security assignment
- **Mobile Patrol**: Vehicle patrol with checkpoint stops
- **Desk Duty**: Administrative operations

### Core Functionality

#### Mission Management
- Start mission with specialist details, start/end times, and optional notes
- Mission report required before ending mission
- Early end protection (15-minute warning) with excuse form
- Local storage for all mission logs
- Copy-to-clipboard functionality for reports

#### Patrol-Specific Features
- **On-Site/Off-Site Tracking**: Guards can mark when they arrive at and leave patrol stops
- **Patrol Stops**: Automatically logged with arrival/departure times, location, and details
- **Checkpoints**: Add checkpoint inspections during patrol stops
- **In-Transit Status**: Shows when guard is between sites
- **Mission Report Lock**: Once mission report is completed, cannot visit new sites

#### Incident Reporting
- File incident reports anytime (even outside patrol stops)
- Multiple incident types: Security Breach, Suspicious Activity, Medical Emergency, etc.
- Incidents automatically categorized by patrol stop or general mission

#### Mission Reports
Contains:
- Full mission details (start/end times, duration)
- All patrol stops with timestamps
- Checkpoint details within each patrol stop
- Incident reports (categorized by location)
- Mission summary, observations, and recommendations
- Early end documentation (if applicable)

### Console Interface
- **No Popups**: All operations performed through console commands
- **Step-by-Step Guidance**: Console provides clear instructions for each operation
- **Command History**: Use UP/DOWN arrows to navigate command history
- **Auto-complete**: Use TAB key for command auto-completion
- **Real-time Feedback**: Console shows status updates and confirmations

### Button Functions
All buttons act as console command shortcuts:
- **Start Mission** → `start_detailed` command
- **Go On Site** → `onsite` command (patrol only)
- **Leave Site** → `offsite` command (patrol only)
- **Incident Report** → `incident_detailed` command
- **Add Checkpoint** → `checkpoint` command (when on site)
- **Mission Report** → `report_detailed` command
- **End Mission** → `end` command

### Data Management
- All missions saved to browser's local storage
- View all past mission logs
- Copy any report to clipboard for email/reporting
- Mission logs accessible from main page

## How to Use

1. **Open** `index.html` in a web browser
2. **Select** your mission type (Standing, Patrol, or Desk)
3. **Start Mission** using console commands or detailed configuration

### Console Commands

The system uses a command console interface. All operations can be performed using console commands:

#### Mission Management
- `start [officer_name]` - Quick start mission with officer name
- `start_detailed` - Start detailed mission configuration
- `officer [name]` - Set officer name (detailed mode)
- `start_time [YYYY-MM-DD HH:MM]` - Set start time (detailed mode)
- `end_time [YYYY-MM-DD HH:MM]` - Set end time (detailed mode)
- `notes [your_notes]` - Set mission notes (detailed mode)
- `confirm_start` - Confirm and start mission (detailed mode)
- `cancel` - Cancel current operation

#### Patrol Operations
- `onsite [location]` - Go on site at location
- `offsite` - Leave current site
- `checkpoint [name] [status] [details]` - Add checkpoint

#### Incident Reporting
- `incident [type] [location] [description]` - Quick incident report
- `incident_detailed` - Start detailed incident report
- `incident_type [type]` - Set incident type (detailed mode)
- `incident_location [location]` - Set incident location (detailed mode)
- `incident_desc [description]` - Set incident description (detailed mode)
- `incident_action [action]` - Set action taken (detailed mode)
- `confirm_incident` - Confirm and submit incident (detailed mode)

#### Mission Reports
- `report [summary]` - Quick mission report
- `report_detailed` - Start detailed mission report
- `report_summary [summary]` - Set mission summary (detailed mode)
- `report_obs [observations]` - Set key observations (detailed mode)
- `report_rec [recommendations]` - Set recommendations (detailed mode)
- `confirm_report` - Confirm and save report (detailed mode)

#### System Commands
- `end` - End current mission
- `status` - Show current mission status
- `time` - Show current time
- `sites` - List saved sites
- `bolos` - List active BOLOs
- `logs` - View mission history
- `clear` - Clear console
- `home` - Return to main page
- `help` - Show all available commands

### For Patrol Missions:
1. Use `start [officer_name]` or `start_detailed` to begin mission
2. Use `onsite [location]` when arriving at a location
3. While on site:
   - Use `checkpoint [name] [status] [details]` to add checkpoints
   - Use `incident [type] [location] [description]` for quick incident reports
   - Use `incident_detailed` for detailed incident reports
4. Use `offsite` when departing (logs patrol stop)
5. Repeat steps 2-4 for all patrol stops
6. Use `report [summary]` or `report_detailed` to complete mission report (required)
7. Use `end` when shift is complete

### Ending Mission Early:
- If ending >15 minutes early, system requires:
  - Reason for early end
  - Coverage/replacement information
  - Additional documentation in final report

### Viewing Past Missions:
- Click "View Mission Logs" button
- View details of any past mission
- Copy reports to clipboard

## Technical Details
- Pure HTML/CSS/JavaScript (no dependencies)
- Local storage for data persistence
- Responsive design for mobile/tablet use
- No server required - runs entirely in browser

## Files
- `index.html` - Main application page
- `app.js` - Application logic
- `styles.css` - Styling and layout

## Console Operations Guide

### Starting a Mission
1. **Quick Start**: `start Officer_Johnson`
2. **Detailed Start**: 
   - `start_detailed`
   - `officer Officer_Johnson`
   - `start_time 2024-01-15 08:00`
   - `end_time 2024-01-15 16:00`
   - `notes Regular patrol shift`
   - `confirm_start`

### Reporting an Incident
1. **Quick Report**: `incident Security_Breach Main_Entrance Unauthorized_access_attempt`
2. **Detailed Report**:
   - `incident_detailed`
   - `incident_type Security_Breach`
   - `incident_location Main_Entrance`
   - `incident_desc Unauthorized access attempt detected`
   - `incident_action Security notified, area secured`
   - `confirm_incident`

### Creating Mission Report
1. **Quick Report**: `report Mission_completed_successfully`
2. **Detailed Report**:
   - `report_detailed`
   - `report_summary Mission completed successfully with no incidents`
   - `report_obs All checkpoints secure, no suspicious activity`
   - `report_rec Continue current patrol schedule`
   - `confirm_report`

### Common Commands
- `status` - Check current mission status
- `time` - Get current time
- `clear` - Clear console screen
- `help` - Show all commands
- `cancel` - Cancel current operation

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with localStorage support

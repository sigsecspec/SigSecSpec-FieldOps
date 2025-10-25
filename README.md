# SigSecSpec - Professional Guard System v2.1

A comprehensive professional security guard system for field operations, incident reporting, mission management, and real-time communications.

## 🚔 New Professional Features

### Enhanced Command System
- **Professional Time Format**: `start 06:00 am end 14:00 pm Perimeter patrol`
- **Interactive Button Prompts**: Press Enter to confirm, ESC to cancel operations
- **Radio Communications**: `radio [message]` for dispatch communication
- **Emergency Backup**: `backup` command for immediate assistance
- **Security Codes**: `code [10-4]` lookup system for police/security codes
- **BOLO System**: `bolo [subject] [description]` for Be On the Lookout alerts
- **Patrol Routes**: `patrol [location]` for route logging

### Professional Interface
- **Terminal-Style Console**: Realistic command-line interface
- **Real-time Status**: Live mission tracking and GPS simulation
- **Emergency Protocols**: Built-in backup request and code systems
- **Professional Prompts**: Step-by-step guided operations

## 📋 Command Reference

### Mission Control
```
start [HH:MM] [am/pm] end [HH:MM] [am/pm] [details] - Professional shift start
start [officer_name] - Quick start mission
end - End current shift/mission
status - Show current mission status
```

### Site Operations
```
onsite [location] - Arrive at location
offsite - Depart current location
patrol [location] - Begin patrol route
checkpoint [name] [status] - Log checkpoint
```

### Incident Reporting
```
incident [type] [location] [description] - Report incident
bolo [subject] [description] - Create BOLO alert
report [summary] - Generate report
```

### Communication
```
radio [message] - Radio check with dispatch
backup - Request emergency backup
code [code] - Look up security/police codes
```

### System Utilities
```
sites - List saved sites
bolos - List active BOLOs
logs - View mission history
time - Show current time
clear - Clear console
help - Show all commands
```

## 🎯 Professional Examples

```bash
# Start professional shift
start 06:00 am end 14:00 pm Perimeter security patrol

# Arrive at location
onsite Main Entrance - Security checkpoint

# Report suspicious activity
incident Suspicious Activity Parking Lot Male subject loitering near vehicles

# Create BOLO alert
bolo John Doe Wanted for questioning - white male 5ft 10in brown hair

# Radio check
radio Unit 12 checking in - all clear on north perimeter

# Request backup
backup

# Look up security codes
code 10-4
code 10-99
```

## 🔧 Interactive Button System

When clicking buttons, the system now provides professional prompts:
- **Press Enter** to confirm and proceed with the operation
- **Press ESC** to cancel and return to ready state
- Each action shows realistic "Press Enter to Start Mission" style prompts

## 🚨 Emergency Features

- **Backup Request**: Simulates emergency backup with dispatch response
- **Radio Communications**: Mock radio checks with realistic responses
- **Security Codes**: Database of common 10-codes and security terminology
- **BOLO System**: Professional Be On the Lookout alert management

## 💻 Technical Features

- **Responsive Design**: Works on mobile devices and desktop terminals
- **Local Storage**: Persistent mission logs and data
- **Real-time Updates**: Live status tracking and notifications
- **Professional UI**: Terminal-style interface with security themes

## 🔐 Security & Professional Use

This system simulates professional guard operations with:
- Realistic command structure
- Professional terminology and procedures
- Emergency protocol simulation
- Comprehensive logging and reporting
- Mock communication systems

Perfect for training, simulation, or professional security operations management.

## 📱 Usage

1. Open `index.html` in a web browser
2. Select mission type (Fixed Post, Mobile Patrol, Desk Duty)
3. Use professional commands or interactive buttons
4. Follow Enter/ESC prompts for operations
5. Complete professional reports and end shift

## 🛠️ Development

Client-side application using vanilla JavaScript, HTML, and CSS. No server setup required.

---
**Professional Security Software - Authorized Personnel Only**
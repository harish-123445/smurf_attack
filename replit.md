# Smurf Attack Simulator - Educational Project

## Overview
An educational web application that demonstrates the mechanics of a Smurf Attack (DDoS attack) with **actual service denial demonstration**. Built with Flask backend and interactive HTML/CSS/JavaScript frontend.

## Purpose
Created for Data Privacy and Security course to help students understand:
- How Smurf attacks work (ICMP-based DDoS)
- Network amplification concepts
- Attack phases and impact
- **Real-world impact on service availability**
- Prevention methods

## Project Architecture

### Backend Components

#### Main Simulator (app.py)
- Flask application with SocketIO for real-time communication
- SmurfAttackSimulator class: Simulates attack with configurable parameters
- **Sends actual HTTP requests to victim service** to demonstrate DDoS impact
- Thread-safe attack control with proper lifecycle management
- Real-time statistics and phase updates via WebSocket
- Health monitoring API for victim service

#### Victim Service (victim_service.py)
- **Standalone Flask application simulating a real online store** (port 3000)
- Progressive degradation under load with tiered delays
- Request counter with automatic decay for recovery demonstration
- Health status endpoint for real-time monitoring
- Demonstrates actual service unavailability during attack

### Frontend
- **templates/index.html**: Main interface with network topology visualization and victim service status panel
- **static/css/styles.css**: Cybersecurity-themed dark mode design
- **static/js/script.js**: Real-time chart updates, packet animations, and victim health monitoring

## Key Features
1. **Interactive Network Visualization**: Shows attacker, broadcast network, and victim with animated packet flow
2. **Configurable Attack Parameters**: Amplification factor, target IP, broadcast network size
3. **Real-Time Statistics**: Packets sent, bandwidth consumed, victim load percentage
4. **Victim Service Status Panel**: Live monitoring of target service health
   - Status indicator (Healthy → Warning → Degraded → Critical → Offline)
   - Active request counter
   - Quick access buttons to visit/test the victim service
5. **Actual Service Denial Demonstration**: Users can visit the victim service and experience slowdown/unavailability during attack
6. **Educational Content**: Detailed explanations of attack mechanics and prevention
7. **Phase Logging**: Step-by-step breakdown of attack progression
8. **Chart Analytics**: Visual representation of attack metrics over time

## How It Works

### Attack Simulation
1. User configures attack parameters (amplification factor, target IP, network size)
2. Simulator sends spoofed ICMP requests to broadcast network
3. For each amplified response, **actual HTTP requests are sent to the victim service** (localhost:3000)
4. Victim service's request counter increases, causing progressive delays
5. Users can observe real service degradation in real-time

### Service Degradation Levels
- **Healthy**: < 50 active requests - Service responds normally
- **Warning**: 50-100 active requests - Slight delays begin
- **Degraded**: 100-200 active requests - Noticeable slowdown (0.8s delay)
- **Critical**: > 200 active requests - Severe slowdown or service unavailable (2s delay or 503 errors)

## Technical Stack
- Python 3.11
- Flask, Flask-SocketIO, Flask-CORS
- Requests (for attacking victim service)
- HTML5, CSS3, JavaScript
- Chart.js for data visualization
- Socket.IO for real-time communication

## How to Run
Both services run automatically via configured workflows:
- **Main Simulator**: Port 5000 (webview)
- **Victim Service**: Port 3000 (console)

Use the control panel to configure attack parameters, then:
1. Click "Visit Victim Service" to open the target website
2. Click "Start Attack" to begin the simulation
3. Watch the victim service status change from green to yellow to red
4. Try accessing the victim service during attack to experience the slowdown
5. Click "Stop Attack" to halt the simulation
6. Click "Reset Service" to restore the victim service to normal

## Recent Changes (Oct 6, 2025)
- Implemented complete Smurf attack simulation engine
- Added network topology visualization with packet animations
- Created real-time statistics dashboard with Chart.js
- Integrated educational content explaining attack mechanics
- Fixed thread lifecycle management for proper start/stop/reset control
- Enhanced packet visualization to show 30% of packets with amplification phase animations
- **Added victim service with progressive degradation under load**
- **Implemented actual HTTP flood attack against victim service**
- **Created victim service health monitoring with real-time status updates**
- **Added interactive panel to visit and test victim service during attack**

## Educational Use Only
This is a safe simulation for learning purposes. All attacks are performed locally against a controlled victim service. No external network packets are sent.

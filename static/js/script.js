const socket = io();

let attackRunning = false;
let chart = null;
let chartData = {
    labels: [],
    packets: [],
    bandwidth: [],
    load: []
};
let healthCheckInterval = null;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');
const targetIpInput = document.getElementById('targetIp');
const ampFactorSlider = document.getElementById('amplificationFactor');
const ampValueSpan = document.getElementById('ampValue');
const nodesSlider = document.getElementById('amplificationNodes');
const nodesValueSpan = document.getElementById('nodesValue');
const victimIpDiv = document.getElementById('victimIp');
const logEntries = document.getElementById('logEntries');

ampFactorSlider.addEventListener('input', (e) => {
    ampValueSpan.textContent = e.target.value;
});

nodesSlider.addEventListener('input', (e) => {
    nodesValueSpan.textContent = e.target.value;
    updateAmplifierNodes(parseInt(e.target.value));
});

targetIpInput.addEventListener('input', (e) => {
    victimIpDiv.textContent = e.target.value;
});

function updateAmplifierNodes(count) {
    const amplifierNodesDiv = document.getElementById('amplifierNodes');
    amplifierNodesDiv.innerHTML = '';
    const displayCount = Math.min(count, 25);
    for (let i = 0; i < displayCount; i++) {
        const node = document.createElement('div');
        node.className = 'mini-node';
        amplifierNodesDiv.appendChild(node);
    }
}

updateAmplifierNodes(50);

function initChart() {
    const ctx = document.getElementById('attackChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Packets Sent',
                    data: chartData.packets,
                    borderColor: '#00ffff',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Bandwidth (MB)',
                    data: chartData.bandwidth,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Victim Load (%)',
                    data: chartData.load,
                    borderColor: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#00ffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00ffff' },
                    grid: { color: 'rgba(0, 255, 255, 0.1)' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { color: '#00ffff' },
                    grid: { color: 'rgba(0, 255, 255, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    max: 100,
                    ticks: { color: '#ff4444' },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateChart(stats) {
    const time = new Date().toLocaleTimeString();
    chartData.labels.push(time);
    chartData.packets.push(stats.packets_sent);
    chartData.bandwidth.push(stats.bandwidth_consumed);
    chartData.load.push(stats.victim_load);
    
    if (chartData.labels.length > 20) {
        chartData.labels.shift();
        chartData.packets.shift();
        chartData.bandwidth.shift();
        chartData.load.shift();
    }
    
    chart.update('none');
}

function createPacketAnimation(source, destination) {
    const svg = document.getElementById('packetSvg');
    const rect = svg.getBoundingClientRect();
    
    const sourceEl = document.getElementById(source);
    const destEl = document.getElementById(destination);
    
    if (!sourceEl || !destEl) return;
    
    const sourceRect = sourceEl.getBoundingClientRect();
    const destRect = destEl.getBoundingClientRect();
    
    const x1 = sourceRect.left - rect.left + sourceRect.width / 2;
    const y1 = sourceRect.top - rect.top + sourceRect.height / 2;
    const x2 = destRect.left - rect.left + destRect.width / 2;
    const y2 = destRect.top - rect.top + destRect.height / 2;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#00ff88');
    circle.setAttribute('class', 'packet');
    
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'cx');
    animate.setAttribute('from', x1);
    animate.setAttribute('to', x2);
    animate.setAttribute('dur', '0.8s');
    animate.setAttribute('fill', 'freeze');
    
    const animateY = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateY.setAttribute('attributeName', 'cy');
    animateY.setAttribute('from', y1);
    animateY.setAttribute('to', y2);
    animateY.setAttribute('dur', '0.8s');
    animateY.setAttribute('fill', 'freeze');
    
    circle.appendChild(animate);
    circle.appendChild(animateY);
    svg.appendChild(circle);
    
    setTimeout(() => {
        svg.removeChild(circle);
    }, 800);
}

function addLogEntry(phase, message, timestamp) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span class="log-message">Phase ${phase}: ${message}</span>
    `;
    logEntries.insertBefore(entry, logEntries.firstChild);
    
    if (logEntries.children.length > 50) {
        logEntries.removeChild(logEntries.lastChild);
    }
}

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('connection_response', (data) => {
    statusDiv.textContent = data.data;
});

socket.on('attack_phase', (data) => {
    addLogEntry(data.phase, data.description, data.timestamp);
    
    if (data.phase === 1) {
        createPacketAnimation('attacker', 'amplifier');
    } else if (data.phase === 2) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createPacketAnimation('amplifier', 'amplifier'), i * 100);
        }
    }
});

socket.on('packet_sent', (data) => {
    if (Math.random() < 0.3) {
        createPacketAnimation('amplifier', 'victim');
    }
});

socket.on('stats_update', (stats) => {
    document.getElementById('packetsSent').textContent = stats.packets_sent.toLocaleString();
    document.getElementById('bandwidth').textContent = stats.bandwidth_consumed.toFixed(2);
    document.getElementById('victimLoad').textContent = stats.victim_load.toFixed(1) + '%';
    document.getElementById('ampFactor').textContent = stats.amplification_factor + 'x';
    
    updateChart(stats);
});

socket.on('attack_complete', (data) => {
    attackRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = `✅ Attack Complete - ${data.total_packets} packets sent, ${data.total_bandwidth} MB consumed`;
    statusDiv.style.background = 'rgba(0, 255, 255, 0.2)';
    stopHealthMonitoring();
});

startBtn.addEventListener('click', () => {
    const config = {
        amplification_factor: parseInt(ampFactorSlider.value),
        target_ip: targetIpInput.value,
        amplification_nodes: parseInt(nodesSlider.value)
    };
    socket.emit('start_attack', config);
});

stopBtn.addEventListener('click', () => {
    socket.emit('stop_attack');
});

resetBtn.addEventListener('click', () => {
    socket.emit('reset_simulation');
});

async function checkVictimHealth() {
    try {
        const response = await fetch('/api/victim/health');
        const data = await response.json();
        updateVictimStatus(data);
    } catch (error) {
        updateVictimStatus({ status: 'offline', message: 'Service unavailable', active_requests: 0 });
    }
}

function updateVictimStatus(data) {
    const statusDot = document.querySelector('.status-dot');
    const serviceStatus = document.getElementById('serviceStatus');
    const activeRequests = document.getElementById('activeRequests');
    const statusMessage = document.getElementById('statusMessage');
    
    statusDot.className = 'status-dot ' + data.status;
    
    const statusText = {
        'healthy': '✅ Online',
        'warning': '⚠️ Warning',
        'degraded': '🔶 Degraded',
        'critical': '🔴 Critical',
        'timeout': '⏱️ Timeout',
        'offline': '❌ Offline'
    };
    
    serviceStatus.textContent = statusText[data.status] || '❓ Unknown';
    activeRequests.textContent = data.active_requests || 0;
    statusMessage.textContent = data.message || 'No information';
}

document.getElementById('checkHealth').addEventListener('click', checkVictimHealth);

document.getElementById('resetService').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/victim/reset');
        const data = await response.json();
        alert(data.message || 'Service reset successfully');
        checkVictimHealth();
    } catch (error) {
        alert('Failed to reset victim service. Make sure it is running.');
    }
});

function startHealthMonitoring() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    healthCheckInterval = setInterval(checkVictimHealth, 1000);
    checkVictimHealth();
}

function stopHealthMonitoring() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
}

socket.on('attack_started', (data) => {
    attackRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDiv.textContent = `✅ ${data.status}`;
    statusDiv.style.background = 'rgba(0, 255, 136, 0.2)';
    statusDiv.style.borderColor = '#00ff88';
    startHealthMonitoring();
});

socket.on('attack_stopped', (data) => {
    attackRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = `⏸️ ${data.status}`;
    statusDiv.style.background = 'rgba(255, 165, 0, 0.2)';
    statusDiv.style.borderColor = '#ffaa00';
    stopHealthMonitoring();
});

socket.on('simulation_reset', (data) => {
    attackRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = `🔄 ${data.status}`;
    statusDiv.style.background = 'rgba(0, 255, 255, 0.2)';
    
    document.getElementById('packetsSent').textContent = '0';
    document.getElementById('bandwidth').textContent = '0';
    document.getElementById('victimLoad').textContent = '0';
    
    chartData.labels = [];
    chartData.packets = [];
    chartData.bandwidth = [];
    chartData.load = [];
    chart.update();
    
    logEntries.innerHTML = '';
    stopHealthMonitoring();
});

checkVictimHealth();
initChart();

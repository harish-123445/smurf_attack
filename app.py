from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import random
import threading
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'smurf-attack-simulation-secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

simulation_thread = None
thread_lock = threading.Lock()

class SmurfAttackSimulator:
    def __init__(self):
        self.is_running = False
        self.amplification_factor = 100
        self.packet_count = 0
        self.packets_sent = 0
        self.bandwidth_consumed = 0
        self.victim_load = 0
        self.amplification_nodes = 50
        
    def configure(self, amplification_factor, target_ip, amplification_nodes):
        self.amplification_factor = amplification_factor
        self.target_ip = target_ip
        self.amplification_nodes = amplification_nodes
        self.packet_count = 0
        self.packets_sent = 0
        self.bandwidth_consumed = 0
        self.victim_load = 0
    
    def simulate_attack(self):
        self.is_running = True
        phase = 1
        
        while self.is_running and self.packet_count < 1000:
            if phase == 1:
                socketio.emit('attack_phase', {
                    'phase': 1,
                    'description': 'Attacker spoofing source IP and sending ICMP Echo Request to broadcast address',
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
                time.sleep(1)
                phase = 2
            
            elif phase == 2:
                socketio.emit('attack_phase', {
                    'phase': 2,
                    'description': f'Broadcast network amplifying attack: {self.amplification_nodes} hosts responding',
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
                time.sleep(0.5)
                phase = 3
            
            elif phase == 3:
                for i in range(self.amplification_factor):
                    if not self.is_running:
                        break
                    
                    self.packet_count += 1
                    self.packets_sent += 1
                    self.bandwidth_consumed += random.uniform(0.5, 1.5)
                    self.victim_load = min(100, (self.packet_count / 10))
                    
                    packet_data = {
                        'source': f'192.168.1.{random.randint(1, 254)}',
                        'destination': self.target_ip,
                        'type': 'ICMP Echo Reply',
                        'size': random.randint(64, 128),
                        'amplification_node': random.randint(1, self.amplification_nodes)
                    }
                    
                    socketio.emit('packet_sent', packet_data)
                    
                    stats = {
                        'packets_sent': self.packets_sent,
                        'bandwidth_consumed': round(self.bandwidth_consumed, 2),
                        'victim_load': round(self.victim_load, 2),
                        'amplification_factor': self.amplification_factor,
                        'timestamp': datetime.now().strftime('%H:%M:%S')
                    }
                    
                    socketio.emit('stats_update', stats)
                    
                    time.sleep(0.05)
                
                if self.is_running:
                    phase = 1
        
        socketio.emit('attack_complete', {
            'total_packets': self.packets_sent,
            'total_bandwidth': round(self.bandwidth_consumed, 2),
            'final_victim_load': round(self.victim_load, 2)
        })
        self.is_running = False

simulator = SmurfAttackSimulator()

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'data': 'Connected to Smurf Attack Simulator'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start_attack')
def handle_start_attack(data):
    global simulation_thread
    
    with thread_lock:
        if simulation_thread and simulation_thread.is_alive():
            emit('error', {'message': 'Attack already running'})
            return
        
        amplification_factor = data.get('amplification_factor', 100)
        target_ip = data.get('target_ip', '10.0.0.100')
        amplification_nodes = data.get('amplification_nodes', 50)
        
        simulator.configure(amplification_factor, target_ip, amplification_nodes)
        
        simulation_thread = threading.Thread(target=simulator.simulate_attack)
        simulation_thread.start()
        
        emit('attack_started', {
            'status': 'Attack simulation started',
            'config': {
                'amplification_factor': amplification_factor,
                'target_ip': target_ip,
                'amplification_nodes': amplification_nodes
            }
        })

@socketio.on('stop_attack')
def handle_stop_attack():
    global simulation_thread
    
    simulator.is_running = False
    
    if simulation_thread and simulation_thread.is_alive():
        simulation_thread.join(timeout=2)
    
    emit('attack_stopped', {'status': 'Attack simulation stopped'})

@socketio.on('reset_simulation')
def handle_reset():
    global simulation_thread
    
    simulator.is_running = False
    
    if simulation_thread and simulation_thread.is_alive():
        simulation_thread.join(timeout=2)
    
    simulator.configure(100, '10.0.0.100', 50)
    emit('simulation_reset', {'status': 'Simulation reset complete'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, use_reloader=False, log_output=True)

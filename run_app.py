import subprocess
import time
import sys
import os

def start_trekmate():
    print("=" * 60)
    print("      STARTING TREKMATE TREKKING MANAGEMENT PLATFORM      ")
    print("=" * 60)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, 'backend')
    frontend_dir = os.path.join(root_dir, 'frontend')

    # Seed Database first
    print("\n1. Checking & Initializing Database...")
    seed_cmd = [sys.executable, os.path.join(backend_dir, 'seed.py')]
    subprocess.run(seed_cmd, cwd=root_dir)

    print("\n2. Launching Flask REST & WebSocket Backend (Port 5000)...")
    backend_process = subprocess.Popen([sys.executable, os.path.join(backend_dir, 'app.py')], cwd=root_dir)

    time.sleep(2)

    print("\n3. Launching Vite Frontend Dev Server (Port 3000)...")
    frontend_process = subprocess.Popen(['npm', 'run', 'dev'], cwd=frontend_dir, shell=True)

    print("\n" + "=" * 60)
    print("   TrekMate platform is now running live!")
    print("   Frontend: http://localhost:3000")
    print("   Backend:  http://localhost:5000/api/health")
    print("   Default Accounts:")
    print("     Admin:   admin@trekmate.com   / admin123")
    print("     Guide:   guide@trekmate.com   / guide123")
    print("     Trekker: trekker@trekmate.com / trekker123")
    print("=" * 60)

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping TrekMate services...")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == '__main__':
    start_trekmate()

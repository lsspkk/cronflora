#!/usr/bin/env python3

import subprocess
import sys
import time
import json
import os
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = Path(__file__).parent / ".env"
HISTORY_FILE = Path(__file__).parent / ".deployment_history.json"

def load_env():
    if not ENV_FILE.exists():
        print(f"✗ .env file not found at {ENV_FILE}")
        sys.exit(1)
    
    env_vars = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    required = ['RESOURCE_GROUP', 'APP_NAME']
    for key in required:
        if key not in env_vars:
            print(f"✗ {key} not found in .env")
            sys.exit(1)
    
    return env_vars

ENV = load_env()
RESOURCE_GROUP = ENV['RESOURCE_GROUP']
APP_NAME = ENV['APP_NAME']

def run(cmd, cwd=PROJECT_ROOT):
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"✗ {cmd}")
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()

def check_typecheck():
    print("→ Typechecking...")
    run("npm run typecheck")
    print("✓ Types OK")

def git_push():
    print("→ Pushing to GitHub...")
    run("git push")
    print("✓ Pushed")

def get_latest_workflow_run():
    data = run("gh run list --limit 1 --json databaseId,status,conclusion,url,createdAt")
    runs = json.loads(data)
    return runs[0] if runs else None

def wait_for_new_workflow():
    """Wait for a new workflow run to appear after git push"""
    print("→ Waiting for workflow to start...")
    initial_run = get_latest_workflow_run()
    initial_id = initial_run['databaseId'] if initial_run else None
    
    for i in range(30):  # Wait up to 60 seconds
        time.sleep(2)
        current_run = get_latest_workflow_run()
        if current_run and current_run['databaseId'] != initial_id:
            print("✓ Workflow started")
            return current_run
    
    print("⚠ No new workflow detected, using latest run")
    return get_latest_workflow_run()

def load_deployment_history():
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    return []

def save_deployment_result(duration_seconds, success):
    history = load_deployment_history()
    history.append({
        'timestamp': datetime.now().isoformat(),
        'duration': duration_seconds,
        'success': success
    })
    # Keep only last 10 deployments
    history = history[-10:]
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def show_deployment_history():
    history = load_deployment_history()
    if not history:
        print("→ No previous deployment data")
        return
    
    print("→ Recent deployment times:")
    for entry in history[-5:]:
        timestamp = datetime.fromisoformat(entry['timestamp']).strftime('%m-%d %H:%M')
        status = '✓' if entry['success'] else '✗'
        minutes = entry['duration'] // 60
        seconds = entry['duration'] % 60
        print(f"  {status} {timestamp}: {minutes}m {seconds}s")
    
    # Calculate average
    successful = [e['duration'] for e in history if e['success']]
    if successful:
        avg = sum(successful) / len(successful)
        avg_min = int(avg // 60)
        avg_sec = int(avg % 60)
        print(f"  Average: {avg_min}m {avg_sec}s")
    print()

def wait_for_deployment():
    show_deployment_history()
    
    workflow_run = wait_for_new_workflow()
    if not workflow_run:
        print("⚠ No workflow run found")
        return
    
    run_id = workflow_run['databaseId']
    print(f"→ Watching deployment (run #{run_id})...")
    start_time = time.time()
    
    while True:
        workflow_run = json.loads(run("gh run view {} --json status,conclusion".format(run_id)))
        status = workflow_run['status']
        
        elapsed = int(time.time() - start_time)
        minutes = elapsed // 60
        seconds = elapsed % 60
        
        if status == 'completed':
            conclusion = workflow_run['conclusion']
            success = conclusion == 'success'
            save_deployment_result(elapsed, success)
            
            if success:
                print(f"\n✓ Deployed in {minutes}m {seconds}s")
            else:
                print(f"\n✗ Failed ({conclusion}) after {minutes}m {seconds}s")
                sys.exit(1)
            break
        
        print(f"  {minutes}m {seconds}s", end="\r")
        time.sleep(2)

def get_swa_url():
    return run(f"az staticwebapp show --name {APP_NAME} --resource-group {RESOURCE_GROUP} --query defaultHostname -o tsv")

def main():
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    check_typecheck()
    git_push()
    wait_for_deployment()
    
    url = get_swa_url()
    print(f"\n→ https://{url}")

if __name__ == "__main__":
    main()

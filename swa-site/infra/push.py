#!/usr/bin/env python3

import subprocess
import sys
import time
import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = Path(__file__).parent / ".env"

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
    data = run("gh run list --limit 1 --json databaseId,status,conclusion,url")
    runs = json.loads(data)
    return runs[0] if runs else None

def wait_for_deployment():
    print("→ Waiting for deployment...")
    
    initial_run = get_latest_workflow_run()
    if not initial_run:
        print("⚠ No workflow run found")
        return
    
    run_id = initial_run['databaseId']
    dots = 0
    
    while True:
        workflow_run = json.loads(run("gh run view {} --json status,conclusion".format(run_id)))
        status = workflow_run['status']
        
        if status == 'completed':
            conclusion = workflow_run['conclusion']
            if conclusion == 'success':
                print("\n✓ Deployed")
            else:
                print(f"\n✗ Failed ({conclusion})")
                sys.exit(1)
            break
        
        print("." * (dots % 3 + 1) + " " * (2 - dots % 3), end="\r")
        dots += 1
        time.sleep(2)
        dots += 1
        time.sleep(2)

def get_swa_url():
    return run(f"az staticwebapp show --name {APP_NAME} --resource-group {RESOURCE_GROUP} --query defaultHostname -o tsv")

def main():
    check_typecheck()
    git_push()
    wait_for_deployment()
    
    url = get_swa_url()
    print(f"\n→ https://{url}")

if __name__ == "__main__":
    main()

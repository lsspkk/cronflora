# Azure Functions API for Static Web App

## Origin

This API code is based on the official Microsoft example from:
- **Repository**: [staticwebdev/vanilla-api](https://github.com/staticwebdev/vanilla-api)
- **Description**: A simple JavaScript Azure Static Web App with managed API

## What It Does

This is a managed API for Azure Static Web Apps using Azure Functions with JavaScript. It provides two HTTP-triggered serverless functions:

### Endpoints

#### 1. `/api/message` (GET)
- **File**: `message/index.js`
- **Purpose**: Returns a simple greeting message
- **Response**: `{ text: "Hello from the API" }`
- **Use Case**: Basic API health check or welcome message

#### 2. `/api/hello` (GET/POST)
- **File**: `hello/index.js`
- **Purpose**: Returns a personalized greeting based on input
- **Parameters**: `name` (query string or request body)
- **Response**: `{ input: "name", message: "Hello, name..." }`
- **Use Case**: Demonstrates parameter handling in Azure Functions

## Structure

```
api3/
├── host.json              # Azure Functions host configuration
├── package.json           # Node.js package metadata
├── .funcignore           # Files excluded from deployment
├── message/
│   ├── function.json     # HTTP trigger configuration
│   └── index.js          # Function implementation
└── hello/
    ├── function.json     # HTTP trigger configuration
    └── index.js          # Function implementation
```

## Local Development

Run locally with Azure Static Web Apps CLI:
```bash
cd swa-site && swa start
```

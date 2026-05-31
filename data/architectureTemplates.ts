import { TechRegistryItem } from './techRegistry';

export interface ArchitectureSlot {
  id: string;
  label: string;
  priority: 'required' | 'recommended' | 'optional';
  description: string;
  emptyGuidance: string;
  compatibleCategories: Array<TechRegistryItem['category']>;
}

export interface ArchitectureTemplate {
  solutionId: string;
  solutionName: string;
  slots: ArchitectureSlot[];
}

export const ARCHITECTURE_TEMPLATES: Record<string, ArchitectureTemplate> = {
  'web-app': {
    solutionId: 'web-app',
    solutionName: 'Web Application',
    slots: [
      {
        id: 'frontend',
        label: 'Frontend Layout',
        priority: 'required',
        description: 'Builds the client-side UI layout and interface hierarchy.',
        emptyGuidance: '[DROP_FRONTEND_UI_FRAMEWORK_HERE]',
        compatibleCategories: ['Frontend', 'Design / UI', 'AR / VR', 'Mobile']
      },
      {
        id: 'backend',
        label: 'Backend Controller',
        priority: 'required',
        description: 'Handles server-side logic routing, validation controllers, and API calls.',
        emptyGuidance: '[DROP_BACKEND_RUNTIME_HERE]',
        compatibleCategories: ['Backend', 'Realtime / Messaging', 'Automation']
      },
      {
        id: 'database',
        label: 'Database Schema',
        priority: 'required',
        description: 'Stores secured relation tables, document models, or transaction records.',
        emptyGuidance: '[DROP_DATABASE_ENGINE_HERE]',
        compatibleCategories: ['Database', 'Blockchain / Web3']
      },
      {
        id: 'auth',
        label: 'User Authentication',
        priority: 'recommended',
        description: 'Protects account sessions, tokens, and multi-tenant access credentials.',
        emptyGuidance: '[DROP_AUTH_PROVIDER_OPTIONAL]',
        compatibleCategories: ['Authentication']
      },
      {
        id: 'payments',
        label: 'Payments Gateway',
        priority: 'optional',
        description: 'Settles subscription checkouts or merchant ledger transactions.',
        emptyGuidance: '[DROP_PAYMENTS_GATEWAY_OPTIONAL]',
        compatibleCategories: ['Payments']
      },
      {
        id: 'hosting',
        label: 'Hosting & Deployment',
        priority: 'required',
        description: 'Deploys client-side static assets or server runtimes to cloud runtimes.',
        emptyGuidance: '[DROP_INFRA_HOSTING_HERE]',
        compatibleCategories: ['Hosting / Infra', 'DevOps']
      },
      {
        id: 'realtime',
        label: 'Realtime Channels',
        priority: 'optional',
        description: 'Synchronizes active clients instantly using high-throughput websockets.',
        emptyGuidance: '[DROP_WEBSOCKET_ENGINE_OPTIONAL]',
        compatibleCategories: ['Realtime / Messaging']
      },
      {
        id: 'ai',
        label: 'AI Integration',
        priority: 'optional',
        description: 'Enriches pages using neural processing models and API reasoning.',
        emptyGuidance: '[DROP_COGNITIVE_API_OPTIONAL]',
        compatibleCategories: ['AI / ML']
      },
      {
        id: 'analytics',
        label: 'Product Analytics',
        priority: 'optional',
        description: 'Monitors client activities, traffic flows, and operational events.',
        emptyGuidance: '[DROP_ANALYTICS_SDK_OPTIONAL]',
        compatibleCategories: ['Analytics']
      }
    ]
  },
  'mobile-app': {
    solutionId: 'mobile-app',
    solutionName: 'Mobile Application',
    slots: [
      {
        id: 'mobile-framework',
        label: 'Mobile Framework',
        priority: 'required',
        description: 'Drives the native cross-platform layout runtime or application engine.',
        emptyGuidance: '[DROP_MOBILE_UI_BUILDER_HERE]',
        compatibleCategories: ['Mobile', 'Frontend']
      },
      {
        id: 'backend',
        label: 'Server API Layer',
        priority: 'required',
        description: 'Communicates with the mobile client through REST or GraphQL endpoints.',
        emptyGuidance: '[DROP_API_RUNTIME_SERVER_HERE]',
        compatibleCategories: ['Backend', 'Realtime / Messaging']
      },
      {
        id: 'database',
        label: 'App Storage',
        priority: 'required',
        description: 'Manages local cached app state or remote operational databases.',
        emptyGuidance: '[DROP_SQLITE_OR_CLOUD_DB_HERE]',
        compatibleCategories: ['Database']
      },
      {
        id: 'auth',
        label: 'Auth & SSO',
        priority: 'recommended',
        description: 'Identifies users across platforms securely via JSON Web Tokens.',
        emptyGuidance: '[DROP_MOBILE_AUTH_OPTIONAL]',
        compatibleCategories: ['Authentication']
      },
      {
        id: 'notifications',
        label: 'Push Notification Engine',
        priority: 'optional',
        description: 'Dispatches high-priority system alerts directly to device home panels.',
        emptyGuidance: '[DROP_NOTIFICATION_SDK_OPTIONAL]',
        compatibleCategories: ['Realtime / Messaging', 'Productivity APIs']
      },
      {
        id: 'maps-device',
        label: 'Hardware & Location',
        priority: 'optional',
        description: 'Queries GPS location coordinates, cameras, or local bluetooth chips.',
        emptyGuidance: '[DROP_MAPS_OR_DEVICE_API_OPTIONAL]',
        compatibleCategories: ['Productivity APIs', 'IoT / Hardware']
      },
      {
        id: 'payments',
        label: 'App Subscriptions',
        priority: 'optional',
        description: 'Handles standard Stripe or mobile checkout transactions.',
        emptyGuidance: '[DROP_PAYMENTS_GATEWAY_OPTIONAL]',
        compatibleCategories: ['Payments']
      },
      {
        id: 'ai-features',
        label: 'Local/Edge AI',
        priority: 'optional',
        description: 'Applies neural classifiers or language generation within mobile views.',
        emptyGuidance: '[DROP_AI_INTEGRATION_OPTIONAL]',
        compatibleCategories: ['AI / ML']
      },
      {
        id: 'analytics',
        label: 'Crash & Event Tracking',
        priority: 'optional',
        description: 'Logs client-side crashes, device configurations, and workflow events.',
        emptyGuidance: '[DROP_CRASHLYTICS_OR_LOGS_OPTIONAL]',
        compatibleCategories: ['Analytics']
      },
      {
        id: 'deployment',
        label: 'App Store Pipelines',
        priority: 'required',
        description: 'Orchestrates CI/CD compilation and beta test flight distributions.',
        emptyGuidance: '[DROP_DEPLOYMENT_DEVOPS_HERE]',
        compatibleCategories: ['Hosting / Infra', 'DevOps']
      }
    ]
  },
  'ai-solution': {
    solutionId: 'ai-solution',
    solutionName: 'AI Solution',
    slots: [
      {
        id: 'ai-model',
        label: 'Neural AI Model',
        priority: 'required',
        description: 'Selects the primary large language model (LLM) or deep neural network.',
        emptyGuidance: '[DROP_AI_MODEL_HERE]',
        compatibleCategories: ['AI / ML']
      },
      {
        id: 'inference-layer',
        label: 'Inference Backend',
        priority: 'required',
        description: 'Configures model pipeline runtime routing or orchestrator nodes.',
        emptyGuidance: '[DROP_INFERENCE_OR_LANGCHAIN_HERE]',
        compatibleCategories: ['AI / ML', 'Backend']
      },
      {
        id: 'vector-db',
        label: 'Vector Database',
        priority: 'optional',
        description: 'Stores semantic embeddings for high-dimensional cosine similarity searches.',
        emptyGuidance: '[DROP_VECTOR_STORE_OPTIONAL]',
        compatibleCategories: ['Database', 'AI / ML']
      },
      {
        id: 'backend-api',
        label: 'API Gateway',
        priority: 'required',
        description: 'Coordinates requests, auth tokens, rate-limits, and payload validation.',
        emptyGuidance: '[DROP_FASTAPI_OR_BACKEND_HERE]',
        compatibleCategories: ['Backend', 'Realtime / Messaging']
      },
      {
        id: 'frontend',
        label: 'UI Playground',
        priority: 'optional',
        description: 'Renders the conversational chat interface or prototype dashboard views.',
        emptyGuidance: '[DROP_PLAYGROUND_UI_OPTIONAL]',
        compatibleCategories: ['Frontend', 'Design / UI']
      },
      {
        id: 'memory-rag',
        label: 'Semantic Memory (RAG)',
        priority: 'optional',
        description: 'Binds vector search indices to the AI contextual window memory.',
        emptyGuidance: '[DROP_RAG_INDEXER_OPTIONAL]',
        compatibleCategories: ['AI / ML', 'Database']
      },
      {
        id: 'hosting',
        label: 'Model Infrastructure',
        priority: 'required',
        description: 'Hosts high-memory edge endpoints or serverless backend gateways.',
        emptyGuidance: '[DROP_AI_HOSTING_INFRA_HERE]',
        compatibleCategories: ['Hosting / Infra', 'DevOps']
      },
      {
        id: 'observability',
        label: 'AI Observability',
        priority: 'optional',
        description: 'Monitors prompt latency budgets, token consumption fees, and hallucinations.',
        emptyGuidance: '[DROP_OBSERVABILITY_SDK_OPTIONAL]',
        compatibleCategories: ['DevOps', 'Hosting / Infra', 'Analytics']
      },
      {
        id: 'data-pipeline',
        label: 'Data Pipeline',
        priority: 'optional',
        description: 'Ingests, chunks, and embeddings text documents recursively.',
        emptyGuidance: '[DROP_ETL_PIPELINE_OPTIONAL]',
        compatibleCategories: ['Backend', 'Database', 'Automation']
      }
    ]
  },
  'iot-product': {
    solutionId: 'iot-product',
    solutionName: 'IoT Hardware Product',
    slots: [
      {
        id: 'microcontroller',
        label: 'Microcontroller / SBC',
        priority: 'required',
        description: 'Selects the primary system on a chip (SoC) or single-board hardware controller.',
        emptyGuidance: '[DROP_SOC_MICROCONTROLLER_HERE]',
        compatibleCategories: ['IoT / Hardware']
      },
      {
        id: 'sensors',
        label: 'Sensors & Actuators',
        priority: 'recommended',
        description: 'Interconnects analog/digital environmental telemetry interfaces.',
        emptyGuidance: '[DROP_TELEMETRY_SENSORS_RECOMMENDED]',
        compatibleCategories: ['IoT / Hardware']
      },
      {
        id: 'connectivity',
        label: 'Mesh Connectivity',
        priority: 'required',
        description: 'Drives physical communication stacks (Wi-Fi, Bluetooth BLE, MQTT, ZigBee).',
        emptyGuidance: '[DROP_COMMUNICATION_PROTOCOL_HERE]',
        compatibleCategories: ['IoT / Hardware', 'Realtime / Messaging']
      },
      {
        id: 'firmware-runtime',
        label: 'Firmware Runtime',
        priority: 'required',
        description: 'Builds the embedded low-level code running on the microcontroller.',
        emptyGuidance: '[DROP_FIRMWARE_BUILDER_HERE]',
        compatibleCategories: ['IoT / Hardware', 'Backend']
      },
      {
        id: 'cloud-backend',
        label: 'IoT Cloud Gateway',
        priority: 'optional',
        description: 'Manages stream ingestion databases or device registry syncs.',
        emptyGuidance: '[DROP_CLOUD_INGESTION_OPTIONAL]',
        compatibleCategories: ['Backend', 'Hosting / Infra']
      },
      {
        id: 'dashboard-mobile',
        label: 'Telemetry Dashboard',
        priority: 'optional',
        description: 'Displays active sensor values to clients through web or mobile grids.',
        emptyGuidance: '[DROP_DASHBOARD_UI_OPTIONAL]',
        compatibleCategories: ['Frontend', 'Mobile']
      },
      {
        id: 'ai-edge',
        label: 'Edge Machine Learning',
        priority: 'optional',
        description: 'Executes neural classification or computer vision directly on the hardware.',
        emptyGuidance: '[DROP_TENSORFLOW_LITE_OPTIONAL]',
        compatibleCategories: ['AI / ML']
      },
      {
        id: 'power-management',
        label: 'Power Management',
        priority: 'optional',
        description: 'Controls sleep cycles, battery gauges, or charge regulators.',
        emptyGuidance: '[DROP_BATTERY_SYSTEM_OPTIONAL]',
        compatibleCategories: ['IoT / Hardware']
      },
      {
        id: 'data-storage',
        label: 'Edge Data Storage',
        priority: 'optional',
        description: 'Saves active sensory records locally inside SQLite db or flash card files.',
        emptyGuidance: '[DROP_LOCAL_STORAGE_OPTIONAL]',
        compatibleCategories: ['Database', 'IoT / Hardware']
      },
      {
        id: 'prototype-platform',
        label: 'CAD & Enclosure',
        priority: 'recommended',
        description: 'Prototypes physical housings using high-precision CAD modeling libraries.',
        emptyGuidance: '[DROP_CAD_PROTOTYPE_RECOMMENDED]',
        compatibleCategories: ['IoT / Hardware', 'Design / UI']
      }
    ]
  },
  'marketplace': {
    solutionId: 'marketplace',
    solutionName: 'Trading Marketplace',
    slots: [
      {
        id: 'frontend',
        label: 'Buyer Frontend',
        priority: 'required',
        description: 'Builds the product grid, listing search, and checkout interface.',
        emptyGuidance: '[DROP_FRONTEND_UI_HERE]',
        compatibleCategories: ['Frontend', 'Design / UI']
      },
      {
        id: 'backend',
        label: 'Escrow Backend',
        priority: 'required',
        description: 'Manages automated ledger commissions, user trust scores, and listing hooks.',
        emptyGuidance: '[DROP_BACKEND_CONTROLLER_HERE]',
        compatibleCategories: ['Backend', 'Realtime / Messaging']
      },
      {
        id: 'database',
        label: 'Transaction Ledger',
        priority: 'required',
        description: 'Saves secure buyer histories, ledger listings, and reviews.',
        emptyGuidance: '[DROP_DATABASE_ENGINE_HERE]',
        compatibleCategories: ['Database']
      },
      {
        id: 'auth',
        label: 'Tenant Verification',
        priority: 'recommended',
        description: 'Protects buyer and vendor accounts from malicious spoofing attempts.',
        emptyGuidance: '[DROP_AUTH_GATE_RECOMMENDED]',
        compatibleCategories: ['Authentication']
      },
      {
        id: 'payments',
        label: 'Multi-party Billing',
        priority: 'required',
        description: 'Splits commissions between vendor accounts and system operators.',
        emptyGuidance: '[DROP_SPLIT_PAYMENTS_HERE]',
        compatibleCategories: ['Payments']
      },
      {
        id: 'maps-discovery',
        label: 'Geospatial Discovery',
        priority: 'optional',
        description: 'Plots local vendors or shipping routes dynamically inside visual maps.',
        emptyGuidance: '[DROP_GEO_LOCATION_API_OPTIONAL]',
        compatibleCategories: ['Productivity APIs']
      },
      {
        id: 'realtime-chat',
        label: 'Negotiation Chat',
        priority: 'optional',
        description: 'Binds peer-to-peer negotiation instant messaging channels.',
        emptyGuidance: '[DROP_CHAT_SOCKET_OPTIONAL]',
        compatibleCategories: ['Realtime / Messaging']
      },
      {
        id: 'recommendation-engine',
        label: 'Product Matchmaker',
        priority: 'optional',
        description: 'Triggers related product recommendations based on search history.',
        emptyGuidance: '[DROP_MATCHMAKER_AI_OPTIONAL]',
        compatibleCategories: ['AI / ML', 'Backend']
      },
      {
        id: 'hosting',
        label: 'Deployment & Edge CDN',
        priority: 'required',
        description: 'Hosts transaction servers across global edge database networks.',
        emptyGuidance: '[DROP_CDN_INFRA_HOSTING_HERE]',
        compatibleCategories: ['Hosting / Infra', 'DevOps']
      },
      {
        id: 'analytics',
        label: 'Conversion Analytics',
        priority: 'optional',
        description: 'Measures funnel performance, shopping cart drops, and average cart size.',
        emptyGuidance: '[DROP_FUNNEL_ANALYTICS_OPTIONAL]',
        compatibleCategories: ['Analytics']
      }
    ]
  },
  'platform': {
    solutionId: 'platform',
    solutionName: 'Service Platform / SaaS',
    slots: [
      {
        id: 'frontend',
        label: 'User Console Portal',
        priority: 'required',
        description: 'Renders the primary multi-tenant management dashboard and settings interface.',
        emptyGuidance: '[DROP_SAAS_CONSOLE_UI_HERE]',
        compatibleCategories: ['Frontend', 'Design / UI']
      },
      {
        id: 'backend',
        label: 'API Core Services',
        priority: 'required',
        description: 'Orchestrates high-concurrency business logic pipelines.',
        emptyGuidance: '[DROP_API_SERVICES_BACKEND_HERE]',
        compatibleCategories: ['Backend', 'Realtime / Messaging']
      },
      {
        id: 'database',
        label: 'Multi-tenant DB',
        priority: 'required',
        description: 'Isolates secure database records safely across customer profiles.',
        emptyGuidance: '[DROP_ISOLATED_DB_HERE]',
        compatibleCategories: ['Database']
      },
      {
        id: 'auth',
        label: 'SSO & IAM Portal',
        priority: 'recommended',
        description: 'Integrates Single Sign-On, SAML bindings, and granular permission access controls.',
        emptyGuidance: '[DROP_SSO_IAM_GATEWAY_RECOMMENDED]',
        compatibleCategories: ['Authentication']
      },
      {
        id: 'billing',
        label: 'Metered Subscription Billing',
        priority: 'required',
        description: 'Manages usage-based metered billing accounts, tax reporting, and invoices.',
        emptyGuidance: '[DROP_SUBSCRIPTION_BILLING_HERE]',
        compatibleCategories: ['Payments']
      },
      {
        id: 'admin-dashboard',
        label: 'Operator Administration',
        priority: 'optional',
        description: 'Grants platform operators customer-impersonation dashboard utilities.',
        emptyGuidance: '[DROP_OPERATOR_CONSOLE_OPTIONAL]',
        compatibleCategories: ['Frontend', 'Design / UI']
      },
      {
        id: 'analytics',
        label: 'Usage Analytics Ledger',
        priority: 'optional',
        description: 'Aggregates tenant API consumption rates for billing calculation.',
        emptyGuidance: '[DROP_BILLING_LEDGER_ANALYTICS_OPTIONAL]',
        compatibleCategories: ['Analytics']
      },
      {
        id: 'automation',
        label: 'Automation / Webhooks',
        priority: 'optional',
        description: 'Dispatches custom event webhooks and automated workflow notifications.',
        emptyGuidance: '[DROP_WORKFLOW_AUTOMATION_OPTIONAL]',
        compatibleCategories: ['Automation', 'Productivity APIs']
      },
      {
        id: 'hosting',
        label: 'Elastic Cloud Scaler',
        priority: 'required',
        description: 'Deploys application servers into elastic auto-scaling load balancers.',
        emptyGuidance: '[DROP_CLOUD_SCALER_INFRA_HERE]',
        compatibleCategories: ['Hosting / Infra', 'DevOps']
      },
      {
        id: 'monitoring',
        label: 'Telemetry Monitoring',
        priority: 'optional',
        description: 'Tracks memory utilization thresholds, error budgets, and runtime latencies.',
        emptyGuidance: '[DROP_TELEMETRY_MONITOR_OPTIONAL]',
        compatibleCategories: ['DevOps', 'Hosting / Infra', 'Analytics']
      }
    ]
  }
};

---
inclusion: manual
---

# AWS Knowledge Skill

## Description

Provides AWS service explanations, architecture examples, best practices, and learning content structure for the AWS Learning Flash Cards application.

## AWS Service Reference

### Fundamentals
- **Cloud Concepts**: Pay-as-you-go model, elasticity, high availability, fault tolerance, global infrastructure
- **Regions**: Geographic areas containing multiple Availability Zones (e.g., us-east-1, eu-west-1)
- **Availability Zones**: Isolated data centers within a Region, connected by low-latency links
- **Shared Responsibility Model**: AWS manages security *of* the cloud; customers manage security *in* the cloud

### Compute
- **EC2**: Virtual machines in the cloud. Key concepts: instance types, AMIs, security groups, key pairs, Auto Scaling, placement groups
- **Lambda**: Serverless functions. Key concepts: event-driven, 15-min timeout, cold starts, layers, concurrency limits
- **Elastic Beanstalk**: PaaS for deploying web apps. Manages EC2, load balancers, Auto Scaling automatically

### Storage
- **S3**: Object storage. Key concepts: buckets, objects, versioning, lifecycle policies, storage classes (Standard, IA, Glacier), presigned URLs
- **EBS**: Block storage for EC2. Key concepts: volume types (gp3, io2, st1, sc1), snapshots, encryption, multi-attach
- **EFS**: Managed NFS file system. Key concepts: shared access across multiple EC2s, elastic scaling, POSIX-compliant

### Databases
- **RDS**: Managed relational databases (MySQL, PostgreSQL, Oracle, SQL Server). Key concepts: Multi-AZ, read replicas, automated backups
- **DynamoDB**: Fully managed NoSQL. Key concepts: partition keys, sort keys, GSIs, LSIs, on-demand vs provisioned capacity, DynamoDB Streams
- **Aurora**: AWS-native relational DB. Key concepts: MySQL/PostgreSQL compatible, 6-way replication, Aurora Serverless, Global Database

### Networking
- **VPC**: Isolated virtual network. Key concepts: CIDR blocks, public/private subnets, Internet Gateway, NAT Gateway, VPC peering
- **Subnets**: Subdivisions of a VPC. Public subnets have route to IGW; private subnets route through NAT
- **Security Groups**: Stateful virtual firewall for EC2. Inbound/outbound rules by port, protocol, source/destination
- **Route 53**: DNS service. Key concepts: hosted zones, record types (A, CNAME, Alias), routing policies (latency, failover, weighted, geolocation)

### Security
- **IAM**: Identity and access management. Key concepts: users, groups, roles, policies (identity-based, resource-based), least privilege, STS, assume role
- **KMS**: Key management service. Key concepts: CMKs, data key encryption, envelope encryption, key rotation, grants
- **Cognito**: User identity for apps. Key concepts: User Pools (authentication), Identity Pools (AWS credential federation), JWT tokens

### Serverless
- **Lambda**: See Compute above
- **API Gateway**: Managed API front door. Key concepts: REST vs HTTP vs WebSocket APIs, stages, throttling, authorizers, Lambda proxy integration
- **EventBridge**: Serverless event bus. Key concepts: event buses, rules, targets, event patterns, scheduled rules (cron)

### AI Services
- **Amazon Bedrock**: Fully managed GenAI service. Key concepts: foundation models (Claude, Titan, Llama), API-based inference, model invocation, prompt engineering, guardrails
- **SageMaker**: ML platform. Key concepts: notebooks, training jobs, endpoints, pipelines, Feature Store, Model Monitor

## Flash Card Difficulty Guidelines

| Level | Description | Example topic |
|---|---|---|
| `easy` | Core concept, single-sentence definition | "What is S3?" |
| `medium` | Requires understanding trade-offs or comparisons | "When would you use EFS over EBS?" |
| `hard` | Architectural decision, multi-service integration, edge case | "Design a multi-region active-active RDS setup" |

## Real-World Scenario Templates

When generating flash card scenarios, use these patterns:
- **Cost optimization**: "A startup wants to store 10TB of infrequently accessed logs at minimum cost..."
- **High availability**: "An e-commerce site must handle Black Friday traffic spikes without downtime..."
- **Security**: "A healthcare company must encrypt all data at rest and in transit and audit all access..."
- **Migration**: "A company is moving their on-premises MySQL database to AWS..."

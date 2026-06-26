-- Migration: seed_topics
-- Seeds the 8 AWS topic categories with all required service entries.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

BEGIN;

INSERT INTO aws_topics (category, service_name, description, difficulty) VALUES

-- Fundamentals
('Fundamentals', 'Cloud Concepts',
 'Core principles of cloud computing including pay-as-you-go, elasticity, high availability, fault tolerance, and the AWS global infrastructure model.',
 'easy'),
('Fundamentals', 'Regions',
 'Geographic areas that contain multiple isolated Availability Zones, allowing deployment closer to end users and enabling data residency compliance.',
 'easy'),
('Fundamentals', 'Availability Zones',
 'Isolated data centers within a Region connected by low-latency links, enabling fault-tolerant and highly available architectures.',
 'easy'),
('Fundamentals', 'Shared Responsibility Model',
 'Security framework defining what AWS manages (security of the cloud) versus what customers manage (security in the cloud).',
 'medium'),

-- Compute
('Compute', 'EC2',
 'Elastic Compute Cloud — virtual machines in the cloud. Covers instance types, AMIs, Auto Scaling, placement groups, and pricing models.',
 'medium'),
('Compute', 'Lambda',
 'Serverless compute that runs code in response to events. Covers cold starts, concurrency, layers, timeouts, and event source mappings.',
 'medium'),
('Compute', 'Elastic Beanstalk',
 'PaaS that automatically manages EC2, load balancers, Auto Scaling, and deployments for web applications.',
 'easy'),

-- Storage
('Storage', 'S3',
 'Simple Storage Service — object storage with 11 9s durability. Covers storage classes, lifecycle policies, versioning, presigned URLs, and access control.',
 'medium'),
('Storage', 'EBS',
 'Elastic Block Store — persistent block storage volumes for EC2. Covers volume types (gp3, io2), snapshots, encryption, and multi-attach.',
 'medium'),
('Storage', 'EFS',
 'Elastic File System — managed NFS file system that scales automatically and supports concurrent access from multiple EC2 instances.',
 'medium'),

-- Databases
('Databases', 'RDS',
 'Relational Database Service — managed databases for MySQL, PostgreSQL, Oracle, and SQL Server. Covers Multi-AZ, read replicas, and automated backups.',
 'medium'),
('Databases', 'DynamoDB',
 'Fully managed NoSQL database with single-digit millisecond performance. Covers partition keys, GSIs, on-demand capacity, and DynamoDB Streams.',
 'hard'),
('Databases', 'Aurora',
 'AWS-native relational database compatible with MySQL and PostgreSQL. Features 6-way replication, Aurora Serverless, and Global Database.',
 'hard'),

-- Networking
('Networking', 'VPC',
 'Virtual Private Cloud — logically isolated network in AWS. Covers CIDR blocks, Internet Gateway, NAT Gateway, VPC peering, and flow logs.',
 'hard'),
('Networking', 'Subnets',
 'Subdivisions of a VPC. Public subnets route to an Internet Gateway; private subnets use a NAT Gateway for outbound internet access.',
 'medium'),
('Networking', 'Security Groups',
 'Stateful virtual firewall for EC2 and other resources. Rules defined by port, protocol, and source/destination IP or security group.',
 'medium'),
('Networking', 'Route 53',
 'Scalable DNS service. Covers hosted zones, record types (A, CNAME, Alias), routing policies (latency, failover, weighted, geolocation), and health checks.',
 'hard'),

-- Security
('Security', 'IAM',
 'Identity and Access Management — users, groups, roles, and policies. Covers least privilege, policy evaluation logic, STS, and cross-account access.',
 'hard'),
('Security', 'KMS',
 'Key Management Service — managed cryptographic keys. Covers CMKs, envelope encryption, key rotation, grants, and integration with other AWS services.',
 'hard'),
('Security', 'Cognito',
 'User identity for applications. User Pools handle authentication; Identity Pools federate AWS credentials. Covers JWT tokens and social identity providers.',
 'medium'),

-- Serverless
('Serverless', 'Lambda',
 'Serverless compute reviewed in the context of serverless architectures — event-driven patterns, SAM, and integration with API Gateway and EventBridge.',
 'medium'),
('Serverless', 'API Gateway',
 'Managed API front door. Covers REST, HTTP, and WebSocket APIs; stages; throttling; Lambda proxy integration; and custom authorizers.',
 'medium'),
('Serverless', 'EventBridge',
 'Serverless event bus for event-driven architectures. Covers event buses, rules, targets, event patterns, and scheduled rules (cron expressions).',
 'medium'),

-- AI Services
('AI Services', 'Amazon Bedrock',
 'Fully managed service for accessing foundation models (Claude, Titan, Llama) via API. Covers model invocation, prompt engineering, and guardrails.',
 'medium'),
('AI Services', 'SageMaker',
 'Comprehensive ML platform. Covers notebooks, training jobs, model endpoints, pipelines, Feature Store, and Model Monitor.',
 'hard')

ON CONFLICT DO NOTHING;

COMMIT;

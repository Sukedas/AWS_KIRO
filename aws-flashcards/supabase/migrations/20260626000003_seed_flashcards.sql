-- Migration: seed_flashcards
-- Seeds starter flash cards for key AWS topics.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

BEGIN;

-- ─── Helper: insert flash cards by topic name ─────────────────────────────────
-- We look up topic IDs dynamically so this migration is portable.

-- EC2 flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is Amazon EC2?',
   'A web service that provides resizable compute capacity in the cloud as virtual machines.',
   'EC2 (Elastic Compute Cloud) lets you rent virtual servers called instances. You choose the OS, CPU, memory, and storage. You pay only for what you use.',
   'easy', 'Compute', 'EC2',
   'A startup needs a web server but does not want to buy physical hardware. They launch an EC2 t3.micro instance and deploy their app in minutes.',
   ARRAY['https://docs.aws.amazon.com/ec2/latest/userguide/concepts.html']),

  ('What is an EC2 instance type?',
   'A configuration defining the CPU, memory, storage, and networking capacity of a virtual machine.',
   'Instance types are grouped into families: General Purpose (t3, m6i), Compute Optimized (c6i), Memory Optimized (r6i), Storage Optimized (i3). Choose based on your workload.',
   'easy', 'Compute', 'EC2',
   'A data analytics company needs high memory for in-memory processing. They select r6i.4xlarge to maximize RAM efficiency.',
   ARRAY['https://docs.aws.amazon.com/ec2/latest/userguide/instance-types.html']),

  ('What is an AMI?',
   'An Amazon Machine Image — a template containing the OS, application server, and applications used to launch EC2 instances.',
   'AMIs capture the state of a configured instance including the root volume snapshot, permissions, and block device mappings. You can create custom AMIs to launch pre-configured instances.',
   'medium', 'Compute', 'EC2',
   'A company wants all new web servers pre-configured with their app and security settings. They create a golden AMI and use it for all Auto Scaling launches.',
   ARRAY['https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'EC2' AND t.category = 'Compute'
ON CONFLICT DO NOTHING;

-- S3 flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is Amazon S3?',
   'A scalable object storage service that stores data as objects in buckets with 99.999999999% (11 nines) durability.',
   'S3 stores any amount of data as objects (files) inside buckets (containers). Objects can be up to 5TB each. S3 is designed for 99.99% availability and 11 nines durability.',
   'easy', 'Storage', 'S3',
   'A media company stores millions of user-uploaded images. They use S3 Standard for frequently accessed images and S3 Glacier for archived media older than 1 year.',
   ARRAY['https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html']),

  ('What are S3 storage classes?',
   'Different tiers of storage with varying cost and retrieval speed tradeoffs: Standard, Intelligent-Tiering, Standard-IA, One Zone-IA, Glacier Instant, Glacier Flexible, Glacier Deep Archive.',
   'Choose storage class based on access frequency. Standard for frequent access, Standard-IA for infrequent access with millisecond retrieval, Glacier for archival. Intelligent-Tiering moves objects automatically.',
   'medium', 'Storage', 'S3',
   'A compliance team must retain audit logs for 7 years but rarely accesses them. They use S3 Glacier Deep Archive at ~$0.00099/GB/month — the cheapest AWS storage option.',
   ARRAY['https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html']),

  ('What is an S3 bucket policy?',
   'A resource-based IAM policy attached to an S3 bucket that controls access from specific principals, IP ranges, or conditions.',
   'Bucket policies use JSON to grant or deny access. Unlike ACLs, they support conditions (IP, VPC endpoint, MFA, time). Required for cross-account access. Evaluated alongside identity-based IAM policies.',
   'hard', 'Storage', 'S3',
   'A company wants to allow only their VPC to access an S3 bucket. They add a bucket policy with a condition: aws:SourceVpc equals their VPC ID and deny all other access.',
   ARRAY['https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'S3' AND t.category = 'Storage'
ON CONFLICT DO NOTHING;

-- IAM flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is the principle of least privilege in IAM?',
   'Granting only the minimum permissions required to perform a task — no more, no less.',
   'Least privilege reduces the blast radius of compromised credentials. Start with zero permissions and add only what is needed. Use IAM Access Analyzer to identify overly permissive policies.',
   'medium', 'Security', 'IAM',
   'A Lambda function only needs to read from one DynamoDB table. Instead of giving it AmazonDynamoDBFullAccess, you attach a custom policy with only dynamodb:GetItem and dynamodb:Query on that specific table ARN.',
   ARRAY['https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html']),

  ('What is an IAM role?',
   'An IAM identity that can be assumed by services, users, or applications to gain temporary security credentials.',
   'Roles use STS to issue short-lived credentials. EC2 instance roles let apps access AWS services without hardcoded keys. Cross-account roles enable access across AWS accounts.',
   'medium', 'Security', 'IAM',
   'A Lambda function needs to write to S3. Instead of embedding AWS keys in code, you attach an IAM execution role with s3:PutObject permission. Lambda assumes the role automatically.',
   ARRAY['https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html']),

  ('What is the difference between an IAM policy and an IAM role?',
   'A policy is a document defining permissions; a role is an identity that uses policies and can be assumed by principals.',
   'Policies (identity-based or resource-based) define what actions are allowed or denied. Roles bundle one or more policies and add a trust policy defining who can assume the role. You attach policies to roles, users, or groups.',
   'hard', 'Security', 'IAM',
   'An EC2 instance (the principal) assumes a role (the identity) that has an S3 read policy (the permission document) attached. The role is the bridge between the EC2 instance and the S3 permission.',
   ARRAY['https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'IAM' AND t.category = 'Security'
ON CONFLICT DO NOTHING;

-- Lambda flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is AWS Lambda?',
   'A serverless compute service that runs code in response to events without managing servers.',
   'Lambda automatically scales from zero to thousands of concurrent executions. You pay only for compute time consumed (billed per 1ms). Max timeout is 15 minutes; max memory is 10GB.',
   'easy', 'Serverless', 'Lambda',
   'An e-commerce site triggers a Lambda function on every S3 image upload to generate thumbnails. Lambda scales automatically during flash sales with no server management needed.',
   ARRAY['https://docs.aws.amazon.com/lambda/latest/dg/welcome.html']),

  ('What is a Lambda cold start?',
   'The initialization latency when Lambda creates a new execution environment to handle an invocation.',
   'Cold starts occur when there is no warm execution environment available. They add 100ms–1s+ of latency depending on runtime and package size. Mitigation: provisioned concurrency, smaller packages, avoid VPC when possible.',
   'medium', 'Serverless', 'Lambda',
   'A trading platform uses Lambda for order processing and cannot tolerate cold start latency. They enable provisioned concurrency to keep 10 pre-warmed instances ready at all times.',
   ARRAY['https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'Lambda' AND t.category = 'Compute'
ON CONFLICT DO NOTHING;

-- VPC flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is a VPC?',
   'A Virtual Private Cloud — a logically isolated section of the AWS cloud where you define your own IP address range, subnets, route tables, and network gateways.',
   'VPCs give you full control over your virtual network. You can create public and private subnets, configure routing, and use security groups and NACLs to control traffic.',
   'medium', 'Networking', 'VPC',
   'A bank wants to deploy a multi-tier app with a public web layer and a private database layer. They create a VPC with public subnets for ALBs and private subnets for RDS, with no direct internet access to the database.',
   ARRAY['https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html']),

  ('What is the difference between a public and private subnet?',
   'A public subnet has a route to an Internet Gateway; a private subnet does not have direct internet access.',
   'Resources in public subnets (like load balancers) can receive inbound internet traffic. Resources in private subnets (like databases) communicate via NAT Gateway for outbound internet access only.',
   'medium', 'Networking', 'VPC',
   'A 3-tier web app places the web servers in public subnets, the app servers in private subnets, and the RDS database in isolated subnets with no route to the internet at all.',
   ARRAY['https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'VPC' AND t.category = 'Networking'
ON CONFLICT DO NOTHING;

-- Amazon Bedrock flash cards
INSERT INTO flash_cards (topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links)
SELECT
  t.id,
  q.question, q.answer, q.explanation, q.difficulty::text, q.aws_category, q.aws_service,
  q.real_world_scenario, false, q.documentation_links
FROM aws_topics t
JOIN (VALUES
  ('What is Amazon Bedrock?',
   'A fully managed service that provides access to foundation models (FMs) from AWS and third-party providers via a single API.',
   'Bedrock lets you build GenAI apps without managing ML infrastructure. Supported models include Anthropic Claude, Meta Llama, Amazon Titan, and others. It includes features like Bedrock Agents, Knowledge Bases, and Guardrails.',
   'medium', 'AI Services', 'Amazon Bedrock',
   'A company wants to add a customer-support chatbot to their app. They use Bedrock with Claude via the InvokeModel API and Bedrock Guardrails to filter inappropriate content — no ML team required.',
   ARRAY['https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html'])
) AS q(question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, documentation_links)
ON t.service_name = 'Amazon Bedrock' AND t.category = 'AI Services'
ON CONFLICT DO NOTHING;

COMMIT;

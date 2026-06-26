# Requirements Document

## Introduction

The AWS Learning Flash Cards application is an AI-powered educational platform that helps users learn AWS concepts through interactive flash cards enhanced with Generative AI. The platform organizes AWS content into structured topic categories, provides an interactive study experience with card flip mechanics, tracks individual learning progress, and integrates Amazon Bedrock to generate contextual explanations, practice questions, and personalized study recommendations. The system is built on a React/Next.js frontend, Supabase backend (PostgreSQL, Auth, RLS), and exposes AI capabilities through a secure server-side API layer.

---

## Glossary

- **Application**: The AWS Learning Flash Cards web application as a whole.
- **User**: An authenticated individual using the Application to study AWS concepts.
- **Guest**: An unauthenticated visitor accessing the Application.
- **Flash Card**: A study unit containing a question, answer, explanation, AWS service reference, difficulty level, real-world scenario, and optional AI-generated hints.
- **Deck**: A collection of Flash Cards grouped under a specific AWS Topic.
- **AWS Topic**: A subject area within an AWS category (e.g., EC2 within Compute).
- **Category**: A top-level grouping of AWS Topics (e.g., Compute, Storage, Security).
- **Knowledge Level**: A User-assigned rating for a Flash Card — one of: `easy`, `medium`, or `hard`.
- **Study Session**: A continuous period during which the User reviews Flash Cards from one or more Decks.
- **Progress Record**: A database entry tracking a User's completion status, score, and last review date for a specific Flash Card.
- **AI Service**: The server-side component that communicates with Amazon Bedrock (or fallback GenAI provider) to generate content.
- **Auth Service**: The Supabase authentication component managing User identity and sessions.
- **Dashboard**: The post-login screen displaying the User's overall learning statistics and recommended next topics.
- **Quiz**: A timed or untimed assessment mode that presents Flash Cards and evaluates User responses.
- **AI Chat**: An in-app conversational interface where the User can ask the AI Service questions about AWS concepts.
- **RLS**: Row-Level Security — Supabase PostgreSQL policies restricting data access to authorized Users.
- **Bedrock_Client**: The application module that communicates with Amazon Bedrock.
- **Supabase_Client**: The application module that communicates with the Supabase backend.
- **Router**: The Next.js routing component managing page navigation.
- **Validator**: The input validation module that checks data integrity before persistence or AI processing.
- **Prompt_Builder**: The module responsible for constructing structured prompts sent to the AI Service.
- **Progress_Tracker**: The module that records and aggregates Progress Records for a User.
- **Card_Generator**: The AI Service sub-module that produces new Flash Cards on demand.
- **Hint_Generator**: The AI Service sub-module that produces contextual hints for a Flash Card.
- **Question_Generator**: The AI Service sub-module that produces practice questions for an AWS Topic.
- **Recommendation_Engine**: The AI Service sub-module that suggests next AWS Topics based on Progress Records.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a Guest, I want to register and log in with my email and password, so that my progress and settings are securely stored and accessible across sessions.

#### Acceptance Criteria

1. THE Auth_Service SHALL support user registration with a unique email address of at most 254 characters and a password between 8 and 128 characters (inclusive).
2. WHEN a Guest submits valid registration credentials, THE Auth_Service SHALL create a User account and issue a session token valid for 24 hours from issuance.
3. IF a Guest submits a registration request with an email address already associated with an existing account, THEN THE Auth_Service SHALL return an error indicating the email is already in use.
4. WHEN a registered User submits valid login credentials, THE Auth_Service SHALL authenticate the User and issue a session token valid for 24 hours from issuance.
5. IF a User submits incorrect login credentials, THEN THE Auth_Service SHALL return an authentication error without revealing which field is incorrect.
6. WHEN an authenticated User requests logout, THE Auth_Service SHALL invalidate the active session token; IF session token invalidation fails, THE Auth_Service SHALL abort the logout operation, leaving the User's account data and active session state unchanged.
7. WHEN a User's session token expires or is invalidated, THE Auth_Service SHALL reject any subsequent protected-resource request with an authentication error and require the User to re-authenticate.
8. WHEN a non-HTTPS authentication request is received, THE Auth_Service SHALL reject the request and return an error indicating that a secure connection is required.
9. THE Auth_Service SHALL enforce HTTPS for all authentication requests.

---

### Requirement 2: User Profile Management

**User Story:** As a User, I want to view and update my profile information, so that the Application reflects my identity and learning level accurately.

#### Acceptance Criteria

1. THE Application SHALL store a User profile containing: id (UUID), username (text), email (text), learning_level (text), and created_at (timestamp).
2. WHEN a User creates an account, THE Application SHALL set the default learning_level to `beginner`.
3. WHEN a User submits a profile update containing one or more valid fields, THE Supabase_Client SHALL persist each valid field independently; fields that fail validation SHALL be skipped without affecting the persistence of valid fields.
4. IF a User submits a profile update with a username that is not a string, or a username containing fewer than 3 or more than 50 characters, THEN THE Validator SHALL reject the username field and return a descriptive validation error message; non-string values SHALL be rejected before length constraints are checked.
5. IF a User submits a profile update with a learning_level value that is not one of `beginner`, `intermediate`, or `advanced`, THEN THE Validator SHALL reject the learning_level field and return a descriptive validation error message.
6. WHILE a User is authenticated, THE Application SHALL display the User's username and current learning_level on the Dashboard.
7. WHEN a User submits a profile update and all supplied fields fail validation, THE Supabase_Client SHALL not issue a database write and THE Application SHALL display the validation errors to the User.

---

### Requirement 3: AWS Topic and Category Browsing

**User Story:** As a User, I want to browse AWS topics organized by category, so that I can find and study the AWS concepts relevant to my learning goals.

#### Acceptance Criteria

1. THE Application SHALL organize AWS Topics under the following categories: Fundamentals, Compute, Storage, Databases, Networking, Security, Serverless, and AI Services.
2. THE Application SHALL include at minimum the following AWS Topics per category:
   - Fundamentals: Cloud Concepts, Regions, Availability Zones, Shared Responsibility Model
   - Compute: EC2, Lambda, Elastic Beanstalk
   - Storage: S3, EBS, EFS
   - Databases: RDS, DynamoDB, Aurora
   - Networking: VPC, Subnets, Security Groups, Route 53
   - Security: IAM, KMS, Cognito
   - Serverless: Lambda, API Gateway, EventBridge
   - AI Services: Amazon Bedrock, SageMaker
3. WHEN a User navigates to the Topic Browser with no Category filter active, THE Application SHALL display all Categories and their associated AWS Topics.
4. WHEN a User selects a Category, THE Application SHALL display only the AWS Topics belonging to that Category and hide AWS Topics belonging to all other Categories.
5. WHEN a User enters a search query of at least 2 characters in the Topic Browser, THE Application SHALL display only the AWS Topics whose name or description contains the query string (case-insensitive), scoped to the active Category filter if one is selected, otherwise across all Categories.
6. WHEN a User enters a search query of fewer than 2 characters in the Topic Browser, THE Application SHALL display a message indicating the query is too short and restore the Topic listing to its pre-query state.
7. IF no AWS Topics match a search query of at least 2 characters, THEN THE Application SHALL display a message indicating no results were found.
8. WHILE a User is authenticated, THE Application SHALL display the User's completion percentage for each AWS Topic inline with its listing entry; WHEN an AWS Topic contains zero Flash Cards, THE Application SHALL display 0% completion for that Topic.
9. WHEN an unauthenticated Guest views the Topic Browser, THE Application SHALL display AWS Topics without completion percentages.

---

### Requirement 4: Flash Card Study Experience

**User Story:** As a User, I want to study AWS flash cards with an interactive flip mechanic, so that I can actively recall information and reinforce my learning.

#### Acceptance Criteria

1. WHEN a User starts a Study Session for an AWS Topic, THE Application SHALL present Flash Cards from that Topic's Deck in sequence, starting from the first card.
2. THE Application SHALL display the question side of each Flash Card by default when it is first presented in a Study Session.
3. WHEN a User triggers the flip action on a Flash Card showing the question side, THE Application SHALL reveal the answer and explanation on the reverse side; WHEN a User triggers the flip action on a Flash Card showing the answer side, THE Application SHALL return it to the question side.
4. WHEN a Flash Card is displaying the answer side, THE Application SHALL present the options to rate the Flash Card with a Knowledge Level of `easy`, `medium`, or `hard`; the Knowledge Level SHALL remain unassigned until the User actively selects one of those options.
5. WHEN a User assigns a Knowledge Level to a Flash Card, THE Progress_Tracker SHALL update the Progress Record for that User and Flash Card with the new Knowledge Level and the current UTC review date, then advance the Study Session to the next card.
6. WHEN a User marks a Flash Card as `hard`, THE Application SHALL add that Flash Card to a repeat queue for review at the end of the current Study Session; each Flash Card SHALL appear in the repeat queue at most once per Study Session regardless of how many times it is rated `hard`.
7. WHEN all Flash Cards in a Deck have been reviewed in the initial pass and the repeat queue is not empty, THE Application SHALL present the Flash Cards in the repeat queue for a second review pass.
8. WHEN a Study Session is completed (all initial and repeat-queue cards reviewed), THE Application SHALL display a summary screen showing: total cards reviewed, count and percentage of each Knowledge Level (`easy`, `medium`, `hard`), and number of cards that entered the repeat queue.
9. WHILE a Study Session is active, THE Application SHALL display the current card index and the total number of cards in the current pass (e.g., "Card 3 of 20") updated in real-time as the User progresses.
10. IF a Flash Card contains AI-generated hints, THEN THE Application SHALL display a "Hint" button on the question side that reveals those hints on demand without triggering the flip action.

---

### Requirement 5: Flash Card Content Structure

**User Story:** As a User, I want each flash card to contain comprehensive information including real-world scenarios and documentation links, so that I can deeply understand each AWS concept.

#### Acceptance Criteria

1. THE Application SHALL store each Flash Card with the following fields: id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated (boolean flag), and documentation_links (array of URLs).
2. THE Validator SHALL reject any Flash Card that is missing the question, answer, explanation, difficulty, or aws_category fields.
3. THE Application SHALL display the content of a Flash Card (question on front, answer and explanation on back) whenever a Flash Card is displayed, regardless of whether a formal Study Session is active.
4. WHERE documentation_links are present on a Flash Card, THE Application SHALL render each link as a clickable element that opens the URL in a new browser tab.
5. WHEN a Flash Card has the ai_generated flag set to true, THE Application SHALL display a visual indicator identifying the card as AI-generated content.

---

### Requirement 6: Search and Filter in Study Mode

**User Story:** As a User, I want to search and filter flash cards by AWS category or difficulty, so that I can focus my study sessions on specific areas.

#### Acceptance Criteria

1. WHEN a User applies a Category filter in the Topic Browser or Study Mode, THE Application SHALL display only Flash Cards belonging to the selected Category.
2. WHEN a User applies a Difficulty filter, THE Application SHALL display only Flash Cards matching the selected difficulty level (`easy`, `medium`, or `hard`).
3. WHEN a User applies both a Category filter and a Difficulty filter simultaneously, THE Application SHALL display only Flash Cards matching both criteria.
4. WHEN a User enters a search query of fewer than 2 characters in Study Mode, THE Application SHALL display a message indicating the query is too short and no results are shown.
5. WHEN a User enters a search query of at least 2 characters in Study Mode, THE Application SHALL filter the Flash Cards to those whose question or explanation contains the query string (case-insensitive).
6. IF no Flash Cards match the applied filters or search query, THEN THE Application SHALL display a message indicating no cards match the current filters while hiding the non-matching cards.
7. WHEN a User clears all filters and search queries, THE Application SHALL restore the full unfiltered Flash Card list.

---

### Requirement 7: Learning Progress Tracking

**User Story:** As a User, I want my learning progress tracked automatically, so that I can see how much I've covered and where I need more practice.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL create a Progress Record for each Flash Card a User reviews, storing: user_id, flash_card_id, completion_status, score, knowledge_level, and review_date.
2. WHEN a User completes a Study Session for a Deck, THE Progress_Tracker SHALL mark all reviewed Flash Cards in that Deck as `completed` in their Progress Records.
3. THE Progress_Tracker SHALL calculate the User's completion percentage for an AWS Topic as: (number of Flash Cards with completion_status `completed`) / (total Flash Cards in Topic) × 100, rounded to the nearest integer; WHEN an AWS Topic contains zero Flash Cards, THE Progress_Tracker SHALL return 0% completion for that Topic.
4. WHEN a User reviews a Flash Card that already has a Progress Record, THE Progress_Tracker SHALL update the existing record rather than create a duplicate.
5. THE Application SHALL identify a Flash Card as a "weak concept" for a User WHEN the User has reviewed that Flash Card at least twice AND the most recent Knowledge Level assignment is `hard`.

---

### Requirement 8: User Dashboard

**User Story:** As a User, I want a dashboard that shows my overall learning progress and recommendations, so that I can track my growth and know what to study next.

#### Acceptance Criteria

1. WHEN a User navigates to the Dashboard, THE Application SHALL display: overall progress percentage, number of completed AWS Topics, list of weak concepts, list of recommended next topics, and a summary of learning statistics.
2. THE Application SHALL calculate overall progress percentage as: (total Flash Cards marked `completed` across all Topics) / (total Flash Cards in the Application) × 100, rounded to the nearest integer.
3. THE Dashboard SHALL display a list of AWS Topics in which the User has at least one Flash Card marked as a weak concept.
4. WHILE a User is authenticated, THE Application SHALL display the date of the User's last Study Session on the Dashboard.
5. THE Application SHALL display learning statistics on the Dashboard including: total cards reviewed, total study sessions completed, and Knowledge Level distribution (percentage of `easy`, `medium`, `hard` ratings) where the three percentages sum to exactly 100%.

---

### Requirement 9: AI-Powered Flash Card Generation

**User Story:** As a User, I want the application to generate new flash cards using AI for any AWS topic, so that I have access to a continuously expanding set of study material.

#### Acceptance Criteria

1. WHEN a User requests AI-generated Flash Cards for an AWS Topic, THE Card_Generator SHALL invoke the AI Service with a structured prompt specifying the Topic, desired difficulty level, and number of cards.
2. WHEN the AI Service returns a valid response, THE Card_Generator SHALL parse the response into Flash Card objects conforming to the content structure defined in Requirement 5; IF parsing fails due to unexpected content structure within an otherwise valid JSON response, THE Card_Generator SHALL treat the failure as an invalid response and apply the error handling defined in AC6.
3. THE Card_Generator SHALL set the ai_generated flag to true on all Flash Cards it creates.
4. WHEN a User requests AI-generated Flash Cards and the AI Service is unavailable, THE Application SHALL display a descriptive error message and preserve any previously generated cards.
5. THE Prompt_Builder SHALL construct prompts that instruct the AI Service to produce Flash Cards in a defined JSON schema containing: question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, and documentation_links.
6. IF the AI Service returns a response that does not conform to the expected JSON schema, THEN THE Card_Generator SHALL log the malformed response and return an error to the requesting User.
7. THE Application SHALL allow a User to save AI-generated Flash Cards to a Deck for future study sessions.
8. FOR ALL valid AWS Topic inputs, THE Card_Generator parsing then serializing then parsing a generated Flash Card SHALL produce an equivalent Flash Card object (round-trip property).

---

### Requirement 10: AI Concept Explanation

**User Story:** As a User, I want to ask the AI to explain difficult AWS concepts in plain language, so that I can deepen my understanding beyond the flash card content.

#### Acceptance Criteria

1. WHEN a User submits an explanation request for a concept via the AI Chat interface, THE AI Service SHALL return an explanation within 15 seconds under normal operating conditions.
2. THE Prompt_Builder SHALL include the AWS Topic context, the User's current learning_level, and the specific concept text when constructing explanation prompts.
3. IF the AI Service returns an error for an explanation request, THEN THE Application SHALL display a descriptive error message and offer the User the option to retry; WHEN the AI Service returns both an explanation and an error simultaneously, THE Application SHALL display the explanation and suppress the error.
4. WHEN the AI Service returns an explanation, THE Application SHALL display the explanation in the AI Chat interface with a visual distinction from User messages.
5. THE Application SHALL retain the AI Chat conversation history for the duration of the current browser session.

---

### Requirement 11: AI Practice Question Generation

**User Story:** As a User, I want the AI to generate practice questions for AWS topics, so that I can test my knowledge before taking AWS certification exams.

#### Acceptance Criteria

1. WHEN a User requests practice questions for an AWS Topic, THE Question_Generator SHALL produce between 1 and 20 questions per request, as specified by the User.
2. THE Prompt_Builder SHALL instruct the AI Service to generate multiple-choice questions with 4 options each, one correct answer, and a brief explanation of the correct answer.
3. WHEN the AI Service returns valid practice questions, THE Application SHALL present them in a Quiz interface with options selectable by the User.
4. WHEN a User submits an answer in the Quiz interface, THE Application SHALL immediately display whether the answer is correct and show the explanation.
5. WHEN a Quiz is completed, THE Application SHALL display a score summary showing the number of correct answers out of total questions.
6. IF any failure occurs in the practice question generation process, including malformed AI data or other errors, THEN THE Question_Generator SHALL log the error and return a descriptive error message to the User.

---

### Requirement 12: AI Study Recommendations

**User Story:** As a User, I want the AI to recommend which AWS topics to study next based on my progress, so that I follow an optimal learning path.

#### Acceptance Criteria

1. WHEN a User requests study recommendations, THE Recommendation_Engine SHALL supply the AI Service with the User's Progress Records including completion percentages and weak concepts.
2. IF the User has no Progress Records OR has Progress Records showing 0% completion across all AWS Topics, THEN THE Recommendation_Engine SHALL recommend AWS Topics from the Fundamentals category as a starting point.
3. WHEN the AI Service returns a recommendation response, THE Recommendation_Engine SHALL parse and display a ranked list of at most 5 recommended AWS Topics with a brief rationale for each; WHEN the AI Service returns more than 5 recommendations, THE Recommendation_Engine SHALL display the top 5 and discard the remainder.
4. WHEN the AI Service is unavailable for recommendations, THE Application SHALL fall back to recommending the AWS Topic with the lowest completion percentage for the User.

---

### Requirement 13: AI-Generated Hints

**User Story:** As a User, I want AI-generated hints available during my study session, so that I can get contextual help without immediately revealing the answer.

#### Acceptance Criteria

1. WHEN a User requests a hint for a Flash Card, THE Hint_Generator SHALL invoke the AI Service with a prompt containing the Flash Card's question and AWS Topic context, without including the answer.
2. WHEN the AI Service returns a valid hint, THE Application SHALL display the hint in the Flash Card view without triggering the flip action; IF the AI Service returns an invalid or malformed hint, THE Application SHALL fall back to displaying any pre-stored hints from the Flash Card's data.
3. THE Application SHALL allow at most 3 hint requests per Flash Card per Study Session.
4. IF the AI Service is unavailable when a hint is requested, THEN THE Application SHALL display any pre-stored hints from the Flash Card's data and notify the User that AI hints are currently unavailable.
5. WHEN a hint is displayed, THE Application SHALL visually indicate how many hint requests remain for that Flash Card (e.g., "Hint 1 of 3").

---

### Requirement 14: Supabase Database Schema

**User Story:** As a developer, I want a well-structured database schema with security policies, so that user data is organized, performant, and protected.

#### Acceptance Criteria

1. THE Supabase_Client SHALL maintain the following tables: `users`, `aws_topics`, `flash_cards`, `progress`, and `ai_history`.
2. THE `users` table SHALL contain columns: id (UUID, primary key), username (text, unique), email (text, unique), learning_level (text), and created_at (timestamp).
3. THE `aws_topics` table SHALL contain columns: id (UUID, primary key), category (text), service_name (text), description (text), and difficulty (text).
4. THE `flash_cards` table SHALL contain columns: id (UUID, primary key), question (text), answer (text), explanation (text), difficulty (text), aws_category (text), aws_service (text), real_world_scenario (text), ai_generated (boolean), documentation_links (text array), and topic_id (UUID, foreign key referencing `aws_topics`).
5. THE `progress` table SHALL contain columns: id (UUID, primary key), user_id (UUID, foreign key referencing `users`), flash_card_id (UUID, foreign key referencing `flash_cards`), completion_status (text), score (integer), knowledge_level (text), and review_date (timestamp).
6. THE `ai_history` table SHALL contain columns: id (UUID, primary key), user_id (UUID, foreign key referencing `users`), prompt (text), response (text), request_type (text), and created_at (timestamp).
7. THE Supabase_Client SHALL enforce RLS policies so that a User can only read and write their own rows in the `progress` and `ai_history` tables.
8. THE Supabase_Client SHALL enforce RLS policies so that `aws_topics` and `flash_cards` are readable by all authenticated Users but writable only by service-role credentials.
9. WHEN a User's account is deleted, THE Supabase_Client SHALL attempt to cascade-delete all associated rows in the `progress` and `ai_history` tables; WHERE deletion of records in one table fails, THE Supabase_Client SHALL continue attempting deletion in the other table and SHALL report which deletions succeeded or failed.

---

### Requirement 15: AI Security and Prompt Safety

**User Story:** As a developer, I want the AI integration to be secure and resistant to prompt injection, so that the application cannot be misused to generate harmful or off-topic content.

#### Acceptance Criteria

1. THE AI Service SHALL only be invoked from server-side API routes, never directly from client-side browser code.
2. THE Prompt_Builder SHALL sanitize all User-supplied text before including it in any prompt sent to the AI Service.
3. THE Prompt_Builder SHALL include a system-level instruction in every prompt that restricts the AI Service to responding only about AWS and cloud computing topics.
4. IF the AI Service returns a response that contains content outside the AWS/cloud computing domain as detected by a server-side content filter, OR IF the AI Service returns no response at all, THEN THE AI Service SHALL discard the response and return an error to the User.
5. THE Application SHALL not expose Amazon Bedrock API credentials in any client-side code or public API response.
6. WHEN an AI Service request fails due to an authorization error, THE Application SHALL log the error server-side and return a generic error message to the User without exposing credential details.

---

### Requirement 16: Amazon Bedrock Integration

**User Story:** As a developer, I want the AI features to use Amazon Bedrock as the primary GenAI provider with a fallback option, so that the application has reliable AI capabilities.

#### Acceptance Criteria

1. THE Bedrock_Client SHALL communicate with Amazon Bedrock using AWS SDK credentials stored as server-side environment variables.
2. WHEN the Bedrock_Client sends a request to Amazon Bedrock, THE Bedrock_Client SHALL specify the model ID, prompt, maximum token count, and temperature parameter.
3. IF Amazon Bedrock is unreachable or returns a service error, THEN THE Bedrock_Client SHALL attempt up to 2 retries with exponential backoff before returning an error to the calling module.
4. WHERE a fallback GenAI provider is configured via environment variable, THE Bedrock_Client SHALL automatically route requests to the fallback provider when Amazon Bedrock is unavailable after all retry attempts are exhausted.
5. THE Bedrock_Client SHALL log all request durations and error codes server-side for observability without logging prompt content that may contain User data.

---

### Requirement 17: Kiro Project Configuration

**User Story:** As a developer, I want the project to include Kiro configuration files with steering rules and reusable skills, so that the development environment enforces consistent practices.

#### Acceptance Criteria

1. THE Application's repository SHALL contain a `.kiro/settings.kiro` file specifying: project name, description, allowed commands, forbidden commands, and allowed file paths; THE settings file SHALL be a prerequisite for all other Kiro configuration components to be valid.
2. THE Application's repository SHALL contain Kiro steering files defining rules for: clean architecture conventions, Supabase best practices, and UI consistency standards.
3. THE Application's repository SHALL contain reusable Kiro skills for: AWS Knowledge, Flash Card Generator, Supabase integration, and UI Implementation.
4. THE steering files SHALL forbid direct database access from frontend components and SHALL require all database interactions to go through the Supabase_Client module.
5. THE steering files SHALL require all AI Service invocations to originate from server-side API routes only.

---

### Requirement 18: Frontend Application Structure

**User Story:** As a developer, I want a well-organized Next.js frontend with a consistent design system, so that the codebase is maintainable and the UI is coherent.

#### Acceptance Criteria

1. THE Application SHALL implement the following main screens: Login/Register, Dashboard, Topic Browser, Flash Card Study, Quiz, and AI Chat/Hints.
2. THE Application SHALL use Tailwind CSS for all styling with a defined design token set covering colors, typography, spacing, and breakpoints.
3. THE Application SHALL be responsive, adapting layouts for mobile (320px–767px), tablet (768px–1023px), and desktop (1024px and above) viewport widths; WHEN the viewport width is below 320px, THE Application SHALL display a notice informing the User that the minimum supported width is 320px.
4. THE Router SHALL redirect unauthenticated Users who attempt to access protected routes to the Login screen.
5. WHEN a User navigates between screens, THE Application SHALL preserve active Study Session state so that progress is not lost on navigation.
6. THE Application SHALL display a loading indicator WHEN any asynchronous operation (data fetch, AI request) is in progress.

---

### Requirement 19: Flash Card Flip Interaction Design

**User Story:** As a User, I want the flash card flip animation to be smooth and intuitive, so that the study experience feels engaging and natural.

#### Acceptance Criteria

1. WHEN a User triggers the flip action, THE Application SHALL animate the Flash Card with a CSS 3D rotation transition completing in no more than 400 milliseconds.
2. THE Application SHALL distinguish the front face (question) from the back face (answer/explanation) with visually distinct background colors or styling.
3. WHEN a Flash Card is in the flipped (answer) state, THE Application SHALL display the Knowledge Level rating buttons (`easy`, `medium`, `hard`) below the card.
4. WHEN a Flash Card is returned to the front (question) state before rating, THE Application SHALL hide the Knowledge Level rating buttons.
5. THE flip interaction SHALL be accessible via keyboard (Enter or Space key) in addition to mouse click or touch tap.

---

### Requirement 20: MCP and External Tool Integration

**User Story:** As a developer, I want the project to document available MCP integrations and open-source alternatives for AWS tooling, so that the development environment can leverage external AWS knowledge sources.

#### Acceptance Criteria

1. THE Application's repository SHALL contain a documentation file listing all evaluated MCP server integrations relevant to AWS development, including availability status (available / unavailable).
2. WHERE AWS-specific MCP tools are unavailable in the development environment, THE documentation SHALL recommend at least one open-source MCP server for each of the following capabilities: AWS documentation lookup, AWS CLI assistance, and cloud architecture guidance.
3. THE documentation SHALL describe how each recommended MCP integration can be configured in the Kiro development environment.

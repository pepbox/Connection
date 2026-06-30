# GetSetKnow: Version 2 (Teammate Connection) Recreation Blueprint

This document serves as a comprehensive technical and UI specification blueprint for **Version 2 (Teammate Connection)** of the **GetSetKnow** application. It contains all database models, API endpoint flows, socket integrations, frontend routing structures, component designs, and admin overrides necessary for an AI coding assistant to recreate this feature set from scratch.

---

## 1. Directory Structure Blueprint

To isolate and rebuild V2, implement the following files and folders:

### Backend Structure
```markdown
server/src/
├── modules/
│   ├── players/
│   │   ├── models/
│   │   │   ├── player.model.ts        # Player collection
│   │   │   └── connection.model.ts    # Connection collection
│   │   └── v2/
│   │       ├── controllers/
│   │       │   └── player.controller.ts # Connection & custom Q&A logic
│   │       └── routes/
│   │           └── player.routes.ts     # Player V2 router
│   ├── questions/
│   │   └── models/
│   │       └── customQuestion.model.ts  # CustomQuestion collection
│   └── admin/
│       └── controllers/
│           └── admin.controller.ts      # V2 Admin dashboard endpoint overrides
└── routes/
    └── v2/
        └── index.ts                     # Version 2 API routing index
```

### Frontend Structure
```markdown
client/src/
├── features/
│   ├── game/
│   │   ├── services/
│   │   │   ├── gameArena.Api.ts         # RTK query endpoints for V2
│   │   │   └── gameSlice.ts             # V2 local state slice
│   │   └── v2/
│   │       ├── pages/
│   │       │   └── V2GameArenaPage.tsx  # Multi-state V2 gameplay page
│   │       └── components/
│   │           ├── ConnectionHub.tsx    # Teammate search & connect panel
│   │           ├── QuestionExchangeHub.tsx # Answering teammate's custom Qs
│   │           ├── ConnectionSelfieScreen.tsx # Snapshot & upload webcam panel
│   │           └── V2CompletionPage.tsx # Final bonding page & answers summary
│   └── question/
│       └── v2/
│           └── components/
│               ├── V2IntroScreen.tsx    # Connection game flow slideshow
│               └── CustomQuestionsBuilder.tsx # Forms to draft custom trivia
└── pages/
    └── gameMain.tsx                     # Frontend routing for V2 screens
```

---

## 2. Database Model Configurations

Implement the following **Mongoose Schemas** in your database layer:

### A. CustomQuestion Model (`CustomQuestion`)
```typescript
import { Schema, model, Document } from 'mongoose';

export interface ICustomQuestion extends Document {
  player: Schema.Types.ObjectId;   // Author of the question
  session: Schema.Types.ObjectId;  // Event session ID
  questionText: string;            // The custom prompt
  correctAnswer?: string;          // Optional correct answer (private)
}

const customQuestionSchema = new Schema<ICustomQuestion>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  questionText: { type: String, required: true, trim: true },
  correctAnswer: { type: String, trim: true }
}, { timestamps: true });

export const CustomQuestion = model<ICustomQuestion>('CustomQuestion', customQuestionSchema);
```

### B. Connection Model (`Connection`)
Stores exclusive 1-to-1 pairings between teammates.
```typescript
import { Schema, model, Document } from 'mongoose';

export interface IConnection extends Document {
  session: Schema.Types.ObjectId;
  playerA: Schema.Types.ObjectId;  // Requester
  playerB: Schema.Types.ObjectId;  // Recipient
  status: 'pending' | 'connected';
  selfieA?: Schema.Types.ObjectId;  // Image file reference uploaded by Player A
  selfieB?: Schema.Types.ObjectId;  // Image file reference uploaded by Player B
  answersA?: Array<{ questionId: Schema.Types.ObjectId; answer: string }>; // Player A's answers to Player B's questions
  answersB?: Array<{ questionId: Schema.Types.ObjectId; answer: string }>; // Player B's answers to Player A's questions
}

const connectionSchema = new Schema<IConnection>({
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  playerA: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  playerB: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  status: { type: String, enum: ['pending', 'connected'], default: 'pending' },
  selfieA: { type: Schema.Types.ObjectId, ref: 'File' },
  selfieB: { type: Schema.Types.ObjectId, ref: 'File' },
  answersA: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'CustomQuestion' },
    answer: { type: String, required: true }
  }],
  answersB: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'CustomQuestion' },
    answer: { type: String, required: true }
  }]
}, { timestamps: true });

export const Connection = model<IConnection>('Connection', connectionSchema);
```

---

## 3. Backend REST API Endpoint Specifications

All endpoints below reside under the `/api/v2` namespace. Use `authenticateUser` JWT middleware on all V2 routes (extracts `id` and `sessionId` as `req.user`).

### 1. Save Custom Questions
* **Route**: `POST /api/v2/player/addCustomQuestions`
* **Controller Logic**:
  * Extract `playerId` and `sessionId` from auth token.
  * Delete any existing custom questions for the player.
  * Map input `questions` array to include author and session.
  * Save to `CustomQuestion` collection.
* **Payload**:
  ```json
  {
    "questions": [
      { "questionText": "What is my absolute dream city to travel to?", "correctAnswer": "Kyoto" },
      { "questionText": "What instrument do I play?", "correctAnswer": "Drums" }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  { "success": true, "message": "Custom questions saved successfully" }
  ```

### 2. Retrieve Custom Questions
* **Route**: `GET /api/v2/player/getCustomQuestions`
* **Query Parameters**: `?playerId=STRING` (Optional - retrieves target teammate's questions; defaults to own questions)
* **Controller Logic**:
  * If the target ID is the current user's ID, fetch questions *with* `correctAnswer`.
  * If target ID is a teammate's ID, fetch questions and project out `correctAnswer` (using `.select("-correctAnswer")`) to prevent cheating.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "_id": "q1_id", "questionText": "What is my absolute dream city to travel to?" }
    ]
  }
  ```

### 3. Send Connection Invitation
* **Route**: `POST /api/v2/player/sendConnectionRequest`
* **Controller Logic**:
  * Verify recipient exists in the same session.
  * Ensure sender cannot request to connect with themselves.
  * Check if sender or recipient has an active Connection request (status = `pending` or `connected`). If either does, return `400 Bad Request` ("You/The recipient already have an active request or connection").
  * Create `Connection` document with `status: 'pending'`.
  * Emit `CONNECT_REQUEST` real-time notification to the recipient.
  * Broadcast `CONNECTION_UPDATE` to all session players to filter availability list.
* **Payload**:
  ```json
  { "recipientId": "teammate_user_id" }
  ```
* **Success Response (201 Created)**:
  ```json
  { "success": true, "data": { "connectionId": "connection_id", "status": "pending" } }
  ```

### 4. Accept or Decline Connection Request
* **Route**: `POST /api/v2/player/respondToConnectionRequest`
* **Controller Logic**:
  * Retrieve connection by ID. Ensure current user is `playerB` (the recipient).
  * Validate connection status is `pending`.
  * **If Action is 'accept'**:
    * Set status to `connected` and save.
    * Emit `CONNECT_RESPONSE` to `playerA` indicating status is accepted.
    * Broadcast `CONNECTION_UPDATE` to all players.
  * **If Action is 'reject'**:
    * Delete the connection document.
    * Emit `CONNECT_RESPONSE` to `playerA` indicating status is rejected.
    * Broadcast `CONNECTION_UPDATE` to all players.
* **Payload**:
  ```json
  { "connectionId": "connection_id", "action": "accept" } // or "reject"
  ```
* **Success Response (200 OK)**:
  ```json
  { "success": true, "message": "Connection request accepted" }
  ```

### 5. Fetch Connection Status
* **Route**: `GET /api/v2/player/getConnectionStatus`
* **Controller Logic**:
  * Find any connection request involving the player in the current session (`playerA == id` or `playerB == id`).
  * If none, return `data: null`.
  * Fetch partner details (name, profile picture URL).
  * Resolve selfies uploaded: `selfieUrl` represents the file path of either `selfieA` or `selfieB`. If either exists, `selfieUploaded` is marked `true`.
  * Fetch own questions and partner's questions (without correct answers).
  * Map answers list:
    * `myAnswers` = if user is player A ? connection.answersA : connection.answersB
    * `partnerAnswers` = if user is player A ? connection.answersB : connection.answersA
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "connectionId": "conn_id",
      "status": "connected",
      "role": "A",
      "selfieUploaded": true,
      "selfieUrl": "http://s3-location/selfie.jpg",
      "partner": { "id": "partner_id", "name": "Jane Doe", "profilePhoto": "http://..." },
      "myQuestions": [...],
      "partnerQuestions": [...],
      "myAnswers": [],
      "partnerAnswers": []
    }
  }
  ```

### 6. Submit Partner Answers
* **Route**: `POST /api/v2/player/submitCustomAnswers`
* **Controller Logic**:
  * Retrieve connection and check if user is player A or B.
  * Save answers payload into the respective field (`answersA` for Player A, `answersB` for Player B).
  * Emit `PARTNER_ANSWERS_SUBMITTED` socket event to the partner.
* **Payload**:
  ```json
  {
    "connectionId": "conn_id",
    "answers": [
      { "questionId": "q1_id", "answer": "Kyoto, Japan" }
    ]
  }
  ```
* **Success Response (200 OK)**:
  ```json
  { "success": true, "message": "Answers submitted successfully" }
  ```

### 7. Upload Joint Selfie
* **Route**: `POST /api/v2/player/submitConnectionSelfie` (Multipart form-data)
* **Controller Logic**:
  * Accept single file upload key `selfie`. Validate size under 20MB, image MIME type.
  * Save the image in local server files/S3 and generate file metadata document.
  * Update `Connection` document: if user is player A, save file ID in `selfieA`; if player B, save file ID in `selfieB`.
  * Emit `PARTNER_SELFIE_UPLOADED` to the partner.
  * Emit `PLAYER_SELFIE_UPDATE` to admin sockets.
* **Payload (FormData)**:
  * File: `selfie`
  * String: `connectionId`
* **Success Response (200 OK)**:
  ```json
  { "success": true, "data": { "selfieUrl": "http://s3-location/file.jpg" } }
  ```

---

## 4. Real-time Infrastructure & WebSockets Setup

Version 2 is fully reactive. On connection, the client initializes Socket.io using cookies for auth, joins their session room, and registers user mappings.

### Socket Emitter Methods
1. **Emit to User**: `toUser(userId, event, payload)`
   * Finds all socket connections associated with the specific User ID and emits the payload. Used for targeted connection requests.
2. **Emit to Session Players**: `toSessionPlayers(sessionId, event, payload)`
   * Emits to all player sockets inside the session room. Used to broadcast membership and connection request state updates to refresh availability lists.

### Event Definitions
* `CONNECT_REQUEST`: Received by recipient (B). Payload: `{ connectionId, requester: { id, name } }`. Shows a modal prompt to accept/decline.
* `CONNECT_RESPONSE`: Received by sender (A). Payload: `{ connectionId, status: "connected" | "rejected", recipient: { id, name } }`. Transitions screen state.
* `CONNECTION_UPDATE`: Broadcasted to session players. Forces client refetch of available players.
* `PARTNER_ANSWERS_SUBMITTED`: Received by partner. Informs the UI that the teammate finished writing responses.
* `PARTNER_SELFIE_UPLOADED`: Received by partner. Previews the uploaded selfie to the partner.
* `PLAYER_SELFIE_UPDATE`: Received by admin. Refreshes admin panel selfie galleries.

---

## 5. Frontend UI Screens & State Machine

The client application renders within a mobile-first frame layout (max-width `480px`, centered, responsive viewport).

### The UI State Machine Flow chart
```
 [Onboarding Profile] 
         │
         ▼
 [V2 Slideshow Intro] 
         │
         ▼
 [Custom Q&A Builder] ─(adds custom Qs)─► [Waiting for Admin] 
                                                  │
                                                  ▼ (Admin Starts)
                                          [Connection Hub] ◄──────┐
                                                  │               │
                                   (Send Request) │               │ (Declined)
                                                  ▼               │
                                          [Waiting Partner B] ────┘
                                                  │
                                       (Accepted) │
                                                  ▼
                                      [Q&A Exchange Panel]
                                                  │
                                     (Answers In) │
                                                  ▼
                                      [Waiting Partner Qs]
                                                  │
                                        (Both In) │
                                                  ▼
                                      [Snap & Upload Selfie]
                                                  │
                                      (Uploaded)  │
                                                  ▼
                                      [Connected Success Page]
```

### Visual Designs & Interface Details

#### A. Slideshow Intro Screen (`V2IntroScreen`)
* **Theme**: Glassmorphic elements on a clean violet background.
* **Layout**: Split into a left sidebar showing a visual vertical "Connection Flow" timeline and a right content box showing card previews.
* **Flow**:
  1. Slide 1: Create Questions ("Write custom questions and fun trivia about yourself.")
  2. Slide 2: Find a Partner ("Search and connect with a teammate in real-time.")
  3. Slide 3: Answer Partner ("Exchange and answer your partner's custom questions.")
  4. Slide 4: Take a Selfie ("Snap a photo together with your partner to complete the connection!")
* **Interactions**: Next/Back buttons at the bottom. Once all 4 slides are viewed, the button turns into a large, animated "Jump in" button that redirects to the builder.

#### B. Questions Creator (`CustomQuestionsBuilder`)
* **Theme**: Soft gray background with a contrasting white card body.
* **Layout**: Top header banner with title "Create Your Questions!". Underneath, a scrollable list of question blocks.
* **Interactions**:
  * Each question block contains two fields: "The Question" (multiline text field, max-length 100) and "Private Answer" (optional text field, max-length 100).
  * "Add new question" button at the bottom.
  * Delete icon on question cards (visible only if there are > 1 questions).
  * Sticky bottom footer containing a "Submit Questions" button.
  * Saves choices to `localStorage` as backup before triggering `/addCustomQuestions`.

#### C. Connecting Hub (`ConnectionHub`)
* **Theme**: Playful, interactive teammate cards.
* **Layout**: Large bold "Find a Partner" title, search input box with search icon start-adornment, and teammate cards.
* **Availability List**:
  * Teammates are fetched using `/getPlayersBySession`. Players already in connections or requests are filtered out on the backend to avoid conflicts.
  * Clicking "Connect" on a card disables all buttons, initiates `/sendConnectionRequest`, and switches the UI to the "Sent Request / Waiting" card.
* **Incoming request card**:
  * Renders dynamically at the top in a bright purple gradient container (`linear-gradient(135deg, #E2D8FD 0%, #C4B2FC 100%)`).
  * Displays requester's name, profile photo, and large "Accept" and "Decline" buttons.

#### D. Questionnaire Exchange (`QuestionExchangeHub`)
* **Layout**: Displays the partner's profile picture and a message: "Get to Know [Partner's Name]".
* **Interaction**: Renders input blocks for each of the partner's custom questions. Answers are required. Click "Submit Answers" to save. Renders a progress indicator ("Question 1 of 2").

#### E. Selfie Snap & Upload Screen (`ConnectionSelfieScreen`)
* **Layout**: Top banner showing "Take a Selfie with [Partner Name]". Underneath, a square `1:1` aspect ratio camera viewfinder.
* **Interaction**:
  * Integrates `react-webcam` for direct captures, alongside a file input loader as a fallback.
  * Show "Capture" and "Upload" buttons.
  * Once captured, shows "Retake" and "Confirm" buttons. Clicking confirm converts the base64 screenshot into a blob and uploads it to the server.

#### F. Connected Page (`V2CompletionPage`)
* **Theme**: Celebration card with green gradient (`linear-gradient(135deg, #4FD1C5 0%, #3AB5A8 100%)`).
* **Layout**:
  * Grid of selfies showing "Your Selfie" and "[Teammate]'s Selfie".
  * Expandable text summaries showing:
    * "Your Answers to [Partner Name]'s Questions" (green left border indicators).
    * "[Partner Name]'s Answers to Your Questions" (purple left border indicators).

---

## 6. Admin Panel Control Dashboard

Admins need visibility into connection setups. Implement the following modules in the Admin Dashboard:

### A. Dashboard Metrics & Player Table Overrides
When `gameVersion` is `both` or `v2`, the admin panel player table should display V2 columns:
* **Questions Written**: Render chip `[ X written ]` (Green) or `[ Pending ]` (Orange).
* **Connected Teammate**: Shows name of the teammate they are connected to, or `Pending connection` / `None`.
* **Teammate's Questions Answered**: Chip `[ X answered ]` or `[ Pending ]`.
* **Connection Selfie**: Chip `[ Uploaded ]` (Green) or `[ Pending ]` (Orange).

### B. Admin Readiness checklist
Before transitioning from `pending` to `playing`, verify players' questionnaire completion:
* A player is flagged **Pending** in V2 if they have created `0` custom questions.
* Render a force start warning popup showing players who haven't completed their questions.

### C. Selfies Downloader
* Modify `/api/v1/session/downloadSelfies/:sessionId` to query connection uploads if version is V2.
* Package selfies using zip file name conventions:
  ```
  [ZIP_INDEX]_[PLAYER_A_NAME]_connected_[PLAYER_B_NAME].[EXT]
  ```

---

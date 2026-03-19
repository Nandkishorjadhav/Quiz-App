# Vercel Live Quiz Deployment Guide

This guide is for deploying shared live quizzes on Vercel where:
- Admin creates and starts a shared quiz.
- Students join with link only (no login), enter name, and take quiz in full screen.
- Admin sees joined names and marks live.

## Why your current flow fails on Vercel

localStorage is browser-specific. Admin and students on different devices do not share the same state.

Result:
- Admin may see 0 joined.
- Student may not get start signal.
- Student marks may not appear in admin panel.

To fix this, use a shared realtime database.

## Recommended stack

- Frontend: Vercel (React + Vite)
- Realtime state: Firebase Realtime Database
- Student auth: no login (name entry)
- Admin auth: existing admin login flow

## 47-step end-to-end setup

### A) Firebase project setup

1. Open Firebase Console.
2. Click Create project.
3. Enter project name.
4. Complete project creation.
5. Open Project settings.
6. Add a Web app.
7. Copy Firebase web config values.
8. Go to Build -> Realtime Database.
9. Click Create Database.
10. Select nearest region.
11. Start in locked mode.

### B) Client dependency and config

12. Open terminal in [Client](Client).
13. Install Firebase SDK: `npm install firebase`.
14. Create [Client/src/lib/firebase.ts](Client/src/lib/firebase.ts).
15. Initialize Firebase app in that file.
16. Export realtime database instance from that file.
17. Create or update your local env file (for example, `.env` in Client).
18. Add Firebase env values for local development.
19. Verify app starts with `npm run dev`.

### C) Vercel environment variables

20. Open Vercel dashboard.
21. Open your project settings.
22. Go to Environment Variables.
23. Add `VITE_FIREBASE_API_KEY`.
24. Add `VITE_FIREBASE_AUTH_DOMAIN`.
25. Add `VITE_FIREBASE_DATABASE_URL`.
26. Add `VITE_FIREBASE_PROJECT_ID`.
27. Add `VITE_FIREBASE_STORAGE_BUCKET`.
28. Add `VITE_FIREBASE_MESSAGING_SENDER_ID`.
29. Add `VITE_FIREBASE_APP_ID`.
30. Save variables for Production and Preview.

### D) Realtime data model

31. Use database node `liveQuizzes/{quizCode}/meta` for quiz details.
32. Keep `status` in meta (`waiting`, `live`, `ended`).
33. Store question set under `meta/questions`.
34. Store each participant under `liveQuizzes/{quizCode}/participants/{participantId}`.
35. Save `userName`, `joinedAt`, `submitted`, `score`, `percentage`, `timeTaken`.

Example structure:

```text
liveQuizzes/
  QUIZ-ABC123/
    meta/
      title
      description
      category
      difficulty
      status
      createdAt
      createdBy
      timePerQuestion
      questions
    participants/
      guest-x1y2z3/
        userName
        joinedAt
        submitted
        score
        percentage
        correctCount
        incorrectCount
        timeTaken
        answers
```

### E) Admin flow wiring

36. On create quiz, write quiz meta and questions to realtime DB.
37. On admin panel open, subscribe to quiz meta and participants.
38. On Start, set `status = live`.
39. On End, set `status = ended`.
40. Show participants count and names from realtime listener.
41. Show submitted marks from participant records.

### F) Student flow wiring (full screen, no login)

42. Open shared link `/live/{quizCode}`.
43. Show name entry screen first.
44. On join, create participant record with entered name.
45. Listen to realtime `status` updates.
46. When `status = live`, auto-start full-screen quiz.
47. On submit/end, write marks and keep results visible for admin.

## Firebase security rules (starter example)

Use this as a starter and tighten later:

```json
{
  "rules": {
    "liveQuizzes": {
      "$quizCode": {
        ".read": true,
        "meta": {
          ".write": true
        },
        "participants": {
          "$participantId": {
            ".write": true
          }
        }
      }
    }
  }
}
```

Important:
- These starter rules are open for easier testing.
- For production, protect admin writes with Firebase Auth and role checks.

## Deployment checklist

1. Push latest code.
2. Confirm env vars are set on Vercel.
3. Redeploy project.
4. Create quiz from deployed admin panel.
5. Copy shared link.
6. Open link on two different devices.
7. Enter different student names.
8. Confirm names appear in admin panel.
9. Start quiz from admin.
10. Confirm both students auto-enter full-screen quiz.
11. Submit from one student and verify marks appear in admin panel.
12. End quiz and verify ended state on all devices.

## Troubleshooting

### Quiz Not Found

- Check the quiz code exists in `liveQuizzes/{quizCode}`.
- Check `VITE_FIREBASE_DATABASE_URL` is correct in Vercel.
- Confirm student link matches exact quiz code.

### Students joined but not visible in admin

- Confirm admin page has active realtime listener on participants node.
- Confirm student join writes participant document successfully.
- Confirm both are using same Firebase project.

### Admin starts but student quiz does not start

- Confirm student page listens to `meta/status` changes.
- Confirm admin writes `status = live` in same quiz node.

### Marks not shown in admin panel

- Confirm submit writes `submitted`, `score`, `percentage` fields.
- Confirm admin table reads participants from realtime source, not localStorage.

## Final note

Without shared realtime backend, Vercel deployment cannot provide true cross-device live quiz sync. Firebase (or similar realtime DB) is required for the exact behavior you want.

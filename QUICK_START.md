# ⚡ Quick Start Checklist - AI Quiz Setup

## 🔑 Step 1: Get API Key (2 minutes)
- [ ] Go to: https://aistudio.google.com/app/apikey
- [ ] Sign in with Google (create account if needed)
- [ ] Click "Create API Key"
- [ ] Copy the key (example: `AIzaSyD7x9...`)

## 📝 Step 2: Update Server Config (30 seconds)
- [ ] Open: `Server/.env`
- [ ] Find line: `GOOGLE_GEMINI_API_KEY=sk-your-api-key-here`
- [ ] Replace with your key: `GOOGLE_GEMINI_API_KEY=AIzaSyD7x9...`
- [ ] Save file

## 🚀 Step 3: Restart Backend (15 seconds)
```bash
cd Server
npm start
```

**Watch for** ✅ (should appear in terminal):
```
✅ Google Gemini API initialized successfully
✓ Server is running on port 5000
✓ Database initialized successfully
```

## 🎨 Step 4: Start Frontend (15 seconds)
**In new terminal**:
```bash
cd Client
npm run dev
```

**Should see**:
```
➜  Local:   http://localhost:5173/
```

## ✅ Step 5: Test the Flow (2 minutes)

1. **Open**: http://localhost:5173
2. **Login** with any account
3. **Click**: "✨ AI Quiz" button (dashboard or navbar)
4. **Enter**: 
   - Topic: `JavaScript`
   - Difficulty: `Easy`
   - Questions: `5`
5. **Click**: "✨ Generate Quiz"
6. **Wait**: 3-5 seconds (Gemini generating)
7. **See**: Success animation → Quiz loads ✅

## 🎯 What You Should See

| Step | Expected Result |
|------|-----------------|
| 1. Login | Dashboard loads, your name appears |
| 2. Click AI Quiz | Generator page with animated background |
| 3. Fill form | All options available to select |
| 4. Click Generate | Loading spinner appears |
| 5. Wait | Success animation with checkmark |
| 6. Quiz loads | Questions display with timer |
| 7. Answer & Submit | Results page with score |

## 🆘 If Something Goes Wrong

### "Google Gemini API key is not configured"
- [ ] Verify API key is in `Server/.env`
- [ ] Check it doesn't start with `sk-` (should be `AIza...`)
- [ ] Restart server: `npm start` in Server directory

### "401 Unauthorized" or "Invalid token"
- [ ] Logout and login again
- [ ] Open DevTools → Console
- [ ] Run: `localStorage.clear()`
- [ ] Refresh page and login again

### "Module not found" or  "Cannot find module"
- [ ] Run: `npm install` in both Client and Server directories
- [ ] Restart servers

### Build says "error TS"
- [ ] Run: `npm run build --verbose` to see full error
- [ ] Check the troubleshooting guide

## 📊 Verify It's Working

**In DevTools Console (F12)**:
```javascript
// Should return: "eyJhbGc..." (a token string)
JSON.parse(localStorage.getItem('qm_auth_token'))

// Should NOT return error about 401
```

**In DevTools Network Tab**:
1. Generate a quiz
2. Look for `/api/quiz/generate` request
3. Should show:
   - Status: `201 Created` ✅ (not 401 or 500)
   - Response has `quizId`, `questions`, etc.

## 🎉 Success Indicators

✅ **All of these should be true**:
- Backend terminal shows "✅ Gemini API initialized"
- Frontend loads at localhost:5173
- Can login successfully
- Can see "AI Quiz" button on dashboard
- Can generate quiz without errors
- Can see questions and take quiz
- Can submit and see results

---

## 📞 Common Issues Quick Fixes

| Error | Fix |
|-------|-----|
| "key is not configured" | Add real API key to `.env`, restart |
| "401 Unauthorized" | Clear localStorage, login again |
| "500 error" | Check API key, check server is running |
| "Cannot find module" | Run `npm install` in that directory |
| "Build fails" | Run `npm run build` to see full error details |

---

## ⏱️ Timeline

- **Get API Key**: 2 minutes
- **Update Config**: 30 seconds  
- **Restart Servers**: 1 minute
- **Test Full Flow**: 2 minutes

**Total Time**: ~6 minutes to full functionality

---

**Next Step**: Follow the checklist above and let me know if you encounter any issues! 🚀

# PB Insurance AI - Voice Guided Assistant

## Current State
The app is a full-featured insurance CRM with lead management, document upload, workflow tracking, WhatsApp integration, AI chat, and PWA support. The LeadDetailPage has a Quick Actions section with an "Open PB Portal" button linking to https://www.pbpartners.com.

## Requested Changes (Diff)

### Add
- `VoiceAssistant` component: a floating panel/modal triggered from the Lead Detail page
- "Start Voice Assistant" button in the Quick Actions section of LeadDetailPage
- 6-step TTS flow in Hindi using Web Speech API (SpeechSynthesis)
- Smart check: if RC data available, compare with entered vehicle details and speak warning if mismatch
- Control buttons: Pause, Resume, Repeat last instruction
- Visual step tracker showing current active step with highlight
- Auto-advance between steps with 5-10 second wait after Step 1

### Modify
- `LeadDetailPage.tsx`: add "Start Voice Assistant" button in Quick Actions section

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/VoiceAssistant.tsx`:
   - Accept `lead` prop to check RC data availability
   - State: currentStep (1-6), isPlaying, isPaused, lastInstruction
   - Use `window.speechSynthesis` for TTS
   - Prefer Hindi voice (lang='hi-IN'); fallback to default
   - Steps array with text and delay (Step 1 has 7s wait before auto-advance)
   - Smart check: if rcFrontUrl or rcBackUrl present, speak mismatch warning at Step 3
   - Control buttons: Pause (pauseSpeaking), Resume (resumeSpeaking), Repeat (re-speak last)
   - Visual stepper: numbered cards, active step highlighted in blue/indigo
   - Show as modal/panel overlay with close button
2. Update `LeadDetailPage.tsx`:
   - Add "Start Voice Assistant" button (mic icon, purple/indigo style) in Quick Actions
   - Wire to show VoiceAssistant component

# Student Feedback Page Gamification Design

## Goal Description
Redesign the Reading Lab student feedback collection page into a premium, gamified, slide-by-slide Duolingo-style questionnaire. The redesigned page features a highly reactive cat mascot (`🐱`), micro-interactive dialogue speech bubbles, 3D tactile card components, smooth page-slide transitions, a progress bar, and comprehensive responsive support. 

This design retains exact database compatibility using the original question keys: `q1_understand`, `q2_difficulty`, `q3_interest`, and `q4_effort`.

---

## Technical Architecture & Layout
The page is organized into an immersive Dual-Panel split-screen layout on desktop screens, adapting gracefully to a stacked layout on tablets and mobile devices.

### Desktop Layout (md and up)
- **Left Panel (40% width / grid-col-5)**: 
  - A beautifully styled "Cat Playground" with a soft pastel-colored card container.
  - A centered interactive mascot rendered using highly styled, layered CSS elements and emojis.
  - A floating, elastic cartoon speech bubble (`pop-bounce`) that renders customized kids' dialogue in response to hover or selected choices.
- **Right Panel (60% width / grid-col-7)**:
  - The current question label styled with prominent bold text and colorful highlights.
  - A vertical column or responsive grid of 5 giant option cards.
  - Each option card is styled as a 3D tactile button with a 4px to 6px border-bottom offset representing an authentic physical press state.

### Mobile Layout (below md)
- A vertical stack:
  - Top: Animated mascot avatar and scaled-down cartoon speech bubble.
  - Middle: Highlighting question heading.
  - Bottom: Compact 3D option cards.

---

## State Management
- `currentIdx`: Tracks the active question slide (0 to 3).
- `answers`: A dictionary map of `{ [questionKey]: selectedOptionLabel }`.
- `hoveredOption`: Tracks the option index that the student is currently hovering over, enabling instant, real-time mascot expression and speech bubble dialogue reaction before the selection is made.
- `slideDirection`: `'next' | 'prev'` to dynamically inject corresponding left-to-right or right-to-left slide-in `@keyframes` animation styles.
- `isTransitioning`: A boolean throttle state to handle smooth transition slide timing.

---

## mascot Reaction Content Matrix

### Q1: Effort (`q1_understand`)
- **Key**: `q1_understand`
- **Label**: "How much {h} did you put in while reading this passage?"
- **Highlight**: "effort"
- **Description**: "Did you concentrate and try your best to read clearly?"
- **Base State (No Hover/Selection)**: 🐱 "Hey there! How much energy did you put into reading just now?" (Mascot Expression: `😺`)
- **Options, Emojis, and Reactive Dialogues**:
  1. **💤 Almost none**
     - Mascot: `😴` (Sleepy breathing)
     - Dialogue: "Zzz... Is this article a lullaby? I'm nodding off! 🥱💤"
  2. **🐌 A little**
     - Mascot: `🥱` (Yawning lazy kitty)
     - Dialogue: "Slow like a little snail! Let's wake up our ears! 🐌🐾"
  3. **🚶 Some**
     - Mascot: `😺` (Friendly content smile)
     - Dialogue: "A steady stroll! You are getting into the groove! 🚶‍♂️✨"
  4. **🏃 A lot**
     - Mascot: `😸` (Energetic wink)
     - Dialogue: "Sprinting forward! I can hear your clear voice! 🏃‍♀️💨"
  5. **🚀 A whole lot**
     - Mascot: `🤩` (Double stars in eyes + rocket)
     - Dialogue: "OMG! You are a reading superstar! Rocketing to space! 🚀🤩"

### Q2: Difficulty (`q2_difficulty`)
- **Key**: `q2_difficulty`
- **Label**: "How {h} was it for you to read this passage?"
- **Highlight**: "hard"
- **Description**: "Were the words and sentences easy or tough for you?"
- **Base State (No Hover/Selection)**: 🐱 "How did the words and sentences feel? Easy-peasy or tough?" (Mascot Expression: `🧗`)
- **Options, Emojis, and Reactive Dialogues**:
  1. **🎈 Very easy**
     - Mascot: `😸` (Floating with balloons)
     - Dialogue: "Easiest thing ever! Like floating on a balloon! 🎈😺"
  2. **🌱 Easy**
     - Mascot: `🌱` (Happy garden waterer)
     - Dialogue: "Smooth sailing! Just like a little plant growing happily! 🌱💧"
  3. **🚲 Medium**
     - Mascot: `😎` (Cool shades cat)
     - Dialogue: "A fun little ride! Just the right speed! 🚲🍀"
  4. **🧗 Hard**
     - Mascot: `🧗` (Sweating helper climbing)
     - Dialogue: "Phew! Quite a climb, but you didn't give up! 🧗🐾"
  5. **⛰️ Very Hard**
     - Mascot: `😭` (Struggling but brave)
     - Dialogue: "Whoa, that was a giant mountain! You are so brave for trying! ⛰️🙀"

### Q3: Enjoyment (`q3_interest`)
- **Key**: `q3_interest`
- **Label**: "How much did you {h} reading this passage?"
- **Highlight**: "enjoy"
- **Description**: "Did you find the content fun and interesting to read?"
- **Base State (No Hover/Selection)**: 🐱 "Did you like this story? Did it make you happy?" (Mascot Expression: `🎉`)
- **Options, Emojis, and Reactive Dialogues**:
  1. **💔 Did not want to finish it**
     - Mascot: `😿` (Sad eyes with tears)
     - Dialogue: "Oh no... Was it that boring? Let me give you a hug! 💔😿"
  2. **🥱 Not very fun**
     - Mascot: `😒` (Bored side glance)
     - Dialogue: "Meh... it was a bit dry. Let's find a cooler one next time! 🥱🐾"
  3. **🍿 It was okay**
     - Mascot: `😋` (Eating popcorn)
     - Dialogue: "Not bad, not bad! Just like munching on some popcorn! 🍿😺"
  4. **⭐ I enjoyed it**
     - Mascot: `🥰` (Heart eyes happy kitten)
     - Dialogue: "Yay! A bright shiny star of fun! I loved reading with you! ⭐😻"
  5. **🎉 Great! I want to read more!**
     - Mascot: `🥳` (Sparkling party hat)
     - Dialogue: "Woohoo! Let's party! Can't wait for our next adventure! 🎉😸"

### Q4: Prior Knowledge (`q4_effort`)
- **Key**: `q4_effort`
- **Label**: "How much did you {h} about this topic before reading this passage?"
- **Highlight**: "already know"
- **Description**: "Was this topic brand new, or did you know a lot about it?"
- **Base State (No Hover/Selection)**: 🐱 "Did you know about this topic before, or was it brand new?" (Mascot Expression: `🔍`)
- **Options, Emojis, and Reactive Dialogues**:
  1. **❓ I knew nothing about it**
     - Mascot: `🧐` (Scratching head inquisitively)
     - Dialogue: "A blank map! But now we've unlocked a new secret! ❓😸"
  2. **🔍 I knew a little**
     - Mascot: `🔍` (Peering through magnifying glass)
     - Dialogue: "A tiny clue! Let's keep exploring! 🔍🐾"
  3. **📚 I knew some things**
     - Mascot: `🤓` (Sitting on stacked books)
     - Dialogue: "You are already a smart explorer! Let's add more knowledge! 📚✨"
  4. **🌍 I knew a lot**
     - Mascot: `🌍` (Hugging globe)
     - Dialogue: "Wow! You've traveled this world of knowledge! 🌍😻"
  5. **👑 I already knew everything about it**
     - Mascot: `👑` (Wearing gold crown)
     - Dialogue: "All hail the Reading King/Queen! You know everything! 👑🦁"

---

## Interactive Animations & Keyframes
To ensure perfect performance, zero asset loading time, and offline support, all animations are written directly in pure TailwindCSS and standard CSS `@keyframes`.

1. **Tactile Push (3D card)**:
   ```css
   .btn-3d {
     transition: all 0.15s ease-out;
     border-bottom-width: 6px;
   }
   .btn-3d:active {
     transform: translateY(4px);
     border-bottom-width: 2px;
   }
   ```
2. **Mascot Idle Animations**:
   - Breathing: Subtle vertical scaling (`scaleY(1.02)`) over 4s.
   - Floating: Soft floating motion (`translateY(-6px)`) over 5s with easing.
3. **Dialogue Pop**:
   - `pop-in`: Rapid scale-up from `scale(0.85)` with spring easing to `scale(1)`.
4. **Slide Transitions**:
   - Left-to-Right and Right-to-Left viewport sliding with opacity fades.

---

## Verification & Compatibility Plan
1. Compile using TypeScript standard linter `tsc --noEmit` to guarantee zero compile errors.
2. Verify existing session state mapping works seamlessly without changing database models.
3. Run the development server and check all responsive breakpoint states.

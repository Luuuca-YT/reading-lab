import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';

// ==========================================
// 8-BIT RETRO GAME WEB AUDIO SYNTH ENGINE
// ==========================================
class AudioSynth {
  private ctx: AudioContext | null = null;
  
  private init() {
    if (!this.ctx) {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  
  playHover() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4
      osc.frequency.exponentialRampToValueAtTime(523.25, this.ctx.currentTime + 0.08); // C5
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  playSelect() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, this.ctx.currentTime); // G4
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime + 0.06); // D5
      
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  playCostume() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [880, 987.77, 1046.50, 1318.51]; // A5, B5, C6, E6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(0.03, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.12);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.12);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  playMeow() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.04, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.22);
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

const synth = new AudioSynth();

// ==========================================
// DATA STRUCTURES & DATA COMPATIBILITY MATRIX
// ==========================================
interface Option {
  emoji: string;
  label: string;
  mascotEmoji: string;
}

interface Question {
  key: string;
  label: string;
  highlight: string;
  description: string;
  themeColor: 'emerald' | 'purple' | 'amber' | 'blue';
  baseMascotEmoji: string;
  options: Option[];
}

const questions: Question[] = [
  {
    key: 'q1_understand',
    label: 'How much {h} did you put in while reading this passage?',
    highlight: 'effort',
    description: 'Did you concentrate and try your best to read clearly?',
    themeColor: 'emerald',
    baseMascotEmoji: '🐱',
    options: [
      { emoji: '💤', label: 'Almost none', mascotEmoji: '😾' },
      { emoji: '🐌', label: 'A little', mascotEmoji: '🐱' },
      { emoji: '🚶', label: 'Some', mascotEmoji: '😺' },
      { emoji: '🏃', label: 'A lot', mascotEmoji: '😸' },
      { emoji: '🚀', label: 'A whole lot', mascotEmoji: '😻' },
    ],
  },
  {
    key: 'q2_difficulty',
    label: 'How {h} was it for you to read this passage?',
    highlight: 'hard',
    description: 'Were the words and sentences easy or tough for you?',
    themeColor: 'purple',
    baseMascotEmoji: '🐱',
    options: [
      { emoji: '🎈', label: 'Very easy', mascotEmoji: '😸' },
      { emoji: '🌱', label: 'Easy', mascotEmoji: '😺' },
      { emoji: '🚲', label: 'Medium', mascotEmoji: '😼' },
      { emoji: '🧗', label: 'Hard', mascotEmoji: '🙀' },
      { emoji: '⛰️', label: 'Very Hard', mascotEmoji: '😿' },
    ],
  },
  {
    key: 'q3_interest',
    label: 'How much did you {h} reading this passage?',
    highlight: 'enjoy',
    description: 'Did you find the content fun and interesting to read?',
    themeColor: 'amber',
    baseMascotEmoji: '🐱',
    options: [
      { emoji: '💔', label: 'Did not want to finish it', mascotEmoji: '😾' },
      { emoji: '🥱', label: 'Not very fun', mascotEmoji: '😿' },
      { emoji: '🍿', label: 'It was okay', mascotEmoji: '🐱' },
      { emoji: '⭐', label: 'I enjoyed it', mascotEmoji: '😺' },
      { emoji: '🎉', label: 'Great! I want to read more!', mascotEmoji: '😻' },
    ],
  },
  {
    key: 'q4_effort',
    label: 'How much did you {h} about this topic before reading this passage?',
    highlight: 'already know',
    description: 'Was this topic brand new, or did you know a lot about it?',
    themeColor: 'blue',
    baseMascotEmoji: '🐱',
    options: [
      { emoji: '❓', label: 'I knew nothing about it', mascotEmoji: '🙀' },
      { emoji: '🔍', label: 'I knew a little', mascotEmoji: '🐱' },
      { emoji: '📚', label: 'I knew some things', mascotEmoji: '😺' },
      { emoji: '🌍', label: 'I knew a lot', mascotEmoji: '😸' },
      { emoji: '👑', label: 'I already knew everything about it', mascotEmoji: '😼' },
    ],
  },
];

interface CatCompanion {
  id: string;
  name: string;
  emoji: string;
  breed: string;
  description: string;
  baseColor: string;
  gradient: string;
  personality: string;
}

const cats: CatCompanion[] = [
  {
    id: 'leo',
    name: 'Leo',
    emoji: '🦁',
    breed: 'Ginger Tabby',
    description: 'Energetic space explorer! Hyper-active, super excited.',
    baseColor: 'bg-orange-50 border-orange-200 shadow-orange-100',
    gradient: 'from-orange-400 to-amber-500',
    personality: 'enthusiastic'
  },
  {
    id: 'luna',
    name: 'Luna',
    emoji: '🐱',
    breed: 'Siamese Princess',
    description: 'Elegant, cool, and witty. Prefers sparkles and magic.',
    baseColor: 'bg-purple-50 border-purple-200 shadow-purple-100',
    gradient: 'from-pink-400 to-purple-500',
    personality: 'sassy'
  },
  {
    id: 'milo',
    name: 'Milo',
    emoji: '😸',
    breed: 'Chubby Calico',
    description: 'Sweet, sleepy foodie. Talkative and loves desserts.',
    baseColor: 'bg-emerald-50 border-emerald-200 shadow-emerald-100',
    gradient: 'from-teal-400 to-emerald-500',
    personality: 'foodie'
  },
  {
    id: 'shadow',
    name: 'Shadow',
    emoji: '🐈‍⬛',
    breed: 'Mystic Black Cat',
    description: 'Enchanted wizard cat. Uses magic runes and ancient wisdom.',
    baseColor: 'bg-slate-200 border-slate-400 shadow-slate-300',
    gradient: 'from-slate-700 to-slate-900',
    personality: 'mysterious'
  }
];

interface ThemeConfig {
  key: string;
  bgGrad: string;
  cardBg: string;
  glowColor: string;
  particleType: 'space' | 'jungle' | 'ocean' | 'library';
  textColor: string;
}

const slideThemes: ThemeConfig[] = [
  {
    key: 'q1_understand',
    bgGrad: 'from-indigo-950 via-slate-900 to-indigo-900 text-slate-100',
    cardBg: 'bg-slate-900/75 border-indigo-500/25 text-slate-100 shadow-indigo-500/10',
    glowColor: 'bg-indigo-500',
    particleType: 'space',
    textColor: 'text-indigo-400'
  },
  {
    key: 'q2_difficulty',
    bgGrad: 'from-emerald-950 via-teal-950 to-stone-900 text-stone-100',
    cardBg: 'bg-emerald-950/75 border-emerald-500/25 text-stone-100 shadow-emerald-500/10',
    glowColor: 'bg-emerald-500',
    particleType: 'jungle',
    textColor: 'text-emerald-400'
  },
  {
    key: 'q3_interest',
    bgGrad: 'from-cyan-950 via-blue-950 to-sky-900 text-sky-100',
    cardBg: 'bg-cyan-950/75 border-cyan-500/25 text-sky-100 shadow-cyan-500/10',
    glowColor: 'bg-cyan-500',
    particleType: 'ocean',
    textColor: 'text-cyan-400'
  },
  {
    key: 'q4_effort',
    bgGrad: 'from-purple-950 via-violet-900 to-amber-950 text-amber-100',
    cardBg: 'bg-purple-950/75 border-amber-500/25 text-amber-100 shadow-amber-500/10',
    glowColor: 'bg-amber-500',
    particleType: 'library',
    textColor: 'text-amber-400'
  }
];

// Dialogue Engine Builder
function getDialogue(catId: string, costumeId: string | null, questionKey: string, optionLabel: string | null) {
  const costumeReacts: Record<string, Record<string, string>> = {
    leo: {
      astronaut: "Spacesuit locked! Leo the astro-lion is ready to blast past this question! 🚀🧑‍🚀",
      pirate: "Arr! Captain Leo is sailing the high reading seas! No hard vocabulary can stop me! 🏴‍☠️🦁",
      sunglasses: "Oh yeah! These shades make me look super cool! Reading is our superpower! 😎💥",
      wizard: "Alakazam! I cast a super-concentration spell on our reading adventure! 🧙‍♂️✨",
      crown: "All hail! We are the monarchs of the reading galaxy! 👑🦁"
    },
    luna: {
      astronaut: "A helmet? I hope there is no cosmic dust in space to mess up my gorgeous fur! 🌌🐱",
      pirate: "A pirate? Fine, but as Siamese royalty, I claim all the gold and sparkly treasures! 👑🏴‍☠️",
      sunglasses: "Hmph, these stylish shades block out the haters. Tres chic, don't you think? ✨💅",
      wizard: "Abracadabra! Watch me turn these tough questions into sweet strawberry candy! 🔮🐈",
      crown: "Naturally, a crown for the true princess. You may bow to my royal reading expertise! 👑👸"
    },
    milo: {
      astronaut: "Floating like a big fluffy marshmallow in zero gravity! Space snacks are awesome! 🍩🧑‍🚀",
      pirate: "Yo-ho-ho and a plate of warm chocolate chip cookies! Set sail for the kitchen! 🍪🏴‍☠️",
      sunglasses: "Shading my eyes so I can take a cozy nap under the warm sun! Wake me up for snacks! ☀️🥱",
      wizard: "Abacadabra! Can my magic wand summon a giant double-chocolate cake right now? 🎂🧙‍♂️",
      crown: "A crown! Does this mean I get a grand royal banquet with endless desserts? 🍔👑"
    },
    shadow: {
      astronaut: "Astral navigation initiated. The cosmic gravity conforms to my mystic will! ☄️🐈‍⬛",
      pirate: "Blackbeard's ghostly guide! Let's search the reading reefs for lost scrolls! 📜🏴‍☠️",
      sunglasses: "My mystic eyes are shielded. The shadows of knowledge are easier to read now! 🕶️🐈‍⬛",
      wizard: "The starry wizard hat aligns perfectly with the ancient ley lines. My magic is complete! 🧙‍♂️🔮",
      crown: "The golden crown of infinite wisdom rests upon my brow! Behold my mental power! 👑👁️"
    }
  };

  const baseDialogues: Record<string, Record<string, string>> = {
    leo: {
      q1_understand: "WHOA! You're back! Ready to show Leo your extreme reading energy? 🚀💪",
      q2_difficulty: "How did the word obstacles feel? Smooth flight or bumpy asteroid field? ☄️",
      q3_interest: "Did you enjoy this stellar reading adventure? Was it a blast? 💥",
      q4_effort: "Did you know about this cosmic topic before, or is it a new galaxy? 🌌"
    },
    luna: {
      q1_understand: "Greetings. Let's catalog your reading performance. Show me your best! 💅🐱",
      q2_difficulty: "Were the words beneath your dignity, or were they a royal challenge? 👑",
      q3_interest: "Did this article satisfy your high-society imperial taste? 🎀",
      q4_effort: "Did you possess prior knowledge of this subject, or was it a blank slate? 📜"
    },
    milo: {
      q1_understand: "Hi there! Yum! That reading sounded delicious. How much energy did we chew up? 🍪🐾",
      q2_difficulty: "How were the word ingredients? Easy like jellybeans or hard like crunchy nuts? 🍬",
      q3_interest: "Did this story make you happy? Was it satisfying like a big bowl of ice cream? 🍦",
      q4_effort: "Did you already have this topic in your knowledge pantry? 📚"
    },
    shadow: {
      q1_understand: "The reading runes have spoken. Tell me, how much focus did you summon? 🔮🐈‍⬛",
      q2_difficulty: "Did you encounter dark word spirits, or was the path clear of fog? 🌫️",
      q3_interest: "Did the topic fuel your inner curiosity? Did you enjoy the spell? 📜",
      q4_effort: "Did your mental library contain books on this subject before today? 📚"
    }
  };

  const optionDialogues: Record<string, Record<string, Record<string, string>>> = {
    leo: {
      q1_understand: {
        'Almost none': "Zzz... Oh no! Did we crash-land? Wake up, booster rockets active! 🚀😴",
        'A little': "We are starting slowly, but every great ship starts from a stop! 🐾💥",
        'Some': "Decent velocity! We are passing the moon! 🚶‍♂️🌔",
        'A lot': "Yes! Full thrusters! We are breaking orbit! 🏃‍♂️🔥",
        'A whole lot': "SUPERNOVA! You are literally flying at light speed! 🚀🤩✨"
      },
      q2_difficulty: {
        'Very easy': "Easiest mission ever! Orbit locked in perfectly! 🎈😸",
        'Easy': "Smooth flight path! Not a scratch on our reading ship! 🌱🚀",
        'Medium': "Perfect training speed! We handled those bumps like pros! 🚲🍀",
        'Hard': "Whew! Space storm! But your reading shields held strong! 🧗💥",
        'Very Hard': "Giant black hole! But you navigated out of it! I'm so proud! ⛰️🙀🚀"
      },
      q3_interest: {
        'Did not want to finish it': "Aww... space sickness? Let's rebuild the rocket together! 💔🚀",
        'Not very fun': "Understood. The space view was a bit grey. We'll pick a cooler planet next! 🥱🪐",
        'It was okay': "Comfy space cruising! Just eating some cosmic popcorn! 🍿😺",
        'I enjoyed it': "Major fun! Stars are shining bright! I love reading with you! ⭐😻",
        'Great! I want to read more!': "WOOHOO! Universal party! Let's jump to the next galaxy! 🎉😸💫"
      },
      q4_effort: {
        'I knew nothing about it': "Zero mapping! But now we've charted a brand new star! ❓😸",
        'I knew a little': "A tiny signal! Now we've established a full radio channel! 🔍🐾",
        'I knew some things': "Space explorer database already had details! Splendid! 📚✨",
        'I knew a lot': "Wow! You are an advanced space astronomer! 🌍😻",
        'I already knew everything about it': "OMFG! You are the space king! Teach me your wisdom! 👑🦁"
      }
    },
    luna: {
      q1_understand: {
        'Almost none': "Yawn... Were you sleeping? Even my naps are more active! 😾💤",
        'A little': "A sluggish start. Let's pick up the pace, okay? 🐌💅",
        'Some': "Acceptable. You are showing some potential. 🚶‍♀️✨",
        'A lot': "Aha! Now that is what I call a royal reading standard! 🏃‍♀️🔥",
        'A whole lot': "Marvelous! Truly a sparkling masterpiece of reading! 😻💖👑"
      },
      q2_difficulty: {
        'Very easy': "Child's play! Like walking on rose petals. 🎈😽",
        'Easy': "Quite elegant. No effort required to sound brilliant. 🌱✨",
        'Medium': "A standard workout. Keeping the royal gears oiled. 🚲🎀",
        'Hard': "A bit messy, but your recovery was noble. 🧗🐾",
        'Very Hard': "A mountain of text! You survived... barely. Good job! ⛰️🙀💕"
      },
      q3_interest: {
        'Did not want to finish it': "Ugh, what a dreadful passage! Fetch me a better one! 💔😿",
        'Not very fun': "Quite dry. Let's find something with more gossip or adventure. 🥱💅",
        'It was okay': "Tolerable. Just like a standard afternoon tea. 🍿😸",
        'I enjoyed it': "Oh, I'm pleased! That was actually quite enchanting. ⭐😻",
        'Great! I want to read more!': "Fabulous! Let the reading parade continue immediately! 🎉😸👑"
      },
      q4_effort: {
        'I knew nothing about it': "An empty slate. Happy to enlighten you, explorer. ❓😸",
        'I knew a little': "A small spark of knowledge. Let's turn it into a fire. 🔍🐾",
        'I knew some things': "You are surprisingly well-read. Keep it up! 📚✨",
        'I knew a lot': "Splendid! It's always a pleasure to talk to an intellectual. 🌍😻",
        'I already knew everything about it': "Outstanding! But remember, I still know more! 😉👑"
      }
    },
    milo: {
      q1_understand: {
        'Almost none': "Munch... I fell asleep and dreamt of giant flying waffles... 😴🧇",
        'A little': "A tiny bite of effort. Let's eat some reading vitamins! 🐌🍪",
        'Some': "Chewing nicely! You're building solid reading muscles! 🚶‍♂️🥯",
        'A lot': "Whoa! You're eating through these paragraphs like a hungry puppy! 🏃‍♂️🍕",
        'A whole lot': "FEAST MODE! You devoured the entire page! Magnificent! 😻🎂🎉"
      },
      q2_difficulty: {
        'Very easy': "Easy-peasy like licking sweet strawberry syrup! 🎈😸",
        'Easy': "Soft and sweet like a fresh fluffy donut! 🌱🍩",
        'Medium': "Just like warm popcorn. A little crunch but yummy! 🚲🍿",
        'Hard': "Ouch, hard as dry dog biscuits! But we chewed it anyway! 🧗🐾",
        'Very Hard': "A giant block of frozen chocolate! Super tough but you did it! ⛰️🙀🍪"
      },
      q3_interest: {
        'Did not want to finish it': "Oh no... did it taste like cold cabbage soup? I'm sorry! 💔😿",
        'Not very fun': "A bit bland... like unsalted crackers. We need more syrup! 🥱🍪",
        'It was okay': "Tasty enough, like a nice standard bowl of cereal! 🍿😸",
        'I enjoyed it': "YUM! Like double-fudge brownies! So delicious! ⭐😻",
        'Great! I want to read more!': "A FULL FEAST! Let's open the giant candy shop of books! 🎉😸🍰"
      },
      q4_effort: {
        'I knew nothing about it': "No crumbs of this topic in my tummy before. Fresh recipe! ❓😸",
        'I knew a little': "I had a tiny nibble of it once. Let's bake a bigger cake! 🔍🐾",
        'I knew some things': "A half-baked loaf of knowledge! Now it's fully toasted! 📚✨",
        'I knew a lot': "Ah, you're a head chef on this topic! Smells delicious! 🌍😻",
        'I already knew everything about it': "A master pastry chef! You know all the secret ingredients! 👑🥐"
      }
    },
    shadow: {
      q1_understand: {
        'Almost none': "Your focus faded into the mist. Let us light a mental candle. 🔮💤",
        'A little': "A faint magical glow. Focus your spirit, apprentice! 🐌✨",
        'Some': "The reading circles are stable. The power flows steadily. 🚶‍♂️🔮",
        'A lot': "A brilliant lightning strike of focus! The runes are glowing! 🏃‍♂️⚡",
        'A whole lot': "AMAZING! The cosmic reading spell is cast at 100% power! 😻🌠🔮"
      },
      q2_difficulty: {
        'Very easy': "The reading barriers vanished like mist in the wind! 🎈😸",
        'Easy': "A smooth path. No dark spells or traps encountered. 🌱✨",
        'Medium': "A standard test of your magical reading reflexes. Perfect. 🚲🔮",
        'Hard': "High resistance! But your willpower broke through the wards! 🧗🐾",
        'Very Hard': "A cursed mountain! You showed extreme courage confronting it! ⛰️🙀💫"
      },
      q3_interest: {
        'Did not want to finish it': "A cursed scroll? Let us banish it to the dark dungeon! 💔😿",
        'Not very fun': "Dry as ancient bone dust. We shall find a more magical scroll. 🥱🔮",
        'It was okay': "The spell was neutral. Safe but simple popcorn magic. 🍿😸",
        'I enjoyed it': "The ancient spirits smile! A delightful mental elixir. ⭐😻",
        'Great! I want to read more!': "GLORIOUS! The grand grimoire of reading is wide open! 🎉😸✨"
      },
      q4_effort: {
        'I knew nothing about it': "An undiscovered realm. A brand new spell unlocked! ❓😸",
        'I knew a little': "A tiny scroll of knowledge. We have expanded it tenfold! 🔍🐾",
        'I knew some things': "Your mind's vault already contained these records. 📚✨",
        'I knew a lot': "You are an elder wizard of this topic. Absolute mastery! 🌍😻",
        'I already knew everything about it': "The archmage of the sky library! All secrets are yours! 👑🔮"
      }
    }
  };

  // Base state costume comments override
  if (costumeId && optionLabel === null) {
    return costumeReacts[catId]?.[costumeId] || "Looking super cool! ✨";
  }

  // Hover or select state comments
  if (optionLabel) {
    const optDiag = optionDialogues[catId]?.[questionKey]?.[optionLabel];
    if (optDiag) {
      if (costumeId) {
        const suffixes: Record<string, string> = {
          astronaut: " (Reporting in my astronaut gear! 🚀)",
          pirate: " (Arr, matey pirate rules! 🏴‍仇)",
          sunglasses: " (Looking cool under my shades! 😎)",
          wizard: " (Magic magic, spell complete! 🧙‍♂️)",
          crown: " (Signed by royal decree! 👑)"
        };
        return optDiag + (suffixes[costumeId] || "");
      }
      return optDiag;
    }
  }

  return baseDialogues[catId]?.[questionKey] || "Let's answer the questions together! 🐱✨";
}

export function StudentFeedbackPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const order = Number(articleOrder);

  // RPG Custom States
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [activeCostume, setActiveCostume] = useState<'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null>(null);

  // Active state handlers
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Transition directions
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentIdx];
  const selectedAnswer = answers[currentQuestion.key] ?? '';
  const isCurrentAnswered = !!selectedAnswer;

  const answeredCount = useMemo(() => {
    return questions.filter((q) => answers[q.key]).length;
  }, [answers]);

  const allAnswered = answeredCount === questions.length;

  const currentTheme = slideThemes[currentIdx];

  // Helper active cat data
  const activeCat = useMemo(() => {
    return cats.find(c => c.id === selectedCatId) || cats[0];
  }, [selectedCatId]);

  // Determine active mascot emoji and dialogue
  const activeMascot = useMemo(() => {
    const isHovered = hoveredIdx !== null;
    let emoji = currentQuestion.baseMascotEmoji;
    let labelText: string | null = null;

    if (isHovered) {
      const opt = currentQuestion.options[hoveredIdx!];
      emoji = opt.mascotEmoji;
      labelText = opt.label;
    } else if (selectedAnswer) {
      const selectedIdx = currentQuestion.options.findIndex((opt) => opt.label === selectedAnswer);
      if (selectedIdx !== -1) {
        const opt = currentQuestion.options[selectedIdx];
        emoji = opt.mascotEmoji;
        labelText = opt.label;
      }
    }

    // Shadow black cat maps to actual kitty emoji
    if (selectedCatId === 'shadow') {
      if (emoji === '🐱') emoji = '🐈‍⬛';
      else if (emoji === '😺') emoji = '😸';
      else if (emoji === '😾') emoji = '🐈‍⬛';
    } else if (selectedCatId === 'leo') {
      if (emoji === '🐱') emoji = '🦁';
      else if (emoji === '😺') emoji = '😸';
    }

    return {
      emoji,
      dialogue: getDialogue(selectedCatId || 'leo', activeCostume, currentQuestion.key, labelText),
      isHovered,
    };
  }, [hoveredIdx, selectedAnswer, currentQuestion, selectedCatId, activeCostume]);

  function selectOption(optionLabel: string) {
    synth.playSelect();
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: optionLabel }));
    
    // Smooth auto-advance to next question if not the last slide
    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 550); // slight tactile delay to let child enjoy the feedback pop/accessories
    }
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setSlideDirection('next');
      setIsTransitioning(true);
      setHoveredIdx(null);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 350); // match transition duration
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setSlideDirection('prev');
      setIsTransitioning(true);
      setHoveredIdx(null);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setIsTransitioning(false);
      }, 350); // match transition duration
    }
  }

  function handleSubmit() {
    if (!allAnswered) return;

    setSession({
      ...session,
      records: {
        ...session.records,
        [order]: {
          ...session.records[order],
          studentFeedback: questions.map((q) => answers[q.key] ?? ''),
        },
      },
    });
    synth.playSuccess();
    navigate(`/session/${id}/tutor-feedback/${order}`);
  }

  // Parse label to highlight keyword with dynamic theme tags
  const parsedLabel = useMemo(() => {
    const [before, after] = currentQuestion.label.split('{h}');
    return (
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
        {before}
        <span className={`inline-block mx-1.5 px-3 py-1 rounded-2xl font-black text-white transform rotate-[-1.5deg] shadow-lg select-none transition-all duration-300 ${
          currentQuestion.themeColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
          currentQuestion.themeColor === 'purple' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
          currentQuestion.themeColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
          'bg-gradient-to-r from-blue-400 to-sky-500'
        }`}>
          {currentQuestion.highlight}
        </span>
        {after}
      </h2>
    );
  }, [currentQuestion]);

  // Interactive wardrobe absolute overlays
  const renderCostumeOverlay = () => {
    if (!activeCostume) return null;
    
    switch (activeCostume) {
      case 'astronaut':
        return (
          <div className="absolute inset-[-4px] rounded-full border-4 border-cyan-300 bg-cyan-200/20 animate-pulse flex items-center justify-center z-20">
            <span className="absolute bottom-1 right-2 text-2xl">🚀</span>
          </div>
        );
      case 'pirate':
        return (
          <>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-5xl rotate-[-10deg] drop-shadow z-20 select-none">🏴‍☠️</span>
            <div className="absolute top-[47%] left-[32%] w-5 h-5 rounded-full bg-slate-900 border border-slate-700 z-20" />
            <div className="absolute top-[42%] left-[24%] w-9 h-0.5 bg-slate-900 rotate-[15deg] z-20" />
          </>
        );
      case 'sunglasses':
        return (
          <span className="absolute top-[38%] left-1/2 -translate-x-1/2 text-6xl drop-shadow z-20 select-none animate-bounce" style={{ animationDuration: '2.5s' }}>🕶️</span>
        );
      case 'wizard':
        return (
          <>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-6.5xl rotate-[-5deg] drop-shadow z-20 select-none">🧙‍♂️</span>
            <span className="absolute top-1/2 -left-4 text-2xl animate-spin" style={{ animationDuration: '4s' }}>✨</span>
            <span className="absolute top-1/3 -right-4 text-2xl animate-bounce">🔮</span>
          </>
        );
      case 'crown':
        return (
          <>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl rotate-[4deg] drop-shadow-md animate-bounce z-20 select-none" style={{ animationDuration: '3.5s' }}>👑</span>
            <span className="absolute -top-3 -right-2 text-xl animate-pulse">✨</span>
          </>
        );
      default:
        return null;
    }
  };

  // Render CSS floating background particles
  const renderThemeParticles = (type: 'space' | 'jungle' | 'ocean' | 'library') => {
    if (type === 'jungle') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-float-leaf1" style={{ left: '15%', top: '-10%', animationDelay: '0s' }}>🍃</span>
          <span className="absolute text-xl animate-float-leaf2" style={{ left: '45%', top: '-10%', animationDelay: '1.2s' }}>🍂</span>
          <span className="absolute text-2xl animate-float-leaf3" style={{ left: '75%', top: '-10%', animationDelay: '0.6s' }}>🍁</span>
          <span className="absolute text-yellow-300 text-lg animate-pulse" style={{ left: '25%', top: '40%', animationDelay: '0.2s' }}>✨</span>
          <span className="absolute text-yellow-200 text-xl animate-pulse" style={{ right: '20%', bottom: '30%', animationDelay: '0.8s' }}>✨</span>
          <span className="absolute text-yellow-300 text-sm animate-pulse" style={{ left: '50%', bottom: '15%', animationDelay: '1.5s' }}>✨</span>
        </div>
      );
    }
    
    if (type === 'ocean') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-float-bubble1" style={{ left: '20%', bottom: '-10%', animationDelay: '0s' }}>🫧</span>
          <span className="absolute text-3xl animate-float-bubble2" style={{ left: '50%', bottom: '-10%', animationDelay: '0.8s' }}>🫧</span>
          <span className="absolute text-xl animate-float-bubble3" style={{ left: '80%', bottom: '-10%', animationDelay: '0.4s' }}>🫧</span>
          <span className="absolute text-2xl animate-swim-fish" style={{ right: '15%', top: '30%', animationDelay: '1s' }}>🐠</span>
          <span className="absolute text-3xl animate-swim-fish" style={{ left: '10%', top: '60%', animationDelay: '2s' }}>🐙</span>
        </div>
      );
    }

    if (type === 'library') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-spin-star" style={{ left: '15%', top: '15%', animationDelay: '0s' }}>⭐</span>
          <span className="absolute text-3xl animate-spin-star" style={{ right: '15%', top: '25%', animationDelay: '0.5s' }}>✨</span>
          <span className="absolute text-2xl animate-spin-star" style={{ left: '40%', bottom: '15%', animationDelay: '1.2s' }}>📚</span>
          <span className="absolute text-xl animate-bounce" style={{ left: '70%', top: '40%', animationDelay: '0.2s' }}>📖</span>
          <span className="absolute text-amber-300 font-bold text-lg animate-pulse" style={{ left: '25%', top: '65%', animationDelay: '0.8s' }}>🔤</span>
          <span className="absolute text-amber-200 font-bold text-xl animate-pulse" style={{ right: '35%', bottom: '35%', animationDelay: '1.8s' }}>🔮</span>
        </div>
      );
    }
    
    // space default
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute text-xl animate-float-meteor1" style={{ left: '15%', bottom: '-10%', animationDelay: '0s' }}>☄️</span>
        <span className="absolute text-2xl animate-float-meteor2" style={{ left: '45%', bottom: '-10%', animationDelay: '0.7s' }}>🪐</span>
        <span className="absolute text-3xl animate-float-meteor3" style={{ right: '15%', bottom: '-10%', animationDelay: '1.4s' }}>🛸</span>
        <span className="absolute text-indigo-300 text-sm animate-pulse" style={{ left: '30%', top: '20%', animationDelay: '0.2s' }}>✨</span>
        <span className="absolute text-purple-300 text-xs animate-pulse" style={{ right: '25%', top: '40%', animationDelay: '0.9s' }}>✨</span>
      </div>
    );
  };

  // If Cat Companion has not been chosen yet, show Landing character selector
  if (selectedCatId === null) {
    return (
      <Layout title={`Choose Companion · Article ${order}`} backTo={`/session/${id}/read/${order}`}>
        <style>{`
          @keyframes pop-bounce {
            0% { transform: scale(0.9); opacity: 0; }
            70% { transform: scale(1.02); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop-bounce {
            animation: pop-bounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
        
        <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6 select-none animate-pop-bounce text-slate-800">
          <div className="text-center flex flex-col gap-3 mb-10">
            <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent py-1 leading-tight drop-shadow-sm">
              Choose Your Reading Companion!
            </h1>
            <p className="text-slate-500 text-base sm:text-lg font-bold">
              Pick a cute pet cat to join your journey and help you fill out the feedback!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {cats.map((catCompanion) => (
              <button
                key={catCompanion.id}
                onClick={() => {
                  synth.playMeow();
                  setSelectedCatId(catCompanion.id);
                }}
                onMouseEnter={() => synth.playHover()}
                className="group flex flex-col items-center p-5 bg-white border-2 border-b-[8px] border-slate-200 border-b-slate-350 rounded-3xl hover:border-emerald-400 hover:border-b-emerald-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-1.5 active:translate-y-0 active:border-b-2 text-center cursor-pointer"
              >
                {/* Cat Avatar Circle */}
                <div className={`h-24 w-24 rounded-full flex items-center justify-center border-4 border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-250 ${catCompanion.baseColor}`}>
                  <span className="text-5xl select-none leading-none inline-block group-hover:rotate-[6deg] transition-transform">{catCompanion.emoji}</span>
                </div>

                {/* Cat Name & Breed */}
                <h3 className="text-lg font-black text-slate-800 mt-4 leading-none">{catCompanion.name}</h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wider">{catCompanion.breed}</span>
                
                {/* Description */}
                <p className="text-xs font-bold text-slate-500 mt-3 leading-relaxed flex-1">
                  {catCompanion.description}
                </p>

                {/* Selection Button */}
                <div className={`mt-4 w-full py-2 rounded-xl text-white font-extrabold text-sm transition-all shadow-md bg-gradient-to-r ${catCompanion.gradient} group-hover:brightness-105 active:scale-95`}>
                  Choose {catCompanion.name} 🐾
                </div>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Student Feedback · Article ${order}`} backTo={`/session/${id}/read/${order}`}>
      {/* Dynamic Keyframes CSS Injector */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes breathe-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes pop-bounce {
          0% { transform: scale(0.85) translateY(10px); opacity: 0; }
          70% { transform: scale(1.03) translateY(-3px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes slide-in-next {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-prev {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.08); }
        }

        /* Ambient floating keyframes */
        @keyframes float-meteor-anim {
          0% { transform: translateY(120px) rotate(0deg) scale(0.8); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-120px) rotate(360deg) scale(1.1); opacity: 0; }
        }
        @keyframes float-leaf-anim {
          0% { transform: translateY(-30px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(220px) translateX(40px) rotate(240deg); opacity: 0; }
        }
        @keyframes float-bubble-anim {
          0% { transform: translateY(120px) scale(0.6); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { transform: translateY(-120px) scale(1.1); opacity: 0; }
        }
        @keyframes swim-fish-anim {
          0%, 100% { transform: translateX(0) translateY(0) scaleX(1); }
          49% { transform: translateX(30px) translateY(-8px) scaleX(1); }
          50% { transform: translateX(30px) translateY(-8px) scaleX(-1); }
          99% { transform: translateX(0) translateY(0) scaleX(-1); }
        }
        @keyframes spin-star-item {
          0% { transform: scale(0.5) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
          100% { transform: scale(0.6) rotate(360deg); opacity: 0; }
        }
        
        .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
        .animate-breathe-slow { animation: breathe-slow 3.5s ease-in-out infinite; }
        .animate-pop-bounce { animation: pop-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-glow { animation: glow-pulse 4s ease-in-out infinite; }
        
        .slide-enter-next { animation: slide-in-next 0.32s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .slide-enter-prev { animation: slide-in-prev 0.32s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

        /* Assigning particle animations */
        .animate-float-meteor1 { animation: float-meteor-anim 3.5s ease-in-out infinite; }
        .animate-float-meteor2 { animation: float-meteor-anim 4.2s ease-in-out infinite 0.8s; }
        .animate-float-meteor3 { animation: float-meteor-anim 3.8s ease-in-out infinite 1.6s; }
        
        .animate-float-leaf1 { animation: float-leaf-anim 4.5s linear infinite; }
        .animate-float-leaf2 { animation: float-leaf-anim 5.2s linear infinite 1.2s; }
        .animate-float-leaf3 { animation: float-leaf-anim 4.8s linear infinite 2.4s; }
        
        .animate-float-bubble1 { animation: float-bubble-anim 3.2s ease-in-out infinite; }
        .animate-float-bubble2 { animation: float-bubble-anim 4s ease-in-out infinite 0.7s; }
        .animate-float-bubble3 { animation: float-bubble-anim 3.6s ease-in-out infinite 1.5s; }
        .animate-swim-fish { animation: swim-fish-anim 6s ease-in-out infinite; }
        
        .animate-spin-star { animation: spin-star-item 2.5s ease-in-out infinite; }

        .btn-3d {
          transition: all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        .btn-3d:active {
          transform: translateY(3px);
          border-bottom-width: 2px !important;
        }
      `}</style>

      {/* Main morphing container */}
      <div className={`mx-auto max-w-6xl py-4 flex flex-col gap-6 select-none px-4 sm:px-6 transition-all duration-700 rounded-3xl p-6 shadow-2xl border border-white/10 bg-gradient-to-br ${currentTheme.bgGrad}`}>
        
        {/* Progress Header */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 px-1 tracking-wider">
            <span className="opacity-80">COMPANION: {activeCat.name.toUpperCase()} ({activeCat.breed.toUpperCase()})</span>
            <span className="bg-white/10 text-slate-200 px-3 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
          </div>

          {/* Gamified Duolingo-style Progress Bar */}
          <div className="h-4.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5 relative border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500 ease-out shadow-md relative"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-1/3 skew-x-12 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Core Double-Panel Content Layout */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-start min-h-[480px] transition-all duration-320 ${
            isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
          } ${
            slideDirection === 'next' ? 'slide-enter-next' : 'slide-enter-prev'
          }`}
        >
          
          {/* LEFT PANEL: Interactive Mascot Playground */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center bg-black/15 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-6 text-center min-h-[380px] md:min-h-[440px] shadow-lg relative overflow-hidden group">
            
            {/* Ambient colorful background glow matching the question theme */}
            <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 filter blur-2xl transition-all duration-700 animate-glow ${currentTheme.glowColor}`} />

            {/* Floating Reactive Particle System Background Container */}
            {renderThemeParticles(currentTheme.particleType)}

            {/* Elastic Speech Bubble */}
            <div 
              key={activeMascot.dialogue}
              className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-sm md:text-base text-center max-w-sm w-full leading-relaxed animate-pop-bounce mb-6 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 before:content-[''] before:absolute before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-[9px] before:border-transparent before:border-t-slate-200/90 z-10"
            >
              {activeMascot.dialogue}
            </div>

            {/* Breathing Mascot Circle Container */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center transition-all duration-300 animate-float-slow z-10">
              
              <div className="absolute inset-4 rounded-full bg-white/5 filter blur(6px)" />

              {/* Big Expressive Cartoon Cat Emoji */}
              <span className="text-6.5xl md:text-7.5xl select-none leading-none inline-block transform transition-transform duration-200 hover:scale-105 active:rotate-6">
                {activeMascot.emoji}
              </span>

              {/* Responsive accessory decorations / skins */}
              {renderCostumeOverlay()}

            </div>

            {/* Interactive Dressing Closet Closet Shelf */}
            <div className="mt-6 w-full max-w-xs bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-2 shadow-md z-10">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 text-center">🐾 Outfit Wardrobe 🐾</p>
              <div className="flex justify-around items-center gap-1">
                {[
                  { id: 'none', label: 'Base', emoji: '🐱' },
                  { id: 'astronaut', label: 'Space', emoji: '🧑‍🚀' },
                  { id: 'pirate', label: 'Pirate', emoji: '🏴‍☠️' },
                  { id: 'sunglasses', label: 'Cool', emoji: '😎' },
                  { id: 'wizard', label: 'Wizard', emoji: '🧙‍♂️' },
                  { id: 'crown', label: 'Royal', emoji: '👑' }
                ].map((closetItem) => {
                  const isEquipped = activeCostume === closetItem.id || (closetItem.id === 'none' && !activeCostume);
                  return (
                    <button
                      key={closetItem.id}
                      onClick={() => {
                        synth.playCostume();
                        setActiveCostume(closetItem.id === 'none' ? null : closetItem.id as any);
                      }}
                      className={`h-11 w-11 flex flex-col items-center justify-center rounded-xl border border-b-4 transition-all ${
                        isEquipped
                          ? 'bg-amber-500/30 border-amber-400 border-b-amber-500 text-white scale-105 shadow-md shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 border-b-white/20 hover:bg-white/10 text-slate-300 hover:translate-y-[-1px]'
                      }`}
                      title={`Equip ${closetItem.label}`}
                    >
                      <span className="text-lg leading-none">{closetItem.emoji}</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">{closetItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Question presentation & Tactile 3D Option Grid */}
          <div className="col-span-1 md:col-span-7 flex flex-col gap-5">
            
            {/* Header Presentation Block */}
            <div className="bg-black/20 rounded-3xl border border-white/5 p-5 md:p-6 shadow-md flex flex-col gap-2 relative overflow-hidden">
              {parsedLabel}
              <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
                {currentQuestion.description}
              </p>
            </div>

            {/* Tactile 3D Option Cards Vertical Stack */}
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt.label;
                const isHovered = hoveredIdx === idx;
                
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectOption(opt.label)}
                    onMouseEnter={() => {
                      synth.playHover();
                      setHoveredIdx(idx);
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`btn-3d group relative flex items-center gap-4 p-3.5 md:p-4 rounded-2xl border-2 border-b-[5px] transition-all cursor-pointer text-left w-full select-none ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-white border-b-emerald-600 shadow-md ring-4 ring-emerald-500/15 scale-[1.01] z-10 translate-y-[-1px]'
                        : isHovered
                        ? 'border-white/30 bg-white/10 text-white border-b-white/40 translate-y-[-2px] shadow-sm'
                        : 'border-white/10 bg-white/5 text-slate-200 border-b-white/20'
                    }`}
                  >
                    
                    {/* Unique Hotkey index badge */}
                    <span className={`h-6 w-6 flex items-center justify-center rounded-lg border text-[10px] font-black select-none ${
                      isSelected 
                        ? 'border-emerald-300 bg-emerald-500/30 text-emerald-200' 
                        : 'border-white/10 bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:border-white/20'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Gigantic Card Emoji */}
                    <span className={`text-3.5xl md:text-4.5xl select-none leading-none transition-transform duration-200 ${
                      isSelected 
                        ? 'scale-110 rotate-6' 
                        : 'group-hover:scale-115 group-hover:rotate-[-4deg]'
                    }`}>
                      {opt.emoji}
                    </span>

                    {/* Choice Text Label */}
                    <span className={`flex-1 font-extrabold text-xs md:text-sm pr-4 leading-tight transition-colors ${
                      isSelected ? 'text-white font-black' : 'text-slate-200 group-hover:text-white'
                    }`}>
                      {opt.label}
                    </span>

                    {/* Interactive Selection Checkmark Marker */}
                    {isSelected && (
                      <span className="h-5.5 w-5.5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow animate-bounce">
                        ✓
                      </span>
                    )}

                  </button>
                );
              })}
            </div>
            
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex justify-between items-center border-t border-white/10 pt-5 mt-2">
          
          {/* Previous Slide Button */}
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-5 font-bold shadow-sm border border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            ← Previous
          </Button>

          {/* Indicator slider dots */}
          <div className="hidden sm:flex gap-2.5">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIdx
                    ? 'w-6 bg-white shadow'
                    : answers[questions[idx].key]
                    ? 'w-2 bg-emerald-400 shadow-sm'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Next / Submit Button */}
          {currentIdx === questions.length - 1 ? (
            <Button
              size="lg"
              variant="primary"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-8 flex items-center gap-2 font-extrabold transition-all duration-150 shadow border-b-[5px] border-emerald-700 active:border-b-0 active:translate-y-[4px] active:scale-95 ${
                allAnswered 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none' 
                  : 'opacity-50'
              }`}
            >
              🎉 Finish & Submit
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex items-center gap-1.5 px-8 font-bold disabled:opacity-50"
            >
              Next Question →
            </Button>
          )}

        </div>

      </div>
    </Layout>
  );
}

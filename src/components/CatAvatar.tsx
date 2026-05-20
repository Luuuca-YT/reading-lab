
// ==========================================
// DATA STRUCTURES & COMPATIBILITY
// ==========================================
export interface CatCompanion {
  id: string;
  name: string;
  emoji: string;
  breed: string;
  description: string;
  baseColor: string;
  gradient: string;
  personality: string;
}

export const cats: CatCompanion[] = [
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

// Dialogue Engine Builder
export function getDialogue(catId: string, costumeId: string | null, questionKey: string, optionLabel: string | null) {
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
          pirate: " (Arr, matey pirate rules! 🏴‍☠️)",
          sunglasses: " (Looking cool under my shades! 😎)",
          wizard: " (Magic magic, spell complete! 🧙‍♂️)",
          crown: " (Signed by royal decree! 👑)"
        };
        return optDiag + (suffixes[costumeId] || "");
      }
      return optDiag;
    }
  }

  return baseDialogues[catId]?.[questionKey] || "Let's read and enjoy together! 🐱✨";
}

// Deprecated: costumes are now drawn in pixel-perfect SVG vectors inside CatAvatar!
export function renderCostumeOverlay(_activeCostume: string | null) {
  return null;
}

export interface CatAvatarProps {
  catId: string;
  expression: 'neutral' | 'happy' | 'excited' | 'smug' | 'shocked' | 'sad' | 'angry' | 'sleepy';
  activeCostume?: 'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null;
  className?: string;
}

export function CatAvatar({ catId, expression, activeCostume = null, className = "w-full h-full" }: CatAvatarProps) {
  let headColor = '#fb923c';       // default orange
  let stripeColor = '#ea580c';     // dark orange
  let earColor = '#fb923c';
  let innerEarColor = '#ffccd5';
  let snoutColor = '#ffedd5';      // snout cream backing
  let noseColor = '#f87171';       // nose pink
  let eyeColor = '#3f2b18';        // default dark eyes
  let hasStripes = false;
  let hasPatches = false;
  let isSiamese = false;

  if (catId === 'leo') {
    headColor = '#fb923c'; // bright ginger orange
    stripeColor = '#d97706';
    earColor = '#fb923c';
    innerEarColor = '#ffccd5';
    snoutColor = '#ffedd5';
    noseColor = '#fb7185';
    eyeColor = '#3f2b18';
    hasStripes = true; // Leo ginger stripes!
  } else if (catId === 'luna') {
    headColor = '#f5f5f4'; // royal cream
    earColor = '#451a03';  // chocolate ears
    innerEarColor = '#f472b6'; // hot pink inner
    snoutColor = '#451a03';  // chocolate face points mask
    noseColor = '#db2777';
    eyeColor = '#06b6d4';  // glowing crystal ice-blue eyes
    isSiamese = true;
  } else if (catId === 'milo') {
    headColor = '#e7e5e4'; // soft tabby grey
    earColor = '#e7e5e4';
    innerEarColor = '#fda4af';
    snoutColor = '#ffffff';
    noseColor = '#fb7185';
    eyeColor = '#1e1b4b';
    hasPatches = true; // Milo cute multi patches
  } else if (catId === 'shadow') {
    headColor = '#1e293b'; // midnight deep charcoal
    stripeColor = '#0f172a';
    earColor = '#1e293b';
    innerEarColor = '#c084fc'; // mystical purple
    snoutColor = '#0f172a';
    noseColor = '#a855f7';
    eyeColor = '#eab308'; // glowing yellow/gold eyes
  }

  // Render SVG eyes based on expression state
  const renderEyes = () => {
    switch (expression) {
      case 'happy':
        return (
          <>
            <path d="M19,48 Q26,37 33,48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M67,48 Q74,37 81,48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
          </>
        );
      case 'excited':
        return (
          <>
            <path d="M19,45 C14,37 27,33 27,44 C27,33 40,37 35,45 L27,53 Z" fill="#f43f5e" />
            <path d="M65,45 C60,37 73,33 73,44 C73,33 86,37 81,45 L73,53 Z" fill="#f43f5e" />
          </>
        );
      case 'smug':
        return (
          <>
            {/* Winking Left Eye */}
            <path d="M19,48 Q26,54 33,48" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
            {/* Smug Right Eye */}
            <ellipse cx="74" cy="46" rx="8.5" ry="6.5" fill="#fff" stroke={eyeColor} strokeWidth="3" />
            <circle cx="76.5" cy="46" r="4.5" fill={eyeColor} />
          </>
        );
      case 'shocked':
        return (
          <>
            <circle cx="26" cy="45" r="10.5" fill="#fff" stroke={eyeColor} strokeWidth="3" />
            <circle cx="26" cy="45" r="4" fill={eyeColor} />
            <circle cx="74" cy="45" r="10.5" fill="#fff" stroke={eyeColor} strokeWidth="3" />
            <circle cx="74" cy="45" r="4" fill={eyeColor} />
          </>
        );
      case 'sad':
        return (
          <>
            <path d="M19,43 Q26,52 33,44" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M67,43 Q74,52 81,44" fill="none" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
            {/* Hanging teardrops */}
            <path d="M16,50 C16,55 13,58 13,60 C13,62 16,62 16,60 Z" fill="#3b82f6" />
            <path d="M84,50 C84,55 87,58 87,60 C87,62 84,62 84,60 Z" fill="#3b82f6" />
          </>
        );
      case 'angry':
        return (
          <>
            {/* Furious eyebrows */}
            <line x1="17" y1="33" x2="33" y2="41" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="83" y1="33" x2="67" y2="41" stroke={eyeColor} strokeWidth="4.5" strokeLinecap="round" />
            {/* Angered eyes */}
            <path d="M19,46 Q26,42 33,46 Q26,50 19,46" fill={eyeColor} />
            <path d="M67,46 Q74,42 81,46 Q74,50 67,46" fill={eyeColor} />
          </>
        );
      case 'sleepy':
        return (
          <>
            <line x1="18" y1="46" x2="34" y2="46" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
            <line x1="66" y1="46" x2="82" y2="46" stroke={eyeColor} strokeWidth="5.5" strokeLinecap="round" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            <ellipse cx="26" cy="45" rx="8" ry="10" fill="#fff" stroke={eyeColor} strokeWidth="3" />
            <circle cx="26" cy="45" r="4.5" fill={eyeColor} />
            <circle cx="24" cy="42.5" r="1.8" fill="#fff" />
            
            <ellipse cx="74" cy="45" rx="8" ry="10" fill="#fff" stroke={eyeColor} strokeWidth="3" />
            <circle cx="74" cy="45" r="4.5" fill={eyeColor} />
            <circle cx="72" cy="42.5" r="1.8" fill="#fff" />
          </>
        );
    }
  };

  // Render SVG mouth based on expression state
  const renderMouth = () => {
    switch (expression) {
      case 'happy':
        return (
          <path d="M41,66 Q50,79 59,66 Q50,68 41,66 Z" fill="#f43f5e" stroke="#3f2b18" strokeWidth="2" />
        );
      case 'excited':
        return (
          <ellipse cx="50" cy="71" rx="6.5" ry="9" fill="#f43f5e" stroke="#3f2b18" strokeWidth="2" />
        );
      case 'smug':
        return (
          <path d="M40,64 Q50,74 57,64" fill="none" stroke="#3f2b18" strokeWidth="3.5" strokeLinecap="round" />
        );
      case 'shocked':
        return (
          <circle cx="50" cy="71" r="5" fill="#f43f5e" stroke="#3f2b18" strokeWidth="2" />
        );
      case 'sad':
        return (
          <path d="M41,70 Q50,61 59,70" fill="none" stroke="#3f2b18" strokeWidth="3.5" strokeLinecap="round" />
        );
      case 'angry':
        return (
          <line x1="41" y1="69" x2="59" y2="69" stroke="#3f2b18" strokeWidth="4" strokeLinecap="round" />
        );
      case 'sleepy':
        return (
          <circle cx="50" cy="69" r="3.5" fill="#ef4444" opacity="0.85" />
        );
      case 'neutral':
      default:
        return (
          <path d="M39,65 Q44.5,70 50,65 Q55.5,70 61,65" fill="none" stroke="#3f2b18" strokeWidth="3.2" strokeLinecap="round" />
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transition: 'all 0.2s ease-in-out', overflow: 'visible' }}>
        {/* Ear polygons */}
        {/* Left Ear */}
        <polygon 
          points="14,35 2,2 35,21" 
          fill={earColor} 
          stroke={catId === 'shadow' ? '#334155' : 'none'}
          strokeWidth="1.5"
        />
        <polygon points="16,31 7,8 31,20" fill={innerEarColor} />

        {/* Right Ear */}
        <polygon 
          points="86,35 98,2 65,21" 
          fill={earColor} 
          stroke={catId === 'shadow' ? '#334155' : 'none'}
          strokeWidth="1.5"
        />
        <polygon points="84,31 93,8 69,20" fill={innerEarColor} />

        {/* Main Head Circle */}
        <ellipse 
          cx="50" 
          cy="54" 
          rx="43" 
          ry="36" 
          fill={headColor} 
          stroke={catId === 'shadow' ? '#334155' : 'none'}
          strokeWidth="1.5"
        />

        {/* Patches for Milo (Calico) */}
        {hasPatches && (
          <>
            {/* Left orange calico patch */}
            <path d="M8,48 Q23,30 35,45 Q27,67 12,60 Z" fill="#fb923c" opacity="0.95" />
            {/* Right stone calico patch */}
            <path d="M92,48 Q77,30 65,45 Q73,67 88,60 Z" fill="#44403c" opacity="0.95" />
          </>
        )}

        {/* Stripes for Leo (Ginger) */}
        {hasStripes && (
          <>
            {/* Top of head stripes */}
            <path d="M45,20 L50,32 L55,20 Z" fill={stripeColor} />
            <path d="M35,22 L41,30 L43,22 Z" fill={stripeColor} />
            <path d="M65,22 L59,30 L57,22 Z" fill={stripeColor} />
            {/* Cheek side stripes */}
            <path d="M8,50 L22,52 L17,47 Z" fill={stripeColor} />
            <path d="M8,58 L20,59 L16,54 Z" fill={stripeColor} />
            <path d="M92,50 L78,52 L83,47 Z" fill={stripeColor} />
            <path d="M92,58 L80,59 L84,54 Z" fill={stripeColor} />
          </>
        )}

        {/* Siamese Snout Mask */}
        {isSiamese && (
          <ellipse cx="50" cy="58" rx="24" ry="17" fill={snoutColor} />
        )}

        {/* Pink Blushing Cheeks */}
        {(expression === 'happy' || expression === 'excited' || expression === 'smug') && (
          <>
            <circle cx="20" cy="59" r="6" fill="#f43f5e" opacity="0.35" />
            <circle cx="80" cy="59" r="6" fill="#f43f5e" opacity="0.35" />
          </>
        )}

        {/* Cute Whiskers */}
        <line x1="9" y1="56" x2="-4" y2="54" stroke={catId === 'shadow' ? '#475569' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="61" x2="-5" y2="62" stroke={catId === 'shadow' ? '#475569' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="91" y1="56" x2="104" y2="54" stroke={catId === 'shadow' ? '#475569' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
        <line x1="92" y1="61" x2="105" y2="62" stroke={catId === 'shadow' ? '#475569' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />

        {/* Draw Dynamic eyes */}
        {renderEyes()}

        {/* Snout Backing for non-siamese */}
        {!isSiamese && (
          <ellipse cx="50" cy="62" rx="13" ry="9" fill={snoutColor} />
        )}

        {/* Small triangle Nose */}
        <polygon points="46.5,59 53.5,59 50,63.5" fill={noseColor} />

        {/* Draw dynamic mouth */}
        {renderMouth()}

        {/* Vector SVG wardrobe overlays sitting perfectly relative to cat head */}
        {activeCostume === 'pirate' && (
          <>
            {/* Pirate strap across head */}
            <path d="M12,28 L88,64" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            {/* Pirate eyepatch over left eye (centered at cx=26, cy=45) */}
            <ellipse cx="26" cy="46" rx="12" ry="11" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
            {/* Golden skull/cross design inside eyepatch */}
            <circle cx="26" cy="46" r="3" fill="#eab308" />
            <line x1="23" y1="43" x2="29" y2="49" stroke="#eab308" strokeWidth="1.2" />
            <line x1="29" y1="43" x2="23" y2="49" stroke="#eab308" strokeWidth="1.2" />
            {/* Small pirate hat above head */}
            <path d="M30,17 C35,7 40,4 50,4 C60,4 65,7 70,17 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <path d="M22,17 Q50,11 78,17" fill="none" stroke="#ef4444" strokeWidth="3" />
            <circle cx="50" cy="10" r="2.5" fill="#fcfcfc" />
          </>
        )}

        {activeCostume === 'sunglasses' && (
          <>
            {/* Sunglasses frame and sides */}
            <path d="M6,40 L16,43" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M94,40 L84,43" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            {/* Left lens */}
            <path d="M14,40 C14,40 22,34 34,38 C38,40 38,53 30,54 C22,55 14,48 14,40 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            {/* Right lens */}
            <path d="M86,40 C86,40 78,34 66,38 C62,40 62,53 70,54 C78,55 86,48 86,40 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            {/* Bridge */}
            <path d="M34,42 Q50,38 66,42" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            {/* Glares */}
            <line x1="18" y1="42" x2="24" y2="48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="70" y1="42" x2="76" y2="48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </>
        )}

        {activeCostume === 'wizard' && (
          <>
            {/* Wizard Hat Base and Cone sitting at y=17 */}
            <path d="M12,20 C12,20 50,11 88,20 L80,16 C80,16 50,7 20,16 Z" fill="#581c87" />
            <path d="M22,17 L50,-18 L78,17 Z" fill="#6b21a8" />
            {/* Wizard hat band */}
            <path d="M22,17 Q50,11 78,17 L76,14 Q50,8 24,14 Z" fill="#eab308" />
            {/* Stars details on wizard hat */}
            <polygon points="50,-4 52,-1 55,-1 53,1 54,4 50,2 46,4 47,1 45,-1 48,-1" fill="#fef08a" />
            <polygon points="40,5 42,7 45,7 43,9 44,12 40,10 36,12 37,9 35,7 38,7" fill="#fef08a" />
          </>
        )}

        {activeCostume === 'crown' && (
          <>
            {/* Gold Crown sitting at y=17 */}
            <path d="M26,17 L22,2 L34,10 L50,-4 L66,10 L78,2 L74,17 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            {/* Crown base band */}
            <path d="M26,17 L74,17 L72,13 L28,13 Z" fill="#d97706" />
            {/* Jewels on peaks */}
            <circle cx="22" cy="2" r="2.5" fill="#ef4444" />
            <circle cx="50" cy="-4" r="3" fill="#3b82f6" />
            <circle cx="78" cy="2" r="2.5" fill="#ec4899" />
            {/* Jewels on base band */}
            <circle cx="38" cy="15" r="1.5" fill="#3b82f6" />
            <circle cx="50" cy="15" r="1.5" fill="#ef4444" />
            <circle cx="62" cy="15" r="1.5" fill="#10b981" />
          </>
        )}

        {activeCostume === 'astronaut' && (
          <>
            {/* Translucent cyan helmet bubble over the head */}
            <circle cx="50" cy="52" r="47" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 2" />
            {/* Helmet glare highlight */}
            <path d="M15,25 Q50,5 85,25" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3" strokeLinecap="round" />
            {/* Tiny mic control */}
            <path d="M85,75 Q92,85 88,87" fill="none" stroke="#64748b" strokeWidth="2" />
            <circle cx="88" cy="87" r="2" fill="#ef4444" />
          </>
        )}
      </svg>
      {renderCostumeOverlay(activeCostume)}
    </div>
  );
}

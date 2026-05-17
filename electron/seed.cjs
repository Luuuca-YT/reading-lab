const { getDb, closeDb } = require('./database.cjs');

const articles = [
  {
    title: 'The Lost Kitten',
    content:
      'Emma was walking home from school when she heard a tiny sound. It was coming from behind a big oak tree. She looked closer and saw a small gray kitten. It was all alone and looked very scared. Emma picked it up gently. "Where is your home?" she asked softly. The kitten just mewed. Emma carried it to her house. Her mom gave it some milk. Together, they put up signs in the neighborhood. The next day, a little girl named Mia came to their door. She had been looking everywhere for her kitten! Mia was so happy to see her pet again. She thanked Emma with a big smile.',
    difficulty: 1,
    story_group: 'A',
    sort_order: 1,
  },
  {
    title: 'A Rainy Day Adventure',
    content:
      'Max stared out the window. Rain was falling hard, and he could not go outside to play. "What should I do?" he thought. He looked around his room and saw an old map on his desk. It was a map his grandpa gave him last summer. Max spread the map across his floor. It showed a treasure path through the house! First, he went to the kitchen. Under the table, he found a small box with cookies inside. Next, he went to the living room. Behind the sofa, he found a new pack of colored pencils. Last, he went to his own closet. Inside a shoe box, he found a note that said, "The best treasure is your imagination." Max smiled and sat down to draw.',
    difficulty: 2,
    story_group: 'A',
    sort_order: 2,
  },
  {
    title: 'The Star Project',
    content:
      'Lily’s class was doing a science project about stars. Every student had to pick one star and learn everything about it. Lily picked Sirius, the brightest star in the night sky. She read three books about stars. She learned that Sirius is actually two stars, not one. They spin around each other in space. She also learned that ancient people used Sirius to know when to plant their crops. On the day of the project, Lily stood in front of her class. She showed a drawing of Sirius and its partner star. She spoke clearly and shared all the facts she had learned. When she finished, her teacher said, "That was excellent, Lily." Lily felt proud of her hard work.',
    difficulty: 3,
    story_group: 'B',
    sort_order: 3,
  },
];

function seed() {
  const db = getDb();

  const existing = db.prepare('SELECT COUNT(*) AS count FROM articles').get();
  if (existing.count > 0) {
    console.log('[seed] Articles table already has data, skipping.');
    closeDb();
    return;
  }

  const insert = db.prepare(
    'INSERT INTO articles (title, content, difficulty, story_group, sort_order) VALUES (@title, @content, @difficulty, @story_group, @sort_order)'
  );

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });

  insertMany(articles);
  console.log(`[seed] Inserted ${articles.length} articles.`);
  closeDb();
}

seed();

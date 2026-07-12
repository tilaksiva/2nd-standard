/* ============================================================
   2nd Standard Questions Database
   Edit this file to add more questions, change images, or adjust difficulty.
   Each question object:
   {
     q: "Question text",
     options: ["Option A", "Option B", "Option C", "Option D"],
     answer: 0, // index of correct option
     explanation: "Short kid-friendly explanation why this is correct.",
     img: "assets/math1.png", // optional image URL relative to index.html
     difficulty: "easy" | "medium" | "hard"
   }
============================================================ */

const QUESTION_BANK = {
  math: {
    icon: "🔢",
    name: "Math",
    chapters: [
      { id: "addition", name: "Addition", icon: "➕" },
      { id: "subtraction", name: "Subtraction", icon: "➖" },
      { id: "shapes", name: "Shapes", icon: "🟦" },
      { id: "measurement", name: "Measurement", icon: "📏" }
    ],
    questions: [
      // Addition
      {
        q: "What is 3 + 2?",
        options: ["4", "5", "6", "7"],
        answer: 1,
        explanation: "If you have 3 apples and get 2 more, you have 5 apples.",
        difficulty: "easy"
      },
      {
        q: "6 + 4 = ?",
        options: ["9", "10", "11", "12"],
        answer: 1,
        explanation: "Six plus four makes ten.",
        difficulty: "easy"
      },
      // Subtraction
      {
        q: "If you have 8 candies and eat 3, how many are left?",
        options: ["4", "5", "6", "7"],
        answer: 1,
        explanation: "Eight minus three equals five.",
        difficulty: "easy"
      },
      {
        q: "10 - 6 = ?",
        options: ["2", "3", "4", "5"],
        answer: 0,
        explanation: "Ten take away six leaves four.",
        difficulty: "easy"
      },
      // Shapes
      {
        q: "Which shape has three sides?",
        options: ["Square", "Rectangle", "Triangle", "Circle"],
        answer: 2,
        explanation: "A triangle has three sides and three corners.",
        img: "assets/triangle.png",
        difficulty: "easy"
      },
      {
        q: "Which shape is round with no corners?",
        options: ["Triangle", "Square", "Circle", "Diamond"],
        answer: 2,
        explanation: "A circle is round and has no corners.",
        img: "assets/circle.png",
        difficulty: "easy"
      },
      // Measurement
      {
        q: "Which tool do we use to measure length?",
        options: ["Scale", "Thermometer", "Ruler", "Clock"],
        answer: 2,
        explanation: "A ruler measures how long something is.",
        img: "assets/ruler.png",
        difficulty: "easy"
      },
      {
        q: "About how long is a new pencil?",
        options: ["2 cm", "10 cm", "30 cm", "1 meter"],
        answer: 1,
        explanation: "A new pencil is about ten centimeters long.",
        difficulty: "easy"
      }
    ]
  },
  english: {
    icon: "📚",
    name: "English",
    chapters: [
      { id: "letters", name: "Letters & Sounds", icon: "🔤" },
      { id: "words", name: "Reading Words", icon: "📖" },
      { id: "sentences", name: "Making Sentences", icon: "✏️" },
      { id: "rhymes", name: "Rhyming Words", icon: "🎵" }
    ],
    questions: [
      // Letters & Sounds
      {
        q: "What sound does the letter 'B' make?",
        options: ["buh", "bah", "beeh", "buh‑buh"],
        answer: 0,
        explanation: "The letter B says /b/ as in 'bat'.",
        difficulty: "easy"
      },
      {
        q: "Which letter makes the sound /s/?",
        options: ["S", "C", "K", "X"],
        answer: 0,
        explanation: "The letter S makes the /s/ sound, like in 'sun'.",
        difficulty: "easy"
      },
      // Reading Words
      {
        q: "Which word means 'a pet that says meow'?",
        options: ["Dog", "Cat", "Fish", "Bird"],
        answer: 1,
        explanation: "A cat says meow.",
        difficulty: "easy"
      },
      {
        q: "Pick the word that rhymes with 'tree'.",
        options: ["car", "bee", "free", "cup"],
        answer: 2,
        explanation: "Free sounds like tree – they rhyme!",
        difficulty: "easy"
      },
      // Sentences
      {
        q: "Which is a complete sentence?",
        options: ["The dog runs.", "Runs fast", "Big blue", "Jumping"],
        answer: 0,
        explanation: "A sentence needs a subject and a verb: 'The dog runs'.",
        difficulty: "easy"
      },
      {
        q: "Choose the correct punctuation at the end of a telling sentence.",
        options: ["?", "!", ".", ","],
        answer: 2,
        explanation: "A telling sentence ends with a period (.).",
        difficulty: "easy"
      },
      // Rhyming Words
      {
        q: "Which pair rhymes?",
        options: ["cat‑bat", "dog‑fish", "sun‑moon", "tree‑car"],
        answer: 0,
        explanation: "Cat and bat both end with the 'at' sound.",
        difficulty: "easy"
      }
    ]
  },
  science: {
    icon: "🔬",
    name: "Science",
    chapters: [
      { id: "plants", name: "Plants", icon: "🌱" },
      { id: "animals", name: "Animals", icon: "🐾" },
      { id: "weather", name: "Weather", icon: "☀️" },
      { id: "materials", name: "Materials", icon: "🧪" }
    ],
    questions: [
      // Plants
      {
        q: "What do plants need to grow?",
        options: ["Light, water, and air", "Only water", "Only light", "Only soil"],
        answer: 0,
        explanation: "Plants need light to make food, water to drink, and air to breathe.",
        img: "assets/plant.png",
        difficulty: "easy"
      },
      {
        q: "Which part of a plant makes food?",
        options: ["Roots", "Stem", "Leaves", "Flower"],
        answer: 2,
        explanation: "Leaves use sunlight to make food for the plant.",
        difficulty: "easy"
      },
      // Animals
      {
        q: "Which animal lives in water and has fins?",
        options: ["Elephant", "Fish", "Bird", "Rabbit"],
        answer: 1,
        explanation: "Fish live in water and swim with their fins.",
        img: "assets/fish.png",
        difficulty: "easy"
      },
      {
        q: "What do cows give us to drink?",
        options: ["Juice", "Milk", "Soda", "Water"],
        answer: 1,
        explanation: "Cows produce milk that we can drink.",
        difficulty: "easy"
      },
      // Weather
      {
        q: "What do we wear when it rains?",
        options: ["Sunglasses", "Raincoat", "Scarf", "Gloves"],
        answer: 1,
        explanation: "A raincoat keeps us dry when it rains.",
        difficulty: "easy"
      },
      {
        q: "Which season is usually the hottest?",
        options: ["Winter", "Spring", "Summer", "Fall"],
        answer: 2,
        explanation: "Summer is the warmest time of the year.",
        difficulty: "easy"
      },
      // Materials
      {
        q: "Which of these is made from wood?",
        options: ["Plastic spoon", "Glass window", "Wooden chair", "Metal key"],
        answer: 2,
        explanation: "A chair made of wood comes from trees.",
        difficulty: "easy"
      },
      {
        q: "What happens to ice when it gets warm?",
        options: ["It becomes harder", "It melts into water", "It turns into steam", "It disappears"],
        answer: 1,
        explanation: "Ice melts and turns into liquid water when it warms up.",
        difficulty: "easy"
      }
    ]
  },
  gk: {
    icon: "🌍",
    name: "General Knowledge",
    chapters: [
      { id: "myfamily", name: "My Family & Community", icon: "👨‍👩‍👧‍👦" },
      { id: "myschool", name: "My School", icon: "🏫" },
      { id: "mycountry", name: "My Country", icon: "🇺🇸" },
      { id: "worldaround", name: "World Around Us", icon: "🌎" }
    ],
    questions: [
      // My Family & Community
      {
        q: "Who takes care of you at home?",
        options: ["Teacher", "Doctor", "Parent or guardian", "Friend"],
        answer: 2,
        explanation: "Your parents or guardians look after you at home.",
        difficulty: "easy"
      },
      {
        q: "What do we call the place where we buy food?",
        options: ["Library", "Hospital", "Grocery store", "Park"],
        answer: 2,
        explanation: "We go to a grocery store to buy fruits, vegetables, and other food.",
        difficulty: "easy"
      },
      // My School
      {
        q: "Who helps you learn new things in class?",
        options: ["Janitor", "Chef", "Teacher", "Driver"],
        answer: 2,
        explanation: "A teacher teaches lessons and helps students understand.",
        difficulty: "easy"
      },
      {
        q: "What do we do with our trash to keep the school clean?",
        options: ["Leave it on the floor", "Throw it in the trash can", "Eat it", "Hide it"],
        answer: 1,
        explanation: "We put trash in the trash can so the classroom stays tidy.",
        difficulty: "easy"
      },
      // My Country (example: United States)
      {
        q: "What is the name of the country where we live?",
        options: ["Canada", "Mexico", "United States", "Australia"],
        answer: 2,
        explanation: "We live in the United States of America.",
        difficulty: "easy"
      },
      {
        q: "Which symbol shows our country's flag?",
        options: ["🍁", "🎋", "🇺🇸", "🌺"],
        answer: 2,
        explanation: "The flag of the United States has red, white, and blue.",
        difficulty: "easy"
      },
      // World Around Us
      {
        q: "Which animal is known as the 'King of the Jungle'?",
        options: ["Tiger", "Elephant", "Lion", "Zebra"],
        answer: 2,
        explanation: "Lions are called the king of the jungle.",
        difficulty: "easy"
      },
      {
        q: "What do we call a place with lots of sand and very little water?",
        options: ["Ocean", "Forest", "Desert", "River"],
        answer: 2,
        explanation: "A desert is a dry area with sand and very little rain.",
        difficulty: "easy"
      }
    ]
  }
};
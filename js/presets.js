// presets.js — Built-in workout presets

const presets = [
  {
    id: 'classic-tabata',
    name: 'Classic Tabata',
    description: '20s work / 10s rest — the original protocol',
    workTime: 20,
    restTime: 10,
    rounds: 8,
    exercises: [
      'High Knees', 'Squats', 'Push-ups', 'Jumping Jacks',
      'High Knees', 'Squats', 'Push-ups', 'Jumping Jacks'
    ]
  },
  {
    id: 'full-body-hiit',
    name: 'Full Body HIIT',
    description: 'Hit every muscle group in one session',
    workTime: 30,
    restTime: 15,
    rounds: 8,
    exercises: [
      'Squats', 'Push-ups', 'Burpees', 'Mountain Climbers',
      'Lunges', 'Plank Hold', 'Jump Squats', 'High Knees'
    ]
  },
  {
    id: 'core-blast',
    name: 'Core Blast',
    description: 'Intense core-focused routine',
    workTime: 25,
    restTime: 10,
    rounds: 8,
    exercises: [
      'Crunches', 'Bicycle Kicks', 'Plank Hold', 'Russian Twists',
      'Leg Raises', 'Flutter Kicks', 'Dead Bugs', 'V-Ups'
    ]
  },
  {
    id: 'upper-body',
    name: 'Upper Body Burn',
    description: 'Arms, chest, shoulders — no equipment needed',
    workTime: 25,
    restTime: 15,
    rounds: 8,
    exercises: [
      'Push-ups', 'Tricep Dips', 'Diamond Push-ups', 'Shoulder Taps',
      'Pike Push-ups', 'Arm Circles', 'Plank Walk', 'Burpees'
    ]
  },
  {
    id: 'lower-body',
    name: 'Lower Body Power',
    description: 'Legs and glutes — feel the burn',
    workTime: 30,
    restTime: 15,
    rounds: 8,
    exercises: [
      'Squats', 'Lunges', 'Jump Squats', 'Wall Sit',
      'Calf Raises', 'Glute Bridges', 'Side Lunges', 'Sumo Squats'
    ]
  }
];

export default presets;

const weekData = [
  null,
  {
    phase: "foundation",
    days: [
      { name: "Day 1 - Push", type: "strength", exercises: [
        { name: "Flat Barbell Bench Press", sets: "5 x 3-5", rpe: "RPE 7-8" },
        { name: "Machine Shoulder Press", sets: "4 x 4-6", rpe: "RPE 7-8" },
        { name: "Incline DB Press", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Cable Lateral Raise", sets: "3 x 12-15", rpe: "RPE 8" },
        { name: "Skull Crushers (EZ-Bar)", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Tricep Pushdown", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 2 - Pull", type: "strength", exercises: [
        { name: "Pendlay Row", sets: "5 x 3-5", rpe: "RPE 7-8", highlight: "foundation" },
        { name: "Lat Pulldown (wide grip)", sets: "4 x 4-6", rpe: "RPE 7-8" },
        { name: "Barbell Shrug", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Cable Row (close grip)", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "EZ-Bar Curl", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Hammer Curl", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 3 - Legs", type: "strength", exercises: [
        { name: "Smith Machine Squat", sets: "5 x 3-5", rpe: "RPE 7-8", highlight: "foundation" },
        { name: "Romanian Deadlift", sets: "4 x 4-6", rpe: "RPE 7-8" },
        { name: "Leg Press", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Seated Leg Curl", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Standing Calf Raise", sets: "4 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 4 - Push", type: "hyper", exercises: [
        { name: "Incline Barbell Press", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Flat DB Fly", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Machine Shoulder Press", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Cable Lateral Raise", sets: "4 x 15-20", rpe: "RPE 8-9" },
        { name: "Cable Flyes", sets: "3 x 12-15", rpe: "RPE 8-9" },
        { name: "Overhead Tricep Extension", sets: "3 x 12-15", rpe: "RPE 9" },
        { name: "Tricep Pushdown", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 5 - Pull", type: "hyper", exercises: [
        { name: "Pendlay Row", sets: "3 x 8-10", rpe: "RPE 8", highlight: "foundation" },
        { name: "Lat Pulldown (wide grip)", sets: "4 x 10-12", rpe: "RPE 8" },
        { name: "Seated Cable Row", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Face Pull", sets: "3 x 15-20", rpe: "RPE 8" },
        { name: "Reverse Pec Deck", sets: "3 x 12-15", rpe: "RPE 8-9" },
        { name: "Incline DB Curl", sets: "3 x 10-12", rpe: "RPE 9" },
        { name: "Hammer Curl", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 6 - Legs", type: "hyper", exercises: [
        { name: "Smith Machine Squat", sets: "3 x 8-10", rpe: "RPE 8", highlight: "foundation" },
        { name: "Hack Squat", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Leg Extension", sets: "3 x 12-15", rpe: "RPE 8-9" },
        { name: "Lying Leg Curl", sets: "3 x 10-12", rpe: "RPE 8-9" },
        { name: "Bulgarian Split Squat", sets: "3 x 10-12/leg", rpe: "RPE 9" },
        { name: "Seated Calf Raise", sets: "4 x 15-20", rpe: "RPE 9" },
        { name: "Cable Crunch", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]}
    ]
  },
  {
    phase: "foundation",
    days: [
      { name: "Day 1 - Push", type: "strength", exercises: [
        { name: "Flat Barbell Bench Press", sets: "5 x 3-5", rpe: "RPE 8" },
        { name: "Machine Shoulder Press", sets: "4 x 4-6", rpe: "RPE 8" },
        { name: "Incline DB Press", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Cable Lateral Raise", sets: "3 x 12-15", rpe: "RPE 8" },
        { name: "Skull Crushers (EZ-Bar)", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Tricep Pushdown", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 2 - Pull", type: "strength", exercises: [
        { name: "Pendlay Row", sets: "5 x 3-5", rpe: "RPE 8", highlight: "foundation" },
        { name: "Lat Pulldown (wide grip)", sets: "4 x 4-6", rpe: "RPE 8" },
        { name: "Barbell Shrug", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Cable Row (close grip)", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "EZ-Bar Curl", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Hammer Curl", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 3 - Legs", type: "strength", exercises: [
        { name: "Smith Machine Squat", sets: "5 x 3-5", rpe: "RPE 8", highlight: "foundation" },
        { name: "Romanian Deadlift", sets: "4 x 4-6", rpe: "RPE 8" },
        { name: "Leg Press", sets: "3 x 6-8", rpe: "RPE 8" },
        { name: "Seated Leg Curl", sets: "3 x 8-10", rpe: "RPE 8" },
        { name: "Standing Calf Raise", sets: "4 x 10-12", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 4 - Push", type: "hyper", exercises: [
        { name: "Incline Barbell Press", sets: "4 x 8-10", rpe: "RPE 8" },
        { name: "Flat DB Fly", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Machine Shoulder Press", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Cable Lateral Raise", sets: "4 x 15-20", rpe: "RPE 8-9" },
        { name: "Cable Flyes", sets: "3 x 12-15", rpe: "RPE 9" },
        { name: "Overhead Tricep Extension", sets: "3 x 12-15", rpe: "RPE 9" },
        { name: "Tricep Pushdown", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 5 - Pull", type: "hyper", exercises: [
        { name: "Pendlay Row", sets: "4 x 8-10", rpe: "RPE 8", highlight: "foundation" },
        { name: "Lat Pulldown (wide grip)", sets: "4 x 10-12", rpe: "RPE 8" },
        { name: "Seated Cable Row", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Face Pull", sets: "3 x 15-20", rpe: "RPE 8" },
        { name: "Reverse Pec Deck", sets: "3 x 12-15", rpe: "RPE 8-9" },
        { name: "Incline DB Curl", sets: "3 x 10-12", rpe: "RPE 9" },
        { name: "Hammer Curl", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]},
      { name: "Day 6 - Legs", type: "hyper", exercises: [
        { name: "Smith Machine Squat", sets: "4 x 8-10", rpe: "RPE 8", highlight: "foundation" },
        { name: "Hack Squat", sets: "3 x 10-12", rpe: "RPE 8" },
        { name: "Leg Extension", sets: "3 x 12-15", rpe: "RPE 8-9" },
        { name: "Lying Leg Curl", sets: "3 x 10-12", rpe: "RPE 8-9" },
        { name: "Bulgarian Split Squat", sets: "3 x 10-12/leg", rpe: "RPE 9" },
        { name: "Seated Calf Raise", sets: "4 x 15-20", rpe: "RPE 9" },
        { name: "Cable Crunch", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
      ]}
    ]
  }
];

for (let i = 3; i <= 5; i += 1) {
  weekData[i] = JSON.parse(JSON.stringify(weekData[2]));
}

weekData[6] = {
  phase: "ramping",
  days: [
    { name: "Day 1 - Push", type: "strength", exercises: [
      { name: "Flat Barbell Bench Press", sets: "5 x 3-5", rpe: "RPE 7-8" },
      { name: "Machine Shoulder Press", sets: "4 x 4-6", rpe: "RPE 7-8" },
      { name: "Incline DB Press (deep stretch)", sets: "3 x 6-8", rpe: "RPE 8" },
      { name: "Meadows Lateral Raise", sets: "3 x 12-15", rpe: "RPE 8", highlight: "ramping" },
      { name: "Skull Crushers (EZ-Bar)", sets: "3 x 8-10", rpe: "RPE 8" },
      { name: "Tricep Pushdown", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 2 - Pull", type: "strength", exercises: [
      { name: "Meadows Row", sets: "5 x 3-5", rpe: "RPE 7-8", highlight: "ramping" },
      { name: "Lat Pulldown (wide grip)", sets: "4 x 4-6", rpe: "RPE 7-8" },
      { name: "Barbell Shrug", sets: "3 x 6-8", rpe: "RPE 8" },
      { name: "Cable Row (close grip)", sets: "3 x 8-10", rpe: "RPE 8" },
      { name: "EZ-Bar Curl", sets: "3 x 8-10", rpe: "RPE 8" },
      { name: "Hammer Curl", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 3 - Legs", type: "strength", exercises: [
      { name: "Deep Smith Machine Squat", sets: "5 x 3-5", rpe: "RPE 7-8", highlight: "ramping" },
      { name: "Romanian Deadlift (full stretch)", sets: "4 x 4-6", rpe: "RPE 8" },
      { name: "Leg Press (feet high / deep)", sets: "3 x 6-8", rpe: "RPE 8" },
      { name: "Seated Leg Curl", sets: "3 x 8-10", rpe: "RPE 8" },
      { name: "Standing Calf Raise (deep)", sets: "4 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 4 - Push", type: "hyper", exercises: [
      { name: "Incline Barbell Press", sets: "3 x 8-10", rpe: "RPE 8" },
      { name: "Super-Stretch DB Fly (off bench)", sets: "4 x 12-15", rpe: "RPE 8-9", highlight: "ramping" },
      { name: "Machine Shoulder Press", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Meadows Lateral Raise", sets: "4 x 15-20", rpe: "RPE 8-9", highlight: "ramping" },
      { name: "Cable Cross-Over (low to high)", sets: "3 x 12-15", rpe: "RPE 9" },
      { name: "Overhead Cable Tricep Extension", sets: "3 x 12-15", rpe: "RPE 9" },
      { name: "Tricep Pushdown", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 5 - Pull", type: "hyper", exercises: [
      { name: "Meadows Row", sets: "4 x 8-10", rpe: "RPE 8", highlight: "ramping" },
      { name: "Lat Pulldown (full stretch)", sets: "4 x 10-12", rpe: "RPE 8" },
      { name: "Seated Cable Row", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Face Pull", sets: "3 x 15-20", rpe: "RPE 8" },
      { name: "Reverse Pec Deck", sets: "3 x 12-15", rpe: "RPE 8-9" },
      { name: "Incline DB Curl", sets: "3 x 10-12", rpe: "RPE 9" },
      { name: "Hammer Curl", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 6 - Legs", type: "hyper", exercises: [
      { name: "Deep Smith Machine Squat", sets: "3 x 8-10", rpe: "RPE 8", highlight: "ramping" },
      { name: "Hack Squat (full depth)", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Leg Extension (paused at stretch)", sets: "3 x 12-15", rpe: "RPE 8-9" },
      { name: "Lying Leg Curl (toes pointed)", sets: "3 x 10-12", rpe: "RPE 8-9" },
      { name: "Bulgarian Split Squat", sets: "3 x 10-12/leg", rpe: "RPE 9" },
      { name: "Seated Calf Raise (deep stretch)", sets: "4 x 15-20", rpe: "RPE 9" },
      { name: "Cable Crunch", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]}
  ]
};

weekData[7] = {
  phase: "ramping",
  days: [
    { name: "Day 1 - Push", type: "strength", exercises: [
      { name: "Flat Barbell Bench Press", sets: "5 x 3-5", rpe: "RPE 8" },
      { name: "Machine Shoulder Press", sets: "4 x 4-6", rpe: "RPE 8" },
      { name: "Incline DB Press (deep stretch)", sets: "4 x 6-8", rpe: "RPE 8" },
      { name: "Meadows Lateral Raise", sets: "3 x 12-15", rpe: "RPE 8", highlight: "ramping" },
      { name: "Skull Crushers (EZ-Bar)", sets: "3 x 8-10", rpe: "RPE 8-9" },
      { name: "Tricep Pushdown", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 2 - Pull", type: "strength", exercises: [
      { name: "Meadows Row", sets: "5 x 3-5", rpe: "RPE 8", highlight: "ramping" },
      { name: "Lat Pulldown (wide grip)", sets: "4 x 4-6", rpe: "RPE 8" },
      { name: "Barbell Shrug", sets: "3 x 6-8", rpe: "RPE 8" },
      { name: "Cable Row (close grip)", sets: "4 x 8-10", rpe: "RPE 8" },
      { name: "EZ-Bar Curl", sets: "3 x 8-10", rpe: "RPE 8-9" },
      { name: "Hammer Curl", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 3 - Legs", type: "strength", exercises: [
      { name: "Deep Smith Machine Squat", sets: "5 x 3-5", rpe: "RPE 8", highlight: "ramping" },
      { name: "Romanian Deadlift (full stretch)", sets: "4 x 4-6", rpe: "RPE 8" },
      { name: "Leg Press (deep)", sets: "3 x 6-8", rpe: "RPE 8" },
      { name: "Seated Leg Curl", sets: "4 x 8-10", rpe: "RPE 8" },
      { name: "Standing Calf Raise (deep)", sets: "4 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 4 - Push", type: "hyper", exercises: [
      { name: "Incline Barbell Press", sets: "4 x 8-10", rpe: "RPE 8" },
      { name: "Super-Stretch DB Fly", sets: "4 x 12-15", rpe: "RPE 8-9", highlight: "ramping" },
      { name: "Machine Shoulder Press", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Meadows Lateral Raise", sets: "4 x 15-20", rpe: "RPE 8-9", highlight: "ramping" },
      { name: "Cable Cross-Over (low to high)", sets: "3 x 12-15", rpe: "RPE 9" },
      { name: "Overhead Cable Tricep Extension", sets: "4 x 12-15", rpe: "RPE 9" },
      { name: "Tricep Pushdown", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 5 - Pull", type: "hyper", exercises: [
      { name: "Meadows Row", sets: "4 x 8-10", rpe: "RPE 8", highlight: "ramping" },
      { name: "Lat Pulldown (full stretch)", sets: "4 x 10-12", rpe: "RPE 8" },
      { name: "Seated Cable Row (elbows high)", sets: "4 x 10-12", rpe: "RPE 8-9" },
      { name: "Face Pull", sets: "3 x 15-20", rpe: "RPE 8" },
      { name: "Reverse Pec Deck (arms wide)", sets: "3 x 12-15", rpe: "RPE 8-9" },
      { name: "Incline DB Curl", sets: "3 x 10-12", rpe: "RPE 9" },
      { name: "Hammer Curl", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 6 - Legs", type: "hyper", exercises: [
      { name: "Deep Smith Machine Squat", sets: "4 x 8-10", rpe: "RPE 8", highlight: "ramping" },
      { name: "Hack Squat (full depth)", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Leg Extension (paused)", sets: "4 x 12-15", rpe: "RPE 8-9" },
      { name: "Lying Leg Curl (toes pointed)", sets: "4 x 10-12", rpe: "RPE 8-9" },
      { name: "Bulgarian Split Squat", sets: "3 x 10-12/leg", rpe: "RPE 9" },
      { name: "Seated Calf Raise (deep)", sets: "4 x 15-20", rpe: "RPE 9" },
      { name: "Cable Crunch", sets: "3 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]}
  ]
};

for (let i = 8; i <= 11; i += 1) {
  weekData[i] = JSON.parse(JSON.stringify(weekData[7]));
}

weekData[12] = {
  phase: "ramping",
  label: "PEAK / DELOAD",
  days: [
    { name: "Day 1 - Push", type: "strength", exercises: [
      { name: "Flat Barbell Bench Press", sets: "3 x 3-5 down vol", rpe: "RPE 7" },
      { name: "Machine Shoulder Press", sets: "3 x 4-6", rpe: "RPE 7" },
      { name: "Incline DB Press (deep stretch)", sets: "2 x 6-8", rpe: "RPE 7-8" },
      { name: "Meadows Lateral Raise", sets: "2 x 12-15", rpe: "RPE 7-8", highlight: "ramping" },
      { name: "Skull Crushers (EZ-Bar)", sets: "2 x 8-10", rpe: "RPE 8" },
      { name: "Tricep Pushdown", sets: "2 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 2 - Pull", type: "strength", exercises: [
      { name: "Meadows Row", sets: "3 x 3-5 down vol", rpe: "RPE 7", highlight: "ramping" },
      { name: "Lat Pulldown (wide grip)", sets: "3 x 4-6", rpe: "RPE 7" },
      { name: "Barbell Shrug", sets: "2 x 6-8", rpe: "RPE 7-8" },
      { name: "Cable Row (close grip)", sets: "2 x 8-10", rpe: "RPE 7-8" },
      { name: "EZ-Bar Curl", sets: "2 x 8-10", rpe: "RPE 8" },
      { name: "Hammer Curl", sets: "2 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 3 - Legs", type: "strength", exercises: [
      { name: "Deep Smith Machine Squat", sets: "3 x 3-5 down vol", rpe: "RPE 7", highlight: "ramping" },
      { name: "Romanian Deadlift", sets: "3 x 4-6", rpe: "RPE 7" },
      { name: "Leg Press", sets: "2 x 6-8", rpe: "RPE 7-8" },
      { name: "Seated Leg Curl", sets: "2 x 8-10", rpe: "RPE 7-8" },
      { name: "Standing Calf Raise", sets: "3 x 10-12", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 4 - Push", type: "hyper", exercises: [
      { name: "Incline Barbell Press", sets: "3 x 8-10", rpe: "RPE 7-8" },
      { name: "Super-Stretch DB Fly", sets: "3 x 12-15", rpe: "RPE 8", highlight: "ramping" },
      { name: "Machine Shoulder Press", sets: "2 x 10-12", rpe: "RPE 7-8" },
      { name: "Meadows Lateral Raise", sets: "3 x 15-20", rpe: "RPE 8", highlight: "ramping" },
      { name: "Cable Cross-Over", sets: "2 x 12-15", rpe: "RPE 8" },
      { name: "Overhead Cable Tricep Extension", sets: "2 x 12-15", rpe: "RPE 8" },
      { name: "Tricep Pushdown", sets: "2 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 5 - Pull", type: "hyper", exercises: [
      { name: "Meadows Row", sets: "3 x 8-10", rpe: "RPE 7-8", highlight: "ramping" },
      { name: "Lat Pulldown (full stretch)", sets: "3 x 10-12", rpe: "RPE 7-8" },
      { name: "Seated Cable Row", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Face Pull", sets: "2 x 15-20", rpe: "RPE 8" },
      { name: "Reverse Pec Deck", sets: "2 x 12-15", rpe: "RPE 8" },
      { name: "Incline DB Curl", sets: "2 x 10-12", rpe: "RPE 8-9" },
      { name: "Hammer Curl", sets: "2 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]},
    { name: "Day 6 - Legs", type: "hyper", exercises: [
      { name: "Deep Smith Machine Squat", sets: "3 x 8-10", rpe: "RPE 7-8", highlight: "ramping" },
      { name: "Hack Squat", sets: "2 x 10-12", rpe: "RPE 7-8" },
      { name: "Leg Extension (paused)", sets: "3 x 12-15", rpe: "RPE 8" },
      { name: "Lying Leg Curl", sets: "3 x 10-12", rpe: "RPE 8" },
      { name: "Bulgarian Split Squat", sets: "2 x 10-12/leg", rpe: "RPE 8" },
      { name: "Seated Calf Raise (deep)", sets: "3 x 15-20", rpe: "RPE 8-9" },
      { name: "Cable Crunch", sets: "2 x 12-15", rpe: "RPE 10 x", rpe10: true }
    ]}
  ]
};

export { weekData };

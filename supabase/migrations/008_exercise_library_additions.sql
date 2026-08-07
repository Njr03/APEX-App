-- Additional exercise library entries (grip variations, dips, legs, arms)
-- Safe to re-run: only inserts when name is not already present.

insert into public.exercises (name, muscle_group, equipment, exercise_type, is_custom, instructions)
select v.name, v.muscle_group, v.equipment, v.exercise_type, false, v.instructions
from (
  values
    ('Double Grip Lat Pulldown', 'back', 'cable', 'compound',
     'Grip the bar with both hands shoulder-width or wider, pull to upper chest, control the return.'),
    ('Single Grip Lat Pulldown', 'back', 'cable', 'compound',
     'Use one handle, pull elbow down to side of ribs, keep torso stable, switch arms each set.'),
    ('Double Grip Seated Row', 'back', 'cable', 'compound',
     'Both hands on the row handle, pull to lower ribs, squeeze shoulder blades, return with control.'),
    ('Single Grip Seated Row', 'back', 'cable', 'compound',
     'One-hand row to hip, keep chest up and avoid rotating torso, switch sides each set.'),
    ('Dumbbell Shrug', 'shoulders', 'dumbbell', 'isolation',
     'Hold dumbbells at sides, shrug shoulders straight up toward ears, pause, lower slowly.'),
    ('Chest Dip', 'chest', 'bodyweight', 'compound',
     'On parallel bars, lean torso forward, lower until upper arms are parallel, press up emphasizing chest.'),
    ('Tricep Dip', 'arms', 'bodyweight', 'compound',
     'On parallel bars, stay upright with elbows close, lower until 90° at elbows, press to lockout.'),
    ('Reverse Preacher Curl', 'arms', 'barbell', 'isolation',
     'Overhand grip on preacher pad, curl without swinging, full extension at bottom for brachialis and forearms.'),
    ('Glute Press', 'legs', 'machine', 'compound',
     'Foot plate on glute press or hip-thrust machine, drive through heels, squeeze glutes at lockout.'),
    ('Machine Hamstring Curl', 'legs', 'machine', 'isolation',
     'On leg curl machine, curl heels toward glutes, pause at peak contraction, lower with control.'),
    ('Goblet Squat', 'legs', 'dumbbell', 'compound',
     'Hold a dumbbell or kettlebell at chest (or clasp hands at chest for bodyweight), squat to depth, drive up through mid-foot.')
) as v(name, muscle_group, equipment, exercise_type, instructions)
where not exists (
  select 1 from public.exercises e where e.name = v.name
);

-- APEX exercise library seed (~40 common strength movements + extended library)
-- Safe to re-run: only inserts when name is not already present.

insert into public.exercises (name, muscle_group, equipment, exercise_type, is_custom, instructions)
select v.name, v.muscle_group, v.equipment, v.exercise_type, false, v.instructions
from (
  values
    -- Chest
    ('Barbell Bench Press', 'chest', 'barbell', 'compound',
     'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to mid-chest, press up.'),
    ('Incline Barbell Bench Press', 'chest', 'barbell', 'compound',
     'Set bench to 30–45°, lower bar to upper chest, press without flaring elbows excessively.'),
    ('Dumbbell Bench Press', 'chest', 'dumbbell', 'compound',
     'Press dumbbells from chest level on a flat bench, keeping wrists stacked over elbows.'),
    ('Incline Dumbbell Press', 'chest', 'dumbbell', 'compound',
     'Press dumbbells on an incline bench, focusing on upper chest engagement.'),
    ('Cable Fly', 'chest', 'cable', 'isolation',
     'With a slight bend in elbows, bring handles together in an arc across the chest.'),
    ('Push-up', 'chest', 'bodyweight', 'compound',
     'Maintain a straight line from head to heels, lower chest near floor, press back up.'),
    ('Dip', 'chest', 'bodyweight', 'compound',
     'Lean slightly forward on parallel bars, lower until upper arms are parallel to floor.'),

    -- Back
    ('Conventional Deadlift', 'back', 'barbell', 'compound',
     'Hinge at hips, grip bar outside knees, drive through floor keeping bar close to shins.'),
    ('Barbell Row', 'back', 'barbell', 'compound',
     'Hinge forward, pull bar to lower ribs, squeeze shoulder blades at the top.'),
    ('Pull-up', 'back', 'bodyweight', 'compound',
     'Pull chin above bar using lats, avoid excessive kipping.'),
    ('Chin-up', 'back', 'bodyweight', 'compound',
     'Supinated grip pull-up emphasizing biceps and lower lats.'),
    ('Lat Pulldown', 'back', 'cable', 'compound',
     'Pull bar to upper chest, control the eccentric without leaning back excessively.'),
    ('Seated Cable Row', 'back', 'cable', 'compound',
     'Pull handle to abdomen, pause briefly, return with control.'),
    ('T-Bar Row', 'back', 'barbell', 'compound',
     'Straddle the bar, row to chest keeping torso stable.'),

    -- Legs
    ('Back Squat', 'legs', 'barbell', 'compound',
     'Bar on upper back, sit hips back and down to parallel or below, drive up through mid-foot.'),
    ('Front Squat', 'legs', 'barbell', 'compound',
     'Bar in front rack, elbows high, squat keeping torso upright.'),
    ('Leg Press', 'legs', 'machine', 'compound',
     'Lower sled until knees reach ~90°, press without locking knees harshly.'),
    ('Romanian Deadlift', 'legs', 'barbell', 'compound',
     'Soft knee bend, hinge until hamstrings stretch, return by driving hips forward.'),
    ('Leg Curl', 'legs', 'machine', 'isolation',
     'Curl heels toward glutes, squeeze hamstrings at peak contraction.'),
    ('Leg Extension', 'legs', 'machine', 'isolation',
     'Extend knees fully without hyperextending, control the lowering phase.'),
    ('Standing Calf Raise', 'legs', 'machine', 'isolation',
     'Rise onto balls of feet, pause at top, lower heels below platform level.'),
    ('Bulgarian Split Squat', 'legs', 'dumbbell', 'compound',
     'Rear foot elevated, lower until front thigh is parallel, drive up through front heel.'),
    ('Hip Thrust', 'legs', 'barbell', 'compound',
     'Upper back on bench, drive hips up squeezing glutes at lockout.'),

    -- Shoulders
    ('Overhead Press', 'shoulders', 'barbell', 'compound',
     'Press bar from front rack to lockout overhead, brace core throughout.'),
    ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'compound',
     'Press dumbbells overhead without excessive lower back arch.'),
    ('Lateral Raise', 'shoulders', 'dumbbell', 'isolation',
     'Raise dumbbells to shoulder height with slight elbow bend, control descent.'),
    ('Face Pull', 'shoulders', 'cable', 'isolation',
     'Pull rope to face, externally rotate at end range, squeeze rear delts.'),
    ('Arnold Press', 'shoulders', 'dumbbell', 'compound',
     'Start palms facing you, rotate outward as you press overhead.'),

    -- Arms
    ('Barbell Bicep Curl', 'arms', 'barbell', 'isolation',
     'Curl bar without swinging torso, full extension at bottom.'),
    ('Dumbbell Hammer Curl', 'arms', 'dumbbell', 'isolation',
     'Neutral grip curl keeping elbows pinned to sides.'),
    ('Cable Tricep Pushdown', 'arms', 'cable', 'isolation',
     'Push handle down until arms fully extend, keep upper arms stationary.'),
    ('Skull Crusher', 'arms', 'barbell', 'isolation',
     'Lower bar to forehead/skull area, extend elbows to lockout.'),
    ('Preacher Curl', 'arms', 'barbell', 'isolation',
     'Curl on preacher pad eliminating momentum, full stretch at bottom.'),

    -- Core
    ('Plank', 'core', 'bodyweight', 'isolation',
     'Hold rigid body line on forearms and toes, brace abs and glutes.'),
    ('Cable Crunch', 'core', 'cable', 'isolation',
     'Kneel and crunch down using abs, not hip flexors.'),
    ('Hanging Leg Raise', 'core', 'bodyweight', 'isolation',
     'Raise legs with control, avoid swinging on the bar.'),
    ('Ab Wheel Rollout', 'core', 'other', 'isolation',
     'Roll out maintaining neutral spine, pull back using core tension.'),

    -- Full body
    ('Power Clean', 'full_body', 'barbell', 'compound',
     'Explosive pull from floor to front rack, catch in partial squat.'),
    ('Kettlebell Swing', 'full_body', 'other', 'compound',
     'Hip hinge swing to shoulder height, snap hips at bottom of arc.'),
    ('Farmer''s Carry', 'full_body', 'dumbbell', 'compound',
     'Walk with heavy weights at sides, maintain tall posture and braced core.'),
    ('Trap Bar Deadlift', 'full_body', 'barbell', 'compound',
     'Stand inside trap bar, drive through floor keeping chest up.')
) as v(name, muscle_group, equipment, exercise_type, instructions)
where not exists (
  select 1 from public.exercises e where e.name = v.name
);

-- Extended library (skips any name already in the table)
-- Copy this ENTIRE block from insert through the final semicolon.
insert into public.exercises (name, muscle_group, equipment, exercise_type, is_custom, instructions)
select v.name, v.muscle_group, v.equipment, v.exercise_type, false, v.instructions
from (
  values
    ('Decline Push-up', 'chest', 'bodyweight', 'compound',
     $t$Feet elevated on bench, lower chest toward floor, press back up.$t$),
    ('Incline Push-up', 'chest', 'bodyweight', 'compound',
     $t$Hands elevated on bench, maintain straight body line, lower and press.$t$),
    ('Clap Push-up', 'chest', 'bodyweight', 'compound',
     $t$Explosive push-up with enough height to clap hands before landing softly.$t$),
    ('Incline Chest Press', 'chest', 'machine', 'compound',
     $t$Press handles on an incline machine, squeeze chest at the top.$t$),
    ('Pec Deck', 'chest', 'machine', 'isolation',
     $t$Bring pads together in front of chest with a slight elbow bend, control return.$t$),
    ('Cable Crossover', 'chest', 'cable', 'isolation',
     $t$Step forward, bring cable handles together in a wide arc across midline.$t$),
    ('Bench Dip', 'chest', 'bodyweight', 'compound',
     $t$Hands on bench behind you, lower until upper arms are parallel, press up.$t$),
    ('Diamond Push-up', 'chest', 'bodyweight', 'compound',
     $t$Hands form a diamond under chest, lower with elbows close, press up.$t$),
    ('Inverted Row', 'back', 'bodyweight', 'compound',
     $t$Hang under bar at waist height, pull chest to bar keeping body straight.$t$),
    ('Back Extension', 'back', 'bodyweight', 'isolation',
     $t$Anchor feet, hinge at hips to lower torso, extend back to neutral.$t$),
    ('Superman', 'back', 'bodyweight', 'isolation',
     $t$Lie face down, lift arms and legs off floor, hold briefly, lower with control.$t$),
    ('Dumbbell Row', 'back', 'dumbbell', 'compound',
     $t$One hand and knee on bench, row dumbbell to hip, squeeze lat at top.$t$),
    ('Pike Push-up', 'shoulders', 'bodyweight', 'compound',
     $t$Hips high in pike position, lower head toward floor between hands, press up.$t$),
    ('Handstand Push-up', 'shoulders', 'bodyweight', 'compound',
     $t$Kick up to wall handstand, lower head toward floor, press to lockout.$t$),
    ('Front Raise', 'shoulders', 'dumbbell', 'isolation',
     $t$Raise dumbbells to shoulder height with arms straight, lower slowly.$t$),
    ('Bicep Curl', 'arms', 'dumbbell', 'isolation',
     $t$Curl dumbbells with elbows pinned, full extension at bottom.$t$),
    ('Tricep Extension', 'arms', 'cable', 'isolation',
     $t$Extend elbows to push attachment overhead or downward, keep upper arms still.$t$),
    ('Bodyweight Squat', 'legs', 'bodyweight', 'compound',
     $t$Sit hips back and down to comfortable depth, drive through mid-foot to stand.$t$),
    ('Jump Squat', 'legs', 'bodyweight', 'compound',
     $t$Squat then explode upward into jump, land softly and repeat.$t$),
    ('Lunge', 'legs', 'bodyweight', 'compound',
     $t$Step forward, lower until both knees bend 90 degrees, push back to start.$t$),
    ('Walking Lunge', 'legs', 'bodyweight', 'compound',
     $t$Alternate forward lunges with controlled steps and upright torso.$t$),
    ('Pistol Squat', 'legs', 'bodyweight', 'compound',
     $t$Single-leg squat on one leg, opposite leg extended, control depth and balance.$t$),
    ('Wall Sit', 'legs', 'bodyweight', 'isolation',
     $t$Back flat on wall, thighs parallel to floor, hold without rising.$t$),
    ('Glute Bridge', 'legs', 'bodyweight', 'compound',
     $t$Lie on back, drive hips up squeezing glutes, lower without collapsing.$t$),
    ('Single-Leg Glute Bridge', 'legs', 'bodyweight', 'compound',
     $t$Bridge on one leg, extend hips fully, keep pelvis level throughout.$t$),
    ('Sumo Deadlift', 'legs', 'barbell', 'compound',
     $t$Wide stance, toes out, grip bar inside knees, drive through floor.$t$),
    ('Weighted Calf Raise', 'legs', 'machine', 'isolation',
     $t$Rise onto balls of feet under load, pause at top, lower heels fully.$t$),
    ('Side Plank', 'core', 'bodyweight', 'isolation',
     $t$Support on one forearm and side of foot, hold hips high and body aligned.$t$),
    ('Crunch', 'core', 'bodyweight', 'isolation',
     $t$Curl shoulders off floor using abs, avoid pulling on neck.$t$),
    ('Leg Raise', 'core', 'bodyweight', 'isolation',
     $t$Lie on back, raise legs with control, lower without arching lower back.$t$),
    ('Mountain Climber', 'core', 'bodyweight', 'compound',
     $t$Plank position, drive knees toward chest alternately at steady pace.$t$),
    ('Bird Dog', 'core', 'bodyweight', 'isolation',
     $t$On all fours, extend opposite arm and leg, hold briefly, switch sides.$t$),
    ('Hollow Body Hold', 'core', 'bodyweight', 'isolation',
     $t$Lie on back, lift shoulders and legs, lower back pressed to floor, hold.$t$),
    ('Cable Woodchopper', 'core', 'cable', 'isolation',
     $t$Rotate torso diagonally pulling cable high to low or low to high.$t$),
    ('Russian Twist', 'core', 'bodyweight', 'isolation',
     $t$Seated lean back, rotate torso side to side, keep chest lifted.$t$),
    ('Weighted Sit-up', 'core', 'other', 'isolation',
     $t$Sit-up holding weight at chest, curl up using abs, lower with control.$t$)
) as v(name, muscle_group, equipment, exercise_type, instructions)
where not exists (
  select 1 from public.exercises e where e.name = v.name
);

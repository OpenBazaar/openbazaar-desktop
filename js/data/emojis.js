/* eslint-disable max-len */
import $ from 'jquery';
import app from '../app';

// todo: ideally, keywords should be an array of strings.
const emojis = {
  '😀': {
    name: ':grinning_face:',
    keywords: 'face, grin',
    group: 'PEOPLE',
  },
  '😁': {
    name: ':grinning_face_with_smiling_eyes:',
    keywords: 'eye, face, grin, smile',
    group: 'PEOPLE',
  },
  '😂': {
    name: ':face_with_tears_of_joy:',
    keywords: 'face, joy, laugh, tear',
    group: 'PEOPLE',
  },
  '🤣': {
    name: ':rolling_on_the_floor_laughing:',
    keywords: 'face, floor, laugh, rolling',
  },
  '😃': {
    name: ':smiling_face_with_open_mouth:',
    keywords: 'face, mouth, open, smile',
    group: 'PEOPLE',
  },
  '😄': {
    name: ':smiling_face_with_open_mouth_smiling_eyes:',
    keywords: 'eye, face, mouth, open, smile',
    group: 'PEOPLE',
  },
  '😅': {
    name: ':smiling_face_with_open_mouth_cold_sweat:',
    keywords: 'cold, face, open, smile, sweat',
    group: 'PEOPLE',
  },
  '😆': {
    name: ':smiling_face_with_open_mouth_closed_eyes:',
    keywords: 'face, laugh, mouth, open, satisfied, smile',
    group: 'PEOPLE',
  },
  '😉': {
    name: ':winking_face:',
    keywords: 'face, wink',
    group: 'PEOPLE',
  },
  '😊': {
    name: ':smiling_face_with_smiling_eyes:',
    keywords: 'blush, eye, face, smile',
    group: 'PEOPLE',
  },
  '😋': {
    name: ':face_savouring_delicious_food:',
    keywords: 'delicious, face, savouring, smile, um, yum',
    group: 'PEOPLE',
  },
  '😎': {
    name: ':smiling_face_with_sunglasses:',
    keywords: 'bright, cool, eye, eyewear, face, glasses, smile, sun, sunglasses',
    group: 'PEOPLE',
  },
  '😍': {
    name: ':smiling_face_with_heart_eyes:',
    keywords: 'eye, face, love, smile',
    group: 'PEOPLE',
  },
  '😘': {
    name: ':face_blowing_a_kiss:',
    keywords: 'face, kiss',
    group: 'PEOPLE',
  },
  '😗': {
    name: ':kissing_face:',
    keywords: 'face, kiss',
    group: 'PEOPLE',
  },
  '😙': {
    name: ':kissing_face_with_smiling_eyes:',
    keywords: 'eye, face, kiss, smile',
    group: 'PEOPLE',
  },
  '😚': {
    name: ':kissing_face_with_closed_eyes:',
    keywords: 'closed, eye, face, kiss',
    group: 'PEOPLE',
  },
  '☺': {
    name: ':smiling_face:',
    keywords: 'face, outlined, relaxed, smile',
    group: 'PEOPLE',
  },
  '🙂': {
    name: ':slightly_smiling_face:',
    keywords: 'face, smile',
  },
  '🤗': {
    name: ':hugging_face:',
    keywords: 'face, hug, hugging',
  },
  '🤔': {
    name: ':thinking_face:',
    keywords: 'face, thinking',
  },
  '😐': {
    name: ':neutral_face:',
    keywords: 'deadpan, face, neutral',
    group: 'PEOPLE',
  },
  '😑': {
    name: ':expressionless_face:',
    keywords: 'expressionless, face, inexpressive, unexpressive',
    group: 'PEOPLE',
  },
  '😶': {
    name: ':face_without_mouth:',
    keywords: 'face, mouth, quiet, silent',
    group: 'PEOPLE',
  },
  '🙄': {
    name: ':face_with_rolling_eyes:',
    keywords: 'eyes, face, rolling',
  },
  '😏': {
    name: ':smirking_face:',
    keywords: 'face, smirk',
    group: 'PEOPLE',
  },
  '😣': {
    name: ':persevering_face:',
    keywords: 'face, persevere',
    group: 'PEOPLE',
  },
  '😥': {
    name: ':disappointed_but_relieved_face:',
    keywords: 'disappointed, face, relieved, whew',
    group: 'PEOPLE',
  },
  '😮': {
    name: ':face_with_open_mouth:',
    keywords: 'face, mouth, open, sympathy',
    group: 'PEOPLE',
  },
  '🤐': {
    name: ':zipper_mouth_face:',
    keywords: 'face, mouth, zipper',
  },
  '😯': {
    name: ':hushed_face:',
    keywords: 'face, hushed, stunned, surprised',
    group: 'PEOPLE',
  },
  '😪': {
    name: ':sleepy_face:',
    keywords: 'face, sleep',
    group: 'PEOPLE',
  },
  '😫': {
    name: ':tired_face:',
    keywords: 'face, tired',
    group: 'PEOPLE',
  },
  '😴': {
    name: ':sleeping_face:',
    keywords: 'face, sleep, zzz',
    group: 'PEOPLE',
  },
  '😌': {
    name: ':relieved_face:',
    keywords: 'face, relieved',
    group: 'PEOPLE',
  },
  '🤓': {
    name: ':nerd_face:',
    keywords: 'face, geek, nerd',
  },
  '😛': {
    name: ':face_with_stuck_out_tongue:',
    keywords: 'face, tongue',
    group: 'PEOPLE',
  },
  '😜': {
    name: ':face_with_stuck_out_tongue_winking_eye:',
    keywords: 'eye, face, joke, tongue, wink',
    group: 'PEOPLE',
  },
  '😝': {
    name: ':face_with_stuck_out_tongue_closed_eyes:',
    keywords: 'eye, face, horrible, taste, tongue',
    group: 'PEOPLE',
  },
  '🤤': {
    name: ':drooling_face:',
    keywords: 'drooling, face',
  },
  '😒': {
    name: ':unamused_face:',
    keywords: 'face, unamused, unhappy',
    group: 'PEOPLE',
  },
  '😓': {
    name: ':face_with_cold_sweat:',
    keywords: 'cold, face, sweat',
    group: 'PEOPLE',
  },
  '😔': {
    name: ':pensive_face:',
    keywords: 'dejected, face, pensive',
    group: 'PEOPLE',
  },
  '😕': {
    name: ':confused_face:',
    keywords: 'confused, face',
    group: 'PEOPLE',
  },
  '🙃': {
    name: ':upside_down_face:',
    keywords: 'face, upside-down',
  },
  '🤑': {
    name: ':money_mouth_face:',
    keywords: 'face, money, mouth',
  },
  '😲': {
    name: ':astonished_face:',
    keywords: 'astonished, face, shocked, totally',
    group: 'PEOPLE',
  },
  '☹': {
    name: ':frowning_face:',
    keywords: 'face, frown',
  },
  '🙁': {
    name: ':slightly_frowning_face:',
    keywords: 'face, frown',
  },
  '😖': {
    name: ':confounded_face:',
    keywords: 'confounded, face',
    group: 'PEOPLE',
  },
  '😞': {
    name: ':disappointed_face:',
    keywords: 'disappointed, face',
    group: 'PEOPLE',
  },
  '😟': {
    name: ':worried_face:',
    keywords: 'face, worried',
    group: 'PEOPLE',
  },
  '😤': {
    name: ':face_with_steam_from_nose:',
    keywords: 'face, triumph, won',
    group: 'PEOPLE',
  },
  '😢': {
    name: ':crying_face:',
    keywords: 'cry, face, sad, tear',
    group: 'PEOPLE',
  },
  '😭': {
    name: ':loudly_crying_face:',
    keywords: 'cry, face, sad, sob, tear',
    group: 'PEOPLE',
  },
  '😦': {
    name: ':frowning_face_with_open_mouth:',
    keywords: 'face, frown, mouth, open',
    group: 'PEOPLE',
  },
  '😧': {
    name: ':anguished_face:',
    keywords: 'anguished, face',
    group: 'PEOPLE',
  },
  '😨': {
    name: ':fearful_face:',
    keywords: 'face, fear, fearful, scared',
    group: 'PEOPLE',
  },
  '😩': {
    name: ':weary_face:',
    keywords: 'face, tired, weary',
    group: 'PEOPLE',
  },
  '😬': {
    name: ':grimacing_face:',
    keywords: 'face, grimace',
    group: 'PEOPLE',
  },
  '😰': {
    name: ':face_with_open_mouth_cold_sweat:',
    keywords: 'blue, cold, face, mouth, open, rushed, sweat',
    group: 'PEOPLE',
  },
  '😱': {
    name: ':face_screaming_in_fear:',
    keywords: 'face, fear, fearful, munch, scared, scream',
    group: 'PEOPLE',
  },
  '😳': {
    name: ':flushed_face:',
    keywords: 'dazed, face, flushed',
    group: 'PEOPLE',
  },
  '😵': {
    name: ':dizzy_face:',
    keywords: 'dizzy, face',
    group: 'PEOPLE',
  },
  '😡': {
    name: ':pouting_face:',
    keywords: 'angry, face, mad, pouting, rage, red',
    group: 'PEOPLE',
  },
  '😠': {
    name: ':angry_face:',
    keywords: 'angry, face, mad',
    group: 'PEOPLE',
  },
  '😇': {
    name: ':smiling_face_with_halo:',
    keywords: 'angel, face, fairy tale, fantasy, halo, innocent, smile',
    group: 'PEOPLE',
  },
  '🤠': {
    name: ':cowboy_hat_face:',
    keywords: 'cowboy, cowgirl, face, hat',
  },
  '🤡': {
    name: ':clown_face:',
    keywords: 'clown, face',
  },
  '🤥': {
    name: ':lying_face:',
    keywords: 'face, lie, pinocchio',
  },
  '😷': {
    name: ':face_with_medical_mask:',
    keywords: 'cold, doctor, face, mask, medicine, sick',
    group: 'PEOPLE',
  },
  '🤒': {
    name: ':face_with_thermometer:',
    keywords: 'face, ill, sick, thermometer',
  },
  '🤕': {
    name: ':face_with_head_bandage:',
    keywords: 'bandage, face, hurt, injury',
  },
  '🤢': {
    name: ':nauseated_face:',
    keywords: 'face, nauseated, vomit',
  },
  '🤧': {
    name: ':sneezing_face:',
    keywords: 'face, gesundheit, sneeze',
  },
  '😈': {
    name: ':smiling_face_with_horns:',
    keywords: 'face, fairy tale, fantasy, horns, smile',
    group: 'PEOPLE',
  },
  '👿': {
    name: ':angry_face_with_horns:',
    keywords: 'demon, devil, face, fairy tale, fantasy, imp',
    group: 'PEOPLE',
  },
  '👹': {
    name: ':ogre:',
    keywords: 'creature, face, fairy tale, fantasy, Japanese, monster',
    group: 'PEOPLE',
  },
  '👺': {
    name: ':goblin:',
    keywords: 'creature, face, fairy tale, fantasy, Japanese, monster',
    group: 'PEOPLE',
  },
  '💀': {
    name: ':skull:',
    keywords: 'death, face, fairy tale, monster',
    group: 'PEOPLE',
  },
  '☠': {
    name: ':skull_and_crossbones:',
    keywords: 'crossbones, death, face, monster, skull',
  },
  '👻': {
    name: ':ghost:',
    keywords: 'creature, face, fairy tale, fantasy, monster',
    group: 'OBJECTS',
  },
  '👽': {
    name: ':alien:',
    keywords: 'creature, extraterrestrial, face, fairy tale, fantasy, monster, ufo',
    group: 'PEOPLE',
  },
  '👾': {
    name: ':alien_monster:',
    keywords: 'alien, creature, extraterrestrial, face, fairy tale, fantasy, monster, ufo',
    group: 'OBJECTS',
  },
  '🤖': {
    name: ':robot_face:',
    keywords: 'face, monster, robot',
  },
  '💩': {
    name: ':pile_of_poo:',
    keywords: 'comic, dung, face, monster, poo, poop',
    group: 'PEOPLE',
  },
  '😺': {
    name: ':smiling_cat_face_with_open_mouth:',
    keywords: 'cat, face, mouth, open, smile',
    group: 'PEOPLE',
  },
  '😸': {
    name: ':grinning_cat_face_with_smiling_eyes:',
    keywords: 'cat, eye, face, grin, smile',
    group: 'PEOPLE',
  },
  '😹': {
    name: ':cat_face_with_tears_of_joy:',
    keywords: 'cat, face, joy, tear',
    group: 'PEOPLE',
  },
  '😻': {
    name: ':smiling_cat_face_with_heart_eyes:',
    keywords: 'cat, eye, face, love, smile',
    group: 'PEOPLE',
  },
  '😼': {
    name: ':cat_face_with_wry_smile:',
    keywords: 'cat, face, ironic, smile, wry',
    group: 'PEOPLE',
  },
  '😽': {
    name: ':kissing_cat_face_with_closed_eyes:',
    keywords: 'cat, eye, face, kiss',
    group: 'PEOPLE',
  },
  '🙀': {
    name: ':weary_cat_face:',
    keywords: 'cat, face, oh, surprised, weary',
    group: 'PEOPLE',
  },
  '😿': {
    name: ':crying_cat_face:',
    keywords: 'cat, cry, face, sad, tear',
    group: 'PEOPLE',
  },
  '😾': {
    name: ':pouting_cat_face:',
    keywords: 'cat, face, pouting',
    group: 'PEOPLE',
  },
  '🙈': {
    name: ':see_no_evil_monkey:',
    keywords: 'evil, face, forbidden, gesture, monkey, no, not, prohibited, see',
    group: 'PEOPLE',
  },
  '🙉': {
    name: ':hear_no_evil_monkey:',
    keywords: 'evil, face, forbidden, gesture, hear, monkey, no, not, prohibited',
    group: 'PEOPLE',
  },
  '🙊': {
    name: ':speak_no_evil_monkey:',
    keywords: 'evil, face, forbidden, gesture, monkey, no, not, prohibited, speak',
    group: 'PEOPLE',
  },
  '👦': {
    name: ':boy:',
    keywords: 'boy, young',
    group: 'PEOPLE',
  },
  '👦🏻': {
    name: ':boy_light_skin_tone:',
    keywords: 'boy, light skin tone, young',
  },
  '👦🏼': {
    name: ':boy_medium_light_skin_tone:',
    keywords: 'boy, medium-light skin tone, young',
  },
  '👦🏽': {
    name: ':boy_medium_skin_tone:',
    keywords: 'boy, medium skin tone, young',
  },
  '👦🏾': {
    name: ':boy_medium_dark_skin_tone:',
    keywords: 'boy, medium-dark skin tone, young',
  },
  '👦🏿': {
    name: ':boy_dark_skin_tone:',
    keywords: 'boy, dark skin tone, young',
  },
  '👧': {
    name: ':girl:',
    keywords: 'Virgo, young, zodiac',
    group: 'PEOPLE',
  },
  '👧🏻': {
    name: ':girl_light_skin_tone:',
    keywords: 'light skin tone, Virgo, young, zodiac',
  },
  '👧🏼': {
    name: ':girl_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, Virgo, young, zodiac',
  },
  '👧🏽': {
    name: ':girl_medium_skin_tone:',
    keywords: 'medium skin tone, Virgo, young, zodiac',
  },
  '👧🏾': {
    name: ':girl_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, Virgo, young, zodiac',
  },
  '👧🏿': {
    name: ':girl_dark_skin_tone:',
    keywords: 'dark skin tone, Virgo, young, zodiac',
  },
  '👨': {
    name: ':man:',
    keywords: 'man',
    group: 'PEOPLE',
  },
  '👨🏻': {
    name: ':man_light_skin_tone:',
    keywords: 'light skin tone, man',
  },
  '👨🏼': {
    name: ':man_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone',
  },
  '👨🏽': {
    name: ':man_medium_skin_tone:',
    keywords: 'man, medium skin tone',
  },
  '👨🏾': {
    name: ':man_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone',
  },
  '👨🏿': {
    name: ':man_dark_skin_tone:',
    keywords: 'dark skin tone, man',
  },
  '👩': {
    name: ':woman:',
    keywords: 'woman',
    group: 'PEOPLE',
  },
  '👩🏻': {
    name: ':woman_light_skin_tone:',
    keywords: 'light skin tone, woman',
  },
  '👩🏼': {
    name: ':woman_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, woman',
  },
  '👩🏽': {
    name: ':woman_medium_skin_tone:',
    keywords: 'medium skin tone, woman',
  },
  '👩🏾': {
    name: ':woman_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, woman',
  },
  '👩🏿': {
    name: ':woman_dark_skin_tone:',
    keywords: 'dark skin tone, woman',
  },
  '👴': {
    name: ':old_man:',
    keywords: 'man, old',
    group: 'PEOPLE',
  },
  '👴🏻': {
    name: ':old_man_light_skin_tone:',
    keywords: 'light skin tone, man, old',
  },
  '👴🏼': {
    name: ':old_man_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, old',
  },
  '👴🏽': {
    name: ':old_man_medium_skin_tone:',
    keywords: 'man, medium skin tone, old',
  },
  '👴🏾': {
    name: ':old_man_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, old',
  },
  '👴🏿': {
    name: ':old_man_dark_skin_tone:',
    keywords: 'dark skin tone, man, old',
  },
  '👵': {
    name: ':old_woman:',
    keywords: 'old, woman',
    group: 'PEOPLE',
  },
  '👵🏻': {
    name: ':old_woman_light_skin_tone:',
    keywords: 'light skin tone, old, woman',
  },
  '👵🏼': {
    name: ':old_woman_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, old, woman',
  },
  '👵🏽': {
    name: ':old_woman_medium_skin_tone:',
    keywords: 'medium skin tone, old, woman',
  },
  '👵🏾': {
    name: ':old_woman_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, old, woman',
  },
  '👵🏿': {
    name: ':old_woman_dark_skin_tone:',
    keywords: 'dark skin tone, old, woman',
  },
  '👶': {
    name: ':baby:',
    keywords: 'baby, young',
    group: 'PEOPLE',
  },
  '👶🏻': {
    name: ':baby_light_skin_tone:',
    keywords: 'baby, light skin tone, young',
  },
  '👶🏼': {
    name: ':baby_medium_light_skin_tone:',
    keywords: 'baby, medium-light skin tone, young',
  },
  '👶🏽': {
    name: ':baby_medium_skin_tone:',
    keywords: 'baby, medium skin tone, young',
  },
  '👶🏾': {
    name: ':baby_medium_dark_skin_tone:',
    keywords: 'baby, medium-dark skin tone, young',
  },
  '👶🏿': {
    name: ':baby_dark_skin_tone:',
    keywords: 'baby, dark skin tone, young',
  },
  '👼': {
    name: ':baby_angel:',
    keywords: 'angel, baby, face, fairy tale, fantasy',
    group: 'PEOPLE',
  },
  '👼🏻': {
    name: ':baby_angel_light_skin_tone:',
    keywords: 'angel, baby, face, fairy tale, fantasy, light skin tone',
  },
  '👼🏼': {
    name: ':baby_angel_medium_light_skin_tone:',
    keywords: 'angel, baby, face, fairy tale, fantasy, medium-light skin tone',
  },
  '👼🏽': {
    name: ':baby_angel_medium_skin_tone:',
    keywords: 'angel, baby, face, fairy tale, fantasy, medium skin tone',
  },
  '👼🏾': {
    name: ':baby_angel_medium_dark_skin_tone:',
    keywords: 'angel, baby, face, fairy tale, fantasy, medium-dark skin tone',
  },
  '👼🏿': {
    name: ':baby_angel_dark_skin_tone:',
    keywords: 'angel, baby, dark skin tone, face, fairy tale, fantasy',
  },
  '👨‍⚕️': {
    name: ':man_health_worker:',
    keywords: 'doctor, healthcare, man, nurse, therapist',
  },
  '👨🏻‍⚕️': {
    name: ':man_health_worker_light_skin_tone:',
    keywords: 'doctor, healthcare, light skin tone, man, nurse, therapist',
  },
  '👨🏼‍⚕️': {
    name: ':man_health_worker_medium_light_skin_tone:',
    keywords: 'doctor, healthcare, man, medium-light skin tone, nurse, therapist',
  },
  '👨🏽‍⚕️': {
    name: ':man_health_worker_medium_skin_tone:',
    keywords: 'doctor, healthcare, man, medium skin tone, nurse, therapist',
  },
  '👨🏾‍⚕️': {
    name: ':man_health_worker_medium_dark_skin_tone:',
    keywords: 'doctor, healthcare, man, medium-dark skin tone, nurse, therapist',
  },
  '👨🏿‍⚕️': {
    name: ':man_health_worker_dark_skin_tone:',
    keywords: 'dark skin tone, doctor, healthcare, man, nurse, therapist',
  },
  '👩‍⚕️': {
    name: ':woman_health_worker:',
    keywords: 'doctor, healthcare, nurse, therapist, woman',
  },
  '👩🏻‍⚕️': {
    name: ':woman_health_worker_light_skin_tone:',
    keywords: 'doctor, healthcare, light skin tone, nurse, therapist, woman',
  },
  '👩🏼‍⚕️': {
    name: ':woman_health_worker_medium_light_skin_tone:',
    keywords: 'doctor, healthcare, medium-light skin tone, nurse, therapist, woman',
  },
  '👩🏽‍⚕️': {
    name: ':woman_health_worker_medium_skin_tone:',
    keywords: 'doctor, healthcare, medium skin tone, nurse, therapist, woman',
  },
  '👩🏾‍⚕️': {
    name: ':woman_health_worker_medium_dark_skin_tone:',
    keywords: 'doctor, healthcare, medium-dark skin tone, nurse, therapist, woman',
  },
  '👩🏿‍⚕️': {
    name: ':woman_health_worker_dark_skin_tone:',
    keywords: 'dark skin tone, doctor, healthcare, nurse, therapist, woman',
  },
  '👨‍🎓': {
    name: ':man_student:',
    keywords: 'graduate, man, student',
  },
  '👨🏻‍🎓': {
    name: ':man_student_light_skin_tone:',
    keywords: 'graduate, light skin tone, man, student',
  },
  '👨🏼‍🎓': {
    name: ':man_student_medium_light_skin_tone:',
    keywords: 'graduate, man, medium-light skin tone, student',
  },
  '👨🏽‍🎓': {
    name: ':man_student_medium_skin_tone:',
    keywords: 'graduate, man, medium skin tone, student',
  },
  '👨🏾‍🎓': {
    name: ':man_student_medium_dark_skin_tone:',
    keywords: 'graduate, man, medium-dark skin tone, student',
  },
  '👨🏿‍🎓': {
    name: ':man_student_dark_skin_tone:',
    keywords: 'dark skin tone, graduate, man, student',
  },
  '👩‍🎓': {
    name: ':woman_student:',
    keywords: 'graduate, student, woman',
  },
  '👩🏻‍🎓': {
    name: ':woman_student_light_skin_tone:',
    keywords: 'graduate, light skin tone, student, woman',
  },
  '👩🏼‍🎓': {
    name: ':woman_student_medium_light_skin_tone:',
    keywords: 'graduate, medium-light skin tone, student, woman',
  },
  '👩🏽‍🎓': {
    name: ':woman_student_medium_skin_tone:',
    keywords: 'graduate, medium skin tone, student, woman',
  },
  '👩🏾‍🎓': {
    name: ':woman_student_medium_dark_skin_tone:',
    keywords: 'graduate, medium-dark skin tone, student, woman',
  },
  '👩🏿‍🎓': {
    name: ':woman_student_dark_skin_tone:',
    keywords: 'dark skin tone, graduate, student, woman',
  },
  '👨‍🏫': {
    name: ':man_teacher:',
    keywords: 'instructor, man, professor, teacher',
  },
  '👨🏻‍🏫': {
    name: ':man_teacher_light_skin_tone:',
    keywords: 'instructor, light skin tone, man, professor, teacher',
  },
  '👨🏼‍🏫': {
    name: ':man_teacher_medium_light_skin_tone:',
    keywords: 'instructor, man, medium-light skin tone, professor, teacher',
  },
  '👨🏽‍🏫': {
    name: ':man_teacher_medium_skin_tone:',
    keywords: 'instructor, man, medium skin tone, professor, teacher',
  },
  '👨🏾‍🏫': {
    name: ':man_teacher_medium_dark_skin_tone:',
    keywords: 'instructor, man, medium-dark skin tone, professor, teacher',
  },
  '👨🏿‍🏫': {
    name: ':man_teacher_dark_skin_tone:',
    keywords: 'dark skin tone, instructor, man, professor, teacher',
  },
  '👩‍🏫': {
    name: ':woman_teacher:',
    keywords: 'instructor, professor, teacher, woman',
  },
  '👩🏻‍🏫': {
    name: ':woman_teacher_light_skin_tone:',
    keywords: 'instructor, light skin tone, professor, teacher, woman',
  },
  '👩🏼‍🏫': {
    name: ':woman_teacher_medium_light_skin_tone:',
    keywords: 'instructor, medium-light skin tone, professor, teacher, woman',
  },
  '👩🏽‍🏫': {
    name: ':woman_teacher_medium_skin_tone:',
    keywords: 'instructor, medium skin tone, professor, teacher, woman',
  },
  '👩🏾‍🏫': {
    name: ':woman_teacher_medium_dark_skin_tone:',
    keywords: 'instructor, medium-dark skin tone, professor, teacher, woman',
  },
  '👩🏿‍🏫': {
    name: ':woman_teacher_dark_skin_tone:',
    keywords: 'dark skin tone, instructor, professor, teacher, woman',
  },
  '👨‍⚖️': {
    name: ':man_judge:',
    keywords: 'justice, man, scales',
  },
  '👨🏻‍⚖️': {
    name: ':man_judge_light_skin_tone:',
    keywords: 'justice, light skin tone, man, scales',
  },
  '👨🏼‍⚖️': {
    name: ':man_judge_medium_light_skin_tone:',
    keywords: 'justice, man, medium-light skin tone, scales',
  },
  '👨🏽‍⚖️': {
    name: ':man_judge_medium_skin_tone:',
    keywords: 'justice, man, medium skin tone, scales',
  },
  '👨🏾‍⚖️': {
    name: ':man_judge_medium_dark_skin_tone:',
    keywords: 'justice, man, medium-dark skin tone, scales',
  },
  '👨🏿‍⚖️': {
    name: ':man_judge_dark_skin_tone:',
    keywords: 'dark skin tone, justice, man, scales',
  },
  '👩‍⚖️': {
    name: ':woman_judge:',
    keywords: 'judge, scales, woman',
  },
  '👩🏻‍⚖️': {
    name: ':woman_judge_light_skin_tone:',
    keywords: 'judge, light skin tone, scales, woman',
  },
  '👩🏼‍⚖️': {
    name: ':woman_judge_medium_light_skin_tone:',
    keywords: 'judge, medium-light skin tone, scales, woman',
  },
  '👩🏽‍⚖️': {
    name: ':woman_judge_medium_skin_tone:',
    keywords: 'judge, medium skin tone, scales, woman',
  },
  '👩🏾‍⚖️': {
    name: ':woman_judge_medium_dark_skin_tone:',
    keywords: 'judge, medium-dark skin tone, scales, woman',
  },
  '👩🏿‍⚖️': {
    name: ':woman_judge_dark_skin_tone:',
    keywords: 'dark skin tone, judge, scales, woman',
  },
  '👨‍🌾': {
    name: ':man_farmer:',
    keywords: 'farmer, gardener, man, rancher',
  },
  '👨🏻‍🌾': {
    name: ':man_farmer_light_skin_tone:',
    keywords: 'farmer, gardener, light skin tone, man, rancher',
  },
  '👨🏼‍🌾': {
    name: ':man_farmer_medium_light_skin_tone:',
    keywords: 'farmer, gardener, man, medium-light skin tone, rancher',
  },
  '👨🏽‍🌾': {
    name: ':man_farmer_medium_skin_tone:',
    keywords: 'farmer, gardener, man, medium skin tone, rancher',
  },
  '👨🏾‍🌾': {
    name: ':man_farmer_medium_dark_skin_tone:',
    keywords: 'farmer, gardener, man, medium-dark skin tone, rancher',
  },
  '👨🏿‍🌾': {
    name: ':man_farmer_dark_skin_tone:',
    keywords: 'dark skin tone, farmer, gardener, man, rancher',
  },
  '👩‍🌾': {
    name: ':woman_farmer:',
    keywords: 'farmer, gardener, rancher, woman',
  },
  '👩🏻‍🌾': {
    name: ':woman_farmer_light_skin_tone:',
    keywords: 'farmer, gardener, light skin tone, rancher, woman',
  },
  '👩🏼‍🌾': {
    name: ':woman_farmer_medium_light_skin_tone:',
    keywords: 'farmer, gardener, medium-light skin tone, rancher, woman',
  },
  '👩🏽‍🌾': {
    name: ':woman_farmer_medium_skin_tone:',
    keywords: 'farmer, gardener, medium skin tone, rancher, woman',
  },
  '👩🏾‍🌾': {
    name: ':woman_farmer_medium_dark_skin_tone:',
    keywords: 'farmer, gardener, medium-dark skin tone, rancher, woman',
  },
  '👩🏿‍🌾': {
    name: ':woman_farmer_dark_skin_tone:',
    keywords: 'dark skin tone, farmer, gardener, rancher, woman',
  },
  '👨‍🍳': {
    name: ':man_cook:',
    keywords: 'chef, cook, man',
  },
  '👨🏻‍🍳': {
    name: ':man_cook_light_skin_tone:',
    keywords: 'chef, cook, light skin tone, man',
  },
  '👨🏼‍🍳': {
    name: ':man_cook_medium_light_skin_tone:',
    keywords: 'chef, cook, man, medium-light skin tone',
  },
  '👨🏽‍🍳': {
    name: ':man_cook_medium_skin_tone:',
    keywords: 'chef, cook, man, medium skin tone',
  },
  '👨🏾‍🍳': {
    name: ':man_cook_medium_dark_skin_tone:',
    keywords: 'chef, cook, man, medium-dark skin tone',
  },
  '👨🏿‍🍳': {
    name: ':man_cook_dark_skin_tone:',
    keywords: 'chef, cook, dark skin tone, man',
  },
  '👩‍🍳': {
    name: ':woman_cook:',
    keywords: 'chef, cook, woman',
  },
  '👩🏻‍🍳': {
    name: ':woman_cook_light_skin_tone:',
    keywords: 'chef, cook, light skin tone, woman',
  },
  '👩🏼‍🍳': {
    name: ':woman_cook_medium_light_skin_tone:',
    keywords: 'chef, cook, medium-light skin tone, woman',
  },
  '👩🏽‍🍳': {
    name: ':woman_cook_medium_skin_tone:',
    keywords: 'chef, cook, medium skin tone, woman',
  },
  '👩🏾‍🍳': {
    name: ':woman_cook_medium_dark_skin_tone:',
    keywords: 'chef, cook, medium-dark skin tone, woman',
  },
  '👩🏿‍🍳': {
    name: ':woman_cook_dark_skin_tone:',
    keywords: 'chef, cook, dark skin tone, woman',
  },
  '👨‍🔧': {
    name: ':man_mechanic:',
    keywords: 'electrician, man, mechanic, plumber, tradesperson',
  },
  '👨🏻‍🔧': {
    name: ':man_mechanic_light_skin_tone:',
    keywords: 'electrician, light skin tone, man, mechanic, plumber, tradesperson',
  },
  '👨🏼‍🔧': {
    name: ':man_mechanic_medium_light_skin_tone:',
    keywords: 'electrician, man, mechanic, medium-light skin tone, plumber, tradesperson',
  },
  '👨🏽‍🔧': {
    name: ':man_mechanic_medium_skin_tone:',
    keywords: 'electrician, man, mechanic, medium skin tone, plumber, tradesperson',
  },
  '👨🏾‍🔧': {
    name: ':man_mechanic_medium_dark_skin_tone:',
    keywords: 'electrician, man, mechanic, medium-dark skin tone, plumber, tradesperson',
  },
  '👨🏿‍🔧': {
    name: ':man_mechanic_dark_skin_tone:',
    keywords: 'dark skin tone, electrician, man, mechanic, plumber, tradesperson',
  },
  '👩‍🔧': {
    name: ':woman_mechanic:',
    keywords: 'electrician, mechanic, plumber, tradesperson, woman',
  },
  '👩🏻‍🔧': {
    name: ':woman_mechanic_light_skin_tone:',
    keywords: 'electrician, light skin tone, mechanic, plumber, tradesperson, woman',
  },
  '👩🏼‍🔧': {
    name: ':woman_mechanic_medium_light_skin_tone:',
    keywords: 'electrician, mechanic, medium-light skin tone, plumber, tradesperson, woman',
  },
  '👩🏽‍🔧': {
    name: ':woman_mechanic_medium_skin_tone:',
    keywords: 'electrician, mechanic, medium skin tone, plumber, tradesperson, woman',
  },
  '👩🏾‍🔧': {
    name: ':woman_mechanic_medium_dark_skin_tone:',
    keywords: 'electrician, mechanic, medium-dark skin tone, plumber, tradesperson, woman',
  },
  '👩🏿‍🔧': {
    name: ':woman_mechanic_dark_skin_tone:',
    keywords: 'dark skin tone, electrician, mechanic, plumber, tradesperson, woman',
  },
  '👨‍🏭': {
    name: ':man_factory_worker:',
    keywords: 'assembly, factory, industrial, man, worker',
  },
  '👨🏻‍🏭': {
    name: ':man_factory_worker_light_skin_tone:',
    keywords: 'assembly, factory, industrial, light skin tone, man, worker',
  },
  '👨🏼‍🏭': {
    name: ':man_factory_worker_medium_light_skin_tone:',
    keywords: 'assembly, factory, industrial, man, medium-light skin tone, worker',
  },
  '👨🏽‍🏭': {
    name: ':man_factory_worker_medium_skin_tone:',
    keywords: 'assembly, factory, industrial, man, medium skin tone, worker',
  },
  '👨🏾‍🏭': {
    name: ':man_factory_worker_medium_dark_skin_tone:',
    keywords: 'assembly, factory, industrial, man, medium-dark skin tone, worker',
  },
  '👨🏿‍🏭': {
    name: ':man_factory_worker_dark_skin_tone:',
    keywords: 'assembly, dark skin tone, factory, industrial, man, worker',
  },
  '👩‍🏭': {
    name: ':woman_factory_worker:',
    keywords: 'assembly, factory, industrial, woman, worker',
  },
  '👩🏻‍🏭': {
    name: ':woman_factory_worker_light_skin_tone:',
    keywords: 'assembly, factory, industrial, light skin tone, woman, worker',
  },
  '👩🏼‍🏭': {
    name: ':woman_factory_worker_medium_light_skin_tone:',
    keywords: 'assembly, factory, industrial, medium-light skin tone, woman, worker',
  },
  '👩🏽‍🏭': {
    name: ':woman_factory_worker_medium_skin_tone:',
    keywords: 'assembly, factory, industrial, medium skin tone, woman, worker',
  },
  '👩🏾‍🏭': {
    name: ':woman_factory_worker_medium_dark_skin_tone:',
    keywords: 'assembly, factory, industrial, medium-dark skin tone, woman, worker',
  },
  '👩🏿‍🏭': {
    name: ':woman_factory_worker_dark_skin_tone:',
    keywords: 'assembly, dark skin tone, factory, industrial, woman, worker',
  },
  '👨‍💼': {
    name: ':man_office_worker:',
    keywords: 'architect, business, man, manager, office, white-collar',
  },
  '👨🏻‍💼': {
    name: ':man_office_worker_light_skin_tone:',
    keywords: 'architect, business, light skin tone, man, manager, office, white-collar',
  },
  '👨🏼‍💼': {
    name: ':man_office_worker_medium_light_skin_tone:',
    keywords: 'architect, business, man, manager, medium-light skin tone, office, white-collar',
  },
  '👨🏽‍💼': {
    name: ':man_office_worker_medium_skin_tone:',
    keywords: 'architect, business, man, manager, medium skin tone, office, white-collar',
  },
  '👨🏾‍💼': {
    name: ':man_office_worker_medium_dark_skin_tone:',
    keywords: 'architect, business, man, manager, medium-dark skin tone, office, white-collar',
  },
  '👨🏿‍💼': {
    name: ':man_office_worker_dark_skin_tone:',
    keywords: 'architect, business, dark skin tone, man, manager, office, white-collar',
  },
  '👩‍💼': {
    name: ':woman_office_worker:',
    keywords: 'architect, business, manager, office, white-collar, woman',
  },
  '👩🏻‍💼': {
    name: ':woman_office_worker_light_skin_tone:',
    keywords: 'architect, business, light skin tone, manager, office, white-collar, woman',
  },
  '👩🏼‍💼': {
    name: ':woman_office_worker_medium_light_skin_tone:',
    keywords: 'architect, business, manager, medium-light skin tone, office, white-collar, woman',
  },
  '👩🏽‍💼': {
    name: ':woman_office_worker_medium_skin_tone:',
    keywords: 'architect, business, manager, medium skin tone, office, white-collar, woman',
  },
  '👩🏾‍💼': {
    name: ':woman_office_worker_medium_dark_skin_tone:',
    keywords: 'architect, business, manager, medium-dark skin tone, office, white-collar, woman',
  },
  '👩🏿‍💼': {
    name: ':woman_office_worker_dark_skin_tone:',
    keywords: 'architect, business, dark skin tone, manager, office, white-collar, woman',
  },
  '👨‍🔬': {
    name: ':man_scientist:',
    keywords: 'biologist, chemist, engineer, man, mathematician, physicist, scientist',
  },
  '👨🏻‍🔬': {
    name: ':man_scientist_light_skin_tone:',
    keywords: 'biologist, chemist, engineer, light skin tone, man, mathematician, physicist, scientist',
  },
  '👨🏼‍🔬': {
    name: ':man_scientist_medium_light_skin_tone:',
    keywords: 'biologist, chemist, engineer, man, mathematician, medium-light skin tone, physicist, scientist',
  },
  '👨🏽‍🔬': {
    name: ':man_scientist_medium_skin_tone:',
    keywords: 'biologist, chemist, engineer, man, mathematician, medium skin tone, physicist, scientist',
  },
  '👨🏾‍🔬': {
    name: ':man_scientist_medium_dark_skin_tone:',
    keywords: 'biologist, chemist, engineer, man, mathematician, medium-dark skin tone, physicist, scientist',
  },
  '👨🏿‍🔬': {
    name: ':man_scientist_dark_skin_tone:',
    keywords: 'biologist, chemist, dark skin tone, engineer, man, mathematician, physicist, scientist',
  },
  '👩‍🔬': {
    name: ':woman_scientist:',
    keywords: 'biologist, chemist, engineer, mathematician, physicist, scientist, woman',
  },
  '👩🏻‍🔬': {
    name: ':woman_scientist_light_skin_tone:',
    keywords: 'biologist, chemist, engineer, light skin tone, mathematician, physicist, scientist, woman',
  },
  '👩🏼‍🔬': {
    name: ':woman_scientist_medium_light_skin_tone:',
    keywords: 'biologist, chemist, engineer, mathematician, medium-light skin tone, physicist, scientist, woman',
  },
  '👩🏽‍🔬': {
    name: ':woman_scientist_medium_skin_tone:',
    keywords: 'biologist, chemist, engineer, mathematician, medium skin tone, physicist, scientist, woman',
  },
  '👩🏾‍🔬': {
    name: ':woman_scientist_medium_dark_skin_tone:',
    keywords: 'biologist, chemist, engineer, mathematician, medium-dark skin tone, physicist, scientist, woman',
  },
  '👩🏿‍🔬': {
    name: ':woman_scientist_dark_skin_tone:',
    keywords: 'biologist, chemist, dark skin tone, engineer, mathematician, physicist, scientist, woman',
  },
  '👨‍💻': {
    name: ':man_technologist:',
    keywords: 'coder, developer, inventor, man, software, technologist',
  },
  '👨🏻‍💻': {
    name: ':man_technologist_light_skin_tone:',
    keywords: 'coder, developer, inventor, light skin tone, man, software, technologist',
  },
  '👨🏼‍💻': {
    name: ':man_technologist_medium_light_skin_tone:',
    keywords: 'coder, developer, inventor, man, medium-light skin tone, software, technologist',
  },
  '👨🏽‍💻': {
    name: ':man_technologist_medium_skin_tone:',
    keywords: 'coder, developer, inventor, man, medium skin tone, software, technologist',
  },
  '👨🏾‍💻': {
    name: ':man_technologist_medium_dark_skin_tone:',
    keywords: 'coder, developer, inventor, man, medium-dark skin tone, software, technologist',
  },
  '👨🏿‍💻': {
    name: ':man_technologist_dark_skin_tone:',
    keywords: 'coder, dark skin tone, developer, inventor, man, software, technologist',
  },
  '👩‍💻': {
    name: ':woman_technologist:',
    keywords: 'coder, developer, inventor, software, technologist, woman',
  },
  '👩🏻‍💻': {
    name: ':woman_technologist_light_skin_tone:',
    keywords: 'coder, developer, inventor, light skin tone, software, technologist, woman',
  },
  '👩🏼‍💻': {
    name: ':woman_technologist_medium_light_skin_tone:',
    keywords: 'coder, developer, inventor, medium-light skin tone, software, technologist, woman',
  },
  '👩🏽‍💻': {
    name: ':woman_technologist_medium_skin_tone:',
    keywords: 'coder, developer, inventor, medium skin tone, software, technologist, woman',
  },
  '👩🏾‍💻': {
    name: ':woman_technologist_medium_dark_skin_tone:',
    keywords: 'coder, developer, inventor, medium-dark skin tone, software, technologist, woman',
  },
  '👩🏿‍💻': {
    name: ':woman_technologist_dark_skin_tone:',
    keywords: 'coder, dark skin tone, developer, inventor, software, technologist, woman',
  },
  '👨‍🎤': {
    name: ':man_singer:',
    keywords: 'actor, entertainer, man, rock, singer, star',
  },
  '👨🏻‍🎤': {
    name: ':man_singer_light_skin_tone:',
    keywords: 'actor, entertainer, light skin tone, man, rock, singer, star',
  },
  '👨🏼‍🎤': {
    name: ':man_singer_medium_light_skin_tone:',
    keywords: 'actor, entertainer, man, medium-light skin tone, rock, singer, star',
  },
  '👨🏽‍🎤': {
    name: ':man_singer_medium_skin_tone:',
    keywords: 'actor, entertainer, man, medium skin tone, rock, singer, star',
  },
  '👨🏾‍🎤': {
    name: ':man_singer_medium_dark_skin_tone:',
    keywords: 'actor, entertainer, man, medium-dark skin tone, rock, singer, star',
  },
  '👨🏿‍🎤': {
    name: ':man_singer_dark_skin_tone:',
    keywords: 'actor, dark skin tone, entertainer, man, rock, singer, star',
  },
  '👩‍🎤': {
    name: ':woman_singer:',
    keywords: 'actor, entertainer, rock, singer, star, woman',
  },
  '👩🏻‍🎤': {
    name: ':woman_singer_light_skin_tone:',
    keywords: 'actor, entertainer, light skin tone, rock, singer, star, woman',
  },
  '👩🏼‍🎤': {
    name: ':woman_singer_medium_light_skin_tone:',
    keywords: 'actor, entertainer, medium-light skin tone, rock, singer, star, woman',
  },
  '👩🏽‍🎤': {
    name: ':woman_singer_medium_skin_tone:',
    keywords: 'actor, entertainer, medium skin tone, rock, singer, star, woman',
  },
  '👩🏾‍🎤': {
    name: ':woman_singer_medium_dark_skin_tone:',
    keywords: 'actor, entertainer, medium-dark skin tone, rock, singer, star, woman',
  },
  '👩🏿‍🎤': {
    name: ':woman_singer_dark_skin_tone:',
    keywords: 'actor, dark skin tone, entertainer, rock, singer, star, woman',
  },
  '👨‍🎨': {
    name: ':man_artist:',
    keywords: 'artist, man, palette',
  },
  '👨🏻‍🎨': {
    name: ':man_artist_light_skin_tone:',
    keywords: 'artist, light skin tone, man, palette',
  },
  '👨🏼‍🎨': {
    name: ':man_artist_medium_light_skin_tone:',
    keywords: 'artist, man, medium-light skin tone, palette',
  },
  '👨🏽‍🎨': {
    name: ':man_artist_medium_skin_tone:',
    keywords: 'artist, man, medium skin tone, palette',
  },
  '👨🏾‍🎨': {
    name: ':man_artist_medium_dark_skin_tone:',
    keywords: 'artist, man, medium-dark skin tone, palette',
  },
  '👨🏿‍🎨': {
    name: ':man_artist_dark_skin_tone:',
    keywords: 'artist, dark skin tone, man, palette',
  },
  '👩‍🎨': {
    name: ':woman_artist:',
    keywords: 'artist, palette, woman',
  },
  '👩🏻‍🎨': {
    name: ':woman_artist_light_skin_tone:',
    keywords: 'artist, light skin tone, palette, woman',
  },
  '👩🏼‍🎨': {
    name: ':woman_artist_medium_light_skin_tone:',
    keywords: 'artist, medium-light skin tone, palette, woman',
  },
  '👩🏽‍🎨': {
    name: ':woman_artist_medium_skin_tone:',
    keywords: 'artist, medium skin tone, palette, woman',
  },
  '👩🏾‍🎨': {
    name: ':woman_artist_medium_dark_skin_tone:',
    keywords: 'artist, medium-dark skin tone, palette, woman',
  },
  '👩🏿‍🎨': {
    name: ':woman_artist_dark_skin_tone:',
    keywords: 'artist, dark skin tone, palette, woman',
  },
  '👨‍✈️': {
    name: ':man_pilot:',
    keywords: 'man, pilot, plane',
  },
  '👨🏻‍✈️': {
    name: ':man_pilot_light_skin_tone:',
    keywords: 'light skin tone, man, pilot, plane',
  },
  '👨🏼‍✈️': {
    name: ':man_pilot_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, pilot, plane',
  },
  '👨🏽‍✈️': {
    name: ':man_pilot_medium_skin_tone:',
    keywords: 'man, medium skin tone, pilot, plane',
  },
  '👨🏾‍✈️': {
    name: ':man_pilot_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, pilot, plane',
  },
  '👨🏿‍✈️': {
    name: ':man_pilot_dark_skin_tone:',
    keywords: 'dark skin tone, man, pilot, plane',
  },
  '👩‍✈️': {
    name: ':woman_pilot:',
    keywords: 'pilot, plane, woman',
  },
  '👩🏻‍✈️': {
    name: ':woman_pilot_light_skin_tone:',
    keywords: 'light skin tone, pilot, plane, woman',
  },
  '👩🏼‍✈️': {
    name: ':woman_pilot_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, pilot, plane, woman',
  },
  '👩🏽‍✈️': {
    name: ':woman_pilot_medium_skin_tone:',
    keywords: 'medium skin tone, pilot, plane, woman',
  },
  '👩🏾‍✈️': {
    name: ':woman_pilot_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, pilot, plane, woman',
  },
  '👩🏿‍✈️': {
    name: ':woman_pilot_dark_skin_tone:',
    keywords: 'dark skin tone, pilot, plane, woman',
  },
  '👨‍🚀': {
    name: ':man_astronaut:',
    keywords: 'astronaut, man, rocket',
  },
  '👨🏻‍🚀': {
    name: ':man_astronaut_light_skin_tone:',
    keywords: 'astronaut, light skin tone, man, rocket',
  },
  '👨🏼‍🚀': {
    name: ':man_astronaut_medium_light_skin_tone:',
    keywords: 'astronaut, man, medium-light skin tone, rocket',
  },
  '👨🏽‍🚀': {
    name: ':man_astronaut_medium_skin_tone:',
    keywords: 'astronaut, man, medium skin tone, rocket',
  },
  '👨🏾‍🚀': {
    name: ':man_astronaut_medium_dark_skin_tone:',
    keywords: 'astronaut, man, medium-dark skin tone, rocket',
  },
  '👨🏿‍🚀': {
    name: ':man_astronaut_dark_skin_tone:',
    keywords: 'astronaut, dark skin tone, man, rocket',
  },
  '👩‍🚀': {
    name: ':woman_astronaut:',
    keywords: 'astronaut, rocket, woman',
  },
  '👩🏻‍🚀': {
    name: ':woman_astronaut_light_skin_tone:',
    keywords: 'astronaut, light skin tone, rocket, woman',
  },
  '👩🏼‍🚀': {
    name: ':woman_astronaut_medium_light_skin_tone:',
    keywords: 'astronaut, medium-light skin tone, rocket, woman',
  },
  '👩🏽‍🚀': {
    name: ':woman_astronaut_medium_skin_tone:',
    keywords: 'astronaut, medium skin tone, rocket, woman',
  },
  '👩🏾‍🚀': {
    name: ':woman_astronaut_medium_dark_skin_tone:',
    keywords: 'astronaut, medium-dark skin tone, rocket, woman',
  },
  '👩🏿‍🚀': {
    name: ':woman_astronaut_dark_skin_tone:',
    keywords: 'astronaut, dark skin tone, rocket, woman',
  },
  '👨‍🚒': {
    name: ':man_firefighter:',
    keywords: 'firefighter, firetruck, man',
  },
  '👨🏻‍🚒': {
    name: ':man_firefighter_light_skin_tone:',
    keywords: 'firefighter, firetruck, light skin tone, man',
  },
  '👨🏼‍🚒': {
    name: ':man_firefighter_medium_light_skin_tone:',
    keywords: 'firefighter, firetruck, man, medium-light skin tone',
  },
  '👨🏽‍🚒': {
    name: ':man_firefighter_medium_skin_tone:',
    keywords: 'firefighter, firetruck, man, medium skin tone',
  },
  '👨🏾‍🚒': {
    name: ':man_firefighter_medium_dark_skin_tone:',
    keywords: 'firefighter, firetruck, man, medium-dark skin tone',
  },
  '👨🏿‍🚒': {
    name: ':man_firefighter_dark_skin_tone:',
    keywords: 'dark skin tone, firefighter, firetruck, man',
  },
  '👩‍🚒': {
    name: ':woman_firefighter:',
    keywords: 'firefighter, firetruck, woman',
  },
  '👩🏻‍🚒': {
    name: ':woman_firefighter_light_skin_tone:',
    keywords: 'firefighter, firetruck, light skin tone, woman',
  },
  '👩🏼‍🚒': {
    name: ':woman_firefighter_medium_light_skin_tone:',
    keywords: 'firefighter, firetruck, medium-light skin tone, woman',
  },
  '👩🏽‍🚒': {
    name: ':woman_firefighter_medium_skin_tone:',
    keywords: 'firefighter, firetruck, medium skin tone, woman',
  },
  '👩🏾‍🚒': {
    name: ':woman_firefighter_medium_dark_skin_tone:',
    keywords: 'firefighter, firetruck, medium-dark skin tone, woman',
  },
  '👩🏿‍🚒': {
    name: ':woman_firefighter_dark_skin_tone:',
    keywords: 'dark skin tone, firefighter, firetruck, woman',
  },
  '👮': {
    name: ':police_officer:',
    keywords: 'cop, officer, police',
    group: 'PEOPLE',
  },
  '👮🏻': {
    name: ':police_officer_light_skin_tone:',
    keywords: 'cop, light skin tone, officer, police',
  },
  '👮🏼': {
    name: ':police_officer_medium_light_skin_tone:',
    keywords: 'cop, medium-light skin tone, officer, police',
  },
  '👮🏽': {
    name: ':police_officer_medium_skin_tone:',
    keywords: 'cop, medium skin tone, officer, police',
  },
  '👮🏾': {
    name: ':police_officer_medium_dark_skin_tone:',
    keywords: 'cop, medium-dark skin tone, officer, police',
  },
  '👮🏿': {
    name: ':police_officer_dark_skin_tone:',
    keywords: 'cop, dark skin tone, officer, police',
  },
  '👮‍♂️': {
    name: ':man_police_officer:',
    keywords: 'cop, man, officer, police',
  },
  '👮🏻‍♂️': {
    name: ':man_police_officer_light_skin_tone:',
    keywords: 'cop, light skin tone, man, officer, police',
  },
  '👮🏼‍♂️': {
    name: ':man_police_officer_medium_light_skin_tone:',
    keywords: 'cop, man, medium-light skin tone, officer, police',
  },
  '👮🏽‍♂️': {
    name: ':man_police_officer_medium_skin_tone:',
    keywords: 'cop, man, medium skin tone, officer, police',
  },
  '👮🏾‍♂️': {
    name: ':man_police_officer_medium_dark_skin_tone:',
    keywords: 'cop, man, medium-dark skin tone, officer, police',
  },
  '👮🏿‍♂️': {
    name: ':man_police_officer_dark_skin_tone:',
    keywords: 'cop, dark skin tone, man, officer, police',
  },
  '👮‍♀️': {
    name: ':woman_police_officer:',
    keywords: 'cop, officer, police, woman',
  },
  '👮🏻‍♀️': {
    name: ':woman_police_officer_light_skin_tone:',
    keywords: 'cop, light skin tone, officer, police, woman',
  },
  '👮🏼‍♀️': {
    name: ':woman_police_officer_medium_light_skin_tone:',
    keywords: 'cop, medium-light skin tone, officer, police, woman',
  },
  '👮🏽‍♀️': {
    name: ':woman_police_officer_medium_skin_tone:',
    keywords: 'cop, medium skin tone, officer, police, woman',
  },
  '👮🏾‍♀️': {
    name: ':woman_police_officer_medium_dark_skin_tone:',
    keywords: 'cop, medium-dark skin tone, officer, police, woman',
  },
  '👮🏿‍♀️': {
    name: ':woman_police_officer_dark_skin_tone:',
    keywords: 'cop, dark skin tone, officer, police, woman',
  },
  '🕵': {
    name: ':detective:',
    keywords: 'detective, sleuth, spy',
  },
  '🕵🏻': {
    name: ':detective_light_skin_tone:',
    keywords: 'detective, light skin tone, sleuth, spy',
  },
  '🕵🏼': {
    name: ':detective_medium_light_skin_tone:',
    keywords: 'detective, medium-light skin tone, sleuth, spy',
  },
  '🕵🏽': {
    name: ':detective_medium_skin_tone:',
    keywords: 'detective, medium skin tone, sleuth, spy',
  },
  '🕵🏾': {
    name: ':detective_medium_dark_skin_tone:',
    keywords: 'detective, medium-dark skin tone, sleuth, spy',
  },
  '🕵🏿': {
    name: ':detective_dark_skin_tone:',
    keywords: 'dark skin tone, detective, sleuth, spy',
  },
  '🕵️‍♂️': {
    name: ':man_detective:',
    keywords: 'detective, man, sleuth, spy',
  },
  '🕵🏻‍♂️': {
    name: ':man_detective_light_skin_tone:',
    keywords: 'detective, light skin tone, man, sleuth, spy',
  },
  '🕵🏼‍♂️': {
    name: ':man_detective_medium_light_skin_tone:',
    keywords: 'detective, man, medium-light skin tone, sleuth, spy',
  },
  '🕵🏽‍♂️': {
    name: ':man_detective_medium_skin_tone:',
    keywords: 'detective, man, medium skin tone, sleuth, spy',
  },
  '🕵🏾‍♂️': {
    name: ':man_detective_medium_dark_skin_tone:',
    keywords: 'detective, man, medium-dark skin tone, sleuth, spy',
  },
  '🕵🏿‍♂️': {
    name: ':man_detective_dark_skin_tone:',
    keywords: 'dark skin tone, detective, man, sleuth, spy',
  },
  '🕵️‍♀️': {
    name: ':woman_detective:',
    keywords: 'detective, sleuth, spy, woman',
  },
  '🕵🏻‍♀️': {
    name: ':woman_detective_light_skin_tone:',
    keywords: 'detective, light skin tone, sleuth, spy, woman',
  },
  '🕵🏼‍♀️': {
    name: ':woman_detective_medium_light_skin_tone:',
    keywords: 'detective, medium-light skin tone, sleuth, spy, woman',
  },
  '🕵🏽‍♀️': {
    name: ':woman_detective_medium_skin_tone:',
    keywords: 'detective, medium skin tone, sleuth, spy, woman',
  },
  '🕵🏾‍♀️': {
    name: ':woman_detective_medium_dark_skin_tone:',
    keywords: 'detective, medium-dark skin tone, sleuth, spy, woman',
  },
  '🕵🏿‍♀️': {
    name: ':woman_detective_dark_skin_tone:',
    keywords: 'dark skin tone, detective, sleuth, spy, woman',
  },
  '💂': {
    name: ':guard:',
    keywords: 'guard',
    group: 'PEOPLE',
  },
  '💂🏻': {
    name: ':guard_light_skin_tone:',
    keywords: 'guard, light skin tone',
  },
  '💂🏼': {
    name: ':guard_medium_light_skin_tone:',
    keywords: 'guard, medium-light skin tone',
  },
  '💂🏽': {
    name: ':guard_medium_skin_tone:',
    keywords: 'guard, medium skin tone',
  },
  '💂🏾': {
    name: ':guard_medium_dark_skin_tone:',
    keywords: 'guard, medium-dark skin tone',
  },
  '💂🏿': {
    name: ':guard_dark_skin_tone:',
    keywords: 'dark skin tone, guard',
  },
  '💂‍♂️': {
    name: ':man_guard:',
    keywords: 'guard, man',
  },
  '💂🏻‍♂️': {
    name: ':man_guard_light_skin_tone:',
    keywords: 'guard, light skin tone, man',
  },
  '💂🏼‍♂️': {
    name: ':man_guard_medium_light_skin_tone:',
    keywords: 'guard, man, medium-light skin tone',
  },
  '💂🏽‍♂️': {
    name: ':man_guard_medium_skin_tone:',
    keywords: 'guard, man, medium skin tone',
  },
  '💂🏾‍♂️': {
    name: ':man_guard_medium_dark_skin_tone:',
    keywords: 'guard, man, medium-dark skin tone',
  },
  '💂🏿‍♂️': {
    name: ':man_guard_dark_skin_tone:',
    keywords: 'dark skin tone, guard, man',
  },
  '💂‍♀️': {
    name: ':woman_guard:',
    keywords: 'guard, woman',
  },
  '💂🏻‍♀️': {
    name: ':woman_guard_light_skin_tone:',
    keywords: 'guard, light skin tone, woman',
  },
  '💂🏼‍♀️': {
    name: ':woman_guard_medium_light_skin_tone:',
    keywords: 'guard, medium-light skin tone, woman',
  },
  '💂🏽‍♀️': {
    name: ':woman_guard_medium_skin_tone:',
    keywords: 'guard, medium skin tone, woman',
  },
  '💂🏾‍♀️': {
    name: ':woman_guard_medium_dark_skin_tone:',
    keywords: 'guard, medium-dark skin tone, woman',
  },
  '💂🏿‍♀️': {
    name: ':woman_guard_dark_skin_tone:',
    keywords: 'dark skin tone, guard, woman',
  },
  '👷': {
    name: ':construction_worker:',
    keywords: 'construction, hat, worker',
    group: 'PEOPLE',
  },
  '👷🏻': {
    name: ':construction_worker_light_skin_tone:',
    keywords: 'construction, hat, light skin tone, worker',
  },
  '👷🏼': {
    name: ':construction_worker_medium_light_skin_tone:',
    keywords: 'construction, hat, medium-light skin tone, worker',
  },
  '👷🏽': {
    name: ':construction_worker_medium_skin_tone:',
    keywords: 'construction, hat, medium skin tone, worker',
  },
  '👷🏾': {
    name: ':construction_worker_medium_dark_skin_tone:',
    keywords: 'construction, hat, medium-dark skin tone, worker',
  },
  '👷🏿': {
    name: ':construction_worker_dark_skin_tone:',
    keywords: 'construction, dark skin tone, hat, worker',
  },
  '👷‍♂️': {
    name: ':man_construction_worker:',
    keywords: 'construction, man, worker',
  },
  '👷🏻‍♂️': {
    name: ':man_construction_worker_light_skin_tone:',
    keywords: 'construction, light skin tone, man, worker',
  },
  '👷🏼‍♂️': {
    name: ':man_construction_worker_medium_light_skin_tone:',
    keywords: 'construction, man, medium-light skin tone, worker',
  },
  '👷🏽‍♂️': {
    name: ':man_construction_worker_medium_skin_tone:',
    keywords: 'construction, man, medium skin tone, worker',
  },
  '👷🏾‍♂️': {
    name: ':man_construction_worker_medium_dark_skin_tone:',
    keywords: 'construction, man, medium-dark skin tone, worker',
  },
  '👷🏿‍♂️': {
    name: ':man_construction_worker_dark_skin_tone:',
    keywords: 'construction, dark skin tone, man, worker',
  },
  '👷‍♀️': {
    name: ':woman_construction_worker:',
    keywords: 'construction, woman, worker',
  },
  '👷🏻‍♀️': {
    name: ':woman_construction_worker_light_skin_tone:',
    keywords: 'construction, light skin tone, woman, worker',
  },
  '👷🏼‍♀️': {
    name: ':woman_construction_worker_medium_light_skin_tone:',
    keywords: 'construction, medium-light skin tone, woman, worker',
  },
  '👷🏽‍♀️': {
    name: ':woman_construction_worker_medium_skin_tone:',
    keywords: 'construction, medium skin tone, woman, worker',
  },
  '👷🏾‍♀️': {
    name: ':woman_construction_worker_medium_dark_skin_tone:',
    keywords: 'construction, medium-dark skin tone, woman, worker',
  },
  '👷🏿‍♀️': {
    name: ':woman_construction_worker_dark_skin_tone:',
    keywords: 'construction, dark skin tone, woman, worker',
  },
  '👳': {
    name: ':person_wearing_turban:',
    keywords: 'turban',
    group: 'PEOPLE',
  },
  '👳🏻': {
    name: ':person_wearing_turban_light_skin_tone:',
    keywords: 'light skin tone, turban',
  },
  '👳🏼': {
    name: ':person_wearing_turban_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, turban',
  },
  '👳🏽': {
    name: ':person_wearing_turban_medium_skin_tone:',
    keywords: 'medium skin tone, turban',
  },
  '👳🏾': {
    name: ':person_wearing_turban_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, turban',
  },
  '👳🏿': {
    name: ':person_wearing_turban_dark_skin_tone:',
    keywords: 'dark skin tone, turban',
  },
  '👳‍♂️': {
    name: ':man_wearing_turban:',
    keywords: 'man, turban',
  },
  '👳🏻‍♂️': {
    name: ':man_wearing_turban_light_skin_tone:',
    keywords: 'light skin tone, man, turban',
  },
  '👳🏼‍♂️': {
    name: ':man_wearing_turban_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, turban',
  },
  '👳🏽‍♂️': {
    name: ':man_wearing_turban_medium_skin_tone:',
    keywords: 'man, medium skin tone, turban',
  },
  '👳🏾‍♂️': {
    name: ':man_wearing_turban_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, turban',
  },
  '👳🏿‍♂️': {
    name: ':man_wearing_turban_dark_skin_tone:',
    keywords: 'dark skin tone, man, turban',
  },
  '👳‍♀️': {
    name: ':woman_wearing_turban:',
    keywords: 'turban, woman',
  },
  '👳🏻‍♀️': {
    name: ':woman_wearing_turban_light_skin_tone:',
    keywords: 'light skin tone, turban, woman',
  },
  '👳🏼‍♀️': {
    name: ':woman_wearing_turban_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, turban, woman',
  },
  '👳🏽‍♀️': {
    name: ':woman_wearing_turban_medium_skin_tone:',
    keywords: 'medium skin tone, turban, woman',
  },
  '👳🏾‍♀️': {
    name: ':woman_wearing_turban_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, turban, woman',
  },
  '👳🏿‍♀️': {
    name: ':woman_wearing_turban_dark_skin_tone:',
    keywords: 'dark skin tone, turban, woman',
  },
  '👱': {
    name: ':blond_haired_person:',
    keywords: 'blond',
    group: 'PEOPLE',
  },
  '👱🏻': {
    name: ':blond_haired_person_light_skin_tone:',
    keywords: 'blond, light skin tone',
  },
  '👱🏼': {
    name: ':blond_haired_person_medium_light_skin_tone:',
    keywords: 'blond, medium-light skin tone',
  },
  '👱🏽': {
    name: ':blond_haired_person_medium_skin_tone:',
    keywords: 'blond, medium skin tone',
  },
  '👱🏾': {
    name: ':blond_haired_person_medium_dark_skin_tone:',
    keywords: 'blond, medium-dark skin tone',
  },
  '👱🏿': {
    name: ':blond_haired_person_dark_skin_tone:',
    keywords: 'blond, dark skin tone',
  },
  '👱‍♂️': {
    name: ':blond_haired_man:',
    keywords: 'blond, man',
  },
  '👱🏻‍♂️': {
    name: ':blond_haired_man_light_skin_tone:',
    keywords: 'blond, light skin tone, man',
  },
  '👱🏼‍♂️': {
    name: ':blond_haired_man_medium_light_skin_tone:',
    keywords: 'blond, man, medium-light skin tone',
  },
  '👱🏽‍♂️': {
    name: ':blond_haired_man_medium_skin_tone:',
    keywords: 'blond, man, medium skin tone',
  },
  '👱🏾‍♂️': {
    name: ':blond_haired_man_medium_dark_skin_tone:',
    keywords: 'blond, man, medium-dark skin tone',
  },
  '👱🏿‍♂️': {
    name: ':blond_haired_man_dark_skin_tone:',
    keywords: 'blond, dark skin tone, man',
  },
  '👱‍♀️': {
    name: ':blond_haired_woman:',
    keywords: 'blonde, woman',
  },
  '👱🏻‍♀️': {
    name: ':blond_haired_woman_light_skin_tone:',
    keywords: 'blonde, light skin tone, woman',
  },
  '👱🏼‍♀️': {
    name: ':blond_haired_woman_medium_light_skin_tone:',
    keywords: 'blonde, medium-light skin tone, woman',
  },
  '👱🏽‍♀️': {
    name: ':blond_haired_woman_medium_skin_tone:',
    keywords: 'blonde, medium skin tone, woman',
  },
  '👱🏾‍♀️': {
    name: ':blond_haired_woman_medium_dark_skin_tone:',
    keywords: 'blonde, medium-dark skin tone, woman',
  },
  '👱🏿‍♀️': {
    name: ':blond_haired_woman_dark_skin_tone:',
    keywords: 'blonde, dark skin tone, woman',
  },
  '🎅': {
    name: ':santa_claus:',
    keywords: 'celebration, Christmas, claus, father, santa',
    group: 'OBJECTS',
  },
  '🎅🏻': {
    name: ':santa_claus_light_skin_tone:',
    keywords: 'celebration, Christmas, claus, father, light skin tone, santa',
  },
  '🎅🏼': {
    name: ':santa_claus_medium_light_skin_tone:',
    keywords: 'celebration, Christmas, claus, father, medium-light skin tone, santa',
  },
  '🎅🏽': {
    name: ':santa_claus_medium_skin_tone:',
    keywords: 'celebration, Christmas, claus, father, medium skin tone, santa',
  },
  '🎅🏾': {
    name: ':santa_claus_medium_dark_skin_tone:',
    keywords: 'celebration, Christmas, claus, father, medium-dark skin tone, santa',
  },
  '🎅🏿': {
    name: ':santa_claus_dark_skin_tone:',
    keywords: 'celebration, Christmas, claus, dark skin tone, father, santa',
  },
  '🤶': {
    name: ':mrs_claus:',
    keywords: 'celebration, Christmas, claus, mother, Mrs.',
  },
  '🤶🏻': {
    name: ':mrs_claus_light_skin_tone:',
    keywords: 'celebration, Christmas, claus, light skin tone, mother, Mrs.',
  },
  '🤶🏼': {
    name: ':mrs_claus_medium_light_skin_tone:',
    keywords: 'celebration, Christmas, claus, medium-light skin tone, mother, Mrs.',
  },
  '🤶🏽': {
    name: ':mrs_claus_medium_skin_tone:',
    keywords: 'celebration, Christmas, claus, medium skin tone, mother, Mrs.',
  },
  '🤶🏾': {
    name: ':mrs_claus_medium_dark_skin_tone:',
    keywords: 'celebration, Christmas, claus, medium-dark skin tone, mother, Mrs.',
  },
  '🤶🏿': {
    name: ':mrs_claus_dark_skin_tone:',
    keywords: 'celebration, Christmas, claus, dark skin tone, mother, Mrs.',
  },
  '👸': {
    name: ':princess:',
    keywords: 'fairy tale, fantasy',
    group: 'PEOPLE',
  },
  '👸🏻': {
    name: ':princess_light_skin_tone:',
    keywords: 'fairy tale, fantasy, light skin tone',
  },
  '👸🏼': {
    name: ':princess_medium_light_skin_tone:',
    keywords: 'fairy tale, fantasy, medium-light skin tone',
  },
  '👸🏽': {
    name: ':princess_medium_skin_tone:',
    keywords: 'fairy tale, fantasy, medium skin tone',
  },
  '👸🏾': {
    name: ':princess_medium_dark_skin_tone:',
    keywords: 'fairy tale, fantasy, medium-dark skin tone',
  },
  '👸🏿': {
    name: ':princess_dark_skin_tone:',
    keywords: 'dark skin tone, fairy tale, fantasy',
  },
  '🤴': {
    name: ':prince:',
    keywords: 'prince',
  },
  '🤴🏻': {
    name: ':prince_light_skin_tone:',
    keywords: 'light skin tone, prince',
  },
  '🤴🏼': {
    name: ':prince_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, prince',
  },
  '🤴🏽': {
    name: ':prince_medium_skin_tone:',
    keywords: 'medium skin tone, prince',
  },
  '🤴🏾': {
    name: ':prince_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, prince',
  },
  '🤴🏿': {
    name: ':prince_dark_skin_tone:',
    keywords: 'dark skin tone, prince',
  },
  '👰': {
    name: ':bride_with_veil:',
    keywords: 'bride, veil, wedding',
    group: 'PEOPLE',
  },
  '👰🏻': {
    name: ':bride_with_veil_light_skin_tone:',
    keywords: 'bride, light skin tone, veil, wedding',
  },
  '👰🏼': {
    name: ':bride_with_veil_medium_light_skin_tone:',
    keywords: 'bride, medium-light skin tone, veil, wedding',
  },
  '👰🏽': {
    name: ':bride_with_veil_medium_skin_tone:',
    keywords: 'bride, medium skin tone, veil, wedding',
  },
  '👰🏾': {
    name: ':bride_with_veil_medium_dark_skin_tone:',
    keywords: 'bride, medium-dark skin tone, veil, wedding',
  },
  '👰🏿': {
    name: ':bride_with_veil_dark_skin_tone:',
    keywords: 'bride, dark skin tone, veil, wedding',
  },
  '🤵': {
    name: ':man_in_tuxedo:',
    keywords: 'groom, man, tuxedo',
  },
  '🤵🏻': {
    name: ':man_in_tuxedo_light_skin_tone:',
    keywords: 'groom, light skin tone, man, tuxedo',
  },
  '🤵🏼': {
    name: ':man_in_tuxedo_medium_light_skin_tone:',
    keywords: 'groom, man, medium-light skin tone, tuxedo',
  },
  '🤵🏽': {
    name: ':man_in_tuxedo_medium_skin_tone:',
    keywords: 'groom, man, medium skin tone, tuxedo',
  },
  '🤵🏾': {
    name: ':man_in_tuxedo_medium_dark_skin_tone:',
    keywords: 'groom, man, medium-dark skin tone, tuxedo',
  },
  '🤵🏿': {
    name: ':man_in_tuxedo_dark_skin_tone:',
    keywords: 'dark skin tone, groom, man, tuxedo',
  },
  '🤰': {
    name: ':pregnant_woman:',
    keywords: 'pregnant, woman',
  },
  '🤰🏻': {
    name: ':pregnant_woman_light_skin_tone:',
    keywords: 'light skin tone, pregnant, woman',
  },
  '🤰🏼': {
    name: ':pregnant_woman_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, pregnant, woman',
  },
  '🤰🏽': {
    name: ':pregnant_woman_medium_skin_tone:',
    keywords: 'medium skin tone, pregnant, woman',
  },
  '🤰🏾': {
    name: ':pregnant_woman_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, pregnant, woman',
  },
  '🤰🏿': {
    name: ':pregnant_woman_dark_skin_tone:',
    keywords: 'dark skin tone, pregnant, woman',
  },
  '👲': {
    name: ':man_with_chinese_cap:',
    keywords: 'gua pi mao, hat, man',
    group: 'PEOPLE',
  },
  '👲🏻': {
    name: ':man_with_chinese_cap_light_skin_tone:',
    keywords: 'gua pi mao, hat, light skin tone, man',
  },
  '👲🏼': {
    name: ':man_with_chinese_cap_medium_light_skin_tone:',
    keywords: 'gua pi mao, hat, man, medium-light skin tone',
  },
  '👲🏽': {
    name: ':man_with_chinese_cap_medium_skin_tone:',
    keywords: 'gua pi mao, hat, man, medium skin tone',
  },
  '👲🏾': {
    name: ':man_with_chinese_cap_medium_dark_skin_tone:',
    keywords: 'gua pi mao, hat, man, medium-dark skin tone',
  },
  '👲🏿': {
    name: ':man_with_chinese_cap_dark_skin_tone:',
    keywords: 'dark skin tone, gua pi mao, hat, man',
  },
  '🙍': {
    name: ':person_frowning:',
    keywords: 'frown, gesture',
    group: 'PEOPLE',
  },
  '🙍🏻': {
    name: ':person_frowning_light_skin_tone:',
    keywords: 'frown, gesture, light skin tone',
  },
  '🙍🏼': {
    name: ':person_frowning_medium_light_skin_tone:',
    keywords: 'frown, gesture, medium-light skin tone',
  },
  '🙍🏽': {
    name: ':person_frowning_medium_skin_tone:',
    keywords: 'frown, gesture, medium skin tone',
  },
  '🙍🏾': {
    name: ':person_frowning_medium_dark_skin_tone:',
    keywords: 'frown, gesture, medium-dark skin tone',
  },
  '🙍🏿': {
    name: ':person_frowning_dark_skin_tone:',
    keywords: 'dark skin tone, frown, gesture',
  },
  '🙍‍♂️': {
    name: ':man_frowning:',
    keywords: 'frowning, gesture, man',
  },
  '🙍🏻‍♂️': {
    name: ':man_frowning_light_skin_tone:',
    keywords: 'frowning, gesture, light skin tone, man',
  },
  '🙍🏼‍♂️': {
    name: ':man_frowning_medium_light_skin_tone:',
    keywords: 'frowning, gesture, man, medium-light skin tone',
  },
  '🙍🏽‍♂️': {
    name: ':man_frowning_medium_skin_tone:',
    keywords: 'frowning, gesture, man, medium skin tone',
  },
  '🙍🏾‍♂️': {
    name: ':man_frowning_medium_dark_skin_tone:',
    keywords: 'frowning, gesture, man, medium-dark skin tone',
  },
  '🙍🏿‍♂️': {
    name: ':man_frowning_dark_skin_tone:',
    keywords: 'dark skin tone, frowning, gesture, man',
  },
  '🙍‍♀️': {
    name: ':woman_frowning:',
    keywords: 'frowning, gesture, woman',
  },
  '🙍🏻‍♀️': {
    name: ':woman_frowning_light_skin_tone:',
    keywords: 'frowning, gesture, light skin tone, woman',
  },
  '🙍🏼‍♀️': {
    name: ':woman_frowning_medium_light_skin_tone:',
    keywords: 'frowning, gesture, medium-light skin tone, woman',
  },
  '🙍🏽‍♀️': {
    name: ':woman_frowning_medium_skin_tone:',
    keywords: 'frowning, gesture, medium skin tone, woman',
  },
  '🙍🏾‍♀️': {
    name: ':woman_frowning_medium_dark_skin_tone:',
    keywords: 'frowning, gesture, medium-dark skin tone, woman',
  },
  '🙍🏿‍♀️': {
    name: ':woman_frowning_dark_skin_tone:',
    keywords: 'dark skin tone, frowning, gesture, woman',
  },
  '🙎': {
    name: ':person_pouting:',
    keywords: 'gesture, pouting',
    group: 'PEOPLE',
  },
  '🙎🏻': {
    name: ':person_pouting_light_skin_tone:',
    keywords: 'gesture, light skin tone, pouting',
  },
  '🙎🏼': {
    name: ':person_pouting_medium_light_skin_tone:',
    keywords: 'gesture, medium-light skin tone, pouting',
  },
  '🙎🏽': {
    name: ':person_pouting_medium_skin_tone:',
    keywords: 'gesture, medium skin tone, pouting',
  },
  '🙎🏾': {
    name: ':person_pouting_medium_dark_skin_tone:',
    keywords: 'gesture, medium-dark skin tone, pouting',
  },
  '🙎🏿': {
    name: ':person_pouting_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, pouting',
  },
  '🙎‍♂️': {
    name: ':man_pouting:',
    keywords: 'gesture, man, pouting',
  },
  '🙎🏻‍♂️': {
    name: ':man_pouting_light_skin_tone:',
    keywords: 'gesture, light skin tone, man, pouting',
  },
  '🙎🏼‍♂️': {
    name: ':man_pouting_medium_light_skin_tone:',
    keywords: 'gesture, man, medium-light skin tone, pouting',
  },
  '🙎🏽‍♂️': {
    name: ':man_pouting_medium_skin_tone:',
    keywords: 'gesture, man, medium skin tone, pouting',
  },
  '🙎🏾‍♂️': {
    name: ':man_pouting_medium_dark_skin_tone:',
    keywords: 'gesture, man, medium-dark skin tone, pouting',
  },
  '🙎🏿‍♂️': {
    name: ':man_pouting_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, man, pouting',
  },
  '🙎‍♀️': {
    name: ':woman_pouting:',
    keywords: 'gesture, pouting, woman',
  },
  '🙎🏻‍♀️': {
    name: ':woman_pouting_light_skin_tone:',
    keywords: 'gesture, light skin tone, pouting, woman',
  },
  '🙎🏼‍♀️': {
    name: ':woman_pouting_medium_light_skin_tone:',
    keywords: 'gesture, medium-light skin tone, pouting, woman',
  },
  '🙎🏽‍♀️': {
    name: ':woman_pouting_medium_skin_tone:',
    keywords: 'gesture, medium skin tone, pouting, woman',
  },
  '🙎🏾‍♀️': {
    name: ':woman_pouting_medium_dark_skin_tone:',
    keywords: 'gesture, medium-dark skin tone, pouting, woman',
  },
  '🙎🏿‍♀️': {
    name: ':woman_pouting_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, pouting, woman',
  },
  '🙅': {
    name: ':person_gesturing_no:',
    keywords: 'forbidden, gesture, hand, no, not, prohibited',
    group: 'PEOPLE',
  },
  '🙅🏻': {
    name: ':person_gesturing_no_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, light skin tone, no, not, prohibited',
  },
  '🙅🏼': {
    name: ':person_gesturing_no_medium_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium-light skin tone, no, not, prohibited',
  },
  '🙅🏽': {
    name: ':person_gesturing_no_medium_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium skin tone, no, not, prohibited',
  },
  '🙅🏾': {
    name: ':person_gesturing_no_medium_dark_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium-dark skin tone, no, not, prohibited',
  },
  '🙅🏿': {
    name: ':person_gesturing_no_dark_skin_tone:',
    keywords: 'dark skin tone, forbidden, gesture, hand, no, not, prohibited',
  },
  '🙅‍♂️': {
    name: ':man_gesturing_no:',
    keywords: 'forbidden, gesture, hand, man, no, prohibited',
  },
  '🙅🏻‍♂️': {
    name: ':man_gesturing_no_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, light skin tone, man, no, prohibited',
  },
  '🙅🏼‍♂️': {
    name: ':man_gesturing_no_medium_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, man, medium-light skin tone, no, prohibited',
  },
  '🙅🏽‍♂️': {
    name: ':man_gesturing_no_medium_skin_tone:',
    keywords: 'forbidden, gesture, hand, man, medium skin tone, no, prohibited',
  },
  '🙅🏾‍♂️': {
    name: ':man_gesturing_no_medium_dark_skin_tone:',
    keywords: 'forbidden, gesture, hand, man, medium-dark skin tone, no, prohibited',
  },
  '🙅🏿‍♂️': {
    name: ':man_gesturing_no_dark_skin_tone:',
    keywords: 'dark skin tone, forbidden, gesture, hand, man, no, prohibited',
  },
  '🙅‍♀️': {
    name: ':woman_gesturing_no:',
    keywords: 'forbidden, gesture, hand, no, prohibited, woman',
  },
  '🙅🏻‍♀️': {
    name: ':woman_gesturing_no_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, light skin tone, no, prohibited, woman',
  },
  '🙅🏼‍♀️': {
    name: ':woman_gesturing_no_medium_light_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium-light skin tone, no, prohibited, woman',
  },
  '🙅🏽‍♀️': {
    name: ':woman_gesturing_no_medium_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium skin tone, no, prohibited, woman',
  },
  '🙅🏾‍♀️': {
    name: ':woman_gesturing_no_medium_dark_skin_tone:',
    keywords: 'forbidden, gesture, hand, medium-dark skin tone, no, prohibited, woman',
  },
  '🙅🏿‍♀️': {
    name: ':woman_gesturing_no_dark_skin_tone:',
    keywords: 'dark skin tone, forbidden, gesture, hand, no, prohibited, woman',
  },
  '🙆': {
    name: ':person_gesturing_ok:',
    keywords: 'gesture, hand, OK',
    group: 'PEOPLE',
  },
  '🙆🏻': {
    name: ':person_gesturing_ok_light_skin_tone:',
    keywords: 'gesture, hand, light skin tone, OK',
  },
  '🙆🏼': {
    name: ':person_gesturing_ok_medium_light_skin_tone:',
    keywords: 'gesture, hand, medium-light skin tone, OK',
  },
  '🙆🏽': {
    name: ':person_gesturing_ok_medium_skin_tone:',
    keywords: 'gesture, hand, medium skin tone, OK',
  },
  '🙆🏾': {
    name: ':person_gesturing_ok_medium_dark_skin_tone:',
    keywords: 'gesture, hand, medium-dark skin tone, OK',
  },
  '🙆🏿': {
    name: ':person_gesturing_ok_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, hand, OK',
  },
  '🙆‍♂️': {
    name: ':man_gesturing_ok:',
    keywords: 'gesture, hand, man, OK',
  },
  '🙆🏻‍♂️': {
    name: ':man_gesturing_ok_light_skin_tone:',
    keywords: 'gesture, hand, light skin tone, man, OK',
  },
  '🙆🏼‍♂️': {
    name: ':man_gesturing_ok_medium_light_skin_tone:',
    keywords: 'gesture, hand, man, medium-light skin tone, OK',
  },
  '🙆🏽‍♂️': {
    name: ':man_gesturing_ok_medium_skin_tone:',
    keywords: 'gesture, hand, man, medium skin tone, OK',
  },
  '🙆🏾‍♂️': {
    name: ':man_gesturing_ok_medium_dark_skin_tone:',
    keywords: 'gesture, hand, man, medium-dark skin tone, OK',
  },
  '🙆🏿‍♂️': {
    name: ':man_gesturing_ok_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, hand, man, OK',
  },
  '🙆‍♀️': {
    name: ':woman_gesturing_ok:',
    keywords: 'gesture, hand, OK, woman',
  },
  '🙆🏻‍♀️': {
    name: ':woman_gesturing_ok_light_skin_tone:',
    keywords: 'gesture, hand, light skin tone, OK, woman',
  },
  '🙆🏼‍♀️': {
    name: ':woman_gesturing_ok_medium_light_skin_tone:',
    keywords: 'gesture, hand, medium-light skin tone, OK, woman',
  },
  '🙆🏽‍♀️': {
    name: ':woman_gesturing_ok_medium_skin_tone:',
    keywords: 'gesture, hand, medium skin tone, OK, woman',
  },
  '🙆🏾‍♀️': {
    name: ':woman_gesturing_ok_medium_dark_skin_tone:',
    keywords: 'gesture, hand, medium-dark skin tone, OK, woman',
  },
  '🙆🏿‍♀️': {
    name: ':woman_gesturing_ok_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, hand, OK, woman',
  },
  '💁': {
    name: ':person_tipping_hand:',
    keywords: 'hand, help, information, sassy, tipping',
    group: 'PEOPLE',
  },
  '💁🏻': {
    name: ':person_tipping_hand_light_skin_tone:',
    keywords: 'hand, help, information, light skin tone, sassy, tipping',
  },
  '💁🏼': {
    name: ':person_tipping_hand_medium_light_skin_tone:',
    keywords: 'hand, help, information, medium-light skin tone, sassy, tipping',
  },
  '💁🏽': {
    name: ':person_tipping_hand_medium_skin_tone:',
    keywords: 'hand, help, information, medium skin tone, sassy, tipping',
  },
  '💁🏾': {
    name: ':person_tipping_hand_medium_dark_skin_tone:',
    keywords: 'hand, help, information, medium-dark skin tone, sassy, tipping',
  },
  '💁🏿': {
    name: ':person_tipping_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand, help, information, sassy, tipping',
  },
  '💁‍♂️': {
    name: ':man_tipping_hand:',
    keywords: 'man, sassy, tipping hand',
  },
  '💁🏻‍♂️': {
    name: ':man_tipping_hand_light_skin_tone:',
    keywords: 'light skin tone, man, sassy, tipping hand',
  },
  '💁🏼‍♂️': {
    name: ':man_tipping_hand_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, sassy, tipping hand',
  },
  '💁🏽‍♂️': {
    name: ':man_tipping_hand_medium_skin_tone:',
    keywords: 'man, medium skin tone, sassy, tipping hand',
  },
  '💁🏾‍♂️': {
    name: ':man_tipping_hand_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, sassy, tipping hand',
  },
  '💁🏿‍♂️': {
    name: ':man_tipping_hand_dark_skin_tone:',
    keywords: 'dark skin tone, man, sassy, tipping hand',
  },
  '💁‍♀️': {
    name: ':woman_tipping_hand:',
    keywords: 'sassy, tipping hand, woman',
  },
  '💁🏻‍♀️': {
    name: ':woman_tipping_hand_light_skin_tone:',
    keywords: 'light skin tone, sassy, tipping hand, woman',
  },
  '💁🏼‍♀️': {
    name: ':woman_tipping_hand_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, sassy, tipping hand, woman',
  },
  '💁🏽‍♀️': {
    name: ':woman_tipping_hand_medium_skin_tone:',
    keywords: 'medium skin tone, sassy, tipping hand, woman',
  },
  '💁🏾‍♀️': {
    name: ':woman_tipping_hand_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, sassy, tipping hand, woman',
  },
  '💁🏿‍♀️': {
    name: ':woman_tipping_hand_dark_skin_tone:',
    keywords: 'dark skin tone, sassy, tipping hand, woman',
  },
  '🙋': {
    name: ':person_raising_hand:',
    keywords: 'gesture, hand, happy, raised',
    group: 'PEOPLE',
  },
  '🙋🏻': {
    name: ':person_raising_hand_light_skin_tone:',
    keywords: 'gesture, hand, happy, light skin tone, raised',
  },
  '🙋🏼': {
    name: ':person_raising_hand_medium_light_skin_tone:',
    keywords: 'gesture, hand, happy, medium-light skin tone, raised',
  },
  '🙋🏽': {
    name: ':person_raising_hand_medium_skin_tone:',
    keywords: 'gesture, hand, happy, medium skin tone, raised',
  },
  '🙋🏾': {
    name: ':person_raising_hand_medium_dark_skin_tone:',
    keywords: 'gesture, hand, happy, medium-dark skin tone, raised',
  },
  '🙋🏿': {
    name: ':person_raising_hand_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, hand, happy, raised',
  },
  '🙋‍♂️': {
    name: ':man_raising_hand:',
    keywords: 'gesture, man, raising hand',
  },
  '🙋🏻‍♂️': {
    name: ':man_raising_hand_light_skin_tone:',
    keywords: 'gesture, light skin tone, man, raising hand',
  },
  '🙋🏼‍♂️': {
    name: ':man_raising_hand_medium_light_skin_tone:',
    keywords: 'gesture, man, medium-light skin tone, raising hand',
  },
  '🙋🏽‍♂️': {
    name: ':man_raising_hand_medium_skin_tone:',
    keywords: 'gesture, man, medium skin tone, raising hand',
  },
  '🙋🏾‍♂️': {
    name: ':man_raising_hand_medium_dark_skin_tone:',
    keywords: 'gesture, man, medium-dark skin tone, raising hand',
  },
  '🙋🏿‍♂️': {
    name: ':man_raising_hand_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, man, raising hand',
  },
  '🙋‍♀️': {
    name: ':woman_raising_hand:',
    keywords: 'gesture, raising hand, woman',
  },
  '🙋🏻‍♀️': {
    name: ':woman_raising_hand_light_skin_tone:',
    keywords: 'gesture, light skin tone, raising hand, woman',
  },
  '🙋🏼‍♀️': {
    name: ':woman_raising_hand_medium_light_skin_tone:',
    keywords: 'gesture, medium-light skin tone, raising hand, woman',
  },
  '🙋🏽‍♀️': {
    name: ':woman_raising_hand_medium_skin_tone:',
    keywords: 'gesture, medium skin tone, raising hand, woman',
  },
  '🙋🏾‍♀️': {
    name: ':woman_raising_hand_medium_dark_skin_tone:',
    keywords: 'gesture, medium-dark skin tone, raising hand, woman',
  },
  '🙋🏿‍♀️': {
    name: ':woman_raising_hand_dark_skin_tone:',
    keywords: 'dark skin tone, gesture, raising hand, woman',
  },
  '🙇': {
    name: ':person_bowing:',
    keywords: 'apology, bow, gesture, sorry',
    group: 'PEOPLE',
  },
  '🙇🏻': {
    name: ':person_bowing_light_skin_tone:',
    keywords: 'apology, bow, gesture, light skin tone, sorry',
  },
  '🙇🏼': {
    name: ':person_bowing_medium_light_skin_tone:',
    keywords: 'apology, bow, gesture, medium-light skin tone, sorry',
  },
  '🙇🏽': {
    name: ':person_bowing_medium_skin_tone:',
    keywords: 'apology, bow, gesture, medium skin tone, sorry',
  },
  '🙇🏾': {
    name: ':person_bowing_medium_dark_skin_tone:',
    keywords: 'apology, bow, gesture, medium-dark skin tone, sorry',
  },
  '🙇🏿': {
    name: ':person_bowing_dark_skin_tone:',
    keywords: 'apology, bow, dark skin tone, gesture, sorry',
  },
  '🙇‍♂️': {
    name: ':man_bowing:',
    keywords: 'apology, bowing, favor, gesture, man, sorry',
  },
  '🙇🏻‍♂️': {
    name: ':man_bowing_light_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, light skin tone, man, sorry',
  },
  '🙇🏼‍♂️': {
    name: ':man_bowing_medium_light_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, man, medium-light skin tone, sorry',
  },
  '🙇🏽‍♂️': {
    name: ':man_bowing_medium_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, man, medium skin tone, sorry',
  },
  '🙇🏾‍♂️': {
    name: ':man_bowing_medium_dark_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, man, medium-dark skin tone, sorry',
  },
  '🙇🏿‍♂️': {
    name: ':man_bowing_dark_skin_tone:',
    keywords: 'apology, bowing, dark skin tone, favor, gesture, man, sorry',
  },
  '🙇‍♀️': {
    name: ':woman_bowing:',
    keywords: 'apology, bowing, favor, gesture, sorry, woman',
  },
  '🙇🏻‍♀️': {
    name: ':woman_bowing_light_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, light skin tone, sorry, woman',
  },
  '🙇🏼‍♀️': {
    name: ':woman_bowing_medium_light_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, medium-light skin tone, sorry, woman',
  },
  '🙇🏽‍♀️': {
    name: ':woman_bowing_medium_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, medium skin tone, sorry, woman',
  },
  '🙇🏾‍♀️': {
    name: ':woman_bowing_medium_dark_skin_tone:',
    keywords: 'apology, bowing, favor, gesture, medium-dark skin tone, sorry, woman',
  },
  '🙇🏿‍♀️': {
    name: ':woman_bowing_dark_skin_tone:',
    keywords: 'apology, bowing, dark skin tone, favor, gesture, sorry, woman',
  },
  '🤦': {
    name: ':person_facepalming:',
    keywords: 'disbelief, exasperation, face, palm',
  },
  '🤦🏻': {
    name: ':person_facepalming_light_skin_tone:',
    keywords: 'disbelief, exasperation, face, light skin tone, palm',
  },
  '🤦🏼': {
    name: ':person_facepalming_medium_light_skin_tone:',
    keywords: 'disbelief, exasperation, face, medium-light skin tone, palm',
  },
  '🤦🏽': {
    name: ':person_facepalming_medium_skin_tone:',
    keywords: 'disbelief, exasperation, face, medium skin tone, palm',
  },
  '🤦🏾': {
    name: ':person_facepalming_medium_dark_skin_tone:',
    keywords: 'disbelief, exasperation, face, medium-dark skin tone, palm',
  },
  '🤦🏿': {
    name: ':person_facepalming_dark_skin_tone:',
    keywords: 'dark skin tone, disbelief, exasperation, face, palm',
  },
  '🤦‍♂️': {
    name: ':man_facepalming:',
    keywords: 'disbelief, exasperation, facepalm, man',
  },
  '🤦🏻‍♂️': {
    name: ':man_facepalming_light_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, light skin tone, man',
  },
  '🤦🏼‍♂️': {
    name: ':man_facepalming_medium_light_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, man, medium-light skin tone',
  },
  '🤦🏽‍♂️': {
    name: ':man_facepalming_medium_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, man, medium skin tone',
  },
  '🤦🏾‍♂️': {
    name: ':man_facepalming_medium_dark_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, man, medium-dark skin tone',
  },
  '🤦🏿‍♂️': {
    name: ':man_facepalming_dark_skin_tone:',
    keywords: 'dark skin tone, disbelief, exasperation, facepalm, man',
  },
  '🤦‍♀️': {
    name: ':woman_facepalming:',
    keywords: 'disbelief, exasperation, facepalm, woman',
  },
  '🤦🏻‍♀️': {
    name: ':woman_facepalming_light_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, light skin tone, woman',
  },
  '🤦🏼‍♀️': {
    name: ':woman_facepalming_medium_light_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, medium-light skin tone, woman',
  },
  '🤦🏽‍♀️': {
    name: ':woman_facepalming_medium_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, medium skin tone, woman',
  },
  '🤦🏾‍♀️': {
    name: ':woman_facepalming_medium_dark_skin_tone:',
    keywords: 'disbelief, exasperation, facepalm, medium-dark skin tone, woman',
  },
  '🤦🏿‍♀️': {
    name: ':woman_facepalming_dark_skin_tone:',
    keywords: 'dark skin tone, disbelief, exasperation, facepalm, woman',
  },
  '🤷': {
    name: ':person_shrugging:',
    keywords: 'doubt, ignorance, indifference, shrug',
  },
  '🤷🏻': {
    name: ':person_shrugging_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, light skin tone, shrug',
  },
  '🤷🏼': {
    name: ':person_shrugging_medium_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium-light skin tone, shrug',
  },
  '🤷🏽': {
    name: ':person_shrugging_medium_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium skin tone, shrug',
  },
  '🤷🏾': {
    name: ':person_shrugging_medium_dark_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium-dark skin tone, shrug',
  },
  '🤷🏿': {
    name: ':person_shrugging_dark_skin_tone:',
    keywords: 'dark skin tone, doubt, ignorance, indifference, shrug',
  },
  '🤷‍♂️': {
    name: ':man_shrugging:',
    keywords: 'doubt, ignorance, indifference, man, shrug',
  },
  '🤷🏻‍♂️': {
    name: ':man_shrugging_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, light skin tone, man, shrug',
  },
  '🤷🏼‍♂️': {
    name: ':man_shrugging_medium_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, man, medium-light skin tone, shrug',
  },
  '🤷🏽‍♂️': {
    name: ':man_shrugging_medium_skin_tone:',
    keywords: 'doubt, ignorance, indifference, man, medium skin tone, shrug',
  },
  '🤷🏾‍♂️': {
    name: ':man_shrugging_medium_dark_skin_tone:',
    keywords: 'doubt, ignorance, indifference, man, medium-dark skin tone, shrug',
  },
  '🤷🏿‍♂️': {
    name: ':man_shrugging_dark_skin_tone:',
    keywords: 'dark skin tone, doubt, ignorance, indifference, man, shrug',
  },
  '🤷‍♀️': {
    name: ':woman_shrugging:',
    keywords: 'doubt, ignorance, indifference, shrug, woman',
  },
  '🤷🏻‍♀️': {
    name: ':woman_shrugging_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, light skin tone, shrug, woman',
  },
  '🤷🏼‍♀️': {
    name: ':woman_shrugging_medium_light_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium-light skin tone, shrug, woman',
  },
  '🤷🏽‍♀️': {
    name: ':woman_shrugging_medium_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium skin tone, shrug, woman',
  },
  '🤷🏾‍♀️': {
    name: ':woman_shrugging_medium_dark_skin_tone:',
    keywords: 'doubt, ignorance, indifference, medium-dark skin tone, shrug, woman',
  },
  '🤷🏿‍♀️': {
    name: ':woman_shrugging_dark_skin_tone:',
    keywords: 'dark skin tone, doubt, ignorance, indifference, shrug, woman',
  },
  '💆': {
    name: ':person_getting_massage:',
    keywords: 'face, massage, salon',
    group: 'PEOPLE',
  },
  '💆🏻': {
    name: ':person_getting_massage_light_skin_tone:',
    keywords: 'face, light skin tone, massage, salon',
  },
  '💆🏼': {
    name: ':person_getting_massage_medium_light_skin_tone:',
    keywords: 'face, massage, medium-light skin tone, salon',
  },
  '💆🏽': {
    name: ':person_getting_massage_medium_skin_tone:',
    keywords: 'face, massage, medium skin tone, salon',
  },
  '💆🏾': {
    name: ':person_getting_massage_medium_dark_skin_tone:',
    keywords: 'face, massage, medium-dark skin tone, salon',
  },
  '💆🏿': {
    name: ':person_getting_massage_dark_skin_tone:',
    keywords: 'dark skin tone, face, massage, salon',
  },
  '💆‍♂️': {
    name: ':man_getting_massage:',
    keywords: 'face, man, massage',
  },
  '💆🏻‍♂️': {
    name: ':man_getting_massage_light_skin_tone:',
    keywords: 'face, light skin tone, man, massage',
  },
  '💆🏼‍♂️': {
    name: ':man_getting_massage_medium_light_skin_tone:',
    keywords: 'face, man, massage, medium-light skin tone',
  },
  '💆🏽‍♂️': {
    name: ':man_getting_massage_medium_skin_tone:',
    keywords: 'face, man, massage, medium skin tone',
  },
  '💆🏾‍♂️': {
    name: ':man_getting_massage_medium_dark_skin_tone:',
    keywords: 'face, man, massage, medium-dark skin tone',
  },
  '💆🏿‍♂️': {
    name: ':man_getting_massage_dark_skin_tone:',
    keywords: 'dark skin tone, face, man, massage',
  },
  '💆‍♀️': {
    name: ':woman_getting_massage:',
    keywords: 'face, massage, woman',
  },
  '💆🏻‍♀️': {
    name: ':woman_getting_massage_light_skin_tone:',
    keywords: 'face, light skin tone, massage, woman',
  },
  '💆🏼‍♀️': {
    name: ':woman_getting_massage_medium_light_skin_tone:',
    keywords: 'face, massage, medium-light skin tone, woman',
  },
  '💆🏽‍♀️': {
    name: ':woman_getting_massage_medium_skin_tone:',
    keywords: 'face, massage, medium skin tone, woman',
  },
  '💆🏾‍♀️': {
    name: ':woman_getting_massage_medium_dark_skin_tone:',
    keywords: 'face, massage, medium-dark skin tone, woman',
  },
  '💆🏿‍♀️': {
    name: ':woman_getting_massage_dark_skin_tone:',
    keywords: 'dark skin tone, face, massage, woman',
  },
  '💇': {
    name: ':person_getting_haircut:',
    keywords: 'barber, beauty, haircut, parlor',
    group: 'PEOPLE',
  },
  '💇🏻': {
    name: ':person_getting_haircut_light_skin_tone:',
    keywords: 'barber, beauty, haircut, light skin tone, parlor',
  },
  '💇🏼': {
    name: ':person_getting_haircut_medium_light_skin_tone:',
    keywords: 'barber, beauty, haircut, medium-light skin tone, parlor',
  },
  '💇🏽': {
    name: ':person_getting_haircut_medium_skin_tone:',
    keywords: 'barber, beauty, haircut, medium skin tone, parlor',
  },
  '💇🏾': {
    name: ':person_getting_haircut_medium_dark_skin_tone:',
    keywords: 'barber, beauty, haircut, medium-dark skin tone, parlor',
  },
  '💇🏿': {
    name: ':person_getting_haircut_dark_skin_tone:',
    keywords: 'barber, beauty, dark skin tone, haircut, parlor',
  },
  '💇‍♂️': {
    name: ':man_getting_haircut:',
    keywords: 'haircut, man',
  },
  '💇🏻‍♂️': {
    name: ':man_getting_haircut_light_skin_tone:',
    keywords: 'haircut, light skin tone, man',
  },
  '💇🏼‍♂️': {
    name: ':man_getting_haircut_medium_light_skin_tone:',
    keywords: 'haircut, man, medium-light skin tone',
  },
  '💇🏽‍♂️': {
    name: ':man_getting_haircut_medium_skin_tone:',
    keywords: 'haircut, man, medium skin tone',
  },
  '💇🏾‍♂️': {
    name: ':man_getting_haircut_medium_dark_skin_tone:',
    keywords: 'haircut, man, medium-dark skin tone',
  },
  '💇🏿‍♂️': {
    name: ':man_getting_haircut_dark_skin_tone:',
    keywords: 'dark skin tone, haircut, man',
  },
  '💇‍♀️': {
    name: ':woman_getting_haircut:',
    keywords: 'haircut, woman',
  },
  '💇🏻‍♀️': {
    name: ':woman_getting_haircut_light_skin_tone:',
    keywords: 'haircut, light skin tone, woman',
  },
  '💇🏼‍♀️': {
    name: ':woman_getting_haircut_medium_light_skin_tone:',
    keywords: 'haircut, medium-light skin tone, woman',
  },
  '💇🏽‍♀️': {
    name: ':woman_getting_haircut_medium_skin_tone:',
    keywords: 'haircut, medium skin tone, woman',
  },
  '💇🏾‍♀️': {
    name: ':woman_getting_haircut_medium_dark_skin_tone:',
    keywords: 'haircut, medium-dark skin tone, woman',
  },
  '💇🏿‍♀️': {
    name: ':woman_getting_haircut_dark_skin_tone:',
    keywords: 'dark skin tone, haircut, woman',
  },
  '🚶': {
    name: ':person_walking:',
    keywords: 'hike, walk, walking',
    group: 'PEOPLE',
  },
  '🚶🏻': {
    name: ':person_walking_light_skin_tone:',
    keywords: 'hike, light skin tone, walk, walking',
  },
  '🚶🏼': {
    name: ':person_walking_medium_light_skin_tone:',
    keywords: 'hike, medium-light skin tone, walk, walking',
  },
  '🚶🏽': {
    name: ':person_walking_medium_skin_tone:',
    keywords: 'hike, medium skin tone, walk, walking',
  },
  '🚶🏾': {
    name: ':person_walking_medium_dark_skin_tone:',
    keywords: 'hike, medium-dark skin tone, walk, walking',
  },
  '🚶🏿': {
    name: ':person_walking_dark_skin_tone:',
    keywords: 'dark skin tone, hike, walk, walking',
  },
  '🚶‍♂️': {
    name: ':man_walking:',
    keywords: 'hike, man, walk',
  },
  '🚶🏻‍♂️': {
    name: ':man_walking_light_skin_tone:',
    keywords: 'hike, light skin tone, man, walk',
  },
  '🚶🏼‍♂️': {
    name: ':man_walking_medium_light_skin_tone:',
    keywords: 'hike, man, medium-light skin tone, walk',
  },
  '🚶🏽‍♂️': {
    name: ':man_walking_medium_skin_tone:',
    keywords: 'hike, man, medium skin tone, walk',
  },
  '🚶🏾‍♂️': {
    name: ':man_walking_medium_dark_skin_tone:',
    keywords: 'hike, man, medium-dark skin tone, walk',
  },
  '🚶🏿‍♂️': {
    name: ':man_walking_dark_skin_tone:',
    keywords: 'dark skin tone, hike, man, walk',
  },
  '🚶‍♀️': {
    name: ':woman_walking:',
    keywords: 'hike, walk, woman',
  },
  '🚶🏻‍♀️': {
    name: ':woman_walking_light_skin_tone:',
    keywords: 'hike, light skin tone, walk, woman',
  },
  '🚶🏼‍♀️': {
    name: ':woman_walking_medium_light_skin_tone:',
    keywords: 'hike, medium-light skin tone, walk, woman',
  },
  '🚶🏽‍♀️': {
    name: ':woman_walking_medium_skin_tone:',
    keywords: 'hike, medium skin tone, walk, woman',
  },
  '🚶🏾‍♀️': {
    name: ':woman_walking_medium_dark_skin_tone:',
    keywords: 'hike, medium-dark skin tone, walk, woman',
  },
  '🚶🏿‍♀️': {
    name: ':woman_walking_dark_skin_tone:',
    keywords: 'dark skin tone, hike, walk, woman',
  },
  '🏃': {
    name: ':person_running:',
    keywords: 'marathon, running',
    group: 'PEOPLE',
  },
  '🏃🏻': {
    name: ':person_running_light_skin_tone:',
    keywords: 'light skin tone, marathon, running',
  },
  '🏃🏼': {
    name: ':person_running_medium_light_skin_tone:',
    keywords: 'marathon, medium-light skin tone, running',
  },
  '🏃🏽': {
    name: ':person_running_medium_skin_tone:',
    keywords: 'marathon, medium skin tone, running',
  },
  '🏃🏾': {
    name: ':person_running_medium_dark_skin_tone:',
    keywords: 'marathon, medium-dark skin tone, running',
  },
  '🏃🏿': {
    name: ':person_running_dark_skin_tone:',
    keywords: 'dark skin tone, marathon, running',
  },
  '🏃‍♂️': {
    name: ':man_running:',
    keywords: 'man, marathon, racing, running',
  },
  '🏃🏻‍♂️': {
    name: ':man_running_light_skin_tone:',
    keywords: 'light skin tone, man, marathon, racing, running',
  },
  '🏃🏼‍♂️': {
    name: ':man_running_medium_light_skin_tone:',
    keywords: 'man, marathon, medium-light skin tone, racing, running',
  },
  '🏃🏽‍♂️': {
    name: ':man_running_medium_skin_tone:',
    keywords: 'man, marathon, medium skin tone, racing, running',
  },
  '🏃🏾‍♂️': {
    name: ':man_running_medium_dark_skin_tone:',
    keywords: 'man, marathon, medium-dark skin tone, racing, running',
  },
  '🏃🏿‍♂️': {
    name: ':man_running_dark_skin_tone:',
    keywords: 'dark skin tone, man, marathon, racing, running',
  },
  '🏃‍♀️': {
    name: ':woman_running:',
    keywords: 'marathon, racing, running, woman',
  },
  '🏃🏻‍♀️': {
    name: ':woman_running_light_skin_tone:',
    keywords: 'light skin tone, marathon, racing, running, woman',
  },
  '🏃🏼‍♀️': {
    name: ':woman_running_medium_light_skin_tone:',
    keywords: 'marathon, medium-light skin tone, racing, running, woman',
  },
  '🏃🏽‍♀️': {
    name: ':woman_running_medium_skin_tone:',
    keywords: 'marathon, medium skin tone, racing, running, woman',
  },
  '🏃🏾‍♀️': {
    name: ':woman_running_medium_dark_skin_tone:',
    keywords: 'marathon, medium-dark skin tone, racing, running, woman',
  },
  '🏃🏿‍♀️': {
    name: ':woman_running_dark_skin_tone:',
    keywords: 'dark skin tone, marathon, racing, running, woman',
  },
  '💃': {
    name: ':woman_dancing:',
    keywords: 'dancing, woman',
    group: 'PEOPLE',
  },
  '💃🏻': {
    name: ':woman_dancing_light_skin_tone:',
    keywords: 'dancing, light skin tone, woman',
  },
  '💃🏼': {
    name: ':woman_dancing_medium_light_skin_tone:',
    keywords: 'dancing, medium-light skin tone, woman',
  },
  '💃🏽': {
    name: ':woman_dancing_medium_skin_tone:',
    keywords: 'dancing, medium skin tone, woman',
  },
  '💃🏾': {
    name: ':woman_dancing_medium_dark_skin_tone:',
    keywords: 'dancing, medium-dark skin tone, woman',
  },
  '💃🏿': {
    name: ':woman_dancing_dark_skin_tone:',
    keywords: 'dancing, dark skin tone, woman',
  },
  '🕺': {
    name: ':man_dancing:',
    keywords: 'dance, man',
  },
  '🕺🏻': {
    name: ':man_dancing_light_skin_tone:',
    keywords: 'dance, light skin tone, man',
  },
  '🕺🏼': {
    name: ':man_dancing_medium_light_skin_tone:',
    keywords: 'dance, man, medium-light skin tone',
  },
  '🕺🏽': {
    name: ':man_dancing_medium_skin_tone:',
    keywords: 'dance, man, medium skin tone',
  },
  '🕺🏾': {
    name: ':man_dancing_medium_dark_skin_tone:',
    keywords: 'dance, man, medium-dark skin tone',
  },
  '🕺🏿': {
    name: ':man_dancing_dark_skin_tone:',
    keywords: 'dance, dark skin tone, man',
  },
  '👯': {
    name: ':people_with_bunny_ears_partying:',
    keywords: 'bunny ear, dancer, partying',
    group: 'PEOPLE',
  },
  '👯‍♂️': {
    name: ':men_with_bunny_ears_partying:',
    keywords: 'bunny ear, dancer, men, partying',
  },
  '👯‍♀️': {
    name: ':women_with_bunny_ears_partying:',
    keywords: 'bunny ear, dancer, partying, women',
  },
  '🕴': {
    name: ':man_in_business_suit_levitating:',
    keywords: 'business, man, suit',
  },
  '🕴🏻': {
    name: ':man_in_business_suit_levitating_light_skin_tone:',
    keywords: 'business, light skin tone, man, suit',
  },
  '🕴🏼': {
    name: ':man_in_business_suit_levitating_medium_light_skin_tone:',
    keywords: 'business, man, medium-light skin tone, suit',
  },
  '🕴🏽': {
    name: ':man_in_business_suit_levitating_medium_skin_tone:',
    keywords: 'business, man, medium skin tone, suit',
  },
  '🕴🏾': {
    name: ':man_in_business_suit_levitating_medium_dark_skin_tone:',
    keywords: 'business, man, medium-dark skin tone, suit',
  },
  '🕴🏿': {
    name: ':man_in_business_suit_levitating_dark_skin_tone:',
    keywords: 'business, dark skin tone, man, suit',
  },
  '🗣': {
    name: ':speaking_head:',
    keywords: 'face, head, silhouette, speak, speaking',
  },
  '👤': {
    name: ':bust_in_silhouette:',
    keywords: 'bust, silhouette',
    group: 'PEOPLE',
  },
  '👥': {
    name: ':busts_in_silhouette:',
    keywords: 'bust, silhouette',
    group: 'PEOPLE',
  },
  '🤺': {
    name: ':person_fencing:',
    keywords: 'fencer, fencing, sword',
  },
  '🏇': {
    name: ':horse_racing:',
    keywords: 'horse, jockey, racehorse, racing',
    group: 'OBJECTS',
  },
  '🏇🏻': {
    name: ':horse_racing_light_skin_tone:',
    keywords: 'horse, jockey, light skin tone, racehorse, racing',
  },
  '🏇🏼': {
    name: ':horse_racing_medium_light_skin_tone:',
    keywords: 'horse, jockey, medium-light skin tone, racehorse, racing',
  },
  '🏇🏽': {
    name: ':horse_racing_medium_skin_tone:',
    keywords: 'horse, jockey, medium skin tone, racehorse, racing',
  },
  '🏇🏾': {
    name: ':horse_racing_medium_dark_skin_tone:',
    keywords: 'horse, jockey, medium-dark skin tone, racehorse, racing',
  },
  '🏇🏿': {
    name: ':horse_racing_dark_skin_tone:',
    keywords: 'dark skin tone, horse, jockey, racehorse, racing',
  },
  '⛷': {
    name: ':skier:',
    keywords: 'ski, snow',
  },
  '🏂': {
    name: ':snowboarder:',
    keywords: 'ski, snow, snowboard',
    group: 'OBJECTS',
  },
  '🏂🏻': {
    name: ':snowboarder_light_skin_tone:',
    keywords: 'light skin tone, ski, snow, snowboard',
  },
  '🏂🏼': {
    name: ':snowboarder_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, ski, snow, snowboard',
  },
  '🏂🏽': {
    name: ':snowboarder_medium_skin_tone:',
    keywords: 'medium skin tone, ski, snow, snowboard',
  },
  '🏂🏾': {
    name: ':snowboarder_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, ski, snow, snowboard',
  },
  '🏂🏿': {
    name: ':snowboarder_dark_skin_tone:',
    keywords: 'dark skin tone, ski, snow, snowboard',
  },
  '🏌': {
    name: ':person_golfing:',
    keywords: 'ball, golf',
  },
  '🏌🏻': {
    name: ':person_golfing_light_skin_tone:',
    keywords: 'ball, golf, light skin tone',
  },
  '🏌🏼': {
    name: ':person_golfing_medium_light_skin_tone:',
    keywords: 'ball, golf, medium-light skin tone',
  },
  '🏌🏽': {
    name: ':person_golfing_medium_skin_tone:',
    keywords: 'ball, golf, medium skin tone',
  },
  '🏌🏾': {
    name: ':person_golfing_medium_dark_skin_tone:',
    keywords: 'ball, golf, medium-dark skin tone',
  },
  '🏌🏿': {
    name: ':person_golfing_dark_skin_tone:',
    keywords: 'ball, dark skin tone, golf',
  },
  '🏌️‍♂️': {
    name: ':man_golfing:',
    keywords: 'golf, man',
  },
  '🏌🏻‍♂️': {
    name: ':man_golfing_light_skin_tone:',
    keywords: 'golf, light skin tone, man',
  },
  '🏌🏼‍♂️': {
    name: ':man_golfing_medium_light_skin_tone:',
    keywords: 'golf, man, medium-light skin tone',
  },
  '🏌🏽‍♂️': {
    name: ':man_golfing_medium_skin_tone:',
    keywords: 'golf, man, medium skin tone',
  },
  '🏌🏾‍♂️': {
    name: ':man_golfing_medium_dark_skin_tone:',
    keywords: 'golf, man, medium-dark skin tone',
  },
  '🏌🏿‍♂️': {
    name: ':man_golfing_dark_skin_tone:',
    keywords: 'dark skin tone, golf, man',
  },
  '🏌️‍♀️': {
    name: ':woman_golfing:',
    keywords: 'golf, woman',
  },
  '🏌🏻‍♀️': {
    name: ':woman_golfing_light_skin_tone:',
    keywords: 'golf, light skin tone, woman',
  },
  '🏌🏼‍♀️': {
    name: ':woman_golfing_medium_light_skin_tone:',
    keywords: 'golf, medium-light skin tone, woman',
  },
  '🏌🏽‍♀️': {
    name: ':woman_golfing_medium_skin_tone:',
    keywords: 'golf, medium skin tone, woman',
  },
  '🏌🏾‍♀️': {
    name: ':woman_golfing_medium_dark_skin_tone:',
    keywords: 'golf, medium-dark skin tone, woman',
  },
  '🏌🏿‍♀️': {
    name: ':woman_golfing_dark_skin_tone:',
    keywords: 'dark skin tone, golf, woman',
  },
  '🏄': {
    name: ':person_surfing:',
    keywords: 'surfing',
    group: 'OBJECTS',
  },
  '🏄🏻': {
    name: ':person_surfing_light_skin_tone:',
    keywords: 'light skin tone, surfing',
  },
  '🏄🏼': {
    name: ':person_surfing_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, surfing',
  },
  '🏄🏽': {
    name: ':person_surfing_medium_skin_tone:',
    keywords: 'medium skin tone, surfing',
  },
  '🏄🏾': {
    name: ':person_surfing_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, surfing',
  },
  '🏄🏿': {
    name: ':person_surfing_dark_skin_tone:',
    keywords: 'dark skin tone, surfing',
  },
  '🏄‍♂️': {
    name: ':man_surfing:',
    keywords: 'man, surfing',
  },
  '🏄🏻‍♂️': {
    name: ':man_surfing_light_skin_tone:',
    keywords: 'light skin tone, man, surfing',
  },
  '🏄🏼‍♂️': {
    name: ':man_surfing_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, surfing',
  },
  '🏄🏽‍♂️': {
    name: ':man_surfing_medium_skin_tone:',
    keywords: 'man, medium skin tone, surfing',
  },
  '🏄🏾‍♂️': {
    name: ':man_surfing_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, surfing',
  },
  '🏄🏿‍♂️': {
    name: ':man_surfing_dark_skin_tone:',
    keywords: 'dark skin tone, man, surfing',
  },
  '🏄‍♀️': {
    name: ':woman_surfing:',
    keywords: 'surfing, woman',
  },
  '🏄🏻‍♀️': {
    name: ':woman_surfing_light_skin_tone:',
    keywords: 'light skin tone, surfing, woman',
  },
  '🏄🏼‍♀️': {
    name: ':woman_surfing_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, surfing, woman',
  },
  '🏄🏽‍♀️': {
    name: ':woman_surfing_medium_skin_tone:',
    keywords: 'medium skin tone, surfing, woman',
  },
  '🏄🏾‍♀️': {
    name: ':woman_surfing_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, surfing, woman',
  },
  '🏄🏿‍♀️': {
    name: ':woman_surfing_dark_skin_tone:',
    keywords: 'dark skin tone, surfing, woman',
  },
  '🚣': {
    name: ':person_rowing_boat:',
    keywords: 'boat, rowboat',
    group: 'PLACES',
  },
  '🚣🏻': {
    name: ':person_rowing_boat_light_skin_tone:',
    keywords: 'boat, light skin tone, rowboat',
  },
  '🚣🏼': {
    name: ':person_rowing_boat_medium_light_skin_tone:',
    keywords: 'boat, medium-light skin tone, rowboat',
  },
  '🚣🏽': {
    name: ':person_rowing_boat_medium_skin_tone:',
    keywords: 'boat, medium skin tone, rowboat',
  },
  '🚣🏾': {
    name: ':person_rowing_boat_medium_dark_skin_tone:',
    keywords: 'boat, medium-dark skin tone, rowboat',
  },
  '🚣🏿': {
    name: ':person_rowing_boat_dark_skin_tone:',
    keywords: 'boat, dark skin tone, rowboat',
  },
  '🚣‍♂️': {
    name: ':man_rowing_boat:',
    keywords: 'boat, man, rowboat',
  },
  '🚣🏻‍♂️': {
    name: ':man_rowing_boat_light_skin_tone:',
    keywords: 'boat, light skin tone, man, rowboat',
  },
  '🚣🏼‍♂️': {
    name: ':man_rowing_boat_medium_light_skin_tone:',
    keywords: 'boat, man, medium-light skin tone, rowboat',
  },
  '🚣🏽‍♂️': {
    name: ':man_rowing_boat_medium_skin_tone:',
    keywords: 'boat, man, medium skin tone, rowboat',
  },
  '🚣🏾‍♂️': {
    name: ':man_rowing_boat_medium_dark_skin_tone:',
    keywords: 'boat, man, medium-dark skin tone, rowboat',
  },
  '🚣🏿‍♂️': {
    name: ':man_rowing_boat_dark_skin_tone:',
    keywords: 'boat, dark skin tone, man, rowboat',
  },
  '🚣‍♀️': {
    name: ':woman_rowing_boat:',
    keywords: 'boat, rowboat, woman',
  },
  '🚣🏻‍♀️': {
    name: ':woman_rowing_boat_light_skin_tone:',
    keywords: 'boat, light skin tone, rowboat, woman',
  },
  '🚣🏼‍♀️': {
    name: ':woman_rowing_boat_medium_light_skin_tone:',
    keywords: 'boat, medium-light skin tone, rowboat, woman',
  },
  '🚣🏽‍♀️': {
    name: ':woman_rowing_boat_medium_skin_tone:',
    keywords: 'boat, medium skin tone, rowboat, woman',
  },
  '🚣🏾‍♀️': {
    name: ':woman_rowing_boat_medium_dark_skin_tone:',
    keywords: 'boat, medium-dark skin tone, rowboat, woman',
  },
  '🚣🏿‍♀️': {
    name: ':woman_rowing_boat_dark_skin_tone:',
    keywords: 'boat, dark skin tone, rowboat, woman',
  },
  '🏊': {
    name: ':person_swimming:',
    keywords: 'swim',
    group: 'OBJECTS',
  },
  '🏊🏻': {
    name: ':person_swimming_light_skin_tone:',
    keywords: 'light skin tone, swim',
  },
  '🏊🏼': {
    name: ':person_swimming_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, swim',
  },
  '🏊🏽': {
    name: ':person_swimming_medium_skin_tone:',
    keywords: 'medium skin tone, swim',
  },
  '🏊🏾': {
    name: ':person_swimming_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, swim',
  },
  '🏊🏿': {
    name: ':person_swimming_dark_skin_tone:',
    keywords: 'dark skin tone, swim',
  },
  '🏊‍♂️': {
    name: ':man_swimming:',
    keywords: 'man, swim',
  },
  '🏊🏻‍♂️': {
    name: ':man_swimming_light_skin_tone:',
    keywords: 'light skin tone, man, swim',
  },
  '🏊🏼‍♂️': {
    name: ':man_swimming_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, swim',
  },
  '🏊🏽‍♂️': {
    name: ':man_swimming_medium_skin_tone:',
    keywords: 'man, medium skin tone, swim',
  },
  '🏊🏾‍♂️': {
    name: ':man_swimming_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, swim',
  },
  '🏊🏿‍♂️': {
    name: ':man_swimming_dark_skin_tone:',
    keywords: 'dark skin tone, man, swim',
  },
  '🏊‍♀️': {
    name: ':woman_swimming:',
    keywords: 'swim, woman',
  },
  '🏊🏻‍♀️': {
    name: ':woman_swimming_light_skin_tone:',
    keywords: 'light skin tone, swim, woman',
  },
  '🏊🏼‍♀️': {
    name: ':woman_swimming_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, swim, woman',
  },
  '🏊🏽‍♀️': {
    name: ':woman_swimming_medium_skin_tone:',
    keywords: 'medium skin tone, swim, woman',
  },
  '🏊🏾‍♀️': {
    name: ':woman_swimming_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, swim, woman',
  },
  '🏊🏿‍♀️': {
    name: ':woman_swimming_dark_skin_tone:',
    keywords: 'dark skin tone, swim, woman',
  },
  '⛹': {
    name: ':person_bouncing_ball:',
    keywords: 'ball',
  },
  '⛹🏻': {
    name: ':person_bouncing_ball_light_skin_tone:',
    keywords: 'ball, light skin tone',
  },
  '⛹🏼': {
    name: ':person_bouncing_ball_medium_light_skin_tone:',
    keywords: 'ball, medium-light skin tone',
  },
  '⛹🏽': {
    name: ':person_bouncing_ball_medium_skin_tone:',
    keywords: 'ball, medium skin tone',
  },
  '⛹🏾': {
    name: ':person_bouncing_ball_medium_dark_skin_tone:',
    keywords: 'ball, medium-dark skin tone',
  },
  '⛹🏿': {
    name: ':person_bouncing_ball_dark_skin_tone:',
    keywords: 'ball, dark skin tone',
  },
  '⛹️‍♂️': {
    name: ':man_bouncing_ball:',
    keywords: 'ball, man',
  },
  '⛹🏻‍♂️': {
    name: ':man_bouncing_ball_light_skin_tone:',
    keywords: 'ball, light skin tone, man',
  },
  '⛹🏼‍♂️': {
    name: ':man_bouncing_ball_medium_light_skin_tone:',
    keywords: 'ball, man, medium-light skin tone',
  },
  '⛹🏽‍♂️': {
    name: ':man_bouncing_ball_medium_skin_tone:',
    keywords: 'ball, man, medium skin tone',
  },
  '⛹🏾‍♂️': {
    name: ':man_bouncing_ball_medium_dark_skin_tone:',
    keywords: 'ball, man, medium-dark skin tone',
  },
  '⛹🏿‍♂️': {
    name: ':man_bouncing_ball_dark_skin_tone:',
    keywords: 'ball, dark skin tone, man',
  },
  '⛹️‍♀️': {
    name: ':woman_bouncing_ball:',
    keywords: 'ball, woman',
  },
  '⛹🏻‍♀️': {
    name: ':woman_bouncing_ball_light_skin_tone:',
    keywords: 'ball, light skin tone, woman',
  },
  '⛹🏼‍♀️': {
    name: ':woman_bouncing_ball_medium_light_skin_tone:',
    keywords: 'ball, medium-light skin tone, woman',
  },
  '⛹🏽‍♀️': {
    name: ':woman_bouncing_ball_medium_skin_tone:',
    keywords: 'ball, medium skin tone, woman',
  },
  '⛹🏾‍♀️': {
    name: ':woman_bouncing_ball_medium_dark_skin_tone:',
    keywords: 'ball, medium-dark skin tone, woman',
  },
  '⛹🏿‍♀️': {
    name: ':woman_bouncing_ball_dark_skin_tone:',
    keywords: 'ball, dark skin tone, woman',
  },
  '🏋': {
    name: ':person_lifting_weights:',
    keywords: 'lifter, weight',
  },
  '🏋🏻': {
    name: ':person_lifting_weights_light_skin_tone:',
    keywords: 'lifter, light skin tone, weight',
  },
  '🏋🏼': {
    name: ':person_lifting_weights_medium_light_skin_tone:',
    keywords: 'lifter, medium-light skin tone, weight',
  },
  '🏋🏽': {
    name: ':person_lifting_weights_medium_skin_tone:',
    keywords: 'lifter, medium skin tone, weight',
  },
  '🏋🏾': {
    name: ':person_lifting_weights_medium_dark_skin_tone:',
    keywords: 'lifter, medium-dark skin tone, weight',
  },
  '🏋🏿': {
    name: ':person_lifting_weights_dark_skin_tone:',
    keywords: 'dark skin tone, lifter, weight',
  },
  '🏋️‍♂️': {
    name: ':man_lifting_weights:',
    keywords: 'man, weight lifter',
  },
  '🏋🏻‍♂️': {
    name: ':man_lifting_weights_light_skin_tone:',
    keywords: 'light skin tone, man, weight lifter',
  },
  '🏋🏼‍♂️': {
    name: ':man_lifting_weights_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, weight lifter',
  },
  '🏋🏽‍♂️': {
    name: ':man_lifting_weights_medium_skin_tone:',
    keywords: 'man, medium skin tone, weight lifter',
  },
  '🏋🏾‍♂️': {
    name: ':man_lifting_weights_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, weight lifter',
  },
  '🏋🏿‍♂️': {
    name: ':man_lifting_weights_dark_skin_tone:',
    keywords: 'dark skin tone, man, weight lifter',
  },
  '🏋️‍♀️': {
    name: ':woman_lifting_weights:',
    keywords: 'weight lifter, woman',
  },
  '🏋🏻‍♀️': {
    name: ':woman_lifting_weights_light_skin_tone:',
    keywords: 'light skin tone, weight lifter, woman',
  },
  '🏋🏼‍♀️': {
    name: ':woman_lifting_weights_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, weight lifter, woman',
  },
  '🏋🏽‍♀️': {
    name: ':woman_lifting_weights_medium_skin_tone:',
    keywords: 'medium skin tone, weight lifter, woman',
  },
  '🏋🏾‍♀️': {
    name: ':woman_lifting_weights_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, weight lifter, woman',
  },
  '🏋🏿‍♀️': {
    name: ':woman_lifting_weights_dark_skin_tone:',
    keywords: 'dark skin tone, weight lifter, woman',
  },
  '🚴': {
    name: ':person_biking:',
    keywords: 'bicycle, biking, cyclist',
    group: 'OBJECTS',
  },
  '🚴🏻': {
    name: ':person_biking_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, light skin tone',
  },
  '🚴🏼': {
    name: ':person_biking_medium_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium-light skin tone',
  },
  '🚴🏽': {
    name: ':person_biking_medium_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium skin tone',
  },
  '🚴🏾': {
    name: ':person_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium-dark skin tone',
  },
  '🚴🏿': {
    name: ':person_biking_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, dark skin tone',
  },
  '🚴‍♂️': {
    name: ':man_biking:',
    keywords: 'bicycle, biking, cyclist, man',
  },
  '🚴🏻‍♂️': {
    name: ':man_biking_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, light skin tone, man',
  },
  '🚴🏼‍♂️': {
    name: ':man_biking_medium_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, man, medium-light skin tone',
  },
  '🚴🏽‍♂️': {
    name: ':man_biking_medium_skin_tone:',
    keywords: 'bicycle, biking, cyclist, man, medium skin tone',
  },
  '🚴🏾‍♂️': {
    name: ':man_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, man, medium-dark skin tone',
  },
  '🚴🏿‍♂️': {
    name: ':man_biking_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, dark skin tone, man',
  },
  '🚴‍♀️': {
    name: ':woman_biking:',
    keywords: 'bicycle, biking, cyclist, woman',
  },
  '🚴🏻‍♀️': {
    name: ':woman_biking_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, light skin tone, woman',
  },
  '🚴🏼‍♀️': {
    name: ':woman_biking_medium_light_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium-light skin tone, woman',
  },
  '🚴🏽‍♀️': {
    name: ':woman_biking_medium_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium skin tone, woman',
  },
  '🚴🏾‍♀️': {
    name: ':woman_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, medium-dark skin tone, woman',
  },
  '🚴🏿‍♀️': {
    name: ':woman_biking_dark_skin_tone:',
    keywords: 'bicycle, biking, cyclist, dark skin tone, woman',
  },
  '🚵': {
    name: ':person_mountain_biking:',
    keywords: 'bicycle, bicyclist, bike, cyclist, mountain',
    group: 'OBJECTS',
  },
  '🚵🏻': {
    name: ':person_mountain_biking_light_skin_tone:',
    keywords: 'bicycle, bicyclist, bike, cyclist, light skin tone, mountain',
  },
  '🚵🏼': {
    name: ':person_mountain_biking_medium_light_skin_tone:',
    keywords: 'bicycle, bicyclist, bike, cyclist, medium-light skin tone, mountain',
  },
  '🚵🏽': {
    name: ':person_mountain_biking_medium_skin_tone:',
    keywords: 'bicycle, bicyclist, bike, cyclist, medium skin tone, mountain',
  },
  '🚵🏾': {
    name: ':person_mountain_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, bicyclist, bike, cyclist, medium-dark skin tone, mountain',
  },
  '🚵🏿': {
    name: ':person_mountain_biking_dark_skin_tone:',
    keywords: 'bicycle, bicyclist, bike, cyclist, dark skin tone, mountain',
  },
  '🚵‍♂️': {
    name: ':man_mountain_biking:',
    keywords: 'bicycle, bike, cyclist, man, mountain',
  },
  '🚵🏻‍♂️': {
    name: ':man_mountain_biking_light_skin_tone:',
    keywords: 'bicycle, bike, cyclist, light skin tone, man, mountain',
  },
  '🚵🏼‍♂️': {
    name: ':man_mountain_biking_medium_light_skin_tone:',
    keywords: 'bicycle, bike, cyclist, man, medium-light skin tone, mountain',
  },
  '🚵🏽‍♂️': {
    name: ':man_mountain_biking_medium_skin_tone:',
    keywords: 'bicycle, bike, cyclist, man, medium skin tone, mountain',
  },
  '🚵🏾‍♂️': {
    name: ':man_mountain_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, bike, cyclist, man, medium-dark skin tone, mountain',
  },
  '🚵🏿‍♂️': {
    name: ':man_mountain_biking_dark_skin_tone:',
    keywords: 'bicycle, bike, cyclist, dark skin tone, man, mountain',
  },
  '🚵‍♀️': {
    name: ':woman_mountain_biking:',
    keywords: 'bicycle, bike, biking, cyclist, mountain, woman',
  },
  '🚵🏻‍♀️': {
    name: ':woman_mountain_biking_light_skin_tone:',
    keywords: 'bicycle, bike, biking, cyclist, light skin tone, mountain, woman',
  },
  '🚵🏼‍♀️': {
    name: ':woman_mountain_biking_medium_light_skin_tone:',
    keywords: 'bicycle, bike, biking, cyclist, medium-light skin tone, mountain, woman',
  },
  '🚵🏽‍♀️': {
    name: ':woman_mountain_biking_medium_skin_tone:',
    keywords: 'bicycle, bike, biking, cyclist, medium skin tone, mountain, woman',
  },
  '🚵🏾‍♀️': {
    name: ':woman_mountain_biking_medium_dark_skin_tone:',
    keywords: 'bicycle, bike, biking, cyclist, medium-dark skin tone, mountain, woman',
  },
  '🚵🏿‍♀️': {
    name: ':woman_mountain_biking_dark_skin_tone:',
    keywords: 'bicycle, bike, biking, cyclist, dark skin tone, mountain, woman',
  },
  '🏎': {
    name: ':racing_car:',
    keywords: 'car, racing',
  },
  '🏍': {
    name: ':motorcycle:',
    keywords: 'racing',
  },
  '🤸': {
    name: ':person_cartwheeling:',
    keywords: 'cartwheel, gymnastics',
  },
  '🤸🏻': {
    name: ':person_cartwheeling_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, light skin tone',
  },
  '🤸🏼': {
    name: ':person_cartwheeling_medium_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium-light skin tone',
  },
  '🤸🏽': {
    name: ':person_cartwheeling_medium_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium skin tone',
  },
  '🤸🏾': {
    name: ':person_cartwheeling_medium_dark_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium-dark skin tone',
  },
  '🤸🏿': {
    name: ':person_cartwheeling_dark_skin_tone:',
    keywords: 'cartwheel, dark skin tone, gymnastics',
  },
  '🤸‍♂️': {
    name: ':man_cartwheeling:',
    keywords: 'cartwheel, gymnastics, man',
  },
  '🤸🏻‍♂️': {
    name: ':man_cartwheeling_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, light skin tone, man',
  },
  '🤸🏼‍♂️': {
    name: ':man_cartwheeling_medium_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, man, medium-light skin tone',
  },
  '🤸🏽‍♂️': {
    name: ':man_cartwheeling_medium_skin_tone:',
    keywords: 'cartwheel, gymnastics, man, medium skin tone',
  },
  '🤸🏾‍♂️': {
    name: ':man_cartwheeling_medium_dark_skin_tone:',
    keywords: 'cartwheel, gymnastics, man, medium-dark skin tone',
  },
  '🤸🏿‍♂️': {
    name: ':man_cartwheeling_dark_skin_tone:',
    keywords: 'cartwheel, dark skin tone, gymnastics, man',
  },
  '🤸‍♀️': {
    name: ':woman_cartwheeling:',
    keywords: 'cartwheel, gymnastics, woman',
  },
  '🤸🏻‍♀️': {
    name: ':woman_cartwheeling_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, light skin tone, woman',
  },
  '🤸🏼‍♀️': {
    name: ':woman_cartwheeling_medium_light_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium-light skin tone, woman',
  },
  '🤸🏽‍♀️': {
    name: ':woman_cartwheeling_medium_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium skin tone, woman',
  },
  '🤸🏾‍♀️': {
    name: ':woman_cartwheeling_medium_dark_skin_tone:',
    keywords: 'cartwheel, gymnastics, medium-dark skin tone, woman',
  },
  '🤸🏿‍♀️': {
    name: ':woman_cartwheeling_dark_skin_tone:',
    keywords: 'cartwheel, dark skin tone, gymnastics, woman',
  },
  '🤼': {
    name: ':people_wrestling:',
    keywords: 'wrestle, wrestler',
  },
  '🤼‍♂️': {
    name: ':men_wrestling:',
    keywords: 'men, wrestle',
  },
  '🤼‍♀️': {
    name: ':women_wrestling:',
    keywords: 'women, wrestle',
  },
  '🤽': {
    name: ':person_playing_water_polo:',
    keywords: 'polo, water',
  },
  '🤽🏻': {
    name: ':person_playing_water_polo_light_skin_tone:',
    keywords: 'light skin tone, polo, water',
  },
  '🤽🏼': {
    name: ':person_playing_water_polo_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, polo, water',
  },
  '🤽🏽': {
    name: ':person_playing_water_polo_medium_skin_tone:',
    keywords: 'medium skin tone, polo, water',
  },
  '🤽🏾': {
    name: ':person_playing_water_polo_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, polo, water',
  },
  '🤽🏿': {
    name: ':person_playing_water_polo_dark_skin_tone:',
    keywords: 'dark skin tone, polo, water',
  },
  '🤽‍♂️': {
    name: ':man_playing_water_polo:',
    keywords: 'man, water polo',
  },
  '🤽🏻‍♂️': {
    name: ':man_playing_water_polo_light_skin_tone:',
    keywords: 'light skin tone, man, water polo',
  },
  '🤽🏼‍♂️': {
    name: ':man_playing_water_polo_medium_light_skin_tone:',
    keywords: 'man, medium-light skin tone, water polo',
  },
  '🤽🏽‍♂️': {
    name: ':man_playing_water_polo_medium_skin_tone:',
    keywords: 'man, medium skin tone, water polo',
  },
  '🤽🏾‍♂️': {
    name: ':man_playing_water_polo_medium_dark_skin_tone:',
    keywords: 'man, medium-dark skin tone, water polo',
  },
  '🤽🏿‍♂️': {
    name: ':man_playing_water_polo_dark_skin_tone:',
    keywords: 'dark skin tone, man, water polo',
  },
  '🤽‍♀️': {
    name: ':woman_playing_water_polo:',
    keywords: 'water polo, woman',
  },
  '🤽🏻‍♀️': {
    name: ':woman_playing_water_polo_light_skin_tone:',
    keywords: 'light skin tone, water polo, woman',
  },
  '🤽🏼‍♀️': {
    name: ':woman_playing_water_polo_medium_light_skin_tone:',
    keywords: 'medium-light skin tone, water polo, woman',
  },
  '🤽🏽‍♀️': {
    name: ':woman_playing_water_polo_medium_skin_tone:',
    keywords: 'medium skin tone, water polo, woman',
  },
  '🤽🏾‍♀️': {
    name: ':woman_playing_water_polo_medium_dark_skin_tone:',
    keywords: 'medium-dark skin tone, water polo, woman',
  },
  '🤽🏿‍♀️': {
    name: ':woman_playing_water_polo_dark_skin_tone:',
    keywords: 'dark skin tone, water polo, woman',
  },
  '🤾': {
    name: ':person_playing_handball:',
    keywords: 'ball, handball',
  },
  '🤾🏻': {
    name: ':person_playing_handball_light_skin_tone:',
    keywords: 'ball, handball, light skin tone',
  },
  '🤾🏼': {
    name: ':person_playing_handball_medium_light_skin_tone:',
    keywords: 'ball, handball, medium-light skin tone',
  },
  '🤾🏽': {
    name: ':person_playing_handball_medium_skin_tone:',
    keywords: 'ball, handball, medium skin tone',
  },
  '🤾🏾': {
    name: ':person_playing_handball_medium_dark_skin_tone:',
    keywords: 'ball, handball, medium-dark skin tone',
  },
  '🤾🏿': {
    name: ':person_playing_handball_dark_skin_tone:',
    keywords: 'ball, dark skin tone, handball',
  },
  '🤾‍♂️': {
    name: ':man_playing_handball:',
    keywords: 'handball, man',
  },
  '🤾🏻‍♂️': {
    name: ':man_playing_handball_light_skin_tone:',
    keywords: 'handball, light skin tone, man',
  },
  '🤾🏼‍♂️': {
    name: ':man_playing_handball_medium_light_skin_tone:',
    keywords: 'handball, man, medium-light skin tone',
  },
  '🤾🏽‍♂️': {
    name: ':man_playing_handball_medium_skin_tone:',
    keywords: 'handball, man, medium skin tone',
  },
  '🤾🏾‍♂️': {
    name: ':man_playing_handball_medium_dark_skin_tone:',
    keywords: 'handball, man, medium-dark skin tone',
  },
  '🤾🏿‍♂️': {
    name: ':man_playing_handball_dark_skin_tone:',
    keywords: 'dark skin tone, handball, man',
  },
  '🤾‍♀️': {
    name: ':woman_playing_handball:',
    keywords: 'handball, woman',
  },
  '🤾🏻‍♀️': {
    name: ':woman_playing_handball_light_skin_tone:',
    keywords: 'handball, light skin tone, woman',
  },
  '🤾🏼‍♀️': {
    name: ':woman_playing_handball_medium_light_skin_tone:',
    keywords: 'handball, medium-light skin tone, woman',
  },
  '🤾🏽‍♀️': {
    name: ':woman_playing_handball_medium_skin_tone:',
    keywords: 'handball, medium skin tone, woman',
  },
  '🤾🏾‍♀️': {
    name: ':woman_playing_handball_medium_dark_skin_tone:',
    keywords: 'handball, medium-dark skin tone, woman',
  },
  '🤾🏿‍♀️': {
    name: ':woman_playing_handball_dark_skin_tone:',
    keywords: 'dark skin tone, handball, woman',
  },
  '🤹': {
    name: ':person_juggling:',
    keywords: 'balance, juggle, multitask, skill',
  },
  '🤹🏻': {
    name: ':person_juggling_light_skin_tone:',
    keywords: 'balance, juggle, light skin tone, multitask, skill',
  },
  '🤹🏼': {
    name: ':person_juggling_medium_light_skin_tone:',
    keywords: 'balance, juggle, medium-light skin tone, multitask, skill',
  },
  '🤹🏽': {
    name: ':person_juggling_medium_skin_tone:',
    keywords: 'balance, juggle, medium skin tone, multitask, skill',
  },
  '🤹🏾': {
    name: ':person_juggling_medium_dark_skin_tone:',
    keywords: 'balance, juggle, medium-dark skin tone, multitask, skill',
  },
  '🤹🏿': {
    name: ':person_juggling_dark_skin_tone:',
    keywords: 'balance, dark skin tone, juggle, multitask, skill',
  },
  '🤹‍♂️': {
    name: ':man_juggling:',
    keywords: 'juggling, man, multitask',
  },
  '🤹🏻‍♂️': {
    name: ':man_juggling_light_skin_tone:',
    keywords: 'juggling, light skin tone, man, multitask',
  },
  '🤹🏼‍♂️': {
    name: ':man_juggling_medium_light_skin_tone:',
    keywords: 'juggling, man, medium-light skin tone, multitask',
  },
  '🤹🏽‍♂️': {
    name: ':man_juggling_medium_skin_tone:',
    keywords: 'juggling, man, medium skin tone, multitask',
  },
  '🤹🏾‍♂️': {
    name: ':man_juggling_medium_dark_skin_tone:',
    keywords: 'juggling, man, medium-dark skin tone, multitask',
  },
  '🤹🏿‍♂️': {
    name: ':man_juggling_dark_skin_tone:',
    keywords: 'dark skin tone, juggling, man, multitask',
  },
  '🤹‍♀️': {
    name: ':woman_juggling:',
    keywords: 'juggling, multitask, woman',
  },
  '🤹🏻‍♀️': {
    name: ':woman_juggling_light_skin_tone:',
    keywords: 'juggling, light skin tone, multitask, woman',
  },
  '🤹🏼‍♀️': {
    name: ':woman_juggling_medium_light_skin_tone:',
    keywords: 'juggling, medium-light skin tone, multitask, woman',
  },
  '🤹🏽‍♀️': {
    name: ':woman_juggling_medium_skin_tone:',
    keywords: 'juggling, medium skin tone, multitask, woman',
  },
  '🤹🏾‍♀️': {
    name: ':woman_juggling_medium_dark_skin_tone:',
    keywords: 'juggling, medium-dark skin tone, multitask, woman',
  },
  '🤹🏿‍♀️': {
    name: ':woman_juggling_dark_skin_tone:',
    keywords: 'dark skin tone, juggling, multitask, woman',
  },
  '👫': {
    name: ':man_and_woman_holding_hands:',
    keywords: 'couple, hand, hold, man, woman',
    group: 'PEOPLE',
  },
  '👬': {
    name: ':two_men_holding_hands:',
    keywords: 'couple, Gemini, hand, hold, man, twins, zodiac',
    group: 'PEOPLE',
  },
  '👭': {
    name: ':two_women_holding_hands:',
    keywords: 'couple, hand, hold, woman',
    group: 'PEOPLE',
  },
  '💏': {
    name: ':kiss:',
    keywords: 'couple',
    group: 'PEOPLE',
  },
  '👩‍❤️‍💋‍👨': {
    name: ':kiss_woman,_man:',
    keywords: 'couple, man, woman',
  },
  '👨‍❤️‍💋‍👨': {
    name: ':kiss_man,_man:',
    keywords: 'couple, man',
  },
  '👩‍❤️‍💋‍👩': {
    name: ':kiss_woman,_woman:',
    keywords: 'couple, woman',
  },
  '💑': {
    name: ':couple_with_heart:',
    keywords: 'couple, love',
    group: 'PEOPLE',
  },
  '👩‍❤️‍👨': {
    name: ':couple_with_heart_woman,_man:',
    keywords: 'couple, love, man, woman',
  },
  '👨‍❤️‍👨': {
    name: ':couple_with_heart_man,_man:',
    keywords: 'couple, love, man',
  },
  '👩‍❤️‍👩': {
    name: ':couple_with_heart_woman,_woman:',
    keywords: 'couple, love, woman',
  },
  '👪': {
    name: ':family:',
    keywords: 'family',
    group: 'PEOPLE',
  },
  '👨‍👩‍👦': {
    name: ':family_man,_woman,_boy:',
    keywords: 'boy, family, man, woman',
  },
  '👨‍👩‍👧': {
    name: ':family_man,_woman,_girl:',
    keywords: 'family, girl, man, woman',
  },
  '👨‍👩‍👧‍👦': {
    name: ':family_man,_woman,_girl,_boy:',
    keywords: 'boy, family, girl, man, woman',
  },
  '👨‍👩‍👦‍👦': {
    name: ':family_man,_woman,_boy,_boy:',
    keywords: 'boy, family, man, woman',
  },
  '👨‍👩‍👧‍👧': {
    name: ':family_man,_woman,_girl,_girl:',
    keywords: 'family, girl, man, woman',
  },
  '👨‍👨‍👦': {
    name: ':family_man,_man,_boy:',
    keywords: 'boy, family, man',
  },
  '👨‍👨‍👧': {
    name: ':family_man,_man,_girl:',
    keywords: 'family, girl, man',
  },
  '👨‍👨‍👧‍👦': {
    name: ':family_man,_man,_girl,_boy:',
    keywords: 'boy, family, girl, man',
  },
  '👨‍👨‍👦‍👦': {
    name: ':family_man,_man,_boy,_boy:',
    keywords: 'boy, family, man',
  },
  '👨‍👨‍👧‍👧': {
    name: ':family_man,_man,_girl,_girl:',
    keywords: 'family, girl, man',
  },
  '👩‍👩‍👦': {
    name: ':family_woman,_woman,_boy:',
    keywords: 'boy, family, woman',
  },
  '👩‍👩‍👧': {
    name: ':family_woman,_woman,_girl:',
    keywords: 'family, girl, woman',
  },
  '👩‍👩‍👧‍👦': {
    name: ':family_woman,_woman,_girl,_boy:',
    keywords: 'boy, family, girl, woman',
  },
  '👩‍👩‍👦‍👦': {
    name: ':family_woman,_woman,_boy,_boy:',
    keywords: 'boy, family, woman',
  },
  '👩‍👩‍👧‍👧': {
    name: ':family_woman,_woman,_girl,_girl:',
    keywords: 'family, girl, woman',
  },
  '👨‍👦': {
    name: ':family_man,_boy:',
    keywords: 'boy, family, man',
  },
  '👨‍👦‍👦': {
    name: ':family_man,_boy,_boy:',
    keywords: 'boy, family, man',
  },
  '👨‍👧': {
    name: ':family_man,_girl:',
    keywords: 'family, girl, man',
  },
  '👨‍👧‍👦': {
    name: ':family_man,_girl,_boy:',
    keywords: 'boy, family, girl, man',
  },
  '👨‍👧‍👧': {
    name: ':family_man,_girl,_girl:',
    keywords: 'family, girl, man',
  },
  '👩‍👦': {
    name: ':family_woman,_boy:',
    keywords: 'boy, family, woman',
  },
  '👩‍👦‍👦': {
    name: ':family_woman,_boy,_boy:',
    keywords: 'boy, family, woman',
  },
  '👩‍👧': {
    name: ':family_woman,_girl:',
    keywords: 'family, girl, woman',
  },
  '👩‍👧‍👦': {
    name: ':family_woman,_girl,_boy:',
    keywords: 'boy, family, girl, woman',
  },
  '👩‍👧‍👧': {
    name: ':family_woman,_girl,_girl:',
    keywords: 'family, girl, woman',
  },
  '🏻': {
    name: ':light_skin_tone:',
    keywords: 'skin tone, type 1–2',
  },
  '🏼': {
    name: ':medium_light_skin_tone:',
    keywords: 'skin tone, type 3',
  },
  '🏽': {
    name: ':medium_skin_tone:',
    keywords: 'skin tone, type 4',
  },
  '🏾': {
    name: ':medium_dark_skin_tone:',
    keywords: 'skin tone, type 5',
  },
  '🏿': {
    name: ':dark_skin_tone:',
    keywords: 'skin tone, type 6',
  },
  '💪': {
    name: ':flexed_biceps:',
    keywords: 'biceps, comic, flex, muscle',
    group: 'PEOPLE',
  },
  '💪🏻': {
    name: ':flexed_biceps_light_skin_tone:',
    keywords: 'biceps, comic, flex, light skin tone, muscle',
  },
  '💪🏼': {
    name: ':flexed_biceps_medium_light_skin_tone:',
    keywords: 'biceps, comic, flex, medium-light skin tone, muscle',
  },
  '💪🏽': {
    name: ':flexed_biceps_medium_skin_tone:',
    keywords: 'biceps, comic, flex, medium skin tone, muscle',
  },
  '💪🏾': {
    name: ':flexed_biceps_medium_dark_skin_tone:',
    keywords: 'biceps, comic, flex, medium-dark skin tone, muscle',
  },
  '💪🏿': {
    name: ':flexed_biceps_dark_skin_tone:',
    keywords: 'biceps, comic, dark skin tone, flex, muscle',
  },
  '🤳': {
    name: ':selfie:',
    keywords: 'camera, phone, selfie',
  },
  '🤳🏻': {
    name: ':selfie_light_skin_tone:',
    keywords: 'camera, light skin tone, phone, selfie',
  },
  '🤳🏼': {
    name: ':selfie_medium_light_skin_tone:',
    keywords: 'camera, medium-light skin tone, phone, selfie',
  },
  '🤳🏽': {
    name: ':selfie_medium_skin_tone:',
    keywords: 'camera, medium skin tone, phone, selfie',
  },
  '🤳🏾': {
    name: ':selfie_medium_dark_skin_tone:',
    keywords: 'camera, medium-dark skin tone, phone, selfie',
  },
  '🤳🏿': {
    name: ':selfie_dark_skin_tone:',
    keywords: 'camera, dark skin tone, phone, selfie',
  },
  '👈': {
    name: ':backhand_index_pointing_left:',
    keywords: 'backhand, finger, hand, index, point',
    group: 'PEOPLE',
  },
  '👈🏻': {
    name: ':backhand_index_pointing_left_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, light skin tone, point',
  },
  '👈🏼': {
    name: ':backhand_index_pointing_left_medium_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-light skin tone, point',
  },
  '👈🏽': {
    name: ':backhand_index_pointing_left_medium_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium skin tone, point',
  },
  '👈🏾': {
    name: ':backhand_index_pointing_left_medium_dark_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-dark skin tone, point',
  },
  '👈🏿': {
    name: ':backhand_index_pointing_left_dark_skin_tone:',
    keywords: 'backhand, dark skin tone, finger, hand, index, point',
  },
  '👉': {
    name: ':backhand_index_pointing_right:',
    keywords: 'backhand, finger, hand, index, point',
    group: 'PEOPLE',
  },
  '👉🏻': {
    name: ':backhand_index_pointing_right_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, light skin tone, point',
  },
  '👉🏼': {
    name: ':backhand_index_pointing_right_medium_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-light skin tone, point',
  },
  '👉🏽': {
    name: ':backhand_index_pointing_right_medium_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium skin tone, point',
  },
  '👉🏾': {
    name: ':backhand_index_pointing_right_medium_dark_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-dark skin tone, point',
  },
  '👉🏿': {
    name: ':backhand_index_pointing_right_dark_skin_tone:',
    keywords: 'backhand, dark skin tone, finger, hand, index, point',
  },
  '☝': {
    name: ':index_pointing_up:',
    keywords: 'finger, hand, index, point, up',
    group: 'PEOPLE',
  },
  '☝🏻': {
    name: ':index_pointing_up_light_skin_tone:',
    keywords: 'finger, hand, index, light skin tone, point, up',
  },
  '☝🏼': {
    name: ':index_pointing_up_medium_light_skin_tone:',
    keywords: 'finger, hand, index, medium-light skin tone, point, up',
  },
  '☝🏽': {
    name: ':index_pointing_up_medium_skin_tone:',
    keywords: 'finger, hand, index, medium skin tone, point, up',
  },
  '☝🏾': {
    name: ':index_pointing_up_medium_dark_skin_tone:',
    keywords: 'finger, hand, index, medium-dark skin tone, point, up',
  },
  '☝🏿': {
    name: ':index_pointing_up_dark_skin_tone:',
    keywords: 'dark skin tone, finger, hand, index, point, up',
  },
  '👆': {
    name: ':backhand_index_pointing_up:',
    keywords: 'backhand, finger, hand, index, point, up',
    group: 'PEOPLE',
  },
  '👆🏻': {
    name: ':backhand_index_pointing_up_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, light skin tone, point, up',
  },
  '👆🏼': {
    name: ':backhand_index_pointing_up_medium_light_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-light skin tone, point, up',
  },
  '👆🏽': {
    name: ':backhand_index_pointing_up_medium_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium skin tone, point, up',
  },
  '👆🏾': {
    name: ':backhand_index_pointing_up_medium_dark_skin_tone:',
    keywords: 'backhand, finger, hand, index, medium-dark skin tone, point, up',
  },
  '👆🏿': {
    name: ':backhand_index_pointing_up_dark_skin_tone:',
    keywords: 'backhand, dark skin tone, finger, hand, index, point, up',
  },
  '🖕': {
    name: ':middle_finger:',
    keywords: 'finger, hand',
  },
  '🖕🏻': {
    name: ':middle_finger_light_skin_tone:',
    keywords: 'finger, hand, light skin tone',
  },
  '🖕🏼': {
    name: ':middle_finger_medium_light_skin_tone:',
    keywords: 'finger, hand, medium-light skin tone',
  },
  '🖕🏽': {
    name: ':middle_finger_medium_skin_tone:',
    keywords: 'finger, hand, medium skin tone',
  },
  '🖕🏾': {
    name: ':middle_finger_medium_dark_skin_tone:',
    keywords: 'finger, hand, medium-dark skin tone',
  },
  '🖕🏿': {
    name: ':middle_finger_dark_skin_tone:',
    keywords: 'dark skin tone, finger, hand',
  },
  '👇': {
    name: ':backhand_index_pointing_down:',
    keywords: 'backhand, down, finger, hand, index, point',
    group: 'PEOPLE',
  },
  '👇🏻': {
    name: ':backhand_index_pointing_down_light_skin_tone:',
    keywords: 'backhand, down, finger, hand, index, light skin tone, point',
  },
  '👇🏼': {
    name: ':backhand_index_pointing_down_medium_light_skin_tone:',
    keywords: 'backhand, down, finger, hand, index, medium-light skin tone, point',
  },
  '👇🏽': {
    name: ':backhand_index_pointing_down_medium_skin_tone:',
    keywords: 'backhand, down, finger, hand, index, medium skin tone, point',
  },
  '👇🏾': {
    name: ':backhand_index_pointing_down_medium_dark_skin_tone:',
    keywords: 'backhand, down, finger, hand, index, medium-dark skin tone, point',
  },
  '👇🏿': {
    name: ':backhand_index_pointing_down_dark_skin_tone:',
    keywords: 'backhand, dark skin tone, down, finger, hand, index, point',
  },
  '✌': {
    name: ':victory_hand:',
    keywords: 'hand, v, victory',
    group: 'PEOPLE',
  },
  '✌🏻': {
    name: ':victory_hand_light_skin_tone:',
    keywords: 'hand, light skin tone, v, victory',
  },
  '✌🏼': {
    name: ':victory_hand_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone, v, victory',
  },
  '✌🏽': {
    name: ':victory_hand_medium_skin_tone:',
    keywords: 'hand, medium skin tone, v, victory',
  },
  '✌🏾': {
    name: ':victory_hand_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone, v, victory',
  },
  '✌🏿': {
    name: ':victory_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand, v, victory',
  },
  '🤞': {
    name: ':crossed_fingers:',
    keywords: 'cross, finger, hand, luck',
  },
  '🤞🏻': {
    name: ':crossed_fingers_light_skin_tone:',
    keywords: 'cross, finger, hand, light skin tone, luck',
  },
  '🤞🏼': {
    name: ':crossed_fingers_medium_light_skin_tone:',
    keywords: 'cross, finger, hand, luck, medium-light skin tone',
  },
  '🤞🏽': {
    name: ':crossed_fingers_medium_skin_tone:',
    keywords: 'cross, finger, hand, luck, medium skin tone',
  },
  '🤞🏾': {
    name: ':crossed_fingers_medium_dark_skin_tone:',
    keywords: 'cross, finger, hand, luck, medium-dark skin tone',
  },
  '🤞🏿': {
    name: ':crossed_fingers_dark_skin_tone:',
    keywords: 'cross, dark skin tone, finger, hand, luck',
  },
  '🖖': {
    name: ':vulcan_salute:',
    keywords: 'finger, hand, spock, vulcan',
  },
  '🖖🏻': {
    name: ':vulcan_salute_light_skin_tone:',
    keywords: 'finger, hand, light skin tone, spock, vulcan',
  },
  '🖖🏼': {
    name: ':vulcan_salute_medium_light_skin_tone:',
    keywords: 'finger, hand, medium-light skin tone, spock, vulcan',
  },
  '🖖🏽': {
    name: ':vulcan_salute_medium_skin_tone:',
    keywords: 'finger, hand, medium skin tone, spock, vulcan',
  },
  '🖖🏾': {
    name: ':vulcan_salute_medium_dark_skin_tone:',
    keywords: 'finger, hand, medium-dark skin tone, spock, vulcan',
  },
  '🖖🏿': {
    name: ':vulcan_salute_dark_skin_tone:',
    keywords: 'dark skin tone, finger, hand, spock, vulcan',
  },
  '🤘': {
    name: ':sign_of_the_horns:',
    keywords: 'finger, hand, horns, rock-on',
  },
  '🤘🏻': {
    name: ':sign_of_the_horns_light_skin_tone:',
    keywords: 'finger, hand, horns, light skin tone, rock-on',
  },
  '🤘🏼': {
    name: ':sign_of_the_horns_medium_light_skin_tone:',
    keywords: 'finger, hand, horns, medium-light skin tone, rock-on',
  },
  '🤘🏽': {
    name: ':sign_of_the_horns_medium_skin_tone:',
    keywords: 'finger, hand, horns, medium skin tone, rock-on',
  },
  '🤘🏾': {
    name: ':sign_of_the_horns_medium_dark_skin_tone:',
    keywords: 'finger, hand, horns, medium-dark skin tone, rock-on',
  },
  '🤘🏿': {
    name: ':sign_of_the_horns_dark_skin_tone:',
    keywords: 'dark skin tone, finger, hand, horns, rock-on',
  },
  '🤙': {
    name: ':call_me_hand:',
    keywords: 'call, hand',
  },
  '🤙🏻': {
    name: ':call_me_hand_light_skin_tone:',
    keywords: 'call, hand, light skin tone',
  },
  '🤙🏼': {
    name: ':call_me_hand_medium_light_skin_tone:',
    keywords: 'call, hand, medium-light skin tone',
  },
  '🤙🏽': {
    name: ':call_me_hand_medium_skin_tone:',
    keywords: 'call, hand, medium skin tone',
  },
  '🤙🏾': {
    name: ':call_me_hand_medium_dark_skin_tone:',
    keywords: 'call, hand, medium-dark skin tone',
  },
  '🤙🏿': {
    name: ':call_me_hand_dark_skin_tone:',
    keywords: 'call, dark skin tone, hand',
  },
  '🖐': {
    name: ':raised_hand_with_fingers_splayed:',
    keywords: 'finger, hand, splayed',
  },
  '🖐🏻': {
    name: ':raised_hand_with_fingers_splayed_light_skin_tone:',
    keywords: 'finger, hand, light skin tone, splayed',
  },
  '🖐🏼': {
    name: ':raised_hand_with_fingers_splayed_medium_light_skin_tone:',
    keywords: 'finger, hand, medium-light skin tone, splayed',
  },
  '🖐🏽': {
    name: ':raised_hand_with_fingers_splayed_medium_skin_tone:',
    keywords: 'finger, hand, medium skin tone, splayed',
  },
  '🖐🏾': {
    name: ':raised_hand_with_fingers_splayed_medium_dark_skin_tone:',
    keywords: 'finger, hand, medium-dark skin tone, splayed',
  },
  '🖐🏿': {
    name: ':raised_hand_with_fingers_splayed_dark_skin_tone:',
    keywords: 'dark skin tone, finger, hand, splayed',
  },
  '✋': {
    name: ':raised_hand:',
    keywords: 'hand',
    group: 'PEOPLE',
  },
  '✋🏻': {
    name: ':raised_hand_light_skin_tone:',
    keywords: 'hand, light skin tone',
  },
  '✋🏼': {
    name: ':raised_hand_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone',
  },
  '✋🏽': {
    name: ':raised_hand_medium_skin_tone:',
    keywords: 'hand, medium skin tone',
  },
  '✋🏾': {
    name: ':raised_hand_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone',
  },
  '✋🏿': {
    name: ':raised_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand',
  },
  '👌': {
    name: ':ok_hand:',
    keywords: 'hand, OK',
    group: 'PEOPLE',
  },
  '👌🏻': {
    name: ':ok_hand_light_skin_tone:',
    keywords: 'hand, light skin tone, OK',
  },
  '👌🏼': {
    name: ':ok_hand_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone, OK',
  },
  '👌🏽': {
    name: ':ok_hand_medium_skin_tone:',
    keywords: 'hand, medium skin tone, OK',
  },
  '👌🏾': {
    name: ':ok_hand_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone, OK',
  },
  '👌🏿': {
    name: ':ok_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand, OK',
  },
  '👍': {
    name: ':thumbs_up:',
    keywords: '+1, hand, thumb, up',
    group: 'PEOPLE',
  },
  '👍🏻': {
    name: ':thumbs_up_light_skin_tone:',
    keywords: '+1, hand, light skin tone, thumb, up',
  },
  '👍🏼': {
    name: ':thumbs_up_medium_light_skin_tone:',
    keywords: '+1, hand, medium-light skin tone, thumb, up',
  },
  '👍🏽': {
    name: ':thumbs_up_medium_skin_tone:',
    keywords: '+1, hand, medium skin tone, thumb, up',
  },
  '👍🏾': {
    name: ':thumbs_up_medium_dark_skin_tone:',
    keywords: '+1, hand, medium-dark skin tone, thumb, up',
  },
  '👍🏿': {
    name: ':thumbs_up_dark_skin_tone:',
    keywords: '+1, dark skin tone, hand, thumb, up',
  },
  '👎': {
    name: ':thumbs_down:',
    keywords: '-1, down, hand, thumb',
    group: 'PEOPLE',
  },
  '👎🏻': {
    name: ':thumbs_down_light_skin_tone:',
    keywords: '-1, down, hand, light skin tone, thumb',
  },
  '👎🏼': {
    name: ':thumbs_down_medium_light_skin_tone:',
    keywords: '-1, down, hand, medium-light skin tone, thumb',
  },
  '👎🏽': {
    name: ':thumbs_down_medium_skin_tone:',
    keywords: '-1, down, hand, medium skin tone, thumb',
  },
  '👎🏾': {
    name: ':thumbs_down_medium_dark_skin_tone:',
    keywords: '-1, down, hand, medium-dark skin tone, thumb',
  },
  '👎🏿': {
    name: ':thumbs_down_dark_skin_tone:',
    keywords: '-1, dark skin tone, down, hand, thumb',
  },
  '✊': {
    name: ':raised_fist:',
    keywords: 'clenched, fist, hand, punch',
    group: 'PEOPLE',
  },
  '✊🏻': {
    name: ':raised_fist_light_skin_tone:',
    keywords: 'clenched, fist, hand, light skin tone, punch',
  },
  '✊🏼': {
    name: ':raised_fist_medium_light_skin_tone:',
    keywords: 'clenched, fist, hand, medium-light skin tone, punch',
  },
  '✊🏽': {
    name: ':raised_fist_medium_skin_tone:',
    keywords: 'clenched, fist, hand, medium skin tone, punch',
  },
  '✊🏾': {
    name: ':raised_fist_medium_dark_skin_tone:',
    keywords: 'clenched, fist, hand, medium-dark skin tone, punch',
  },
  '✊🏿': {
    name: ':raised_fist_dark_skin_tone:',
    keywords: 'clenched, dark skin tone, fist, hand, punch',
  },
  '👊': {
    name: ':oncoming_fist:',
    keywords: 'clenched, fist, hand, punch',
    group: 'PEOPLE',
  },
  '👊🏻': {
    name: ':oncoming_fist_light_skin_tone:',
    keywords: 'clenched, fist, hand, light skin tone, punch',
  },
  '👊🏼': {
    name: ':oncoming_fist_medium_light_skin_tone:',
    keywords: 'clenched, fist, hand, medium-light skin tone, punch',
  },
  '👊🏽': {
    name: ':oncoming_fist_medium_skin_tone:',
    keywords: 'clenched, fist, hand, medium skin tone, punch',
  },
  '👊🏾': {
    name: ':oncoming_fist_medium_dark_skin_tone:',
    keywords: 'clenched, fist, hand, medium-dark skin tone, punch',
  },
  '👊🏿': {
    name: ':oncoming_fist_dark_skin_tone:',
    keywords: 'clenched, dark skin tone, fist, hand, punch',
  },
  '🤛': {
    name: ':left_facing_fist:',
    keywords: 'fist, leftwards',
  },
  '🤛🏻': {
    name: ':left_facing_fist_light_skin_tone:',
    keywords: 'fist, leftwards, light skin tone',
  },
  '🤛🏼': {
    name: ':left_facing_fist_medium_light_skin_tone:',
    keywords: 'fist, leftwards, medium-light skin tone',
  },
  '🤛🏽': {
    name: ':left_facing_fist_medium_skin_tone:',
    keywords: 'fist, leftwards, medium skin tone',
  },
  '🤛🏾': {
    name: ':left_facing_fist_medium_dark_skin_tone:',
    keywords: 'fist, leftwards, medium-dark skin tone',
  },
  '🤛🏿': {
    name: ':left_facing_fist_dark_skin_tone:',
    keywords: 'dark skin tone, fist, leftwards',
  },
  '🤜': {
    name: ':right_facing_fist:',
    keywords: 'fist, rightwards',
  },
  '🤜🏻': {
    name: ':right_facing_fist_light_skin_tone:',
    keywords: 'fist, light skin tone, rightwards',
  },
  '🤜🏼': {
    name: ':right_facing_fist_medium_light_skin_tone:',
    keywords: 'fist, medium-light skin tone, rightwards',
  },
  '🤜🏽': {
    name: ':right_facing_fist_medium_skin_tone:',
    keywords: 'fist, medium skin tone, rightwards',
  },
  '🤜🏾': {
    name: ':right_facing_fist_medium_dark_skin_tone:',
    keywords: 'fist, medium-dark skin tone, rightwards',
  },
  '🤜🏿': {
    name: ':right_facing_fist_dark_skin_tone:',
    keywords: 'dark skin tone, fist, rightwards',
  },
  '🤚': {
    name: ':raised_back_of_hand:',
    keywords: 'backhand, raised',
  },
  '🤚🏻': {
    name: ':raised_back_of_hand_light_skin_tone:',
    keywords: 'backhand, light skin tone, raised',
  },
  '🤚🏼': {
    name: ':raised_back_of_hand_medium_light_skin_tone:',
    keywords: 'backhand, medium-light skin tone, raised',
  },
  '🤚🏽': {
    name: ':raised_back_of_hand_medium_skin_tone:',
    keywords: 'backhand, medium skin tone, raised',
  },
  '🤚🏾': {
    name: ':raised_back_of_hand_medium_dark_skin_tone:',
    keywords: 'backhand, medium-dark skin tone, raised',
  },
  '🤚🏿': {
    name: ':raised_back_of_hand_dark_skin_tone:',
    keywords: 'backhand, dark skin tone, raised',
  },
  '👋': {
    name: ':waving_hand:',
    keywords: 'hand, wave, waving',
    group: 'PEOPLE',
  },
  '👋🏻': {
    name: ':waving_hand_light_skin_tone:',
    keywords: 'hand, light skin tone, wave, waving',
  },
  '👋🏼': {
    name: ':waving_hand_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone, wave, waving',
  },
  '👋🏽': {
    name: ':waving_hand_medium_skin_tone:',
    keywords: 'hand, medium skin tone, wave, waving',
  },
  '👋🏾': {
    name: ':waving_hand_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone, wave, waving',
  },
  '👋🏿': {
    name: ':waving_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand, wave, waving',
  },
  '👏': {
    name: ':clapping_hands:',
    keywords: 'clap, hand',
    group: 'PEOPLE',
  },
  '👏🏻': {
    name: ':clapping_hands_light_skin_tone:',
    keywords: 'clap, hand, light skin tone',
  },
  '👏🏼': {
    name: ':clapping_hands_medium_light_skin_tone:',
    keywords: 'clap, hand, medium-light skin tone',
  },
  '👏🏽': {
    name: ':clapping_hands_medium_skin_tone:',
    keywords: 'clap, hand, medium skin tone',
  },
  '👏🏾': {
    name: ':clapping_hands_medium_dark_skin_tone:',
    keywords: 'clap, hand, medium-dark skin tone',
  },
  '👏🏿': {
    name: ':clapping_hands_dark_skin_tone:',
    keywords: 'clap, dark skin tone, hand',
  },
  '✍': {
    name: ':writing_hand:',
    keywords: 'hand, write',
  },
  '✍🏻': {
    name: ':writing_hand_light_skin_tone:',
    keywords: 'hand, light skin tone, write',
  },
  '✍🏼': {
    name: ':writing_hand_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone, write',
  },
  '✍🏽': {
    name: ':writing_hand_medium_skin_tone:',
    keywords: 'hand, medium skin tone, write',
  },
  '✍🏾': {
    name: ':writing_hand_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone, write',
  },
  '✍🏿': {
    name: ':writing_hand_dark_skin_tone:',
    keywords: 'dark skin tone, hand, write',
  },
  '👐': {
    name: ':open_hands:',
    keywords: 'hand, open',
    group: 'PEOPLE',
  },
  '👐🏻': {
    name: ':open_hands_light_skin_tone:',
    keywords: 'hand, light skin tone, open',
  },
  '👐🏼': {
    name: ':open_hands_medium_light_skin_tone:',
    keywords: 'hand, medium-light skin tone, open',
  },
  '👐🏽': {
    name: ':open_hands_medium_skin_tone:',
    keywords: 'hand, medium skin tone, open',
  },
  '👐🏾': {
    name: ':open_hands_medium_dark_skin_tone:',
    keywords: 'hand, medium-dark skin tone, open',
  },
  '👐🏿': {
    name: ':open_hands_dark_skin_tone:',
    keywords: 'dark skin tone, hand, open',
  },
  '🙌': {
    name: ':raising_hands:',
    keywords: 'celebration, gesture, hand, hooray, raised',
    group: 'PEOPLE',
  },
  '🙌🏻': {
    name: ':raising_hands_light_skin_tone:',
    keywords: 'celebration, gesture, hand, hooray, light skin tone, raised',
  },
  '🙌🏼': {
    name: ':raising_hands_medium_light_skin_tone:',
    keywords: 'celebration, gesture, hand, hooray, medium-light skin tone, raised',
  },
  '🙌🏽': {
    name: ':raising_hands_medium_skin_tone:',
    keywords: 'celebration, gesture, hand, hooray, medium skin tone, raised',
  },
  '🙌🏾': {
    name: ':raising_hands_medium_dark_skin_tone:',
    keywords: 'celebration, gesture, hand, hooray, medium-dark skin tone, raised',
  },
  '🙌🏿': {
    name: ':raising_hands_dark_skin_tone:',
    keywords: 'celebration, dark skin tone, gesture, hand, hooray, raised',
  },
  '🙏': {
    name: ':folded_hands:',
    keywords: 'ask, bow, folded, gesture, hand, please, pray, thanks',
    group: 'PEOPLE',
  },
  '🙏🏻': {
    name: ':folded_hands_light_skin_tone:',
    keywords: 'ask, bow, folded, gesture, hand, light skin tone, please, pray, thanks',
  },
  '🙏🏼': {
    name: ':folded_hands_medium_light_skin_tone:',
    keywords: 'ask, bow, folded, gesture, hand, medium-light skin tone, please, pray, thanks',
  },
  '🙏🏽': {
    name: ':folded_hands_medium_skin_tone:',
    keywords: 'ask, bow, folded, gesture, hand, medium skin tone, please, pray, thanks',
  },
  '🙏🏾': {
    name: ':folded_hands_medium_dark_skin_tone:',
    keywords: 'ask, bow, folded, gesture, hand, medium-dark skin tone, please, pray, thanks',
  },
  '🙏🏿': {
    name: ':folded_hands_dark_skin_tone:',
    keywords: 'ask, bow, dark skin tone, folded, gesture, hand, please, pray, thanks',
  },
  '🤝': {
    name: ':handshake:',
    keywords: 'agreement, hand, handshake, meeting, shake',
  },
  '💅': {
    name: ':nail_polish:',
    keywords: 'care, cosmetics, manicure, nail, polish',
    group: 'PEOPLE',
  },
  '💅🏻': {
    name: ':nail_polish_light_skin_tone:',
    keywords: 'care, cosmetics, light skin tone, manicure, nail, polish',
  },
  '💅🏼': {
    name: ':nail_polish_medium_light_skin_tone:',
    keywords: 'care, cosmetics, manicure, medium-light skin tone, nail, polish',
  },
  '💅🏽': {
    name: ':nail_polish_medium_skin_tone:',
    keywords: 'care, cosmetics, manicure, medium skin tone, nail, polish',
  },
  '💅🏾': {
    name: ':nail_polish_medium_dark_skin_tone:',
    keywords: 'care, cosmetics, manicure, medium-dark skin tone, nail, polish',
  },
  '💅🏿': {
    name: ':nail_polish_dark_skin_tone:',
    keywords: 'care, cosmetics, dark skin tone, manicure, nail, polish',
  },
  '👂': {
    name: ':ear:',
    keywords: 'body',
    group: 'PEOPLE',
  },
  '👂🏻': {
    name: ':ear_light_skin_tone:',
    keywords: 'body, light skin tone',
  },
  '👂🏼': {
    name: ':ear_medium_light_skin_tone:',
    keywords: 'body, medium-light skin tone',
  },
  '👂🏽': {
    name: ':ear_medium_skin_tone:',
    keywords: 'body, medium skin tone',
  },
  '👂🏾': {
    name: ':ear_medium_dark_skin_tone:',
    keywords: 'body, medium-dark skin tone',
  },
  '👂🏿': {
    name: ':ear_dark_skin_tone:',
    keywords: 'body, dark skin tone',
  },
  '👃': {
    name: ':nose:',
    keywords: 'body',
    group: 'PEOPLE',
  },
  '👃🏻': {
    name: ':nose_light_skin_tone:',
    keywords: 'body, light skin tone',
  },
  '👃🏼': {
    name: ':nose_medium_light_skin_tone:',
    keywords: 'body, medium-light skin tone',
  },
  '👃🏽': {
    name: ':nose_medium_skin_tone:',
    keywords: 'body, medium skin tone',
  },
  '👃🏾': {
    name: ':nose_medium_dark_skin_tone:',
    keywords: 'body, medium-dark skin tone',
  },
  '👃🏿': {
    name: ':nose_dark_skin_tone:',
    keywords: 'body, dark skin tone',
  },
  '👣': {
    name: ':footprints:',
    keywords: 'clothing, footprint, print',
    group: 'PEOPLE',
  },
  '👀': {
    name: ':eyes:',
    keywords: 'eye, face',
    group: 'PEOPLE',
  },
  '👁': {
    name: ':eye:',
    keywords: 'body',
  },
  '👁️‍🗨️': {
    name: ':eye_in_speech_bubble:',
    keywords: 'eye, speech bubble, witness',
  },
  '👅': {
    name: ':tongue:',
    keywords: 'body',
    group: 'PEOPLE',
  },
  '👄': {
    name: ':mouth:',
    keywords: 'lips',
    group: 'PEOPLE',
  },
  '💋': {
    name: ':kiss_mark:',
    keywords: 'kiss, lips',
    group: 'PEOPLE',
  },
  '💘': {
    name: ':heart_with_arrow:',
    keywords: 'arrow, cupid',
    group: 'PEOPLE',
  },
  '❤': {
    name: ':red_heart:',
    keywords: 'heart',
    group: 'PEOPLE',
  },
  '💓': {
    name: ':beating_heart:',
    keywords: 'beating, heartbeat, pulsating',
    group: 'PEOPLE',
  },
  '💔': {
    name: ':broken_heart:',
    keywords: 'break, broken',
    group: 'PEOPLE',
  },
  '💕': {
    name: ':two_hearts:',
    keywords: 'love',
    group: 'PEOPLE',
  },
  '💖': {
    name: ':sparkling_heart:',
    keywords: 'excited, sparkle',
    group: 'PEOPLE',
  },
  '💗': {
    name: ':growing_heart:',
    keywords: 'excited, growing, nervous, pulse',
    group: 'PEOPLE',
  },
  '💙': {
    name: ':blue_heart:',
    keywords: 'blue',
    group: 'PEOPLE',
  },
  '💚': {
    name: ':green_heart:',
    keywords: 'green',
    group: 'PEOPLE',
  },
  '💛': {
    name: ':yellow_heart:',
    keywords: 'yellow',
    group: 'PEOPLE',
  },
  '💜': {
    name: ':purple_heart:',
    keywords: 'purple',
    group: 'PEOPLE',
  },
  '🖤': {
    name: ':black_heart:',
    keywords: 'black, evil, wicked',
  },
  '💝': {
    name: ':heart_with_ribbon:',
    keywords: 'ribbon, valentine',
    group: 'OBJECTS',
  },
  '💞': {
    name: ':revolving_hearts:',
    keywords: 'revolving',
    group: 'PEOPLE',
  },
  '💟': {
    name: ':heart_decoration:',
    keywords: 'heart',
    group: 'SYMBOLS',
  },
  '❣': {
    name: ':heavy_heart_exclamation:',
    keywords: 'exclamation, mark, punctuation',
  },
  '💌': {
    name: ':love_letter:',
    keywords: 'heart, letter, love, mail',
    group: 'PEOPLE',
  },
  '💤': {
    name: ':zzz:',
    keywords: 'comic, sleep',
    group: 'PEOPLE',
  },
  '💢': {
    name: ':anger_symbol:',
    keywords: 'angry, comic, mad',
    group: 'PEOPLE',
  },
  '💣': {
    name: ':bomb:',
    keywords: 'comic',
    group: 'OBJECTS',
  },
  '💥': {
    name: ':collision:',
    keywords: 'boom, comic',
    group: 'PEOPLE',
  },
  '💦': {
    name: ':sweat_droplets:',
    keywords: 'comic, splashing, sweat',
    group: 'PEOPLE',
  },
  '💨': {
    name: ':dashing_away:',
    keywords: 'comic, dash, running',
    group: 'PEOPLE',
  },
  '💫': {
    name: ':dizzy:',
    keywords: 'comic, star',
    group: 'PEOPLE',
  },
  '💬': {
    name: ':speech_balloon:',
    keywords: 'balloon, bubble, comic, dialog, speech',
    group: 'PEOPLE',
  },
  '🗨': {
    name: ':left_speech_bubble:',
    keywords: 'dialog, speech',
  },
  '🗯': {
    name: ':right_anger_bubble:',
    keywords: 'angry, balloon, bubble, mad',
  },
  '💭': {
    name: ':thought_balloon:',
    keywords: 'balloon, bubble, comic, thought',
    group: 'PEOPLE',
  },
  '🕳': {
    name: ':hole:',
    keywords: 'hole',
  },
  '👓': {
    name: ':glasses:',
    keywords: 'clothing, eye, eyeglasses, eyewear',
    group: 'PEOPLE',
  },
  '🕶': {
    name: ':sunglasses:',
    keywords: 'dark, eye, eyewear, glasses',
  },
  '👔': {
    name: ':necktie:',
    keywords: 'clothing',
    group: 'PEOPLE',
  },
  '👕': {
    name: ':t_shirt:',
    keywords: 'clothing, shirt, tshirt',
    group: 'PEOPLE',
  },
  '👖': {
    name: ':jeans:',
    keywords: 'clothing, pants, trousers',
    group: 'PEOPLE',
  },
  '👗': {
    name: ':dress:',
    keywords: 'clothing',
    group: 'PEOPLE',
  },
  '👘': {
    name: ':kimono:',
    keywords: 'clothing',
    group: 'PEOPLE',
  },
  '👙': {
    name: ':bikini:',
    keywords: 'clothing, swim',
    group: 'PEOPLE',
  },
  '👚': {
    name: ':womans_clothes:',
    keywords: 'clothing, woman',
    group: 'PEOPLE',
  },
  '👛': {
    name: ':purse:',
    keywords: 'clothing, coin',
    group: 'PEOPLE',
  },
  '👜': {
    name: ':handbag:',
    keywords: 'bag, clothing, purse',
    group: 'PEOPLE',
  },
  '👝': {
    name: ':clutch_bag:',
    keywords: 'bag, clothing, pouch',
    group: 'PEOPLE',
  },
  '🛍': {
    name: ':shopping_bags:',
    keywords: 'bag, hotel, shopping',
  },
  '🎒': {
    name: ':school_backpack:',
    keywords: 'bag, satchel, school',
    group: 'OBJECTS',
  },
  '👞': {
    name: ':mans_shoe:',
    keywords: 'clothing, man, shoe',
    group: 'PEOPLE',
  },
  '👟': {
    name: ':running_shoe:',
    keywords: 'athletic, clothing, shoe, sneaker',
    group: 'PEOPLE',
  },
  '👠': {
    name: ':high_heeled_shoe:',
    keywords: 'clothing, heel, shoe, woman',
    group: 'PEOPLE',
  },
  '👡': {
    name: ':womans_sandal:',
    keywords: 'clothing, sandal, shoe, woman',
    group: 'PEOPLE',
  },
  '👢': {
    name: ':womans_boot:',
    keywords: 'boot, clothing, shoe, woman',
    group: 'PEOPLE',
  },
  '👑': {
    name: ':crown:',
    keywords: 'clothing, king, queen',
    group: 'PEOPLE',
  },
  '👒': {
    name: ':womans_hat:',
    keywords: 'clothing, hat, woman',
    group: 'PEOPLE',
  },
  '🎩': {
    name: ':top_hat:',
    keywords: 'clothing, hat, top, tophat',
    group: 'PEOPLE',
  },
  '🎓': {
    name: ':graduation_cap:',
    keywords: 'cap, celebration, clothing, graduation, hat',
    group: 'OBJECTS',
  },
  '⛑': {
    name: ':rescue_workers_helmet:',
    keywords: 'aid, cross, face, hat, helmet',
  },
  '📿': {
    name: ':prayer_beads:',
    keywords: 'beads, clothing, necklace, prayer, religion',
  },
  '💄': {
    name: ':lipstick:',
    keywords: 'cosmetics, makeup',
    group: 'PEOPLE',
  },
  '💍': {
    name: ':ring:',
    keywords: 'diamond',
    group: 'PEOPLE',
  },
  '💎': {
    name: ':gem_stone:',
    keywords: 'diamond, gem, jewel',
    group: 'PEOPLE',
  },
  '🐵': {
    name: ':monkey_face:',
    keywords: 'face, monkey',
    group: 'NATURE',
  },
  '🐒': {
    name: ':monkey:',
    keywords: 'monkey',
    group: 'NATURE',
  },
  '🦍': {
    name: ':gorilla:',
    keywords: 'gorilla',
  },
  '🐶': {
    name: ':dog_face:',
    keywords: 'dog, face, pet',
    group: 'NATURE',
  },
  '🐕': {
    name: ':dog:',
    keywords: 'pet',
    group: 'NATURE',
  },
  '🐩': {
    name: ':poodle:',
    keywords: 'dog',
    group: 'NATURE',
  },
  '🐺': {
    name: ':wolf_face:',
    keywords: 'face, wolf',
    group: 'NATURE',
  },
  '🦊': {
    name: ':fox_face:',
    keywords: 'face, fox',
  },
  '🐱': {
    name: ':cat_face:',
    keywords: 'cat, face, pet',
    group: 'NATURE',
  },
  '🐈': {
    name: ':cat:',
    keywords: 'pet',
    group: 'NATURE',
  },
  '🦁': {
    name: ':lion_face:',
    keywords: 'face, Leo, lion, zodiac',
  },
  '🐯': {
    name: ':tiger_face:',
    keywords: 'face, tiger',
    group: 'NATURE',
  },
  '🐅': {
    name: ':tiger:',
    keywords: 'tiger',
    group: 'NATURE',
  },
  '🐆': {
    name: ':leopard:',
    keywords: 'leopard',
    group: 'NATURE',
  },
  '🐴': {
    name: ':horse_face:',
    keywords: 'face, horse',
    group: 'NATURE',
  },
  '🐎': {
    name: ':horse:',
    keywords: 'equestrian, racehorse, racing',
    group: 'NATURE',
  },
  '🦌': {
    name: ':deer:',
    keywords: 'deer',
  },
  '🦄': {
    name: ':unicorn_face:',
    keywords: 'face, unicorn',
  },
  '🐮': {
    name: ':cow_face:',
    keywords: 'cow, face',
    group: 'NATURE',
  },
  '🐂': {
    name: ':ox:',
    keywords: 'bull, Taurus, zodiac',
    group: 'NATURE',
  },
  '🐃': {
    name: ':water_buffalo:',
    keywords: 'buffalo, water',
    group: 'NATURE',
  },
  '🐄': {
    name: ':cow:',
    keywords: 'cow',
    group: 'NATURE',
  },
  '🐷': {
    name: ':pig_face:',
    keywords: 'face, pig',
    group: 'NATURE',
  },
  '🐖': {
    name: ':pig:',
    keywords: 'sow',
    group: 'NATURE',
  },
  '🐗': {
    name: ':boar:',
    keywords: 'pig',
    group: 'NATURE',
  },
  '🐽': {
    name: ':pig_nose:',
    keywords: 'face, nose, pig',
    group: 'NATURE',
  },
  '🐏': {
    name: ':ram:',
    keywords: 'Aries, sheep, zodiac',
    group: 'NATURE',
  },
  '🐑': {
    name: ':sheep:',
    keywords: 'ewe',
    group: 'NATURE',
  },
  '🐐': {
    name: ':goat:',
    keywords: 'Capricorn, zodiac',
    group: 'NATURE',
  },
  '🐪': {
    name: ':camel:',
    keywords: 'dromedary, hump',
    group: 'NATURE',
  },
  '🐫': {
    name: ':two_hump_camel:',
    keywords: 'bactrian, camel, hump',
    group: 'NATURE',
  },
  '🐘': {
    name: ':elephant:',
    keywords: 'elephant',
    group: 'NATURE',
  },
  '🦏': {
    name: ':rhinoceros:',
    keywords: 'rhinoceros',
  },
  '🐭': {
    name: ':mouse_face:',
    keywords: 'face, mouse',
    group: 'NATURE',
  },
  '🐁': {
    name: ':mouse:',
    keywords: 'mouse',
    group: 'NATURE',
  },
  '🐀': {
    name: ':rat:',
    keywords: 'rat',
    group: 'NATURE',
  },
  '🐹': {
    name: ':hamster_face:',
    keywords: 'face, hamster, pet',
    group: 'NATURE',
  },
  '🐰': {
    name: ':rabbit_face:',
    keywords: 'bunny, face, pet, rabbit',
    group: 'NATURE',
  },
  '🐇': {
    name: ':rabbit:',
    keywords: 'bunny, pet',
    group: 'NATURE',
  },
  '🐿': {
    name: ':chipmunk:',
    keywords: 'chipmunk',
  },
  '🦇': {
    name: ':bat:',
    keywords: 'bat, vampire',
  },
  '🐻': {
    name: ':bear_face:',
    keywords: 'bear, face',
    group: 'NATURE',
  },
  '🐨': {
    name: ':koala:',
    keywords: 'bear',
    group: 'NATURE',
  },
  '🐼': {
    name: ':panda_face:',
    keywords: 'face, panda',
    group: 'NATURE',
  },
  '🐾': {
    name: ':paw_prints:',
    keywords: 'feet, paw, print',
    group: 'NATURE',
  },
  '🦃': {
    name: ':turkey:',
    keywords: 'turkey',
  },
  '🐔': {
    name: ':chicken:',
    keywords: 'chicken',
    group: 'NATURE',
  },
  '🐓': {
    name: ':rooster:',
    keywords: 'rooster',
    group: 'NATURE',
  },
  '🐣': {
    name: ':hatching_chick:',
    keywords: 'baby, chick, hatching',
    group: 'NATURE',
  },
  '🐤': {
    name: ':baby_chick:',
    keywords: 'baby, chick',
    group: 'NATURE',
  },
  '🐥': {
    name: ':front_facing_baby_chick:',
    keywords: 'baby, chick',
    group: 'NATURE',
  },
  '🐦': {
    name: ':bird:',
    keywords: 'bird',
    group: 'NATURE',
  },
  '🐧': {
    name: ':penguin:',
    keywords: 'penguin',
    group: 'NATURE',
  },
  '🕊': {
    name: ':dove:',
    keywords: 'bird, fly, peace',
  },
  '🦅': {
    name: ':eagle:',
    keywords: 'bird, eagle',
  },
  '🦆': {
    name: ':duck:',
    keywords: 'bird, duck',
  },
  '🦉': {
    name: ':owl:',
    keywords: 'bird, owl, wise',
  },
  '🐸': {
    name: ':frog_face:',
    keywords: 'face, frog',
    group: 'NATURE',
  },
  '🐊': {
    name: ':crocodile:',
    keywords: 'crocodile',
    group: 'NATURE',
  },
  '🐢': {
    name: ':turtle:',
    keywords: 'terrapin, tortoise, turtle',
    group: 'NATURE',
  },
  '🦎': {
    name: ':lizard:',
    keywords: 'lizard, reptile',
  },
  '🐍': {
    name: ':snake:',
    keywords: 'bearer, Ophiuchus, serpent, zodiac',
    group: 'NATURE',
  },
  '🐲': {
    name: ':dragon_face:',
    keywords: 'dragon, face, fairy tale',
    group: 'NATURE',
  },
  '🐉': {
    name: ':dragon:',
    keywords: 'fairy tale',
    group: 'NATURE',
  },
  '🐳': {
    name: ':spouting_whale:',
    keywords: 'face, spouting, whale',
    group: 'NATURE',
  },
  '🐋': {
    name: ':whale:',
    keywords: 'whale',
    group: 'NATURE',
  },
  '🐬': {
    name: ':dolphin:',
    keywords: 'flipper',
    group: 'NATURE',
  },
  '🐟': {
    name: ':fish:',
    keywords: 'Pisces, zodiac',
    group: 'NATURE',
  },
  '🐠': {
    name: ':tropical_fish:',
    keywords: 'fish, tropical',
    group: 'NATURE',
  },
  '🐡': {
    name: ':blowfish:',
    keywords: 'fish',
    group: 'NATURE',
  },
  '🦈': {
    name: ':shark:',
    keywords: 'fish, shark',
  },
  '🐙': {
    name: ':octopus:',
    keywords: 'octopus',
    group: 'NATURE',
  },
  '🐚': {
    name: ':spiral_shell:',
    keywords: 'shell, spiral',
    group: 'NATURE',
  },
  '🦀': {
    name: ':crab:',
    keywords: 'Cancer, zodiac',
  },
  '🦐': {
    name: ':shrimp:',
    keywords: 'food, shellfish, shrimp, small',
  },
  '🦑': {
    name: ':squid:',
    keywords: 'food, molusc, squid',
  },
  '🦋': {
    name: ':butterfly:',
    keywords: 'butterfly, insect, pretty',
  },
  '🐌': {
    name: ':snail:',
    keywords: 'snail',
    group: 'NATURE',
  },
  '🐛': {
    name: ':bug:',
    keywords: 'insect',
    group: 'NATURE',
  },
  '🐜': {
    name: ':ant:',
    keywords: 'insect',
    group: 'NATURE',
  },
  '🐝': {
    name: ':honeybee:',
    keywords: 'bee, insect',
    group: 'NATURE',
  },
  '🐞': {
    name: ':lady_beetle:',
    keywords: 'beetle, insect, ladybird, ladybug',
    group: 'NATURE',
  },
  '🕷': {
    name: ':spider:',
    keywords: 'insect',
  },
  '🕸': {
    name: ':spider_web:',
    keywords: 'spider, web',
  },
  '🦂': {
    name: ':scorpion:',
    keywords: 'scorpio, Scorpius, zodiac',
  },
  '💐': {
    name: ':bouquet:',
    keywords: 'flower',
    group: 'NATURE',
  },
  '🌸': {
    name: ':cherry_blossom:',
    keywords: 'blossom, cherry, flower',
    group: 'NATURE',
  },
  '💮': {
    name: ':white_flower:',
    keywords: 'flower',
    group: 'SYMBOLS',
  },
  '🏵': {
    name: ':rosette:',
    keywords: 'plant',
  },
  '🌹': {
    name: ':rose:',
    keywords: 'flower',
    group: 'NATURE',
  },
  '🥀': {
    name: ':wilted_flower:',
    keywords: 'flower, wilted',
  },
  '🌺': {
    name: ':hibiscus:',
    keywords: 'flower',
    group: 'NATURE',
  },
  '🌻': {
    name: ':sunflower:',
    keywords: 'flower, sun',
    group: 'NATURE',
  },
  '🌼': {
    name: ':blossom:',
    keywords: 'flower',
    group: 'NATURE',
  },
  '🌷': {
    name: ':tulip:',
    keywords: 'flower',
    group: 'NATURE',
  },
  '🌱': {
    name: ':seedling:',
    keywords: 'young',
    group: 'NATURE',
  },
  '🌲': {
    name: ':evergreen_tree:',
    keywords: 'tree',
    group: 'NATURE',
  },
  '🌳': {
    name: ':deciduous_tree:',
    keywords: 'deciduous, shedding, tree',
    group: 'NATURE',
  },
  '🌴': {
    name: ':palm_tree:',
    keywords: 'palm, tree',
    group: 'NATURE',
  },
  '🌵': {
    name: ':cactus:',
    keywords: 'plant',
    group: 'NATURE',
  },
  '🌾': {
    name: ':sheaf_of_rice:',
    keywords: 'ear, grain, rice',
    group: 'NATURE',
  },
  '🌿': {
    name: ':herb:',
    keywords: 'leaf',
    group: 'NATURE',
  },
  '☘': {
    name: ':shamrock:',
    keywords: 'plant',
  },
  '🍀': {
    name: ':four_leaf_clover:',
    keywords: '4, clover, four, leaf',
    group: 'NATURE',
  },
  '🍁': {
    name: ':maple_leaf:',
    keywords: 'falling, leaf, maple',
    group: 'NATURE',
  },
  '🍂': {
    name: ':fallen_leaf:',
    keywords: 'falling, leaf',
    group: 'NATURE',
  },
  '🍃': {
    name: ':leaf_fluttering_in_wind:',
    keywords: 'blow, flutter, leaf, wind',
    group: 'NATURE',
  },
  '🍇': {
    name: ':grapes:',
    keywords: 'fruit, grape',
    group: 'OBJECTS',
  },
  '🍈': {
    name: ':melon:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍉': {
    name: ':watermelon:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍊': {
    name: ':tangerine:',
    keywords: 'fruit, orange',
    group: 'OBJECTS',
  },
  '🍋': {
    name: ':lemon:',
    keywords: 'citrus, fruit',
    group: 'OBJECTS',
  },
  '🍌': {
    name: ':banana:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍍': {
    name: ':pineapple:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍎': {
    name: ':red_apple:',
    keywords: 'apple, fruit, red',
    group: 'OBJECTS',
  },
  '🍏': {
    name: ':green_apple:',
    keywords: 'apple, fruit, green',
    group: 'OBJECTS',
  },
  '🍐': {
    name: ':pear:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍑': {
    name: ':peach:',
    keywords: 'fruit',
    group: 'OBJECTS',
  },
  '🍒': {
    name: ':cherries:',
    keywords: 'cherry, fruit',
    group: 'OBJECTS',
  },
  '🍓': {
    name: ':strawberry:',
    keywords: 'berry, fruit',
    group: 'OBJECTS',
  },
  '🥝': {
    name: ':kiwi_fruit:',
    keywords: 'food, fruit, kiwi',
  },
  '🍅': {
    name: ':tomato:',
    keywords: 'fruit, vegetable',
    group: 'OBJECTS',
  },
  '🥑': {
    name: ':avocado:',
    keywords: 'avocado, food, fruit',
  },
  '🍆': {
    name: ':eggplant:',
    keywords: 'aubergine, vegetable',
    group: 'OBJECTS',
  },
  '🥔': {
    name: ':potato:',
    keywords: 'food, potato, vegetable',
  },
  '🥕': {
    name: ':carrot:',
    keywords: 'carrot, food, vegetable',
  },
  '🌽': {
    name: ':ear_of_corn:',
    keywords: 'corn, ear, maize, maze',
    group: 'OBJECTS',
  },
  '🌶': {
    name: ':hot_pepper:',
    keywords: 'hot, pepper',
  },
  '🥒': {
    name: ':cucumber:',
    keywords: 'cucumber, food, pickle, vegetable',
  },
  '🍄': {
    name: ':mushroom:',
    keywords: 'toadstool',
    group: 'NATURE',
  },
  '🥜': {
    name: ':peanuts:',
    keywords: 'food, nut, peanut, vegetable',
  },
  '🌰': {
    name: ':chestnut:',
    keywords: 'plant',
    group: 'NATURE',
  },
  '🍞': {
    name: ':bread:',
    keywords: 'loaf',
    group: 'OBJECTS',
  },
  '🥐': {
    name: ':croissant:',
    keywords: 'bread, crescent roll, croissant, food, french',
  },
  '🥖': {
    name: ':baguette_bread:',
    keywords: 'baguette, bread, food, french',
  },
  '🥞': {
    name: ':pancakes:',
    keywords: 'crêpe, food, hotcake, pancake',
  },
  '🧀': {
    name: ':cheese_wedge:',
    keywords: 'cheese',
  },
  '🍖': {
    name: ':meat_on_bone:',
    keywords: 'bone, meat',
    group: 'OBJECTS',
  },
  '🍗': {
    name: ':poultry_leg:',
    keywords: 'bone, chicken, leg, poultry',
    group: 'OBJECTS',
  },
  '🥓': {
    name: ':bacon:',
    keywords: 'bacon, food, meat',
  },
  '🍔': {
    name: ':hamburger:',
    keywords: 'burger',
    group: 'OBJECTS',
  },
  '🍟': {
    name: ':french_fries:',
    keywords: 'french, fries',
    group: 'OBJECTS',
  },
  '🍕': {
    name: ':pizza:',
    keywords: 'cheese, slice',
    group: 'OBJECTS',
  },
  '🌭': {
    name: ':hot_dog:',
    keywords: 'frankfurter, hotdog, sausage',
  },
  '🌮': {
    name: ':taco:',
    keywords: 'mexican',
  },
  '🌯': {
    name: ':burrito:',
    keywords: 'mexican, wrap',
  },
  '🥙': {
    name: ':stuffed_flatbread:',
    keywords: 'falafel, flatbread, food, gyro, kebab, stuffed',
  },
  '🥚': {
    name: ':egg:',
    keywords: 'egg, food',
  },
  '🍳': {
    name: ':cooking:',
    keywords: 'egg, frying, pan',
    group: 'OBJECTS',
  },
  '🥘': {
    name: ':shallow_pan_of_food:',
    keywords: 'casserole, food, paella, pan, shallow',
  },
  '🍲': {
    name: ':pot_of_food:',
    keywords: 'pot, stew',
    group: 'OBJECTS',
  },
  '🥗': {
    name: ':green_salad:',
    keywords: 'food, green, salad',
  },
  '🍿': {
    name: ':popcorn:',
    keywords: 'popcorn',
  },
  '🍱': {
    name: ':bento_box:',
    keywords: 'bento, box',
    group: 'OBJECTS',
  },
  '🍘': {
    name: ':rice_cracker:',
    keywords: 'cracker, rice',
    group: 'OBJECTS',
  },
  '🍙': {
    name: ':rice_ball:',
    keywords: 'ball, Japanese, rice',
    group: 'OBJECTS',
  },
  '🍚': {
    name: ':cooked_rice:',
    keywords: 'cooked, rice',
    group: 'OBJECTS',
  },
  '🍛': {
    name: ':curry_rice:',
    keywords: 'curry, rice',
    group: 'OBJECTS',
  },
  '🍜': {
    name: ':steaming_bowl:',
    keywords: 'bowl, noodle, ramen, steaming',
    group: 'OBJECTS',
  },
  '🍝': {
    name: ':spaghetti:',
    keywords: 'pasta',
    group: 'OBJECTS',
  },
  '🍠': {
    name: ':roasted_sweet_potato:',
    keywords: 'potato, roasted, sweet',
    group: 'OBJECTS',
  },
  '🍢': {
    name: ':oden:',
    keywords: 'kebab, seafood, skewer, stick',
    group: 'OBJECTS',
  },
  '🍣': {
    name: ':sushi:',
    keywords: 'sushi',
    group: 'OBJECTS',
  },
  '🍤': {
    name: ':fried_shrimp:',
    keywords: 'fried, prawn, shrimp, tempura',
    group: 'OBJECTS',
  },
  '🍥': {
    name: ':fish_cake_with_swirl:',
    keywords: 'cake, fish, pastry, swirl',
    group: 'OBJECTS',
  },
  '🍡': {
    name: ':dango:',
    keywords: 'dessert, Japanese, skewer, stick, sweet',
    group: 'OBJECTS',
  },
  '🍦': {
    name: ':soft_ice_cream:',
    keywords: 'cream, dessert, ice, icecream, soft, sweet',
    group: 'OBJECTS',
  },
  '🍧': {
    name: ':shaved_ice:',
    keywords: 'dessert, ice, shaved, sweet',
    group: 'OBJECTS',
  },
  '🍨': {
    name: ':ice_cream:',
    keywords: 'cream, dessert, ice, sweet',
    group: 'OBJECTS',
  },
  '🍩': {
    name: ':doughnut:',
    keywords: 'dessert, donut, sweet',
    group: 'OBJECTS',
  },
  '🍪': {
    name: ':cookie:',
    keywords: 'dessert, sweet',
    group: 'OBJECTS',
  },
  '🎂': {
    name: ':birthday_cake:',
    keywords: 'birthday, cake, celebration, dessert, pastry, sweet',
    group: 'OBJECTS',
  },
  '🍰': {
    name: ':shortcake:',
    keywords: 'cake, dessert, pastry, slice, sweet',
    group: 'OBJECTS',
  },
  '🍫': {
    name: ':chocolate_bar:',
    keywords: 'bar, chocolate, dessert, sweet',
    group: 'OBJECTS',
  },
  '🍬': {
    name: ':candy:',
    keywords: 'dessert, sweet',
    group: 'OBJECTS',
  },
  '🍭': {
    name: ':lollipop:',
    keywords: 'candy, dessert, sweet',
    group: 'OBJECTS',
  },
  '🍮': {
    name: ':custard:',
    keywords: 'dessert, pudding, sweet',
    group: 'OBJECTS',
  },
  '🍯': {
    name: ':honey_pot:',
    keywords: 'honey, honeypot, pot, sweet',
    group: 'OBJECTS',
  },
  '🍼': {
    name: ':baby_bottle:',
    keywords: 'baby, bottle, drink, milk',
    group: 'OBJECTS',
  },
  '🥛': {
    name: ':glass_of_milk:',
    keywords: 'drink, glass, milk',
  },
  '☕': {
    name: ':hot_beverage:',
    keywords: 'beverage, coffee, drink, hot, steaming, tea',
    group: 'OBJECTS',
  },
  '🍵': {
    name: ':teacup_without_handle:',
    keywords: 'beverage, cup, drink, tea, teacup',
    group: 'OBJECTS',
  },
  '🍶': {
    name: ':sake:',
    keywords: 'bar, beverage, bottle, cup, drink',
    group: 'OBJECTS',
  },
  '🍾': {
    name: ':bottle_with_popping_cork:',
    keywords: 'bar, bottle, cork, drink, popping',
  },
  '🍷': {
    name: ':wine_glass:',
    keywords: 'bar, beverage, drink, glass, wine',
    group: 'OBJECTS',
  },
  '🍸': {
    name: ':cocktail_glass:',
    keywords: 'bar, cocktail, drink, glass',
    group: 'OBJECTS',
  },
  '🍹': {
    name: ':tropical_drink:',
    keywords: 'bar, drink, tropical',
    group: 'OBJECTS',
  },
  '🍺': {
    name: ':beer_mug:',
    keywords: 'bar, beer, drink, mug',
    group: 'OBJECTS',
  },
  '🍻': {
    name: ':clinking_beer_mugs:',
    keywords: 'bar, beer, clink, drink, mug',
    group: 'OBJECTS',
  },
  '🥂': {
    name: ':clinking_glasses:',
    keywords: 'celebrate, clink, drink, glass',
  },
  '🥃': {
    name: ':tumbler_glass:',
    keywords: 'glass, liquor, shot, tumbler, whisky',
  },
  '🍽': {
    name: ':fork_and_knife_with_plate:',
    keywords: 'cooking, fork, knife, plate',
  },
  '🍴': {
    name: ':fork_and_knife:',
    keywords: 'cooking, fork, knife',
    group: 'OBJECTS',
  },
  '🥄': {
    name: ':spoon:',
    keywords: 'spoon, tableware',
  },
  '🔪': {
    name: ':kitchen_knife:',
    keywords: 'cooking, hocho, knife, tool, weapon',
    group: 'OBJECTS',
  },
  '🏺': {
    name: ':amphora:',
    keywords: 'Aquarius, cooking, drink, jug, tool, weapon, zodiac',
  },
  '🌍': {
    name: ':globe_showing_europe_africa:',
    keywords: 'Africa, earth, Europe, globe, world',
    group: 'NATURE',
  },
  '🌎': {
    name: ':globe_showing_americas:',
    keywords: 'Americas, earth, globe, world',
    group: 'NATURE',
  },
  '🌏': {
    name: ':globe_showing_asia_australia:',
    keywords: 'Asia, Australia, earth, globe, world',
    group: 'NATURE',
  },
  '🌐': {
    name: ':globe_with_meridians:',
    keywords: 'earth, globe, meridians, world',
    group: 'NATURE',
  },
  '🗺': {
    name: ':world_map:',
    keywords: 'map, world',
  },
  '🗾': {
    name: ':map_of_japan:',
    keywords: 'Japan, map',
    group: 'PLACES',
  },
  '🏔': {
    name: ':snow_capped_mountain:',
    keywords: 'cold, mountain, snow',
  },
  '⛰': {
    name: ':mountain:',
    keywords: 'mountain',
  },
  '🌋': {
    name: ':volcano:',
    keywords: 'eruption, mountain',
    group: 'NATURE',
  },
  '🗻': {
    name: ':mount_fuji:',
    keywords: 'fuji, mountain',
    group: 'PLACES',
  },
  '🏕': {
    name: ':camping:',
    keywords: 'camping',
  },
  '🏖': {
    name: ':beach_with_umbrella:',
    keywords: 'beach, umbrella',
  },
  '🏜': {
    name: ':desert:',
    keywords: 'desert',
  },
  '🏝': {
    name: ':desert_island:',
    keywords: 'desert, island',
  },
  '🏞': {
    name: ':national_park:',
    keywords: 'park',
  },
  '🏟': {
    name: ':stadium:',
    keywords: 'stadium',
  },
  '🏛': {
    name: ':classical_building:',
    keywords: 'classical',
  },
  '🏗': {
    name: ':building_construction:',
    keywords: 'construction',
  },
  '🏘': {
    name: ':house:',
    keywords: 'house',
  },
  '🏙': {
    name: ':cityscape:',
    keywords: 'city',
  },
  '🏚': {
    name: ':derelict_house:',
    keywords: 'derelict, house',
  },
  '🏠': {
    name: ':house:',
    keywords: 'home, house',
    group: 'PLACES',
  },
  '🏡': {
    name: ':house_with_garden:',
    keywords: 'garden, home, house',
    group: 'PLACES',
  },
  '🏢': {
    name: ':office_building:',
    keywords: 'building',
    group: 'PLACES',
  },
  '🏣': {
    name: ':japanese_post_office:',
    keywords: 'Japanese, post',
    group: 'PLACES',
  },
  '🏤': {
    name: ':post_office:',
    keywords: 'European, post',
    group: 'PLACES',
  },
  '🏥': {
    name: ':hospital:',
    keywords: 'doctor, medicine',
    group: 'PLACES',
  },
  '🏦': {
    name: ':bank:',
    keywords: 'building',
    group: 'PLACES',
  },
  '🏨': {
    name: ':hotel:',
    keywords: 'building',
    group: 'PLACES',
  },
  '🏩': {
    name: ':love_hotel:',
    keywords: 'hotel, love',
    group: 'PLACES',
  },
  '🏪': {
    name: ':convenience_store:',
    keywords: 'convenience, store',
    group: 'PLACES',
  },
  '🏫': {
    name: ':school:',
    keywords: 'building',
    group: 'PLACES',
  },
  '🏬': {
    name: ':department_store:',
    keywords: 'department, store',
    group: 'PLACES',
  },
  '🏭': {
    name: ':factory:',
    keywords: 'building',
    group: 'PLACES',
  },
  '🏯': {
    name: ':japanese_castle:',
    keywords: 'castle, Japanese',
    group: 'PLACES',
  },
  '🏰': {
    name: ':castle:',
    keywords: 'European',
    group: 'PLACES',
  },
  '💒': {
    name: ':wedding:',
    keywords: 'chapel, romance',
    group: 'PLACES',
  },
  '🗼': {
    name: ':tokyo_tower:',
    keywords: 'Tokyo, tower',
    group: 'PLACES',
  },
  '🗽': {
    name: ':statue_of_liberty:',
    keywords: 'liberty, statue',
    group: 'PLACES',
  },
  '⛪': {
    name: ':church:',
    keywords: 'Christian, cross, religion',
    group: 'PLACES',
  },
  '🕌': {
    name: ':mosque:',
    keywords: 'islam, Muslim, religion',
  },
  '🕍': {
    name: ':synagogue:',
    keywords: 'Jew, Jewish, religion, temple',
  },
  '⛩': {
    name: ':shinto_shrine:',
    keywords: 'religion, shinto, shrine',
  },
  '🕋': {
    name: ':kaaba:',
    keywords: 'islam, Muslim, religion',
  },
  '⛲': {
    name: ':fountain:',
    keywords: 'fountain',
    group: 'PLACES',
  },
  '⛺': {
    name: ':tent:',
    keywords: 'camping',
    group: 'PLACES',
  },
  '🌁': {
    name: ':foggy:',
    keywords: 'fog',
    group: 'NATURE',
  },
  '🌃': {
    name: ':night_with_stars:',
    keywords: 'night, star',
    group: 'PLACES',
  },
  '🌄': {
    name: ':sunrise_over_mountains:',
    keywords: 'morning, mountain, sun, sunrise',
    group: 'PLACES',
  },
  '🌅': {
    name: ':sunrise:',
    keywords: 'morning, sun',
    group: 'PLACES',
  },
  '🌆': {
    name: ':cityscape_at_dusk:',
    keywords: 'city, dusk, evening, landscape, sun, sunset',
    group: 'PLACES',
  },
  '🌇': {
    name: ':sunset:',
    keywords: 'dusk, sun',
    group: 'PLACES',
  },
  '🌉': {
    name: ':bridge_at_night:',
    keywords: 'bridge, night',
    group: 'PLACES',
  },
  '♨': {
    name: ':hot_springs:',
    keywords: 'hot, hotsprings, springs, steaming',
    group: 'PLACES',
  },
  '🌌': {
    name: ':milky_way:',
    keywords: 'space',
    group: 'NATURE',
  },
  '🎠': {
    name: ':carousel_horse:',
    keywords: 'carousel, horse',
    group: 'PLACES',
  },
  '🎡': {
    name: ':ferris_wheel:',
    keywords: 'amusement park, ferris, wheel',
    group: 'PLACES',
  },
  '🎢': {
    name: ':roller_coaster:',
    keywords: 'amusement park, coaster, roller',
    group: 'PLACES',
  },
  '💈': {
    name: ':barber_pole:',
    keywords: 'barber, haircut, pole',
    group: 'PLACES',
  },
  '🎪': {
    name: ':circus_tent:',
    keywords: 'circus, tent',
    group: 'PLACES',
  },
  '🎭': {
    name: ':performing_arts:',
    keywords: 'art, mask, performing, theater, theatre',
    group: 'PLACES',
  },
  '🖼': {
    name: ':framed_picture:',
    keywords: 'art, frame, museum, painting, picture',
  },
  '🎨': {
    name: ':artist_palette:',
    keywords: 'art, museum, painting, palette',
    group: 'OBJECTS',
  },
  '🎰': {
    name: ':slot_machine:',
    keywords: 'game, slot',
    group: 'PLACES',
  },
  '🚂': {
    name: ':locomotive:',
    keywords: 'engine, railway, steam, train',
    group: 'PLACES',
  },
  '🚃': {
    name: ':railway_car:',
    keywords: 'car, electric, railway, train, tram, trolleybus',
    group: 'PLACES',
  },
  '🚄': {
    name: ':high_speed_train:',
    keywords: 'railway, shinkansen, speed, train',
    group: 'PLACES',
  },
  '🚅': {
    name: ':high_speed_train_with_bullet_nose:',
    keywords: 'bullet, railway, shinkansen, speed, train',
    group: 'PLACES',
  },
  '🚆': {
    name: ':train:',
    keywords: 'railway',
    group: 'PLACES',
  },
  '🚇': {
    name: ':metro:',
    keywords: 'subway',
    group: 'PLACES',
  },
  '🚈': {
    name: ':light_rail:',
    keywords: 'railway',
    group: 'PLACES',
  },
  '🚉': {
    name: ':station:',
    keywords: 'railway, train',
    group: 'PLACES',
  },
  '🚊': {
    name: ':tram:',
    keywords: 'trolleybus',
    group: 'PLACES',
  },
  '🚝': {
    name: ':monorail:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚞': {
    name: ':mountain_railway:',
    keywords: 'car, mountain, railway',
    group: 'PLACES',
  },
  '🚋': {
    name: ':tram_car:',
    keywords: 'car, tram, trolleybus',
    group: 'PLACES',
  },
  '🚌': {
    name: ':bus:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚍': {
    name: ':oncoming_bus:',
    keywords: 'bus, oncoming',
    group: 'PLACES',
  },
  '🚎': {
    name: ':trolleybus:',
    keywords: 'bus, tram, trolley',
    group: 'PLACES',
  },
  '🚐': {
    name: ':minibus:',
    keywords: 'bus',
    group: 'PLACES',
  },
  '🚑': {
    name: ':ambulance:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚒': {
    name: ':fire_engine:',
    keywords: 'engine, fire, truck',
    group: 'PLACES',
  },
  '🚓': {
    name: ':police_car:',
    keywords: 'car, patrol, police',
    group: 'PLACES',
  },
  '🚔': {
    name: ':oncoming_police_car:',
    keywords: 'car, oncoming, police',
    group: 'PLACES',
  },
  '🚕': {
    name: ':taxi:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚖': {
    name: ':oncoming_taxi:',
    keywords: 'oncoming, taxi',
    group: 'PLACES',
  },
  '🚗': {
    name: ':automobile:',
    keywords: 'car',
    group: 'PLACES',
  },
  '🚘': {
    name: ':oncoming_automobile:',
    keywords: 'automobile, car, oncoming',
    group: 'PLACES',
  },
  '🚙': {
    name: ':sport_utility_vehicle:',
    keywords: 'recreational, sport utility',
    group: 'PLACES',
  },
  '🚚': {
    name: ':delivery_truck:',
    keywords: 'delivery, truck',
    group: 'PLACES',
  },
  '🚛': {
    name: ':articulated_lorry:',
    keywords: 'lorry, semi, truck',
    group: 'PLACES',
  },
  '🚜': {
    name: ':tractor:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚲': {
    name: ':bicycle:',
    keywords: 'bike',
    group: 'PLACES',
  },
  '🛴': {
    name: ':kick_scooter:',
    keywords: 'kick, scooter',
  },
  '🛵': {
    name: ':motor_scooter:',
    keywords: 'motor, scooter',
  },
  '🚏': {
    name: ':bus_stop:',
    keywords: 'bus, busstop, stop',
    group: 'PLACES',
  },
  '🛣': {
    name: ':motorway:',
    keywords: 'highway, road',
  },
  '🛤': {
    name: ':railway_track:',
    keywords: 'railway, train',
  },
  '⛽': {
    name: ':fuel_pump:',
    keywords: 'fuel, fuelpump, gas, pump, station',
    group: 'PLACES',
  },
  '🚨': {
    name: ':police_car_light:',
    keywords: 'beacon, car, light, police, revolving',
    group: 'PLACES',
  },
  '🚥': {
    name: ':horizontal_traffic_light:',
    keywords: 'light, signal, traffic',
    group: 'PLACES',
  },
  '🚦': {
    name: ':vertical_traffic_light:',
    keywords: 'light, signal, traffic',
    group: 'PLACES',
  },
  '🚧': {
    name: ':construction:',
    keywords: 'barrier',
    group: 'PLACES',
  },
  '🛑': {
    name: ':stop_sign:',
    keywords: 'octagonal, sign, stop',
  },
  '⚓': {
    name: ':anchor:',
    keywords: 'ship, tool',
    group: 'PLACES',
  },
  '⛵': {
    name: ':sailboat:',
    keywords: 'boat, resort, sea, yacht',
    group: 'PLACES',
  },
  '🛶': {
    name: ':canoe:',
    keywords: 'boat, canoe',
  },
  '🚤': {
    name: ':speedboat:',
    keywords: 'boat',
    group: 'PLACES',
  },
  '🛳': {
    name: ':passenger_ship:',
    keywords: 'passenger, ship',
  },
  '⛴': {
    name: ':ferry:',
    keywords: 'boat, passenger',
  },
  '🛥': {
    name: ':motor_boat:',
    keywords: 'boat, motorboat',
  },
  '🚢': {
    name: ':ship:',
    keywords: 'boat, passenger',
    group: 'PLACES',
  },
  '✈': {
    name: ':airplane:',
    keywords: 'aeroplane, airplane',
    group: 'PLACES',
  },
  '🛩': {
    name: ':small_airplane:',
    keywords: 'aeroplane, airplane',
  },
  '🛫': {
    name: ':airplane_departure:',
    keywords: 'aeroplane, airplane, check-in, departure, departures',
  },
  '🛬': {
    name: ':airplane_arrival:',
    keywords: 'aeroplane, airplane, arrivals, arriving, landing',
  },
  '💺': {
    name: ':seat:',
    keywords: 'chair',
    group: 'PLACES',
  },
  '🚁': {
    name: ':helicopter:',
    keywords: 'vehicle',
    group: 'PLACES',
  },
  '🚟': {
    name: ':suspension_railway:',
    keywords: 'railway, suspension',
    group: 'PLACES',
  },
  '🚠': {
    name: ':mountain_cableway:',
    keywords: 'cable, gondola, mountain',
    group: 'PLACES',
  },
  '🚡': {
    name: ':aerial_tramway:',
    keywords: 'aerial, cable, car, gondola, tramway',
    group: 'PLACES',
  },
  '🚀': {
    name: ':rocket:',
    keywords: 'space',
    group: 'PLACES',
  },
  '🛰': {
    name: ':satellite:',
    keywords: 'space',
  },
  '🛎': {
    name: ':bellhop_bell:',
    keywords: 'bell, bellhop, hotel',
  },
  '🚪': {
    name: ':door:',
    keywords: 'door',
    group: 'OBJECTS',
  },
  '🛌': {
    name: ':person_in_bed:',
    keywords: 'hotel, sleep',
  },
  '🛌🏻': {
    name: ':person_in_bed_light_skin_tone:',
    keywords: 'hotel, light skin tone, sleep',
  },
  '🛌🏼': {
    name: ':person_in_bed_medium_light_skin_tone:',
    keywords: 'hotel, medium-light skin tone, sleep',
  },
  '🛌🏽': {
    name: ':person_in_bed_medium_skin_tone:',
    keywords: 'hotel, medium skin tone, sleep',
  },
  '🛌🏾': {
    name: ':person_in_bed_medium_dark_skin_tone:',
    keywords: 'hotel, medium-dark skin tone, sleep',
  },
  '🛌🏿': {
    name: ':person_in_bed_dark_skin_tone:',
    keywords: 'dark skin tone, hotel, sleep',
  },
  '🛏': {
    name: ':bed:',
    keywords: 'hotel, sleep',
  },
  '🛋': {
    name: ':couch_and_lamp:',
    keywords: 'couch, hotel, lamp',
  },
  '🚽': {
    name: ':toilet:',
    keywords: 'toilet',
    group: 'OBJECTS',
  },
  '🚿': {
    name: ':shower:',
    keywords: 'water',
    group: 'OBJECTS',
  },
  '🛀': {
    name: ':person_taking_bath:',
    keywords: 'bath, bathtub',
    group: 'OBJECTS',
  },
  '🛀🏻': {
    name: ':person_taking_bath_light_skin_tone:',
    keywords: 'bath, bathtub, light skin tone',
  },
  '🛀🏼': {
    name: ':person_taking_bath_medium_light_skin_tone:',
    keywords: 'bath, bathtub, medium-light skin tone',
  },
  '🛀🏽': {
    name: ':person_taking_bath_medium_skin_tone:',
    keywords: 'bath, bathtub, medium skin tone',
  },
  '🛀🏾': {
    name: ':person_taking_bath_medium_dark_skin_tone:',
    keywords: 'bath, bathtub, medium-dark skin tone',
  },
  '🛀🏿': {
    name: ':person_taking_bath_dark_skin_tone:',
    keywords: 'bath, bathtub, dark skin tone',
  },
  '🛁': {
    name: ':bathtub:',
    keywords: 'bath',
    group: 'OBJECTS',
  },
  '⌛': {
    name: ':hourglass:',
    keywords: 'sand, timer',
    group: 'OBJECTS',
  },
  '⏳': {
    name: ':hourglass_with_flowing_sand:',
    keywords: 'hourglass, sand, timer',
    group: 'OBJECTS',
  },
  '⌚': {
    name: ':watch:',
    keywords: 'clock',
    group: 'OBJECTS',
  },
  '⏰': {
    name: ':alarm_clock:',
    keywords: 'alarm, clock',
    group: 'OBJECTS',
  },
  '⏱': {
    name: ':stopwatch:',
    keywords: 'clock',
  },
  '⏲': {
    name: ':timer_clock:',
    keywords: 'clock, timer',
  },
  '🕰': {
    name: ':mantelpiece_clock:',
    keywords: 'clock',
  },
  '🕛': {
    name: ':twelve_oclock:',
    keywords: '00, 12, 12:00, clock, o’clock, twelve',
    group: 'SYMBOLS',
  },
  '🕧': {
    name: ':twelve_thirty:',
    keywords: '12, 12:30, 30, clock, thirty, twelve',
    group: 'SYMBOLS',
  },
  '🕐': {
    name: ':one_oclock:',
    keywords: '00, 1, 1:00, clock, o’clock, one',
    group: 'SYMBOLS',
  },
  '🕜': {
    name: ':one_thirty:',
    keywords: '1, 1:30, 30, clock, one, thirty',
    group: 'SYMBOLS',
  },
  '🕑': {
    name: ':two_oclock:',
    keywords: '00, 2, 2:00, clock, o’clock, two',
    group: 'SYMBOLS',
  },
  '🕝': {
    name: ':two_thirty:',
    keywords: '2, 2:30, 30, clock, thirty, two',
    group: 'SYMBOLS',
  },
  '🕒': {
    name: ':three_oclock:',
    keywords: '00, 3, 3:00, clock, o’clock, three',
    group: 'SYMBOLS',
  },
  '🕞': {
    name: ':three_thirty:',
    keywords: '3, 3:30, 30, clock, thirty, three',
    group: 'SYMBOLS',
  },
  '🕓': {
    name: ':four_oclock:',
    keywords: '00, 4, 4:00, clock, four, o’clock',
    group: 'SYMBOLS',
  },
  '🕟': {
    name: ':four_thirty:',
    keywords: '30, 4, 4:30, clock, four, thirty',
    group: 'SYMBOLS',
  },
  '🕔': {
    name: ':five_oclock:',
    keywords: '00, 5, 5:00, clock, five, o’clock',
    group: 'SYMBOLS',
  },
  '🕠': {
    name: ':five_thirty:',
    keywords: '30, 5, 5:30, clock, five, thirty',
    group: 'SYMBOLS',
  },
  '🕕': {
    name: ':six_oclock:',
    keywords: '00, 6, 6:00, clock, o’clock, six',
    group: 'SYMBOLS',
  },
  '🕡': {
    name: ':six_thirty:',
    keywords: '30, 6, 6:30, clock, six, thirty',
    group: 'SYMBOLS',
  },
  '🕖': {
    name: ':seven_oclock:',
    keywords: '00, 7, 7:00, clock, o’clock, seven',
    group: 'SYMBOLS',
  },
  '🕢': {
    name: ':seven_thirty:',
    keywords: '30, 7, 7:30, clock, seven, thirty',
    group: 'SYMBOLS',
  },
  '🕗': {
    name: ':eight_oclock:',
    keywords: '00, 8, 8:00, clock, eight, o’clock',
    group: 'SYMBOLS',
  },
  '🕣': {
    name: ':eight_thirty:',
    keywords: '30, 8, 8:30, clock, eight, thirty',
    group: 'SYMBOLS',
  },
  '🕘': {
    name: ':nine_oclock:',
    keywords: '00, 9, 9:00, clock, nine, o’clock',
    group: 'SYMBOLS',
  },
  '🕤': {
    name: ':nine_thirty:',
    keywords: '30, 9, 9:30, clock, nine, thirty',
    group: 'SYMBOLS',
  },
  '🕙': {
    name: ':ten_oclock:',
    keywords: '00, 10, 10:00, clock, o’clock, ten',
    group: 'SYMBOLS',
  },
  '🕥': {
    name: ':ten_thirty:',
    keywords: '10, 10:30, 30, clock, ten, thirty',
    group: 'SYMBOLS',
  },
  '🕚': {
    name: ':eleven_oclock:',
    keywords: '00, 11, 11:00, clock, eleven, o’clock',
    group: 'SYMBOLS',
  },
  '🕦': {
    name: ':eleven_thirty:',
    keywords: '11, 11:30, 30, clock, eleven, thirty',
    group: 'SYMBOLS',
  },
  '🌑': {
    name: ':new_moon:',
    keywords: 'dark, moon',
    group: 'NATURE',
  },
  '🌒': {
    name: ':waxing_crescent_moon:',
    keywords: 'crescent, moon, waxing',
    group: 'NATURE',
  },
  '🌓': {
    name: ':first_quarter_moon:',
    keywords: 'moon, quarter',
    group: 'NATURE',
  },
  '🌔': {
    name: ':waxing_gibbous_moon:',
    keywords: 'gibbous, moon, waxing',
    group: 'NATURE',
  },
  '🌕': {
    name: ':full_moon:',
    keywords: 'full, moon',
    group: 'NATURE',
  },
  '🌖': {
    name: ':waning_gibbous_moon:',
    keywords: 'gibbous, moon, waning',
    group: 'NATURE',
  },
  '🌗': {
    name: ':last_quarter_moon:',
    keywords: 'moon, quarter',
    group: 'NATURE',
  },
  '🌘': {
    name: ':waning_crescent_moon:',
    keywords: 'crescent, moon, waning',
    group: 'NATURE',
  },
  '🌙': {
    name: ':crescent_moon:',
    keywords: 'crescent, moon',
    group: 'NATURE',
  },
  '🌚': {
    name: ':new_moon_face:',
    keywords: 'face, moon',
    group: 'NATURE',
  },
  '🌛': {
    name: ':first_quarter_moon_with_face:',
    keywords: 'face, moon, quarter',
    group: 'NATURE',
  },
  '🌜': {
    name: ':last_quarter_moon_with_face:',
    keywords: 'face, moon, quarter',
    group: 'NATURE',
  },
  '🌡': {
    name: ':thermometer:',
    keywords: 'weather',
  },
  '☀': {
    name: ':sun:',
    keywords: 'bright, rays, sunny',
    group: 'NATURE',
  },
  '🌝': {
    name: ':full_moon_with_face:',
    keywords: 'bright, face, full, moon',
    group: 'NATURE',
  },
  '🌞': {
    name: ':sun_with_face:',
    keywords: 'bright, face, sun',
    group: 'NATURE',
  },
  '⭐': {
    name: ':white_medium_star:',
    keywords: 'star',
    group: 'NATURE',
  },
  '🌟': {
    name: ':glowing_star:',
    keywords: 'glittery, glow, shining, sparkle, star',
    group: 'PEOPLE',
  },
  '🌠': {
    name: ':shooting_star:',
    keywords: 'falling, shooting, star',
    group: 'NATURE',
  },
  '☁': {
    name: ':cloud:',
    keywords: 'weather',
    group: 'NATURE',
  },
  '⛅': {
    name: ':sun_behind_cloud:',
    keywords: 'cloud, sun',
    group: 'NATURE',
  },
  '⛈': {
    name: ':cloud_with_lightning_and_rain:',
    keywords: 'cloud, rain, thunder',
  },
  '🌤': {
    name: ':sun_behind_small_cloud:',
    keywords: 'cloud, sun',
  },
  '🌥': {
    name: ':sun_behind_large_cloud:',
    keywords: 'cloud, sun',
  },
  '🌦': {
    name: ':sun_behind_rain_cloud:',
    keywords: 'cloud, rain, sun',
  },
  '🌧': {
    name: ':cloud_with_rain:',
    keywords: 'cloud, rain',
  },
  '🌨': {
    name: ':cloud_with_snow:',
    keywords: 'cloud, cold, snow',
  },
  '🌩': {
    name: ':cloud_with_lightning:',
    keywords: 'cloud, lightning',
  },
  '🌪': {
    name: ':tornado:',
    keywords: 'cloud, whirlwind',
  },
  '🌫': {
    name: ':fog:',
    keywords: 'cloud',
  },
  '🌬': {
    name: ':wind_face:',
    keywords: 'blow, cloud, face, wind',
  },
  '🌀': {
    name: ':cyclone:',
    keywords: 'dizzy, twister, typhoon',
    group: 'NATURE',
  },
  '🌈': {
    name: ':rainbow:',
    keywords: 'rain',
    group: 'NATURE',
  },
  '🌂': {
    name: ':closed_umbrella:',
    keywords: 'clothing, rain, umbrella',
    group: 'PEOPLE',
  },
  '☂': {
    name: ':umbrella:',
    keywords: 'clothing, rain',
  },
  '☔': {
    name: ':umbrella_with_rain_drops:',
    keywords: 'clothing, drop, rain, umbrella',
    group: 'NATURE',
  },
  '⛱': {
    name: ':umbrella_on_ground:',
    keywords: 'rain, sun, umbrella',
  },
  '⚡': {
    name: ':high_voltage:',
    keywords: 'danger, electric, electricity, lightning, voltage, zap',
    group: 'NATURE',
  },
  '❄': {
    name: ':snowflake:',
    keywords: 'cold, snow',
    group: 'NATURE',
  },
  '☃': {
    name: ':snowman:',
    keywords: 'cold, snow',
  },
  '⛄': {
    name: ':snowman_without_snow:',
    keywords: 'cold, snow, snowman',
    group: 'NATURE',
  },
  '☄': {
    name: ':comet:',
    keywords: 'space',
  },
  '🔥': {
    name: ':fire:',
    keywords: 'flame, tool',
    group: 'PEOPLE',
  },
  '💧': {
    name: ':droplet:',
    keywords: 'cold, comic, drop, sweat',
    group: 'PEOPLE',
  },
  '🌊': {
    name: ':water_wave:',
    keywords: 'ocean, water, wave',
    group: 'NATURE',
  },
  '🎃': {
    name: ':jack_o_lantern:',
    keywords: 'celebration, halloween, jack, lantern',
    group: 'OBJECTS',
  },
  '🎄': {
    name: ':christmas_tree:',
    keywords: 'celebration, Christmas, tree',
    group: 'OBJECTS',
  },
  '🎆': {
    name: ':fireworks:',
    keywords: 'celebration',
    group: 'OBJECTS',
  },
  '🎇': {
    name: ':sparkler:',
    keywords: 'celebration, fireworks, sparkle',
    group: 'OBJECTS',
  },
  '✨': {
    name: ':sparkles:',
    keywords: 'sparkle, star',
    group: 'PEOPLE',
  },
  '🎈': {
    name: ':balloon:',
    keywords: 'celebration',
    group: 'OBJECTS',
  },
  '🎉': {
    name: ':party_popper:',
    keywords: 'celebration, party, popper, tada',
    group: 'OBJECTS',
  },
  '🎊': {
    name: ':confetti_ball:',
    keywords: 'ball, celebration, confetti',
    group: 'OBJECTS',
  },
  '🎋': {
    name: ':tanabata_tree:',
    keywords: 'banner, celebration, Japanese, tree',
    group: 'OBJECTS',
  },
  '🎍': {
    name: ':pine_decoration:',
    keywords: 'bamboo, celebration, Japanese, pine',
    group: 'OBJECTS',
  },
  '🎎': {
    name: ':japanese_dolls:',
    keywords: 'celebration, doll, festival, Japanese',
    group: 'OBJECTS',
  },
  '🎏': {
    name: ':carp_streamer:',
    keywords: 'carp, celebration, streamer',
    group: 'OBJECTS',
  },
  '🎐': {
    name: ':wind_chime:',
    keywords: 'bell, celebration, chime, wind',
    group: 'OBJECTS',
  },
  '🎑': {
    name: ':moon_viewing_ceremony:',
    keywords: 'celebration, ceremony, moon',
    group: 'OBJECTS',
  },
  '🎀': {
    name: ':ribbon:',
    keywords: 'celebration',
    group: 'PEOPLE',
  },
  '🎁': {
    name: ':wrapped_gift:',
    keywords: 'box, celebration, gift, present, wrapped',
    group: 'OBJECTS',
  },
  '🎗': {
    name: ':reminder_ribbon:',
    keywords: 'celebration, reminder, ribbon',
  },
  '🎟': {
    name: ':admission_tickets:',
    keywords: 'admission, ticket',
  },
  '🎫': {
    name: ':ticket:',
    keywords: 'admission',
    group: 'PLACES',
  },
  '🎖': {
    name: ':military_medal:',
    keywords: 'celebration, medal, military',
  },
  '🏆': {
    name: ':trophy:',
    keywords: 'prize',
    group: 'OBJECTS',
  },
  '🏅': {
    name: ':sports_medal:',
    keywords: 'medal',
  },
  '🥇': {
    name: ':1st_place_medal:',
    keywords: 'first, gold, medal',
  },
  '🥈': {
    name: ':2nd_place_medal:',
    keywords: 'medal, second, silver',
  },
  '🥉': {
    name: ':3rd_place_medal:',
    keywords: 'bronze, medal, third',
  },
  '⚽': {
    name: ':soccer_ball:',
    keywords: 'ball, football, soccer',
    group: 'OBJECTS',
  },
  '⚾': {
    name: ':baseball:',
    keywords: 'ball',
    group: 'OBJECTS',
  },
  '🏀': {
    name: ':basketball:',
    keywords: 'ball, hoop',
    group: 'OBJECTS',
  },
  '🏐': {
    name: ':volleyball:',
    keywords: 'ball, game',
  },
  '🏈': {
    name: ':american_football:',
    keywords: 'american, ball, football',
    group: 'OBJECTS',
  },
  '🏉': {
    name: ':rugby_football:',
    keywords: 'ball, football, rugby',
    group: 'OBJECTS',
  },
  '🎾': {
    name: ':tennis:',
    keywords: 'ball, racquet',
    group: 'OBJECTS',
  },
  '🎱': {
    name: ':pool_8_ball:',
    keywords: '8, 8 ball, ball, billiard, eight, game',
    group: 'OBJECTS',
  },
  '🎳': {
    name: ':bowling:',
    keywords: 'ball, game',
    group: 'OBJECTS',
  },
  '🏏': {
    name: ':cricket:',
    keywords: 'ball, bat, game',
  },
  '🏑': {
    name: ':field_hockey:',
    keywords: 'ball, field, game, hockey, stick',
  },
  '🏒': {
    name: ':ice_hockey:',
    keywords: 'game, hockey, ice, puck, stick',
  },
  '🏓': {
    name: ':ping_pong:',
    keywords: 'ball, bat, game, paddle, ping pong, table tennis',
  },
  '🏸': {
    name: ':badminton:',
    keywords: 'birdie, game, racquet, shuttlecock',
  },
  '🥊': {
    name: ':boxing_glove:',
    keywords: 'boxing, glove',
  },
  '🥋': {
    name: ':martial_arts_uniform:',
    keywords: 'judo, karate, martial arts, taekwondo, uniform',
  },
  '🥅': {
    name: ':goal_net:',
    keywords: 'goal, net',
  },
  '🎯': {
    name: ':direct_hit:',
    keywords: 'bull, bullseye, dart, eye, game, hit, target',
    group: 'OBJECTS',
  },
  '⛳': {
    name: ':flag_in_hole:',
    keywords: 'golf, hole',
    group: 'OBJECTS',
  },
  '⛸': {
    name: ':ice_skate:',
    keywords: 'ice, skate',
  },
  '🎣': {
    name: ':fishing_pole:',
    keywords: 'fish, pole',
    group: 'OBJECTS',
  },
  '🎽': {
    name: ':running_shirt:',
    keywords: 'athletics, running, sash, shirt',
    group: 'PEOPLE',
  },
  '🎿': {
    name: ':skis:',
    keywords: 'ski, snow',
    group: 'OBJECTS',
  },
  '🎮': {
    name: ':video_game:',
    keywords: 'controller, game',
    group: 'OBJECTS',
  },
  '🕹': {
    name: ':joystick:',
    keywords: 'game, video game',
  },
  '🎲': {
    name: ':game_die:',
    keywords: 'dice, die, game',
    group: 'OBJECTS',
  },
  '♠': {
    name: ':spade_suit:',
    keywords: 'card, game',
    group: 'SYMBOLS',
  },
  '♥': {
    name: ':heart_suit:',
    keywords: 'card, game',
    group: 'SYMBOLS',
  },
  '♦': {
    name: ':diamond_suit:',
    keywords: 'card, game',
    group: 'SYMBOLS',
  },
  '♣': {
    name: ':club_suit:',
    keywords: 'card, game',
    group: 'SYMBOLS',
  },
  '🃏': {
    name: ':joker:',
    keywords: 'card, game, wildcard',
    group: 'OBJECTS',
  },
  '🀄': {
    name: ':mahjong_red_dragon:',
    keywords: 'game, mahjong, red',
    group: 'OBJECTS',
  },
  '🎴': {
    name: ':flower_playing_cards:',
    keywords: 'card, flower, game, Japanese, playing',
    group: 'OBJECTS',
  },
  '🔇': {
    name: ':muted_speaker:',
    keywords: 'mute, quiet, silent, speaker',
    group: 'OBJECTS',
  },
  '🔈': {
    name: ':speaker_low_volume:',
    keywords: 'soft',
    group: 'OBJECTS',
  },
  '🔉': {
    name: ':speaker_medium_volume:',
    keywords: 'medium',
    group: 'OBJECTS',
  },
  '🔊': {
    name: ':speaker_high_volume:',
    keywords: 'loud',
    group: 'OBJECTS',
  },
  '📢': {
    name: ':loudspeaker:',
    keywords: 'loud, public address',
    group: 'OBJECTS',
  },
  '📣': {
    name: ':megaphone:',
    keywords: 'cheering',
    group: 'OBJECTS',
  },
  '📯': {
    name: ':postal_horn:',
    keywords: 'horn, post, postal',
    group: 'OBJECTS',
  },
  '🔔': {
    name: ':bell:',
    keywords: 'bell',
    group: 'OBJECTS',
  },
  '🔕': {
    name: ':bell_with_slash:',
    keywords: 'bell, forbidden, mute, no, not, prohibited, quiet, silent',
    group: 'OBJECTS',
  },
  '🎼': {
    name: ':musical_score:',
    keywords: 'music, score',
    group: 'OBJECTS',
  },
  '🎵': {
    name: ':musical_note:',
    keywords: 'music, note',
    group: 'OBJECTS',
  },
  '🎶': {
    name: ':musical_notes:',
    keywords: 'music, note, notes',
    group: 'OBJECTS',
  },
  '🎙': {
    name: ':studio_microphone:',
    keywords: 'mic, microphone, music, studio',
  },
  '🎚': {
    name: ':level_slider:',
    keywords: 'level, music, slider',
  },
  '🎛': {
    name: ':control_knobs:',
    keywords: 'control, knobs, music',
  },
  '🎤': {
    name: ':microphone:',
    keywords: 'karaoke, mic',
    group: 'OBJECTS',
  },
  '🎧': {
    name: ':headphone:',
    keywords: 'earbud',
    group: 'OBJECTS',
  },
  '📻': {
    name: ':radio:',
    keywords: 'video',
    group: 'OBJECTS',
  },
  '🎷': {
    name: ':saxophone:',
    keywords: 'instrument, music, sax',
    group: 'OBJECTS',
  },
  '🎸': {
    name: ':guitar:',
    keywords: 'instrument, music',
    group: 'OBJECTS',
  },
  '🎹': {
    name: ':musical_keyboard:',
    keywords: 'instrument, keyboard, music, piano',
    group: 'OBJECTS',
  },
  '🎺': {
    name: ':trumpet:',
    keywords: 'instrument, music',
    group: 'OBJECTS',
  },
  '🎻': {
    name: ':violin:',
    keywords: 'instrument, music',
    group: 'OBJECTS',
  },
  '🥁': {
    name: ':drum:',
    keywords: 'drum, drumsticks, music',
  },
  '📱': {
    name: ':mobile_phone:',
    keywords: 'cell, mobile, phone, telephone',
    group: 'OBJECTS',
  },
  '📲': {
    name: ':mobile_phone_with_arrow:',
    keywords: 'arrow, call, cell, mobile, phone, receive, telephone',
    group: 'OBJECTS',
  },
  '☎': {
    name: ':telephone:',
    keywords: 'phone',
    group: 'OBJECTS',
  },
  '📞': {
    name: ':telephone_receiver:',
    keywords: 'phone, receiver, telephone',
    group: 'OBJECTS',
  },
  '📟': {
    name: ':pager:',
    keywords: 'pager',
    group: 'OBJECTS',
  },
  '📠': {
    name: ':fax_machine:',
    keywords: 'fax',
    group: 'OBJECTS',
  },
  '🔋': {
    name: ':battery:',
    keywords: 'battery',
    group: 'OBJECTS',
  },
  '🔌': {
    name: ':electric_plug:',
    keywords: 'electric, electricity, plug',
    group: 'OBJECTS',
  },
  '💻': {
    name: ':laptop_computer:',
    keywords: 'computer, pc, personal',
    group: 'OBJECTS',
  },
  '🖥': {
    name: ':desktop_computer:',
    keywords: 'computer, desktop',
  },
  '🖨': {
    name: ':printer:',
    keywords: 'computer',
  },
  '⌨': {
    name: ':keyboard:',
    keywords: 'computer',
  },
  '🖱': {
    name: ':computer_mouse:',
    keywords: 'computer',
  },
  '🖲': {
    name: ':trackball:',
    keywords: 'computer',
  },
  '💽': {
    name: ':computer_disk:',
    keywords: 'computer, disk, minidisk, optical',
    group: 'OBJECTS',
  },
  '💾': {
    name: ':floppy_disk:',
    keywords: 'computer, disk, floppy',
    group: 'OBJECTS',
  },
  '💿': {
    name: ':optical_disk:',
    keywords: 'cd, computer, disk, optical',
    group: 'OBJECTS',
  },
  '📀': {
    name: ':dvd:',
    keywords: 'blu-ray, computer, disk, dvd, optical',
    group: 'OBJECTS',
  },
  '🎥': {
    name: ':movie_camera:',
    keywords: 'camera, cinema, movie',
    group: 'OBJECTS',
  },
  '🎞': {
    name: ':film_frames:',
    keywords: 'cinema, film, frames, movie',
  },
  '📽': {
    name: ':film_projector:',
    keywords: 'cinema, film, movie, projector, video',
  },
  '🎬': {
    name: ':clapper_board:',
    keywords: 'clapper, movie',
    group: 'OBJECTS',
  },
  '📺': {
    name: ':television:',
    keywords: 'tv, video',
    group: 'OBJECTS',
  },
  '📷': {
    name: ':camera:',
    keywords: 'video',
    group: 'OBJECTS',
  },
  '📸': {
    name: ':camera_with_flash:',
    keywords: 'camera, flash, video',
  },
  '📹': {
    name: ':video_camera:',
    keywords: 'camera, video',
    group: 'OBJECTS',
  },
  '📼': {
    name: ':videocassette:',
    keywords: 'tape, vhs, video',
    group: 'OBJECTS',
  },
  '🔍': {
    name: ':left_pointing_magnifying_glass:',
    keywords: 'glass, magnifying, search, tool',
    group: 'OBJECTS',
  },
  '🔎': {
    name: ':right_pointing_magnifying_glass:',
    keywords: 'glass, magnifying, search, tool',
    group: 'OBJECTS',
  },
  '🔬': {
    name: ':microscope:',
    keywords: 'science, tool',
    group: 'OBJECTS',
  },
  '🔭': {
    name: ':telescope:',
    keywords: 'science, tool',
    group: 'OBJECTS',
  },
  '📡': {
    name: ':satellite_antenna:',
    keywords: 'antenna, dish, satellite',
    group: 'OBJECTS',
  },
  '🕯': {
    name: ':candle:',
    keywords: 'light',
  },
  '💡': {
    name: ':light_bulb:',
    keywords: 'bulb, comic, electric, idea, light',
    group: 'OBJECTS',
  },
  '🔦': {
    name: ':flashlight:',
    keywords: 'electric, light, tool, torch',
    group: 'OBJECTS',
  },
  '🏮': {
    name: ':red_paper_lantern:',
    keywords: 'bar, Japanese, lantern, light, red',
    group: 'PLACES',
  },
  '📔': {
    name: ':notebook_with_decorative_cover:',
    keywords: 'book, cover, decorated, notebook',
    group: 'OBJECTS',
  },
  '📕': {
    name: ':closed_book:',
    keywords: 'book, closed',
    group: 'OBJECTS',
  },
  '📖': {
    name: ':open_book:',
    keywords: 'book, open',
    group: 'OBJECTS',
  },
  '📗': {
    name: ':green_book:',
    keywords: 'book, green',
    group: 'OBJECTS',
  },
  '📘': {
    name: ':blue_book:',
    keywords: 'blue, book',
    group: 'OBJECTS',
  },
  '📙': {
    name: ':orange_book:',
    keywords: 'book, orange',
    group: 'OBJECTS',
  },
  '📚': {
    name: ':books:',
    keywords: 'book',
    group: 'OBJECTS',
  },
  '📓': {
    name: ':notebook:',
    keywords: 'notebook',
    group: 'OBJECTS',
  },
  '📒': {
    name: ':ledger:',
    keywords: 'notebook',
    group: 'OBJECTS',
  },
  '📃': {
    name: ':page_with_curl:',
    keywords: 'curl, document, page',
    group: 'OBJECTS',
  },
  '📜': {
    name: ':scroll:',
    keywords: 'paper',
    group: 'OBJECTS',
  },
  '📄': {
    name: ':page_facing_up:',
    keywords: 'document, page',
    group: 'OBJECTS',
  },
  '📰': {
    name: ':newspaper:',
    keywords: 'news, paper',
    group: 'OBJECTS',
  },
  '🗞': {
    name: ':rolled_up_newspaper:',
    keywords: 'news, newspaper, paper, rolled',
  },
  '📑': {
    name: ':bookmark_tabs:',
    keywords: 'bookmark, mark, marker, tabs',
    group: 'OBJECTS',
  },
  '🔖': {
    name: ':bookmark:',
    keywords: 'mark',
    group: 'OBJECTS',
  },
  '🏷': {
    name: ':label:',
    keywords: 'label',
  },
  '💰': {
    name: ':money_bag:',
    keywords: 'bag, dollar, money, moneybag',
    group: 'OBJECTS',
  },
  '💴': {
    name: ':yen_banknote:',
    keywords: 'bank, banknote, bill, currency, money, note, yen',
    group: 'OBJECTS',
  },
  '💵': {
    name: ':dollar_banknote:',
    keywords: 'bank, banknote, bill, currency, dollar, money, note',
    group: 'OBJECTS',
  },
  '💶': {
    name: ':euro_banknote:',
    keywords: 'bank, banknote, bill, currency, euro, money, note',
    group: 'OBJECTS',
  },
  '💷': {
    name: ':pound_banknote:',
    keywords: 'bank, banknote, bill, currency, money, note, pound',
    group: 'OBJECTS',
  },
  '💸': {
    name: ':money_with_wings:',
    keywords: 'bank, banknote, bill, dollar, fly, money, note, wings',
    group: 'OBJECTS',
  },
  '💳': {
    name: ':credit_card:',
    keywords: 'bank, card, credit, money',
    group: 'OBJECTS',
  },
  '💹': {
    name: ':chart_increasing_with_yen:',
    keywords: 'bank, chart, currency, graph, growth, market, money, rise, trend, upward, yen',
    group: 'SYMBOLS',
  },
  '💱': {
    name: ':currency_exchange:',
    keywords: 'bank, currency, exchange, money',
    group: 'SYMBOLS',
  },
  '💲': {
    name: ':heavy_dollar_sign:',
    keywords: 'currency, dollar, money',
    group: 'SYMBOLS',
  },
  '✉': {
    name: ':envelope:',
    keywords: 'email, letter',
    group: 'OBJECTS',
  },
  '📧': {
    name: ':e_mail:',
    keywords: 'email, letter, mail',
    group: 'OBJECTS',
  },
  '📨': {
    name: ':incoming_envelope:',
    keywords: 'e-mail, email, envelope, incoming, letter, mail, receive',
    group: 'OBJECTS',
  },
  '📩': {
    name: ':envelope_with_arrow:',
    keywords: 'arrow, down, e-mail, email, envelope, letter, mail, outgoing, sent',
    group: 'OBJECTS',
  },
  '📤': {
    name: ':outbox_tray:',
    keywords: 'box, letter, mail, outbox, sent, tray',
    group: 'OBJECTS',
  },
  '📥': {
    name: ':inbox_tray:',
    keywords: 'box, inbox, letter, mail, receive, tray',
    group: 'OBJECTS',
  },
  '📦': {
    name: ':package:',
    keywords: 'box, parcel',
    group: 'OBJECTS',
  },
  '📫': {
    name: ':closed_mailbox_with_raised_flag:',
    keywords: 'closed, mail, mailbox, postbox',
    group: 'OBJECTS',
  },
  '📪': {
    name: ':closed_mailbox_with_lowered_flag:',
    keywords: 'closed, lowered, mail, mailbox, postbox',
    group: 'OBJECTS',
  },
  '📬': {
    name: ':open_mailbox_with_raised_flag:',
    keywords: 'mail, mailbox, open, postbox',
    group: 'OBJECTS',
  },
  '📭': {
    name: ':open_mailbox_with_lowered_flag:',
    keywords: 'lowered, mail, mailbox, open, postbox',
    group: 'OBJECTS',
  },
  '📮': {
    name: ':postbox:',
    keywords: 'mail, mailbox',
    group: 'OBJECTS',
  },
  '🗳': {
    name: ':ballot_box_with_ballot:',
    keywords: 'ballot, box',
  },
  '✏': {
    name: ':pencil:',
    keywords: 'pencil',
    group: 'OBJECTS',
  },
  '✒': {
    name: ':black_nib:',
    keywords: 'nib, pen',
    group: 'OBJECTS',
  },
  '🖋': {
    name: ':fountain_pen:',
    keywords: 'fountain, pen',
  },
  '🖊': {
    name: ':pen:',
    keywords: 'ballpoint',
  },
  '🖌': {
    name: ':paintbrush:',
    keywords: 'painting',
  },
  '🖍': {
    name: ':crayon:',
    keywords: 'crayon',
  },
  '📝': {
    name: ':memo:',
    keywords: 'pencil',
    group: 'OBJECTS',
  },
  '💼': {
    name: ':briefcase:',
    keywords: 'briefcase',
    group: 'PEOPLE',
  },
  '📁': {
    name: ':file_folder:',
    keywords: 'file, folder',
    group: 'OBJECTS',
  },
  '📂': {
    name: ':open_file_folder:',
    keywords: 'file, folder, open',
    group: 'OBJECTS',
  },
  '🗂': {
    name: ':card_index_dividers:',
    keywords: 'card, dividers, index',
  },
  '📅': {
    name: ':calendar:',
    keywords: 'date',
    group: 'OBJECTS',
  },
  '📆': {
    name: ':tear_off_calendar:',
    keywords: 'calendar',
    group: 'OBJECTS',
  },
  '🗒': {
    name: ':spiral_notepad:',
    keywords: 'note, pad, spiral',
  },
  '🗓': {
    name: ':spiral_calendar:',
    keywords: 'calendar, pad, spiral',
  },
  '📇': {
    name: ':card_index:',
    keywords: 'card, index, rolodex',
    group: 'OBJECTS',
  },
  '📈': {
    name: ':chart_increasing:',
    keywords: 'chart, graph, growth, trend, upward',
    group: 'OBJECTS',
  },
  '📉': {
    name: ':chart_decreasing:',
    keywords: 'chart, down, graph, trend',
    group: 'OBJECTS',
  },
  '📊': {
    name: ':bar_chart:',
    keywords: 'bar, chart, graph',
    group: 'OBJECTS',
  },
  '📋': {
    name: ':clipboard:',
    keywords: 'clipboard',
    group: 'OBJECTS',
  },
  '📌': {
    name: ':pushpin:',
    keywords: 'pin',
    group: 'OBJECTS',
  },
  '📍': {
    name: ':round_pushpin:',
    keywords: 'pin, pushpin',
    group: 'PLACES',
  },
  '📎': {
    name: ':paperclip:',
    keywords: 'paperclip',
    group: 'OBJECTS',
  },
  '🖇': {
    name: ':linked_paperclips:',
    keywords: 'link, paperclip',
  },
  '📏': {
    name: ':straight_ruler:',
    keywords: 'ruler, straight edge',
    group: 'OBJECTS',
  },
  '📐': {
    name: ':triangular_ruler:',
    keywords: 'ruler, set, triangle',
    group: 'OBJECTS',
  },
  '✂': {
    name: ':scissors:',
    keywords: 'cutting, tool',
    group: 'OBJECTS',
  },
  '🗃': {
    name: ':card_file_box:',
    keywords: 'box, card, file',
  },
  '🗄': {
    name: ':file_cabinet:',
    keywords: 'cabinet, file, filing',
  },
  '🗑': {
    name: ':wastebasket:',
    keywords: 'wastebasket',
  },
  '🔒': {
    name: ':locked:',
    keywords: 'closed',
    group: 'OBJECTS',
  },
  '🔓': {
    name: ':unlocked:',
    keywords: 'lock, open, unlock',
    group: 'OBJECTS',
  },
  '🔏': {
    name: ':locked_with_pen:',
    keywords: 'ink, lock, nib, pen, privacy',
    group: 'OBJECTS',
  },
  '🔐': {
    name: ':locked_with_key:',
    keywords: 'closed, key, lock, secure',
    group: 'OBJECTS',
  },
  '🔑': {
    name: ':key:',
    keywords: 'lock, password',
    group: 'OBJECTS',
  },
  '🗝': {
    name: ':old_key:',
    keywords: 'clue, key, lock, old',
  },
  '🔨': {
    name: ':hammer:',
    keywords: 'tool',
    group: 'OBJECTS',
  },
  '⛏': {
    name: ':pick:',
    keywords: 'mining, tool',
  },
  '⚒': {
    name: ':hammer_and_pick:',
    keywords: 'hammer, pick, tool',
  },
  '🛠': {
    name: ':hammer_and_wrench:',
    keywords: 'hammer, spanner, tool, wrench',
  },
  '🗡': {
    name: ':dagger:',
    keywords: 'knife, weapon',
  },
  '⚔': {
    name: ':crossed_swords:',
    keywords: 'crossed, swords, weapon',
  },
  '🔫': {
    name: ':pistol:',
    keywords: 'gun, handgun, revolver, tool, weapon',
    group: 'OBJECTS',
  },
  '🏹': {
    name: ':bow_and_arrow:',
    keywords: 'archer, archery, arrow, bow, Sagittarius, tool, weapon, zodiac',
  },
  '🛡': {
    name: ':shield:',
    keywords: 'weapon',
  },
  '🔧': {
    name: ':wrench:',
    keywords: 'spanner, tool, wrench',
    group: 'OBJECTS',
  },
  '🔩': {
    name: ':nut_and_bolt:',
    keywords: 'bolt, nut, tool',
    group: 'OBJECTS',
  },
  '⚙': {
    name: ':gear:',
    keywords: 'tool',
  },
  '🗜': {
    name: ':clamp:',
    keywords: 'compress, tool, vice',
  },
  '⚗': {
    name: ':alembic:',
    keywords: 'chemistry, tool',
  },
  '⚖': {
    name: ':balance_scale:',
    keywords: 'balance, justice, Libra, scales, tool, weight, zodiac',
  },
  '🔗': {
    name: ':link:',
    keywords: 'link',
    group: 'SYMBOLS',
  },
  '⛓': {
    name: ':chains:',
    keywords: 'chain',
  },
  '💉': {
    name: ':syringe:',
    keywords: 'doctor, medicine, needle, shot, sick, tool',
    group: 'OBJECTS',
  },
  '💊': {
    name: ':pill:',
    keywords: 'doctor, medicine, sick',
    group: 'OBJECTS',
  },
  '🚬': {
    name: ':cigarette:',
    keywords: 'smoking',
    group: 'OBJECTS',
  },
  '⚰': {
    name: ':coffin:',
    keywords: 'death',
  },
  '⚱': {
    name: ':funeral_urn:',
    keywords: 'ashes, death, funeral, urn',
  },
  '🗿': {
    name: ':moai:',
    keywords: 'face, moyai, statue',
    group: 'PLACES',
  },
  '🛢': {
    name: ':oil_drum:',
    keywords: 'drum, oil',
  },
  '🔮': {
    name: ':crystal_ball:',
    keywords: 'ball, crystal, fairy tale, fantasy, fortune, tool',
    group: 'OBJECTS',
  },
  '🛒': {
    name: ':shopping_cart:',
    keywords: 'cart, shopping, trolley',
  },
  '🏧': {
    name: ':atm_sign:',
    keywords: 'atm, automated, bank, teller',
    group: 'SYMBOLS',
  },
  '🚮': {
    name: ':litter_in_bin_sign:',
    keywords: 'litter, litter bin',
    group: 'SYMBOLS',
  },
  '🚰': {
    name: ':potable_water:',
    keywords: 'drinking, potable, water',
    group: 'SYMBOLS',
  },
  '♿': {
    name: ':wheelchair_symbol:',
    keywords: 'access',
    group: 'SYMBOLS',
  },
  '🚹': {
    name: ':mens_room:',
    keywords: 'lavatory, man, restroom, wc',
    group: 'SYMBOLS',
  },
  '🚺': {
    name: ':womens_room:',
    keywords: 'lavatory, restroom, wc, woman',
    group: 'SYMBOLS',
  },
  '🚻': {
    name: ':restroom:',
    keywords: 'lavatory, restroom, WC',
    group: 'SYMBOLS',
  },
  '🚼': {
    name: ':baby_symbol:',
    keywords: 'baby, changing',
    group: 'SYMBOLS',
  },
  '🚾': {
    name: ':water_closet:',
    keywords: 'closet, lavatory, restroom, water, wc',
    group: 'SYMBOLS',
  },
  '🛂': {
    name: ':passport_control:',
    keywords: 'control, passport',
    group: 'SYMBOLS',
  },
  '🛃': {
    name: ':customs:',
    keywords: 'customs',
    group: 'SYMBOLS',
  },
  '🛄': {
    name: ':baggage_claim:',
    keywords: 'baggage, claim',
    group: 'SYMBOLS',
  },
  '🛅': {
    name: ':left_luggage:',
    keywords: 'baggage, locker, luggage',
    group: 'SYMBOLS',
  },
  '⚠': {
    name: ':warning:',
    keywords: 'warning',
    group: 'PLACES',
  },
  '🚸': {
    name: ':children_crossing:',
    keywords: 'child, crossing, pedestrian, traffic',
    group: 'SYMBOLS',
  },
  '⛔': {
    name: ':no_entry:',
    keywords: 'entry, forbidden, no, not, prohibited, traffic',
    group: 'SYMBOLS',
  },
  '🚫': {
    name: ':prohibited:',
    keywords: 'entry, forbidden, no, not',
    group: 'SYMBOLS',
  },
  '🚳': {
    name: ':no_bicycles:',
    keywords: 'bicycle, bike, forbidden, no, not, prohibited',
    group: 'SYMBOLS',
  },
  '🚭': {
    name: ':no_smoking:',
    keywords: 'forbidden, no, not, prohibited, smoking',
    group: 'SYMBOLS',
  },
  '🚯': {
    name: ':no_littering:',
    keywords: 'forbidden, litter, no, not, prohibited',
    group: 'SYMBOLS',
  },
  '🚱': {
    name: ':non_potable_water:',
    keywords: 'non-drinking, non-potable, water',
    group: 'SYMBOLS',
  },
  '🚷': {
    name: ':no_pedestrians:',
    keywords: 'forbidden, no, not, pedestrian, prohibited',
    group: 'SYMBOLS',
  },
  '📵': {
    name: ':no_mobile_phones:',
    keywords: 'cell, forbidden, mobile, no, not, phone, prohibited, telephone',
    group: 'SYMBOLS',
  },
  '🔞': {
    name: ':no_one_under_eighteen:',
    keywords: '18, age restriction, eighteen, forbidden, no, not, prohibited, underage',
    group: 'SYMBOLS',
  },
  '☢': {
    name: ':radioactive:',
    keywords: 'radioactive, sign',
  },
  '☣': {
    name: ':biohazard:',
    keywords: 'biohazard, sign',
  },
  '⬆': {
    name: ':up_arrow:',
    keywords: 'arrow, cardinal, direction, north',
    group: 'SYMBOLS',
  },
  '↗': {
    name: ':up_right_arrow:',
    keywords: 'arrow, direction, intercardinal, northeast',
    group: 'SYMBOLS',
  },
  '➡': {
    name: ':right_arrow:',
    keywords: 'arrow, cardinal, direction, east',
    group: 'SYMBOLS',
  },
  '↘': {
    name: ':down_right_arrow:',
    keywords: 'arrow, direction, intercardinal, southeast',
    group: 'SYMBOLS',
  },
  '⬇': {
    name: ':down_arrow:',
    keywords: 'arrow, cardinal, direction, down, south',
    group: 'SYMBOLS',
  },
  '↙': {
    name: ':down_left_arrow:',
    keywords: 'arrow, direction, intercardinal, southwest',
    group: 'SYMBOLS',
  },
  '⬅': {
    name: ':left_arrow:',
    keywords: 'arrow, cardinal, direction, west',
    group: 'SYMBOLS',
  },
  '↖': {
    name: ':up_left_arrow:',
    keywords: 'arrow, direction, intercardinal, northwest',
    group: 'SYMBOLS',
  },
  '↕': {
    name: ':up_down_arrow:',
    keywords: 'arrow',
    group: 'SYMBOLS',
  },
  '↔': {
    name: ':left_right_arrow:',
    keywords: 'arrow',
    group: 'SYMBOLS',
  },
  '↩': {
    name: ':right_arrow_curving_left:',
    keywords: 'arrow',
    group: 'SYMBOLS',
  },
  '↪': {
    name: ':left_arrow_curving_right:',
    keywords: 'arrow',
    group: 'SYMBOLS',
  },
  '⤴': {
    name: ':right_arrow_curving_up:',
    keywords: 'arrow',
    group: 'SYMBOLS',
  },
  '⤵': {
    name: ':right_arrow_curving_down:',
    keywords: 'arrow, down',
    group: 'SYMBOLS',
  },
  '🔃': {
    name: ':clockwise_vertical_arrows:',
    keywords: 'arrow, clockwise, reload',
    group: 'SYMBOLS',
  },
  '🔄': {
    name: ':anticlockwise_arrows_button:',
    keywords: 'anticlockwise, arrow, counterclockwise, withershins',
    group: 'SYMBOLS',
  },
  '🔙': {
    name: ':back_arrow:',
    keywords: 'arrow, back',
    group: 'SYMBOLS',
  },
  '🔚': {
    name: ':end_arrow:',
    keywords: 'arrow, end',
    group: 'SYMBOLS',
  },
  '🔛': {
    name: ':on!_arrow:',
    keywords: 'arrow, mark, on',
    group: 'SYMBOLS',
  },
  '🔜': {
    name: ':soon_arrow:',
    keywords: 'arrow, soon',
    group: 'SYMBOLS',
  },
  '🔝': {
    name: ':top_arrow:',
    keywords: 'arrow, top, up',
    group: 'SYMBOLS',
  },
  '🛐': {
    name: ':place_of_worship:',
    keywords: 'religion, worship',
  },
  '⚛': {
    name: ':atom_symbol:',
    keywords: 'atheist, atom',
  },
  '🕉': {
    name: ':om:',
    keywords: 'Hindu, religion',
  },
  '✡': {
    name: ':star_of_david:',
    keywords: 'David, Jew, Jewish, religion, star',
  },
  '☸': {
    name: ':wheel_of_dharma:',
    keywords: 'Buddhist, dharma, religion, wheel',
  },
  '☯': {
    name: ':yin_yang:',
    keywords: 'religion, tao, taoist, yang, yin',
  },
  '✝': {
    name: ':latin_cross:',
    keywords: 'Christian, cross, religion',
  },
  '☦': {
    name: ':orthodox_cross:',
    keywords: 'Christian, cross, religion',
  },
  '☪': {
    name: ':star_and_crescent:',
    keywords: 'islam, Muslim, religion',
  },
  '☮': {
    name: ':peace_symbol:',
    keywords: 'peace',
  },
  '🕎': {
    name: ':menorah:',
    keywords: 'candelabrum, candlestick, religion',
  },
  '🔯': {
    name: ':dotted_six_pointed_star:',
    keywords: 'fortune, star',
    group: 'SYMBOLS',
  },
  '♈': {
    name: ':aries:',
    keywords: 'ram, zodiac',
    group: 'SYMBOLS',
  },
  '♉': {
    name: ':taurus:',
    keywords: 'bull, ox, zodiac',
    group: 'SYMBOLS',
  },
  '♊': {
    name: ':gemini:',
    keywords: 'twins, zodiac',
    group: 'SYMBOLS',
  },
  '♋': {
    name: ':cancer:',
    keywords: 'crab, zodiac',
    group: 'SYMBOLS',
  },
  '♌': {
    name: ':leo:',
    keywords: 'lion, zodiac',
    group: 'SYMBOLS',
  },
  '♍': {
    name: ':virgo:',
    keywords: 'zodiac',
    group: 'SYMBOLS',
  },
  '♎': {
    name: ':libra:',
    keywords: 'balance, justice, scales, zodiac',
    group: 'SYMBOLS',
  },
  '♏': {
    name: ':scorpius:',
    keywords: 'scorpio, scorpion, zodiac',
    group: 'SYMBOLS',
  },
  '♐': {
    name: ':sagittarius:',
    keywords: 'archer, zodiac',
    group: 'SYMBOLS',
  },
  '♑': {
    name: ':capricorn:',
    keywords: 'goat, zodiac',
    group: 'SYMBOLS',
  },
  '♒': {
    name: ':aquarius:',
    keywords: 'bearer, water, zodiac',
    group: 'SYMBOLS',
  },
  '♓': {
    name: ':pisces:',
    keywords: 'fish, zodiac',
    group: 'SYMBOLS',
  },
  '⛎': {
    name: ':ophiuchus:',
    keywords: 'bearer, serpent, snake, zodiac',
    group: 'SYMBOLS',
  },
  '🔀': {
    name: ':shuffle_tracks_button:',
    keywords: 'arrow, crossed',
    group: 'SYMBOLS',
  },
  '🔁': {
    name: ':repeat_button:',
    keywords: 'arrow, clockwise, repeat',
    group: 'SYMBOLS',
  },
  '🔂': {
    name: ':repeat_single_button:',
    keywords: 'arrow, clockwise, once',
    group: 'SYMBOLS',
  },
  '▶': {
    name: ':play_button:',
    keywords: 'arrow, play, right, triangle',
    group: 'SYMBOLS',
  },
  '⏩': {
    name: ':fast_forward_button:',
    keywords: 'arrow, double, fast, forward',
    group: 'SYMBOLS',
  },
  '⏭': {
    name: ':next_track_button:',
    keywords: 'arrow, next scene, next track, triangle',
  },
  '⏯': {
    name: ':play_or_pause_button:',
    keywords: 'arrow, pause, play, right, triangle',
  },
  '◀': {
    name: ':reverse_button:',
    keywords: 'arrow, left, reverse, triangle',
    group: 'SYMBOLS',
  },
  '⏪': {
    name: ':fast_reverse_button:',
    keywords: 'arrow, double, rewind',
    group: 'SYMBOLS',
  },
  '⏮': {
    name: ':last_track_button:',
    keywords: 'arrow, previous scene, previous track, triangle',
  },
  '🔼': {
    name: ':up_button:',
    keywords: 'arrow, button, red',
    group: 'SYMBOLS',
  },
  '⏫': {
    name: ':fast_up_button:',
    keywords: 'arrow, double',
    group: 'SYMBOLS',
  },
  '🔽': {
    name: ':down_button:',
    keywords: 'arrow, button, down, red',
    group: 'SYMBOLS',
  },
  '⏬': {
    name: ':fast_down_button:',
    keywords: 'arrow, double, down',
    group: 'SYMBOLS',
  },
  '⏸': {
    name: ':pause_button:',
    keywords: 'bar, double, pause, vertical',
  },
  '⏹': {
    name: ':stop_button:',
    keywords: 'square, stop',
  },
  '⏺': {
    name: ':record_button:',
    keywords: 'circle, record',
  },
  '⏏': {
    name: ':eject_button:',
    keywords: 'eject',
  },
  '🎦': {
    name: ':cinema:',
    keywords: 'camera, film, movie',
    group: 'SYMBOLS',
  },
  '🔅': {
    name: ':dim_button:',
    keywords: 'brightness, dim, low',
    group: 'OBJECTS',
  },
  '🔆': {
    name: ':bright_button:',
    keywords: 'bright, brightness',
    group: 'OBJECTS',
  },
  '📶': {
    name: ':antenna_bars:',
    keywords: 'antenna, bar, cell, mobile, phone, signal, telephone',
    group: 'SYMBOLS',
  },
  '📳': {
    name: ':vibration_mode:',
    keywords: 'cell, mobile, mode, phone, telephone, vibration',
    group: 'SYMBOLS',
  },
  '📴': {
    name: ':mobile_phone_off:',
    keywords: 'cell, mobile, off, phone, telephone',
    group: 'SYMBOLS',
  },
  '♻': {
    name: ':recycling_symbol:',
    keywords: 'recycle',
    group: 'SYMBOLS',
  },
  '📛': {
    name: ':name_badge:',
    keywords: 'badge, name',
    group: 'OBJECTS',
  },
  '⚜': {
    name: ':fleur_de_lis:',
    keywords: 'fleur-de-lis',
  },
  '🔰': {
    name: ':japanese_symbol_for_beginner:',
    keywords: 'beginner, chevron, green, Japanese, leaf, tool, yellow',
    group: 'PLACES',
  },
  '🔱': {
    name: ':trident_emblem:',
    keywords: 'anchor, emblem, ship, tool, trident',
    group: 'SYMBOLS',
  },
  '⭕': {
    name: ':heavy_large_circle:',
    keywords: 'circle, o',
    group: 'SYMBOLS',
  },
  '✅': {
    name: ':white_heavy_check_mark:',
    keywords: 'check, mark',
    group: 'SYMBOLS',
  },
  '☑': {
    name: ':ballot_box_with_check:',
    keywords: 'ballot, box, check',
    group: 'SYMBOLS',
  },
  '✔': {
    name: ':heavy_check_mark:',
    keywords: 'check, mark',
    group: 'SYMBOLS',
  },
  '✖': {
    name: ':heavy_multiplication_x:',
    keywords: 'cancel, multiplication, multiply, x',
    group: 'SYMBOLS',
  },
  '❌': {
    name: ':cross_mark:',
    keywords: 'cancel, mark, multiplication, multiply, x',
    group: 'SYMBOLS',
  },
  '❎': {
    name: ':cross_mark_button:',
    keywords: 'mark, square',
    group: 'SYMBOLS',
  },
  '➕': {
    name: ':heavy_plus_sign:',
    keywords: 'math, plus',
    group: 'SYMBOLS',
  },
  '♀': {
    name: ':female_sign:',
    keywords: 'woman',
  },
  '♂': {
    name: ':male_sign:',
    keywords: 'man',
  },
  '⚕': {
    name: ':medical_symbol:',
    keywords: 'aesculapius, medicine, staff',
  },
  '➖': {
    name: ':heavy_minus_sign:',
    keywords: 'math, minus',
    group: 'SYMBOLS',
  },
  '➗': {
    name: ':heavy_division_sign:',
    keywords: 'division, math',
    group: 'SYMBOLS',
  },
  '➰': {
    name: ':curly_loop:',
    keywords: 'curl, loop',
    group: 'SYMBOLS',
  },
  '➿': {
    name: ':double_curly_loop:',
    keywords: 'curl, double, loop',
    group: 'SYMBOLS',
  },
  '〽': {
    name: ':part_alternation_mark:',
    keywords: 'mark, part',
    group: 'SYMBOLS',
  },
  '✳': {
    name: ':eight_spoked_asterisk:',
    keywords: 'asterisk',
    group: 'SYMBOLS',
  },
  '✴': {
    name: ':eight_pointed_star:',
    keywords: 'star',
    group: 'SYMBOLS',
  },
  '❇': {
    name: ':sparkle:',
    keywords: 'sparkle',
    group: 'SYMBOLS',
  },
  '‼': {
    name: ':double_exclamation_mark:',
    keywords: 'bangbang, exclamation, mark, punctuation',
    group: 'SYMBOLS',
  },
  '⁉': {
    name: ':exclamation_question_mark:',
    keywords: 'exclamation, interrobang, mark, punctuation, question',
    group: 'SYMBOLS',
  },
  '❓': {
    name: ':question_mark:',
    keywords: 'mark, punctuation, question',
    group: 'SYMBOLS',
  },
  '❔': {
    name: ':white_question_mark:',
    keywords: 'mark, outlined, punctuation, question',
    group: 'SYMBOLS',
  },
  '❕': {
    name: ':white_exclamation_mark:',
    keywords: 'exclamation, mark, outlined, punctuation',
    group: 'SYMBOLS',
  },
  '❗': {
    name: ':exclamation_mark:',
    keywords: 'exclamation, mark, punctuation',
    group: 'SYMBOLS',
  },
  '〰': {
    name: ':wavy_dash:',
    keywords: 'dash, punctuation, wavy',
    group: 'SYMBOLS',
  },
  '©': {
    name: ':copyright:',
    keywords: 'copyright',
    group: 'SYMBOLS',
  },
  '®': {
    name: ':registered:',
    keywords: 'registered',
    group: 'SYMBOLS',
  },
  '™': {
    name: ':trade_mark:',
    keywords: 'mark, tm, trademark',
    group: 'SYMBOLS',
  },
  '#️⃣': {
    name: ':keycap_#:',
    keywords: 'keycap',
  },
  '*️⃣': {
    name: ':keycap_*:',
    keywords: 'keycap',
  },
  '0️⃣': {
    name: ':keycap_0:',
    keywords: 'keycap',
  },
  '1️⃣': {
    name: ':keycap_1:',
    keywords: 'keycap',
  },
  '2️⃣': {
    name: ':keycap_2:',
    keywords: 'keycap',
  },
  '3️⃣': {
    name: ':keycap_3:',
    keywords: 'keycap',
  },
  '4️⃣': {
    name: ':keycap_4:',
    keywords: 'keycap',
  },
  '5️⃣': {
    name: ':keycap_5:',
    keywords: 'keycap',
  },
  '6️⃣': {
    name: ':keycap_6:',
    keywords: 'keycap',
  },
  '7️⃣': {
    name: ':keycap_7:',
    keywords: 'keycap',
  },
  '8️⃣': {
    name: ':keycap_8:',
    keywords: 'keycap',
  },
  '9️⃣': {
    name: ':keycap_9:',
    keywords: 'keycap',
  },
  '🔟': {
    name: ':keycap_10:',
    keywords: 'keycap 10',
    group: 'SYMBOLS',
  },
  '💯': {
    name: ':hundred_points:',
    keywords: '100, full, hundred, score',
    group: 'SYMBOLS',
  },
  '🔠': {
    name: ':input_latin_uppercase:',
    keywords: 'ABCD, input, latin, letters, uppercase',
    group: 'SYMBOLS',
  },
  '🔡': {
    name: ':input_latin_lowercase:',
    keywords: 'abcd, input, latin, letters, lowercase',
    group: 'SYMBOLS',
  },
  '🔢': {
    name: ':input_numbers:',
    keywords: '1234, input, numbers',
    group: 'SYMBOLS',
  },
  '🔣': {
    name: ':input_symbols:',
    keywords: '〒♪&%, input',
    group: 'SYMBOLS',
  },
  '🔤': {
    name: ':input_latin_letters:',
    keywords: 'abc, alphabet, input, latin, letters',
    group: 'SYMBOLS',
  },
  '🅰': {
    name: ':a_button_blood_type:',
    keywords: 'a, blood type',
    group: 'SYMBOLS',
  },
  '🆎': {
    name: ':ab_button_blood_type:',
    keywords: 'ab, blood type',
    group: 'SYMBOLS',
  },
  '🅱': {
    name: ':b_button_blood_type:',
    keywords: 'b, blood type',
    group: 'SYMBOLS',
  },
  '🆑': {
    name: ':cl_button:',
    keywords: 'cl',
    group: 'SYMBOLS',
  },
  '🆒': {
    name: ':cool_button:',
    keywords: 'cool',
    group: 'SYMBOLS',
  },
  '🆓': {
    name: ':free_button:',
    keywords: 'free',
    group: 'SYMBOLS',
  },
  ℹ: {
    name: ':information:',
    keywords: 'i, information',
    group: 'SYMBOLS',
  },
  '🆔': {
    name: ':id_button:',
    keywords: 'id, identity',
    group: 'SYMBOLS',
  },
  'Ⓜ': {
    name: ':circled_m:',
    keywords: 'circle, m',
    group: 'SYMBOLS',
  },
  '🆕': {
    name: ':new_button:',
    keywords: 'new',
    group: 'SYMBOLS',
  },
  '🆖': {
    name: ':ng_button:',
    keywords: 'ng',
    group: 'SYMBOLS',
  },
  '🅾': {
    name: ':o_button_blood_type:',
    keywords: 'blood type, o',
    group: 'SYMBOLS',
  },
  '🆗': {
    name: ':ok_button:',
    keywords: 'OK',
    group: 'SYMBOLS',
  },
  '🅿': {
    name: ':p_button:',
    keywords: 'parking',
    group: 'SYMBOLS',
  },
  '🆘': {
    name: ':sos_button:',
    keywords: 'help, sos',
    group: 'SYMBOLS',
  },
  '🆙': {
    name: ':up!_button:',
    keywords: 'mark, up',
    group: 'SYMBOLS',
  },
  '🆚': {
    name: ':vs_button:',
    keywords: 'versus, vs',
    group: 'SYMBOLS',
  },
  '🈁': {
    name: ':japanese_here_button:',
    keywords: '“here”, Japanese, katakana, ココ',
    group: 'SYMBOLS',
  },
  '🈂': {
    name: ':japanese_service_charge_button:',
    keywords: '“service charge”, Japanese, katakana, サ',
    group: 'SYMBOLS',
  },
  '🈷': {
    name: ':japanese_monthly_amount_button:',
    keywords: '“monthly amount”, ideograph, Japanese, 月',
    group: 'SYMBOLS',
  },
  '🈶': {
    name: ':japanese_not_free_of_charge_button:',
    keywords: '“not free of charge”, ideograph, Japanese, 有',
    group: 'SYMBOLS',
  },
  '🈯': {
    name: ':japanese_reserved_button:',
    keywords: '“reserved”, ideograph, Japanese, 指',
    group: 'SYMBOLS',
  },
  '🉐': {
    name: ':japanese_bargain_button:',
    keywords: '“bargain”, ideograph, Japanese, 得',
    group: 'SYMBOLS',
  },
  '🈹': {
    name: ':japanese_discount_button:',
    keywords: '“discount”, ideograph, Japanese, 割',
    group: 'SYMBOLS',
  },
  '🈚': {
    name: ':japanese_free_of_charge_button:',
    keywords: '“free of charge”, ideograph, Japanese, 無',
    group: 'SYMBOLS',
  },
  '🈲': {
    name: ':japanese_prohibited_button:',
    keywords: '“prohibited”, ideograph, Japanese, 禁',
    group: 'SYMBOLS',
  },
  '🉑': {
    name: ':japanese_acceptable_button:',
    keywords: '“acceptable”, ideograph, Japanese, 可',
    group: 'SYMBOLS',
  },
  '🈸': {
    name: ':japanese_application_button:',
    keywords: '“application”, ideograph, Japanese, 申',
    group: 'SYMBOLS',
  },
  '🈴': {
    name: ':japanese_passing_grade_button:',
    keywords: '“passing grade”, ideograph, Japanese, 合',
    group: 'SYMBOLS',
  },
  '🈳': {
    name: ':japanese_vacancy_button:',
    keywords: '“vacancy”, ideograph, Japanese, 空',
    group: 'SYMBOLS',
  },
  '㊗': {
    name: ':japanese_congratulations_button:',
    keywords: '“congratulations”, ideograph, Japanese, 祝',
    group: 'SYMBOLS',
  },
  '㊙': {
    name: ':japanese_secret_button:',
    keywords: '“secret”, ideograph, Japanese, 秘',
    group: 'SYMBOLS',
  },
  '🈺': {
    name: ':japanese_open_for_business_button:',
    keywords: '“open for business”, ideograph, Japanese, 営',
    group: 'SYMBOLS',
  },
  '🈵': {
    name: ':japanese_no_vacancy_button:',
    keywords: '“no vacancy”, ideograph, Japanese, 満',
    group: 'SYMBOLS',
  },
  '▪': {
    name: ':black_small_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '▫': {
    name: ':white_small_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '◻': {
    name: ':white_medium_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '◼': {
    name: ':black_medium_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '◽': {
    name: ':white_medium_small_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '◾': {
    name: ':black_medium_small_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '⬛': {
    name: ':black_large_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '⬜': {
    name: ':white_large_square:',
    keywords: 'geometric, square',
    group: 'SYMBOLS',
  },
  '🔶': {
    name: ':large_orange_diamond:',
    keywords: 'diamond, geometric, orange',
    group: 'SYMBOLS',
  },
  '🔷': {
    name: ':large_blue_diamond:',
    keywords: 'blue, diamond, geometric',
    group: 'SYMBOLS',
  },
  '🔸': {
    name: ':small_orange_diamond:',
    keywords: 'diamond, geometric, orange',
    group: 'SYMBOLS',
  },
  '🔹': {
    name: ':small_blue_diamond:',
    keywords: 'blue, diamond, geometric',
    group: 'SYMBOLS',
  },
  '🔺': {
    name: ':red_triangle_pointed_up:',
    keywords: 'geometric, red',
    group: 'SYMBOLS',
  },
  '🔻': {
    name: ':red_triangle_pointed_down:',
    keywords: 'down, geometric, red',
    group: 'SYMBOLS',
  },
  '💠': {
    name: ':diamond_with_a_dot:',
    keywords: 'comic, diamond, geometric, inside',
    group: 'SYMBOLS',
  },
  '🔘': {
    name: ':radio_button:',
    keywords: 'button, geometric, radio',
    group: 'SYMBOLS',
  },
  '🔲': {
    name: ':black_square_button:',
    keywords: 'button, geometric, square',
    group: 'SYMBOLS',
  },
  '🔳': {
    name: ':white_square_button:',
    keywords: 'button, geometric, outlined, square',
    group: 'SYMBOLS',
  },
  '⚪': {
    name: ':white_circle:',
    keywords: 'circle, geometric',
    group: 'SYMBOLS',
  },
  '⚫': {
    name: ':black_circle:',
    keywords: 'circle, geometric',
    group: 'SYMBOLS',
  },
  '🔴': {
    name: ':red_circle:',
    keywords: 'circle, geometric, red',
    group: 'SYMBOLS',
  },
  '🔵': {
    name: ':blue_circle:',
    keywords: 'blue, circle, geometric',
    group: 'SYMBOLS',
  },
  '🏁': {
    name: ':chequered_flag:',
    keywords: 'checkered, chequered, racing',
    group: 'OBJECTS',
  },
  '🚩': {
    name: ':triangular_flag:',
    keywords: 'post',
    group: 'PLACES',
  },
  '🎌': {
    name: ':crossed_flags:',
    keywords: 'celebration, cross, crossed, Japanese',
    group: 'OBJECTS',
  },
  '🏴': {
    name: ':black_flag:',
    keywords: 'waving',
  },
  '🏳': {
    name: ':white_flag:',
    keywords: 'waving',
  },
  '🏳️‍🌈': {
    name: ':rainbow_flag:',
    keywords: 'rainbow',
  },
  '🇦🇨': {
    name: ':ascension_island:',
    keywords: 'flag',
  },
  '🇦🇩': {
    name: ':andorra:',
    keywords: 'flag',
  },
  '🇦🇪': {
    name: ':united_arab_emirates:',
    keywords: 'flag',
  },
  '🇦🇫': {
    name: ':afghanistan:',
    keywords: 'flag',
  },
  '🇦🇬': {
    name: ':antigua_barbuda:',
    keywords: 'flag',
  },
  '🇦🇮': {
    name: ':anguilla:',
    keywords: 'flag',
  },
  '🇦🇱': {
    name: ':albania:',
    keywords: 'flag',
  },
  '🇦🇲': {
    name: ':armenia:',
    keywords: 'flag',
  },
  '🇦🇴': {
    name: ':angola:',
    keywords: 'flag',
  },
  '🇦🇶': {
    name: ':antarctica:',
    keywords: 'flag',
  },
  '🇦🇷': {
    name: ':argentina:',
    keywords: 'flag',
  },
  '🇦🇸': {
    name: ':american_samoa:',
    keywords: 'flag',
  },
  '🇦🇹': {
    name: ':austria:',
    keywords: 'flag',
  },
  '🇦🇺': {
    name: ':australia:',
    keywords: 'flag',
  },
  '🇦🇼': {
    name: ':aruba:',
    keywords: 'flag',
  },
  '🇦🇽': {
    name: ':åland_islands:',
    keywords: 'flag',
  },
  '🇦🇿': {
    name: ':azerbaijan:',
    keywords: 'flag',
  },
  '🇧🇦': {
    name: ':bosnia_herzegovina:',
    keywords: 'flag',
  },
  '🇧🇧': {
    name: ':barbados:',
    keywords: 'flag',
  },
  '🇧🇩': {
    name: ':bangladesh:',
    keywords: 'flag',
  },
  '🇧🇪': {
    name: ':belgium:',
    keywords: 'flag',
  },
  '🇧🇫': {
    name: ':burkina_faso:',
    keywords: 'flag',
  },
  '🇧🇬': {
    name: ':bulgaria:',
    keywords: 'flag',
  },
  '🇧🇭': {
    name: ':bahrain:',
    keywords: 'flag',
  },
  '🇧🇮': {
    name: ':burundi:',
    keywords: 'flag',
  },
  '🇧🇯': {
    name: ':benin:',
    keywords: 'flag',
  },
  '🇧🇱': {
    name: ':st_barthélemy:',
    keywords: 'flag',
  },
  '🇧🇲': {
    name: ':bermuda:',
    keywords: 'flag',
  },
  '🇧🇳': {
    name: ':brunei:',
    keywords: 'flag',
  },
  '🇧🇴': {
    name: ':bolivia:',
    keywords: 'flag',
  },
  '🇧🇶': {
    name: ':caribbean_netherlands:',
    keywords: 'flag',
  },
  '🇧🇷': {
    name: ':brazil:',
    keywords: 'flag',
  },
  '🇧🇸': {
    name: ':bahamas:',
    keywords: 'flag',
  },
  '🇧🇹': {
    name: ':bhutan:',
    keywords: 'flag',
  },
  '🇧🇻': {
    name: ':bouvet_island:',
    keywords: 'flag',
  },
  '🇧🇼': {
    name: ':botswana:',
    keywords: 'flag',
  },
  '🇧🇾': {
    name: ':belarus:',
    keywords: 'flag',
  },
  '🇧🇿': {
    name: ':belize:',
    keywords: 'flag',
  },
  '🇨🇦': {
    name: ':canada:',
    keywords: 'flag',
  },
  '🇨🇨': {
    name: ':cocos_keeling_islands:',
    keywords: 'flag',
  },
  '🇨🇩': {
    name: ':congo___kinshasa:',
    keywords: 'flag',
  },
  '🇨🇫': {
    name: ':central_african_republic:',
    keywords: 'flag',
  },
  '🇨🇬': {
    name: ':congo___brazzaville:',
    keywords: 'flag',
  },
  '🇨🇭': {
    name: ':switzerland:',
    keywords: 'flag',
  },
  '🇨🇮': {
    name: ':côte_divoire:',
    keywords: 'flag',
  },
  '🇨🇰': {
    name: ':cook_islands:',
    keywords: 'flag',
  },
  '🇨🇱': {
    name: ':chile:',
    keywords: 'flag',
  },
  '🇨🇲': {
    name: ':cameroon:',
    keywords: 'flag',
  },
  '🇨🇳': {
    name: ':china:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇨🇴': {
    name: ':colombia:',
    keywords: 'flag',
  },
  '🇨🇵': {
    name: ':clipperton_island:',
    keywords: 'flag',
  },
  '🇨🇷': {
    name: ':costa_rica:',
    keywords: 'flag',
  },
  '🇨🇺': {
    name: ':cuba:',
    keywords: 'flag',
  },
  '🇨🇻': {
    name: ':cape_verde:',
    keywords: 'flag',
  },
  '🇨🇼': {
    name: ':curaçao:',
    keywords: 'flag',
  },
  '🇨🇽': {
    name: ':christmas_island:',
    keywords: 'flag',
  },
  '🇨🇾': {
    name: ':cyprus:',
    keywords: 'flag',
  },
  '🇨🇿': {
    name: ':czech_republic:',
    keywords: 'flag',
  },
  '🇩🇪': {
    name: ':germany:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇩🇬': {
    name: ':diego_garcia:',
    keywords: 'flag',
  },
  '🇩🇯': {
    name: ':djibouti:',
    keywords: 'flag',
  },
  '🇩🇰': {
    name: ':denmark:',
    keywords: 'flag',
  },
  '🇩🇲': {
    name: ':dominica:',
    keywords: 'flag',
  },
  '🇩🇴': {
    name: ':dominican_republic:',
    keywords: 'flag',
  },
  '🇩🇿': {
    name: ':algeria:',
    keywords: 'flag',
  },
  '🇪🇦': {
    name: ':ceuta_melilla:',
    keywords: 'flag',
  },
  '🇪🇨': {
    name: ':ecuador:',
    keywords: 'flag',
  },
  '🇪🇪': {
    name: ':estonia:',
    keywords: 'flag',
  },
  '🇪🇬': {
    name: ':egypt:',
    keywords: 'flag',
  },
  '🇪🇭': {
    name: ':western_sahara:',
    keywords: 'flag',
  },
  '🇪🇷': {
    name: ':eritrea:',
    keywords: 'flag',
  },
  '🇪🇸': {
    name: ':spain:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇪🇹': {
    name: ':ethiopia:',
    keywords: 'flag',
  },
  '🇪🇺': {
    name: ':european_union:',
    keywords: 'flag',
  },
  '🇫🇮': {
    name: ':finland:',
    keywords: 'flag',
  },
  '🇫🇯': {
    name: ':fiji:',
    keywords: 'flag',
  },
  '🇫🇰': {
    name: ':falkland_islands:',
    keywords: 'flag',
  },
  '🇫🇲': {
    name: ':micronesia:',
    keywords: 'flag',
  },
  '🇫🇴': {
    name: ':faroe_islands:',
    keywords: 'flag',
  },
  '🇫🇷': {
    name: ':france:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇬🇦': {
    name: ':gabon:',
    keywords: 'flag',
  },
  '🇬🇧': {
    name: ':united_kingdom:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇬🇩': {
    name: ':grenada:',
    keywords: 'flag',
  },
  '🇬🇪': {
    name: ':georgia:',
    keywords: 'flag',
  },
  '🇬🇫': {
    name: ':french_guiana:',
    keywords: 'flag',
  },
  '🇬🇬': {
    name: ':guernsey:',
    keywords: 'flag',
  },
  '🇬🇭': {
    name: ':ghana:',
    keywords: 'flag',
  },
  '🇬🇮': {
    name: ':gibraltar:',
    keywords: 'flag',
  },
  '🇬🇱': {
    name: ':greenland:',
    keywords: 'flag',
  },
  '🇬🇲': {
    name: ':gambia:',
    keywords: 'flag',
  },
  '🇬🇳': {
    name: ':guinea:',
    keywords: 'flag',
  },
  '🇬🇵': {
    name: ':guadeloupe:',
    keywords: 'flag',
  },
  '🇬🇶': {
    name: ':equatorial_guinea:',
    keywords: 'flag',
  },
  '🇬🇷': {
    name: ':greece:',
    keywords: 'flag',
  },
  '🇬🇸': {
    name: ':south_georgia_south_sandwich_islands:',
    keywords: 'flag',
  },
  '🇬🇹': {
    name: ':guatemala:',
    keywords: 'flag',
  },
  '🇬🇺': {
    name: ':guam:',
    keywords: 'flag',
  },
  '🇬🇼': {
    name: ':guinea_bissau:',
    keywords: 'flag',
  },
  '🇬🇾': {
    name: ':guyana:',
    keywords: 'flag',
  },
  '🇭🇰': {
    name: ':hong_kong_sar_china:',
    keywords: 'flag',
  },
  '🇭🇲': {
    name: ':heard_mcdonald_islands:',
    keywords: 'flag',
  },
  '🇭🇳': {
    name: ':honduras:',
    keywords: 'flag',
  },
  '🇭🇷': {
    name: ':croatia:',
    keywords: 'flag',
  },
  '🇭🇹': {
    name: ':haiti:',
    keywords: 'flag',
  },
  '🇭🇺': {
    name: ':hungary:',
    keywords: 'flag',
  },
  '🇮🇨': {
    name: ':canary_islands:',
    keywords: 'flag',
  },
  '🇮🇩': {
    name: ':indonesia:',
    keywords: 'flag',
  },
  '🇮🇪': {
    name: ':ireland:',
    keywords: 'flag',
  },
  '🇮🇱': {
    name: ':israel:',
    keywords: 'flag',
  },
  '🇮🇲': {
    name: ':isle_of_man:',
    keywords: 'flag',
  },
  '🇮🇳': {
    name: ':india:',
    keywords: 'flag',
  },
  '🇮🇴': {
    name: ':british_indian_ocean_territory:',
    keywords: 'flag',
  },
  '🇮🇶': {
    name: ':iraq:',
    keywords: 'flag',
  },
  '🇮🇷': {
    name: ':iran:',
    keywords: 'flag',
  },
  '🇮🇸': {
    name: ':iceland:',
    keywords: 'flag',
  },
  '🇮🇹': {
    name: ':italy:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇯🇪': {
    name: ':jersey:',
    keywords: 'flag',
  },
  '🇯🇲': {
    name: ':jamaica:',
    keywords: 'flag',
  },
  '🇯🇴': {
    name: ':jordan:',
    keywords: 'flag',
  },
  '🇯🇵': {
    name: ':japan:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇰🇪': {
    name: ':kenya:',
    keywords: 'flag',
  },
  '🇰🇬': {
    name: ':kyrgyzstan:',
    keywords: 'flag',
  },
  '🇰🇭': {
    name: ':cambodia:',
    keywords: 'flag',
  },
  '🇰🇮': {
    name: ':kiribati:',
    keywords: 'flag',
  },
  '🇰🇲': {
    name: ':comoros:',
    keywords: 'flag',
  },
  '🇰🇳': {
    name: ':st_kitts_nevis:',
    keywords: 'flag',
  },
  '🇰🇵': {
    name: ':north_korea:',
    keywords: 'flag',
  },
  '🇰🇷': {
    name: ':south_korea:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇰🇼': {
    name: ':kuwait:',
    keywords: 'flag',
  },
  '🇰🇾': {
    name: ':cayman_islands:',
    keywords: 'flag',
  },
  '🇰🇿': {
    name: ':kazakhstan:',
    keywords: 'flag',
  },
  '🇱🇦': {
    name: ':laos:',
    keywords: 'flag',
  },
  '🇱🇧': {
    name: ':lebanon:',
    keywords: 'flag',
  },
  '🇱🇨': {
    name: ':st_lucia:',
    keywords: 'flag',
  },
  '🇱🇮': {
    name: ':liechtenstein:',
    keywords: 'flag',
  },
  '🇱🇰': {
    name: ':sri_lanka:',
    keywords: 'flag',
  },
  '🇱🇷': {
    name: ':liberia:',
    keywords: 'flag',
  },
  '🇱🇸': {
    name: ':lesotho:',
    keywords: 'flag',
  },
  '🇱🇹': {
    name: ':lithuania:',
    keywords: 'flag',
  },
  '🇱🇺': {
    name: ':luxembourg:',
    keywords: 'flag',
  },
  '🇱🇻': {
    name: ':latvia:',
    keywords: 'flag',
  },
  '🇱🇾': {
    name: ':libya:',
    keywords: 'flag',
  },
  '🇲🇦': {
    name: ':morocco:',
    keywords: 'flag',
  },
  '🇲🇨': {
    name: ':monaco:',
    keywords: 'flag',
  },
  '🇲🇩': {
    name: ':moldova:',
    keywords: 'flag',
  },
  '🇲🇪': {
    name: ':montenegro:',
    keywords: 'flag',
  },
  '🇲🇫': {
    name: ':st_martin:',
    keywords: 'flag',
  },
  '🇲🇬': {
    name: ':madagascar:',
    keywords: 'flag',
  },
  '🇲🇭': {
    name: ':marshall_islands:',
    keywords: 'flag',
  },
  '🇲🇰': {
    name: ':macedonia:',
    keywords: 'flag',
  },
  '🇲🇱': {
    name: ':mali:',
    keywords: 'flag',
  },
  '🇲🇲': {
    name: ':myanmar_burma:',
    keywords: 'flag',
  },
  '🇲🇳': {
    name: ':mongolia:',
    keywords: 'flag',
  },
  '🇲🇴': {
    name: ':macau_sar_china:',
    keywords: 'flag',
  },
  '🇲🇵': {
    name: ':northern_mariana_islands:',
    keywords: 'flag',
  },
  '🇲🇶': {
    name: ':martinique:',
    keywords: 'flag',
  },
  '🇲🇷': {
    name: ':mauritania:',
    keywords: 'flag',
  },
  '🇲🇸': {
    name: ':montserrat:',
    keywords: 'flag',
  },
  '🇲🇹': {
    name: ':malta:',
    keywords: 'flag',
  },
  '🇲🇺': {
    name: ':mauritius:',
    keywords: 'flag',
  },
  '🇲🇻': {
    name: ':maldives:',
    keywords: 'flag',
  },
  '🇲🇼': {
    name: ':malawi:',
    keywords: 'flag',
  },
  '🇲🇽': {
    name: ':mexico:',
    keywords: 'flag',
  },
  '🇲🇾': {
    name: ':malaysia:',
    keywords: 'flag',
  },
  '🇲🇿': {
    name: ':mozambique:',
    keywords: 'flag',
  },
  '🇳🇦': {
    name: ':namibia:',
    keywords: 'flag',
  },
  '🇳🇨': {
    name: ':new_caledonia:',
    keywords: 'flag',
  },
  '🇳🇪': {
    name: ':niger:',
    keywords: 'flag',
  },
  '🇳🇫': {
    name: ':norfolk_island:',
    keywords: 'flag',
  },
  '🇳🇬': {
    name: ':nigeria:',
    keywords: 'flag',
  },
  '🇳🇮': {
    name: ':nicaragua:',
    keywords: 'flag',
  },
  '🇳🇱': {
    name: ':netherlands:',
    keywords: 'flag',
  },
  '🇳🇴': {
    name: ':norway:',
    keywords: 'flag',
  },
  '🇳🇵': {
    name: ':nepal:',
    keywords: 'flag',
  },
  '🇳🇷': {
    name: ':nauru:',
    keywords: 'flag',
  },
  '🇳🇺': {
    name: ':niue:',
    keywords: 'flag',
  },
  '🇳🇿': {
    name: ':new_zealand:',
    keywords: 'flag',
  },
  '🇴🇲': {
    name: ':oman:',
    keywords: 'flag',
  },
  '🇵🇦': {
    name: ':panama:',
    keywords: 'flag',
  },
  '🇵🇪': {
    name: ':peru:',
    keywords: 'flag',
  },
  '🇵🇫': {
    name: ':french_polynesia:',
    keywords: 'flag',
  },
  '🇵🇬': {
    name: ':papua_new_guinea:',
    keywords: 'flag',
  },
  '🇵🇭': {
    name: ':philippines:',
    keywords: 'flag',
  },
  '🇵🇰': {
    name: ':pakistan:',
    keywords: 'flag',
  },
  '🇵🇱': {
    name: ':poland:',
    keywords: 'flag',
  },
  '🇵🇲': {
    name: ':st_pierre_miquelon:',
    keywords: 'flag',
  },
  '🇵🇳': {
    name: ':pitcairn_islands:',
    keywords: 'flag',
  },
  '🇵🇷': {
    name: ':puerto_rico:',
    keywords: 'flag',
  },
  '🇵🇸': {
    name: ':palestinian_territories:',
    keywords: 'flag',
  },
  '🇵🇹': {
    name: ':portugal:',
    keywords: 'flag',
  },
  '🇵🇼': {
    name: ':palau:',
    keywords: 'flag',
  },
  '🇵🇾': {
    name: ':paraguay:',
    keywords: 'flag',
  },
  '🇶🇦': {
    name: ':qatar:',
    keywords: 'flag',
  },
  '🇷🇪': {
    name: ':réunion:',
    keywords: 'flag',
  },
  '🇷🇴': {
    name: ':romania:',
    keywords: 'flag',
  },
  '🇷🇸': {
    name: ':serbia:',
    keywords: 'flag',
  },
  '🇷🇺': {
    name: ':russia:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇷🇼': {
    name: ':rwanda:',
    keywords: 'flag',
  },
  '🇸🇦': {
    name: ':saudi_arabia:',
    keywords: 'flag',
  },
  '🇸🇧': {
    name: ':solomon_islands:',
    keywords: 'flag',
  },
  '🇸🇨': {
    name: ':seychelles:',
    keywords: 'flag',
  },
  '🇸🇩': {
    name: ':sudan:',
    keywords: 'flag',
  },
  '🇸🇪': {
    name: ':sweden:',
    keywords: 'flag',
  },
  '🇸🇬': {
    name: ':singapore:',
    keywords: 'flag',
  },
  '🇸🇭': {
    name: ':st_helena:',
    keywords: 'flag',
  },
  '🇸🇮': {
    name: ':slovenia:',
    keywords: 'flag',
  },
  '🇸🇯': {
    name: ':svalbard_jan_mayen:',
    keywords: 'flag',
  },
  '🇸🇰': {
    name: ':slovakia:',
    keywords: 'flag',
  },
  '🇸🇱': {
    name: ':sierra_leone:',
    keywords: 'flag',
  },
  '🇸🇲': {
    name: ':san_marino:',
    keywords: 'flag',
  },
  '🇸🇳': {
    name: ':senegal:',
    keywords: 'flag',
  },
  '🇸🇴': {
    name: ':somalia:',
    keywords: 'flag',
  },
  '🇸🇷': {
    name: ':suriname:',
    keywords: 'flag',
  },
  '🇸🇸': {
    name: ':south_sudan:',
    keywords: 'flag',
  },
  '🇸🇹': {
    name: ':são_tomé_príncipe:',
    keywords: 'flag',
  },
  '🇸🇻': {
    name: ':el_salvador:',
    keywords: 'flag',
  },
  '🇸🇽': {
    name: ':sint_maarten:',
    keywords: 'flag',
  },
  '🇸🇾': {
    name: ':syria:',
    keywords: 'flag',
  },
  '🇸🇿': {
    name: ':swaziland:',
    keywords: 'flag',
  },
  '🇹🇦': {
    name: ':tristan_da_cunha:',
    keywords: 'flag',
  },
  '🇹🇨': {
    name: ':turks_caicos_islands:',
    keywords: 'flag',
  },
  '🇹🇩': {
    name: ':chad:',
    keywords: 'flag',
  },
  '🇹🇫': {
    name: ':french_southern_territories:',
    keywords: 'flag',
  },
  '🇹🇬': {
    name: ':togo:',
    keywords: 'flag',
  },
  '🇹🇭': {
    name: ':thailand:',
    keywords: 'flag',
  },
  '🇹🇯': {
    name: ':tajikistan:',
    keywords: 'flag',
  },
  '🇹🇰': {
    name: ':tokelau:',
    keywords: 'flag',
  },
  '🇹🇱': {
    name: ':timor_leste:',
    keywords: 'flag',
  },
  '🇹🇲': {
    name: ':turkmenistan:',
    keywords: 'flag',
  },
  '🇹🇳': {
    name: ':tunisia:',
    keywords: 'flag',
  },
  '🇹🇴': {
    name: ':tonga:',
    keywords: 'flag',
  },
  '🇹🇷': {
    name: ':turkey:',
    keywords: 'flag',
  },
  '🇹🇹': {
    name: ':trinidad_tobago:',
    keywords: 'flag',
  },
  '🇹🇻': {
    name: ':tuvalu:',
    keywords: 'flag',
  },
  '🇹🇼': {
    name: ':taiwan:',
    keywords: 'flag',
  },
  '🇹🇿': {
    name: ':tanzania:',
    keywords: 'flag',
  },
  '🇺🇦': {
    name: ':ukraine:',
    keywords: 'flag',
  },
  '🇺🇬': {
    name: ':uganda:',
    keywords: 'flag',
  },
  '🇺🇲': {
    name: ':us_outlying_islands:',
    keywords: 'flag',
  },
  '🇺🇳': {
    name: ':united_nations:',
    keywords: 'flag',
  },
  '🇺🇸': {
    name: ':united_states:',
    keywords: 'flag',
    group: 'PLACES',
  },
  '🇺🇾': {
    name: ':uruguay:',
    keywords: 'flag',
  },
  '🇺🇿': {
    name: ':uzbekistan:',
    keywords: 'flag',
  },
  '🇻🇦': {
    name: ':vatican_city:',
    keywords: 'flag',
  },
  '🇻🇨': {
    name: ':st_vincent_grenadines:',
    keywords: 'flag',
  },
  '🇻🇪': {
    name: ':venezuela:',
    keywords: 'flag',
  },
  '🇻🇬': {
    name: ':british_virgin_islands:',
    keywords: 'flag',
  },
  '🇻🇮': {
    name: ':us_virgin_islands:',
    keywords: 'flag',
  },
  '🇻🇳': {
    name: ':vietnam:',
    keywords: 'flag',
  },
  '🇻🇺': {
    name: ':vanuatu:',
    keywords: 'flag',
  },
  '🇼🇫': {
    name: ':wallis_futuna:',
    keywords: 'flag',
  },
  '🇼🇸': {
    name: ':samoa:',
    keywords: 'flag',
  },
  '🇽🇰': {
    name: ':kosovo:',
    keywords: 'flag',
  },
  '🇾🇪': {
    name: ':yemen:',
    keywords: 'flag',
  },
  '🇾🇹': {
    name: ':mayotte:',
    keywords: 'flag',
  },
  '🇿🇦': {
    name: ':south_africa:',
    keywords: 'flag',
  },
  '🇿🇲': {
    name: ':zambia:',
    keywords: 'flag',
  },
  '🇿🇼': {
    name: ':zimbabwe:',
    keywords: 'flag',
  },
};

export default emojis;

const emojiGroups = [
  {
    id: 'PEOPLE',
    name: 'People',
    symbols: ['😄', '😃', '😀', '😊', '☺', '😉', '😍', '😘', '😚', '😗', '😙', '😜', '😝', '😛', '😳', '😁', '😔', '😌', '😒', '😞', '😣', '😢', '😂', '😭', '😪', '😥', '😰', '😅', '😓', '😩', '😫', '😨', '😱', '😠', '😡', '😤', '😖', '😆', '😋', '😷', '😎', '😴', '😵', '😲', '😟', '😦', '😧', '😈', '👿', '😮', '😬', '😐', '😕', '😯', '😶', '😇', '😏', '😑', '👲', '👳', '👮', '👷', '💂', '👶', '👦', '👧', '👨', '👩', '👴', '👵', '👱', '👼', '👸', '😺', '😸', '😻', '😽', '😼', '🙀', '😿', '😹', '😾', '👹', '👺', '🙈', '🙉', '🙊', '💀', '👽', '💩', '🔥', '✨', '🌟', '💫', '💥', '💢', '💦', '💧', '💤', '💨', '👂', '👀', '👃', '👅', '👄', '👍', '👎', '👌', '👊', '✊', '✌', '👋', '✋', '👐', '👆', '👇', '👉', '👈', '🙌', '🙏', '☝', '👏', '💪', '🚶', '🏃', '💃', '👫', '👪', '👬', '👭', '💏', '💑', '👯', '🙆', '🙅', '💁', '🙋', '💆', '💇', '💅', '👰', '🙎', '🙍', '🙇', '🎩', '👑', '👒', '👟', '👞', '👡', '👠', '👢', '👕', '👔', '👚', '👗', '🎽', '👖', '👘', '👙', '💼', '👜', '👝', '👛', '👓', '🎀', '🌂', '💄', '💛', '💙', '💜', '💚', '❤', '💔', '💗', '💓', '💕', '💖', '💞', '💘', '💌', '💋', '💍', '💎', '👤', '👥', '💬', '👣', '💭'],
  },
  {
    id: 'NATURE',
    name: 'Nature',
    symbols: ['🐶', '🐺', '🐱', '🐭', '🐹', '🐰', '🐸', '🐯', '🐨', '🐻', '🐷', '🐽', '🐮', '🐗', '🐵', '🐒', '🐴', '🐑', '🐘', '🐼', '🐧', '🐦', '🐤', '🐥', '🐣', '🐔', '🐍', '🐢', '🐛', '🐝', '🐜', '🐞', '🐌', '🐙', '🐚', '🐠', '🐟', '🐬', '🐳', '🐋', '🐄', '🐏', '🐀', '🐃', '🐅', '🐇', '🐉', '🐎', '🐐', '🐓', '🐕', '🐖', '🐁', '🐂', '🐲', '🐡', '🐊', '🐫', '🐪', '🐆', '🐈', '🐩', '🐾', '💐', '🌸', '🌷', '🍀', '🌹', '🌻', '🌺', '🍁', '🍃', '🍂', '🌿', '🌾', '🍄', '🌵', '🌴', '🌲', '🌳', '🌰', '🌱', '🌼', '🌐', '🌞', '🌝', '🌚', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌜', '🌛', '🌙', '🌍', '🌎', '🌏', '🌋', '🌌', '🌠', '⭐', '☀', '⛅', '☁', '⚡', '☔', '❄', '⛄', '🌀', '🌁', '🌈', '🌊'],
  },
  {
    id: 'OBJECTS',
    name: 'Objects',
    symbols: ['🎍', '💝', '🎎', '🎒', '🎓', '🎏', '🎆', '🎇', '🎐', '🎑', '🎃', '👻', '🎅', '🎄', '🎁', '🎋', '🎉', '🎊', '🎈', '🎌', '🔮', '🎥', '📷', '📹', '📼', '💿', '📀', '💽', '💾', '💻', '📱', '☎', '📞', '📟', '📠', '📡', '📺', '📻', '🔊', '🔉', '🔈', '🔇', '🔔', '🔕', '📢', '📣', '⏳', '⌛', '⏰', '⌚', '🔓', '🔒', '🔏', '🔐', '🔑', '🔎', '💡', '🔦', '🔆', '🔅', '🔌', '🔋', '🔍', '🛁', '🛀', '🚿', '🚽', '🔧', '🔩', '🔨', '🚪', '🚬', '💣', '🔫', '🔪', '💊', '💉', '💰', '💴', '💵', '💷', '💶', '💳', '💸', '📲', '📧', '📥', '📤', '✉', '📩', '📨', '📯', '📫', '📪', '📬', '📭', '📮', '📦', '📝', '📄', '📃', '📑', '📊', '📈', '📉', '📜', '📋', '📅', '📆', '📇', '📁', '📂', '✂', '📌', '📎', '✒', '✏', '📏', '📐', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📚', '📖', '🔖', '📛', '🔬', '🔭', '📰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🎻', '🎺', '🎷', '🎸', '👾', '🎮', '🃏', '🎴', '🀄', '🎲', '🎯', '🏈', '🏀', '⚽', '⚾', '🎾', '🎱', '🏉', '🎳', '⛳', '🚵', '🚴', '🏁', '🏇', '🏆', '🎿', '🏂', '🏊', '🏄', '🎣', '☕', '🍵', '🍶', '🍼', '🍺', '🍻', '🍸', '🍹', '🍷', '🍴', '🍕', '🍔', '🍟', '🍗', '🍖', '🍝', '🍛', '🍤', '🍱', '🍣', '🍥', '🍙', '🍘', '🍚', '🍜', '🍲', '🍢', '🍡', '🍳', '🍞', '🍩', '🍮', '🍦', '🍨', '🍧', '🎂', '🍰', '🍪', '🍫', '🍬', '🍭', '🍯', '🍎', '🍏', '🍊', '🍋', '🍒', '🍇', '🍉', '🍓', '🍑', '🍈', '🍌', '🍐', '🍍', '🍠', '🍆', '🍅', '🌽'],
  },
  {
    id: 'PLACES',
    name: 'Places',
    symbols: ['🏠', '🏡', '🏫', '🏢', '🏣', '🏥', '🏦', '🏪', '🏩', '🏨', '💒', '⛪', '🏬', '🏤', '🌇', '🌆', '🏯', '🏰', '⛺', '🏭', '🗼', '🗾', '🗻', '🌄', '🌅', '🌃', '🗽', '🌉', '🎠', '🎡', '⛲', '🎢', '🚢', '⛵', '🚤', '🚣', '⚓', '🚀', '✈', '💺', '🚁', '🚂', '🚊', '🚉', '🚞', '🚆', '🚄', '🚅', '🚈', '🚇', '🚝', '🚋', '🚃', '🚎', '🚌', '🚍', '🚙', '🚘', '🚗', '🚕', '🚖', '🚛', '🚚', '🚨', '🚓', '🚔', '🚒', '🚑', '🚐', '🚲', '🚡', '🚟', '🚠', '🚜', '💈', '🚏', '🎫', '🚦', '🚥', '⚠', '🚧', '🔰', '⛽', '🏮', '🎰', '♨', '🗿', '🎪', '🎭', '📍', '🚩', '🇯🇵', '🇰🇷', '🇩🇪', '🇨🇳', '🇺🇸', '🇫🇷', '🇪🇸', '🇮🇹', '🇷🇺', '🇬🇧'],
  },
  {
    id: 'SYMBOLS',
    name: 'Symbols',
    symbols: ['🔟', '🔢', '🔣', '⬆', '⬇', '⬅', '➡', '🔠', '🔡', '🔤', '↗', '↖', '↘', '↙', '↔', '↕', '🔄', '◀', '▶', '🔼', '🔽', '↩', '↪', 'ℹ', '⏪', '⏩', '⏫', '⏬', '⤵', '⤴', '🆗', '🔀', '🔁', '🔂', '🆕', '🆙', '🆒', '🆓', '🆖', '📶', '🎦', '🈁', '🈯', '🈳', '🈵', '🈴', '🈲', '🉐', '🈹', '🈺', '🈶', '🈚', '🚻', '🚹', '🚺', '🚼', '🚾', '🚰', '🚮', '🅿', '♿', '🚭', '🈷', '🈸', '🈂', 'Ⓜ', '🛂', '🛄', '🛅', '🛃', '🉑', '㊙', '㊗', '🆑', '🆘', '🆔', '🚫', '🔞', '📵', '🚯', '🚱', '🚳', '🚷', '🚸', '⛔', '✳', '❇', '❎', '✅', '✴', '💟', '🆚', '📳', '📴', '🅰', '🅱', '🆎', '🅾', '💠', '➿', '♻', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔯', '🏧', '💹', '💲', '💱', '©', '®', '™', '❌', '‼', '⁉', '❗', '❓', '❕', '❔', '⭕', '🔝', '🔚', '🔙', '🔛', '🔜', '🔃', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '✖', '➕', '➖', '➗', '♠', '♥', '♣', '♦', '💮', '💯', '✔', '☑', '🔘', '🔗', '➰', '〰', '〽', '🔱', '◼', '◻', '◾', '◽', '▪', '▫', '🔺', '🔲', '🔳', '⚫', '⚪', '🔴', '🔵', '🔻', '⬜', '⬛', '🔶', '🔷', '🔸', '🔹'],
  },
];

const groupsCache = {};

export function getEmojiGroups() {
  let groups = groupsCache[app.polyglot.currentLocale];

  if (!groups) {
    groups = emojiGroups.map(group => ({
      ...group,
      name: app.polyglot.t(`emojis.groups.${group.id}`),
    }));

    groupsCache[app.polyglot.currentLocale] = groups;
  }

  return groups;
}

let emojisIndexedByName;

export function getEmojiByName(name) {
  if (typeof name !== 'string') {
    throw new Error('Please provide a name as a string.');
  }

  if (!emojisIndexedByName) {
    emojisIndexedByName = {};

    Object.keys(emojis)
      .forEach(emojiKey => {
        const emoji = emojis[emojiKey];
        emojisIndexedByName[emoji.name] = {
          char: emojiKey,
          ...emoji,
        };
      });
  }

  return emojisIndexedByName[name];
}

/**
 * The following two methods were used to compile the reference data in this module. They
 * are NOT expected to be called in production.
 */

// Todo: Make keywords compile an array of strings rather than a comma seperated list.
const emojiRefData = () => {
  const deferred = $.Deferred();

  $.get('http://unicode.org/emoji/charts/full-emoji-list.html#1f468_1f3fb_200d_1f373', (data) => {
    const $rows = $(data).find('tr');
    const emojiDataMap = {};

    $rows.each((i, row) => {
      const $char = $(row).find('.chars');

      if ($char.length) {
        const char = $char.text();

        let name = $(row).find('.name')
          .eq(0)
          .text()
          .replace(/-/g, '_')
          .replace(/\s&\s/g, '_')
          .replace(/\s/g, '_')
          .replace(/[()":’\.'“”]/g, '')
          .toLowerCase();

        name = `:${name}:`;

        const keywords = $(row).find('.name')
          .eq(1)
          .find('a')
          .map((index, el) => (el.innerText))
          .get()
          .join(', ');

        emojiDataMap[char] = {
          name,
          keywords,
        };
      }
    });

    deferred.resolve(emojiDataMap);
  });

  return deferred.promise();
};


const emojiGroupData = [];

// Todo: Make symbols compile an array of strings rather than a comma seperated list.
export function compileEmojiData() {
  const deferred = $.Deferred();

  emojiRefData()
    .done(emojiReferenceData => {
      $.get('https://gist.githubusercontent.com/mattt/8185075/raw/78c937673ed493302be2ab73b176c4a390678866/Emoji.plist', (data) => {
        $(data).find('key')
          .each((i, keyEl) => {
            const keyName = keyEl.innerText;
            const keyId = keyName.toUpperCase()
              .replace(/\s/g, '_');

            const symbolsInGroup = $(keyEl).next()
              .find('string')
              .each((stringI, stringEl) => {
                const symbol = stringEl.innerText;

                if (emojiReferenceData[symbol]) {
                  emojiReferenceData[symbol] = {
                    ...emojiReferenceData[symbol],
                    group: keyId,
                  };
                } else {
                  console.error(`Symbol ${symbol} is not represented in the reference data.`);
                }
              })
              .map((stringI, stringEl) => (stringEl.innerText))
              .get()
              .join(', ');

            emojiGroupData.push({
              id: keyId,
              name: keyName,
              symbols: symbolsInGroup,
            });
          });

        deferred.resolve(emojiReferenceData, emojiGroupData);
      });
    });

  return deferred.promise();
}

export const RESOURCE_PATH = {
  SPRITE_SHEET: 'assets/sprite_sheet.json',
  TEXTURES: {},
  SOUNDS: {}
};

const TEXTURES = RESOURCE_PATH.TEXTURES;
TEXTURES.PIKACHU = (i, j) => `pikachu/pikachu_${i}_${j}.png`;
TEXTURES.BALL = s => `ball/ball_${s}.png`;
TEXTURES.NUMBER = n => `number/number_${n}.png`;

TEXTURES.SKY_BLUE = 'objects/sky_blue.png';
TEXTURES.MOUNTAIN = 'objects/mountain.png';
TEXTURES.GROUND_RED = 'objects/ground_red.png';
TEXTURES.GROUND_LINE = 'objects/ground_line.png';
TEXTURES.GROUND_LINE_LEFT_MOST = 'objects/ground_line_leftmost.png';
TEXTURES.GROUND_LINE_RIGHT_MOST = 'objects/ground_line_rightmost.png';
TEXTURES.GROUND_YELLOW = 'objects/ground_yellow.png';
TEXTURES.NET_PILLAR_TOP = 'objects/net_pillar_top.png';
TEXTURES.NET_PILLAR = 'objects/net_pillar.png';
TEXTURES.SHADOW = 'objects/shadow.png';
TEXTURES.BALL_HYPER = 'ball/ball_hyper.png';
TEXTURES.BALL_TRAIL = 'ball/ball_trail.png';
TEXTURES.BALL_PUNCH = 'ball/ball_punch.png';
TEXTURES.CLOUD = 'objects/cloud.png';
TEXTURES.WAVE = 'objects/wave.png';

TEXTURES.GAME_START = 'messages/ko/game_start.png';
TEXTURES.READY = 'messages/common/ready.png';
TEXTURES.GAME_END = 'messages/common/game_end.png';

TEXTURES.POKEMON = 'messages/ko/pokemon.png';
TEXTURES.PIKACHU_VOLLEYBALL = 'messages/ko/pikachu_volleyball.png';
TEXTURES.FIGHT = 'messages/ko/fight.png';
TEXTURES.WITH_COMPUTER = 'messages/ko/with_computer.png';
TEXTURES.WITH_FRIEND = 'messages/ko/with_friend.png';

TEXTURES.MARK = 'messages/ko/mark.png';
TEXTURES.SACHISOFT = 'messages/common/sachisoft.png';
TEXTURES.SITTING_PIKACHU = 'pikachu_sitting.png';

const SOUNDS = RESOURCE_PATH.SOUNDS;
SOUNDS.BGM = 'assets/bgm.mp3';
SOUNDS.PIPIKACHU = 'assets/WAVE140_1.wav';
SOUNDS.PIKA = 'assets/WAVE141_1.wav';
SOUNDS.CHU = 'assets/WAVE142_1.wav';
SOUNDS.PI = 'assets/WAVE143_1.wav';
SOUNDS.PIKACHU = 'assets/WAVE144_1.wav';
SOUNDS.POWERHIT = 'assets/WAVE145_1.wav';
SOUNDS.BALLTOUCHESGROUND = 'assets/WAVE146_1.wav';

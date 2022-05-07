# Pikachu Volleyball

_&check;_ _English_ | [_Korean(한국어)_](README.ko.md)

Pikachu Volleyball (対戦ぴかちゅ～　ﾋﾞｰﾁﾊﾞﾚｰ編) is an old Windows game which was developed by "(C) SACHI SOFT / SAWAYAKAN Programmers" and "(C) Satoshi Takenouchi" in 1997. The source code on this repository is gained by reverse engineering the core part of the machine code &mdash; including the physics engine and the AI &mdash; of the original game and implementing it into JavaScript.

You can play this game on the website: https://gorisanson.github.io/pikachu-volleyball/en/

<img src="src/resources/assets/images/screenshot.png" alt="Pikachu Volleyball game screenshot" width="648">

## How to run locally

1. Clone this repoistory and get into the directory.

```sh
git clone https://github.com/gorisanson/pikachu-volleyball.git
cd pikachu-volleyball
```

2. Install dependencies. (If errors occur, you can try with `node v16` and `npm v8`.)

```sh
npm install
```

3. Bundle the code.

```sh
npm run build
```

4. Run a local web server.

```sh
npx http-server dist
```

5. Connect to the local web server on a web browser. (In most cases, the URL for connecting to the server would be `http://localhost:8080`. For the exact URL, it is supposed to be found on the printed messages on your terminal.)

## Game structure

- Physics Engine: The physics engine, which calculates the position of the ball and the players (Pikachus), is contained in the file [`src/resources/js/physics.js`](src/resources/js/physics.js). (This file also containes the AI which determines the keyboard input of the computer when you are playing against your computer.) This source code file is gained by reverse engineering the function at the address 00403dd0 of the machine code of the original game.

- Rendering: [PixiJS](https://github.com/pixijs/pixi.js) library is used for rendering the game.

Refer comments on [`src/resources/js/main.js`](src/resources/js/main.js) for other details.

## Methods used for reverse engineering

The main tools used for reverse engineering are following.

- [Ghidra](https://ghidra-sre.org/)
- [Cheat Engine](https://www.cheatengine.org/)
- [OllyDbg](http://www.ollydbg.de/)
- [Resource Hacker](http://www.angusj.com/resourcehacker/)

[Ghidra](https://ghidra-sre.org/) is used for decompiling the machine code to C code. At first look, the decompiled C code looked incomprehensible. One of the reason was that the variable names (`iVar1`, `iVar2`, ...) and function names (`FUN_00402dc0`, `FUN_00403070`, ...) in the decompiled C code are meaningless. But, with the aid of [Cheat Engine](https://www.cheatengine.org/), I could find the location of some significant variables &mdash; x, y coordinate of the ball and the players. And reading from the location of the variables, the decompiled C code was comprehensible! [OllyDbg](http://www.ollydbg.de/) was used for altering a specific part of the machine code. For example, to make slower version of the game so that it would be easier to count the number of frames of "Ready?" message on the start of new round in the game. [Resource Hacker](http://www.angusj.com/resourcehacker/) was used for extract the assets (sprites and sounds) of the game.

## An intended deviation from the original game

If there is no keyboard input, AI vs AI match is started after a while. In the original game, the match lasts only for about 40 seconds. But in this JavaScript version, there's no time limit to the AI vs AI match so you can watch it as long as you want.

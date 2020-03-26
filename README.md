# Pikachu Volleyball implemented into Javascript by reverse engineering the original game

Pikachu Volleyball is a classic game which was developed in Japan in 1997. This is the JavaScript version which is gained by the core part of the machine code of the original game.

The main tools used for reverse engineering are following.

- [Ghidra](https://ghidra-sre.org/)
- [Cheat Engine](https://www.cheatengine.org/)
- [OllyDbg](http://www.ollydbg.de/)
- [Resource Hacker](http://www.angusj.com/resourcehacker/)

[Ghidra](https://ghidra-sre.org/) is used for decompiling the machine code to C code. At first look, the decompiled C code looked incomprehensible. One of the reason was that the variable names (iVar1, iVar2, ...) and function names (FUN_00402dc0, FUN_00403070, ...) in the decompiled C code are meaningless. But, by the aid of [Cheat Engine](https://www.cheatengine.org/), I could find the locations of some significant variables &mdash; x, y coordinate of the ball and the Pikachus. And reading from the location of the variables, the decompiled C code was comprehensible! [OllyDbg](http://www.ollydbg.de/) was used for altering a specific part of the machine code. (For example, to make slower version of the game so that it would be easier to count the number of frames of "Ready?" message.) [Resource Hacker](http://www.angusj.com/resourcehacker/) was used for extract the assets (sprites and sounds) of the game.

You can play the game on the website https://gorisanson.github.io/pikachu-volleyball/en/.

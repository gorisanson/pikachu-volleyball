# 피카츄 배구

[_English_](README.md) | _&check;_ _Korean(한국어)_

피카츄 배구는 1997년에 일본에서 만들어진 게임입니다. 여기있는 소스 코드는 원조 피카츄 배구 게임을 리버스 엔지니어링하여 머신 코드의 주요 부분을 자바스크립트로 구현한 것입니다.

피카츄 배구를 https://gorisanson.github.io/pikachu-volleyball/ko/ 에서 플레이할 수 있습니다.

## 게임 구조

- 물리 엔진: 핵심 물리 엔진은 [`src/resources/js/physcis.js`](src/resources/js/physcis.js) 파일에 있습니다. 이 소스 코드는 원조 게임의 00403dd0 주소에 위치한 함수를 리버스 엔지니어링하여 작성한 것입니다. 공과 플레이어(피카츄)의 위치를 계산합니다.

- 렌더링: [PixiJS](https://github.com/pixijs/pixi.js) 라이브러리를 사용하였습니다.

더 자세한 사항은 [`src/resources/js/main.js`](src/resources/js/main.js) 파일에 있는 주석에서 볼 수 있습니다.

## 리버스 엔지니어링 방법

다음 프로그램들을 사용했습니다.

- [Ghidra](https://ghidra-sre.org/)
- [Cheat Engine](https://www.cheatengine.org/)
- [OllyDbg](http://www.ollydbg.de/)
- [Resource Hacker](http://www.angusj.com/resourcehacker/)

[Ghidra](https://ghidra-sre.org/)는 머신 코드를 C 코드로 디컴파일할 때 사용했습니다. 디컴파일된 C 코드를 처음 봤을 때는 막막했습니다. 한 가지 이유는 변수들의 이름과 함수들의 이름이 `iVar1`, `iVar2`, `FUN_00402dc0`, `FUN_00403070`, ...` 이런 식이라 이게 어떤 변수이고 어떤 역할을 하는 함수인지 알 수가 없었기 때문입니다.하지만 [Cheat Engine](https://www.cheatengine.org/)을 이용하여 공의 좌표, 플레이어의 좌표 변수가 머신 코드 어디에 위치하는지 알아낼 수 있었고 거기서부터 디컴파일된 C 코드를 읽어내려가니까 코드가 해석이 되기 시작했습니다. [OllyDbg](http://www.ollydbg.de/)는 머신 코드의 일부분을 바꾸는데 사용했습니다. 예를 들어 새 라운드가 시작할 때 "Ready?" 메시지가 깜빡 거리는데 이 때 재생되는 프레임 수가 몇 개인지 세기위해 게임 속도를 느리게 만들 때 사용했습니다. [Resource Hacker](http://www.angusj.com/resourcehacker/)는 게임 리소스(스프라이트, 소리)를 추출할 때 사용했습니다.

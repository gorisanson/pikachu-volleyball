# 대회용 피카츄 배구

대회용 피카츄 배구는 [기존 웹 버전 피카츄 배구](https://gorisanson.github.io/pikachu-volleyball/ko/)를 피카츄 배구 온라인에서 진행되는 대회 규칙에 맞추어 변형한 것입니다. 

https://ilesejin.github.io/pikachu-volleyball/ko/
에서 플레이할 수 있습니다. 

<img src="src/resources/assets/images/screenshot.png" alt="피카츄 배구 게임 스크린샷" width="648">

## 로컬 환경에서 실행하는 방법

1. 본 저장소를 클론하고 해당 디렉토리로 들어갑니다.

```sh
git clone https://github.com/ilesejin/pikachu-volleyball.git
cd pikachu-volleyball
```

2. 의존하는 패키지를 설치합니다. (오류가 발생한다면, `node v16`와 `npm v8`을 사용해보세요.)

```sh
npm install
```

3. 코드를 번들링 합니다.

```sh
npm run build
```

4. 로컬 웹 서버를 실행합니다.

```sh
npx http-server dist
```

5. 웹 브라우저에서 로컬 웹 서버로 접속합니다. (대부분의 경우, 서버에 접속하기 위한 URL은 `http://localhost:8080` 입니다. 정확한 URL은 터미널에 출력된 메시지에서 확인할 수 있습니다.)

## 게임 구조

- 물리 엔진: 공과 플레이어(피카츄)의 위치를 계산하는 물리 엔진은 [`src/resources/js/physics.js`](src/resources/js/physics.js) 파일에 담겨 있습니다. (플레이어가 컴퓨터와 대전 시 컴퓨터의 키보드 입력을 결정하는 AI도 동일한 파일에 담겨 있습니다.) 이 소스 코드 파일은 원조 게임의 머신 코드 00403dd0 주소에 위치한 함수를 리버스 엔지니어링하여 작성한 것입니다.

- 렌더링: [PixiJS](https://github.com/pixijs/pixi.js) 라이브러리를 사용하였습니다.

더 자세한 사항은 [`src/resources/js/main.js`](src/resources/js/main.js) 파일에 있는 주석에서 볼 수 있습니다.

## 사용한 리버스 엔지니어링 방법

다음 프로그램들을 사용했습니다.

- [Ghidra](https://ghidra-sre.org/)
- [Cheat Engine](https://www.cheatengine.org/)
- [OllyDbg](http://www.ollydbg.de/)
- [Resource Hacker](http://www.angusj.com/resourcehacker/)

[Ghidra](https://ghidra-sre.org/)는 머신 코드를 C 코드로 디컴파일할 때 사용했습니다. 디컴파일된 C 코드를 처음 봤을 때는 막막했습니다. 한 가지 이유는 변수들의 이름과 함수들의 이름이 `iVar1`, `iVar2`, `FUN_00402dc0`, `FUN_00403070`, ... 이런 식이라 이게 어떤 변수이고 어떤 역할을 하는 함수인지 알 수 없었기 때문입니다. 공의 좌표 변수가 머신 코드 어느 지점에서 엑세스 되는지 한번 알아나보자는 생각으로 [Cheat Engine](https://www.cheatengine.org/)을 사용하여 해당 위치를 알아내었고, 거기서부터 디컴파일된 C 코드를 읽어내려가니 코드가 해석이 되기 시작했습니다. [OllyDbg](http://www.ollydbg.de/)는 머신 코드의 일부분을 바꾸는데 사용했습니다. 예를 들어, 새 라운드가 시작할 때 "Ready?" 메시지가 깜빡 거리는데 이 때 재생되는 프레임 수가 몇 개인지 세기위해 게임 속도를 느리게 만들 때 사용했습니다. [Resource Hacker](http://www.angusj.com/resourcehacker/)는 게임 리소스(스프라이트, 소리)를 추출할 때 사용했습니다.

## 원조 게임과 일부러 다르게 한 사항

키보드 입력이 없는 경우, 얼마의 시간이 지나면 AI 대 AI 경기가 시작됩니다. 원조 게임에서는 이 경기가 약 40초간만 진행됩니다. 이 자바스크립트 버전에서는 이 AI 대 AI 경기의 제한 시간이 없으므로, 마음 놓고 원하는 만큼 관전할 수 있습니다.

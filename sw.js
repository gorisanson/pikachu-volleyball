if(!self.define){let e,s={};const r=(r,d)=>(r=new URL(r+".js",d).href,s[r]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=s,document.head.appendChild(e)}else e=r,importScripts(r),s()})).then((()=>{let e=s[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(d,i)=>{const a=e||("document"in self?document.currentScript.src:"")||location.href;if(s[a])return;let o={};const n=e=>r(e,a),c={module:{uri:a},exports:o,require:n};s[a]=Promise.all(d.map((e=>c[e]||n(e)))).then((e=>(i(...e),o)))}}define(["./workbox-d5348a15"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"407.bundle.js",revision:"1bee7c3e4f681d79778458d562f32fdb"},{url:"407.bundle.js.LICENSE.txt",revision:"5c018e230a018b5417ea6d77f6db7997"},{url:"dark_color_scheme.bundle.js",revision:"15fd2ff5720636254dd3bff5cd6ab7c4"},{url:"en/index.html",revision:"d5fd81487c59b774c7a3b14b08ff3af4"},{url:"en/manifest.json",revision:"9c2fba642fff247e04697110fcc58ff9"},{url:"en/update-history/index.html",revision:"4704a6d69408e4167271fe69069ce6f1"},{url:"index.html",revision:"97623352ef3b2b2572bfa2108aeabdfe"},{url:"is_embedded_in_other_website.bundle.js",revision:"ed9756eafdc0b1ae07d5457b20c2c84e"},{url:"ko.bundle.js",revision:"85b7983e86676f7e9e59a1ad52034a2b"},{url:"ko/index.html",revision:"87882907e9ed2c94f8eda31a9b2a4b12"},{url:"ko/manifest.json",revision:"20e0d1683d218b21f80574bc139aeb81"},{url:"ko/update-history/index.html",revision:"4f6536d2f0cfcabb7cbb3d36cc79f7fc"},{url:"main.bundle.js",revision:"ff0a5227e06e60273d35d157714e652e"},{url:"resources/assets/images/IDI_PIKAICON-0.png",revision:"818a5aabfd92f99c7d1f98b8361d3c7f"},{url:"resources/assets/images/IDI_PIKAICON-1_gap_filled.png",revision:"f3f21ca643c4ff5e692b8de485ae8004"},{url:"resources/assets/images/IDI_PIKAICON-1_gap_filled_192.png",revision:"dac21c95f585cb036ad61246d3d722b2"},{url:"resources/assets/images/IDI_PIKAICON-1_gap_filled_512.png",revision:"6cbcbdfef391a347ba1643574bd7ed1b"},{url:"resources/assets/images/controls.png",revision:"5275b91d01abe46c45f43fe59c95d170"},{url:"resources/assets/images/controls_ko.png",revision:"c5c52fd2313b63d024ad06060609c84f"},{url:"resources/assets/images/screenshot.png",revision:"3867bffd4bef3786694f9ebeb77d4d1d"},{url:"resources/assets/images/sprite_sheet.json",revision:"5b62092ca5b40d420e906629b647c919"},{url:"resources/assets/images/sprite_sheet.png",revision:"4fc3712243966195534ee80e1ca81364"},{url:"resources/assets/sounds/WAVE140_1.wav",revision:"a31e486f9bf2dfa2548a4208d78edc1f"},{url:"resources/assets/sounds/WAVE141_1.wav",revision:"e6b661515829712630bbead41d86ee8d"},{url:"resources/assets/sounds/WAVE142_1.wav",revision:"918c03522e79304ad8bb8891c35f58a3"},{url:"resources/assets/sounds/WAVE143_1.wav",revision:"eb2ac1cb1900cd970cdd86be87ebea11"},{url:"resources/assets/sounds/WAVE144_1.wav",revision:"6b16d233bc68aea2a7d071eee85da431"},{url:"resources/assets/sounds/WAVE145_1.wav",revision:"85da47de3575fbedaef71188fe4fc05f"},{url:"resources/assets/sounds/WAVE146_1.wav",revision:"9976daa90c7fd3f7008cf30e7cda8825"},{url:"resources/assets/sounds/bgm.mp3",revision:"029ae684624b50612c09a255264b2d93"},{url:"resources/style.css",revision:"fbc649f35821e383897ad046ad0414ca"},{url:"runtime.bundle.js",revision:"5515a84be76013d8df230538de8a73bc"},{url:"zh/index.html",revision:"51bd65f69a90966b35c0fb86e18fadd2"},{url:"zh/manifest.json",revision:"bd6076c6691c90bfda46149789420061"},{url:"zh/update-history/index.html",revision:"3b679810a31cddaf0d6598587e8f5503"}],{}),e.cleanupOutdatedCaches()}));
//# sourceMappingURL=sw.js.map

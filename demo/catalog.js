(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ForestCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const items=[
  {
    "id": "soap",
    "word": "мыло",
    "image": "soap.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-soap",
    "letterAudio": "letter-m"
  },
  {
    "id": "cat",
    "word": "кот",
    "image": "cat.webp",
    "onset": "k",
    "target": false,
    "wordAudio": "word-cat",
    "letterAudio": "letter-k"
  },
  {
    "id": "house",
    "word": "дом",
    "image": "house.webp",
    "onset": "d",
    "target": false,
    "wordAudio": "word-house",
    "letterAudio": "letter-d"
  },
  {
    "id": "onion",
    "word": "лук",
    "image": "onion.webp",
    "onset": "l",
    "target": false,
    "wordAudio": "word-onion",
    "letterAudio": "letter-l"
  },
  {
    "id": "sea",
    "word": "море",
    "image": "sea.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-sea",
    "letterAudio": "letter-m"
  },
  {
    "id": "nose",
    "word": "нос",
    "image": "nose.webp",
    "onset": "n",
    "target": false,
    "wordAudio": "word-nose",
    "letterAudio": "letter-n"
  },
  {
    "id": "mother",
    "word": "мама",
    "image": "mother.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-mother",
    "letterAudio": "letter-m"
  },
  {
    "id": "car",
    "word": "машина",
    "image": "car.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-car",
    "letterAudio": "letter-m"
  },
  {
    "id": "umbrella",
    "word": "зонт",
    "image": "umbrella.webp",
    "onset": "z",
    "target": false,
    "wordAudio": "word-umbrella",
    "letterAudio": "letter-z"
  },
  {
    "id": "watermelon",
    "word": "арбуз",
    "image": "watermelon.webp",
    "onset": "a",
    "target": false,
    "wordAudio": "word-watermelon",
    "letterAudio": "letter-a"
  },
  {
    "id": "milk",
    "word": "молоко",
    "image": "milk.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-milk",
    "letterAudio": "letter-m"
  },
  {
    "id": "juice",
    "word": "сок",
    "image": "juice.webp",
    "onset": "s",
    "target": false,
    "wordAudio": "word-juice",
    "letterAudio": "letter-s"
  },
  {
    "id": "fish",
    "word": "рыба",
    "image": "fish.webp",
    "onset": "r",
    "target": false,
    "wordAudio": "word-fish",
    "letterAudio": "letter-r"
  },
  {
    "id": "bridge",
    "word": "мост",
    "image": "bridge.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-bridge",
    "letterAudio": "letter-m"
  },
  {
    "id": "pear",
    "word": "груша",
    "image": "pear.webp",
    "onset": "g",
    "target": false,
    "wordAudio": "word-pear",
    "letterAudio": "letter-g"
  },
  {
    "id": "forest",
    "word": "лес",
    "image": "forest.webp",
    "onset": "l-soft",
    "target": false,
    "wordAudio": "word-forest",
    "letterAudio": "letter-l"
  },
  {
    "id": "fly",
    "word": "муха",
    "image": "fly.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-fly",
    "letterAudio": "letter-m"
  },
  {
    "id": "tree",
    "word": "дерево",
    "image": "tree.webp",
    "onset": "d-soft",
    "target": false,
    "wordAudio": "word-tree",
    "letterAudio": "letter-d"
  },
  {
    "id": "book",
    "word": "книга",
    "image": "book.webp",
    "onset": "k",
    "target": false,
    "wordAudio": "word-book",
    "letterAudio": "letter-k"
  },
  {
    "id": "hammer",
    "word": "молоток",
    "image": "hammer.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-hammer",
    "letterAudio": "letter-m"
  },
  {
    "id": "moon",
    "word": "луна",
    "image": "moon.webp",
    "onset": "l",
    "target": false,
    "wordAudio": "word-moon",
    "letterAudio": "letter-l"
  },
  {
    "id": "boot",
    "word": "сапог",
    "image": "boot.webp",
    "onset": "s",
    "target": false,
    "wordAudio": "word-boot",
    "letterAudio": "letter-s"
  },
  {
    "id": "carrot",
    "word": "морковь",
    "image": "carrot.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-carrot",
    "letterAudio": "letter-m"
  },
  {
    "id": "owl",
    "word": "сова",
    "image": "owl.webp",
    "onset": "s",
    "target": false,
    "wordAudio": "word-owl",
    "letterAudio": "letter-s"
  },
  {
    "id": "cake",
    "word": "торт",
    "image": "cake.webp",
    "onset": "t",
    "target": false,
    "wordAudio": "word-cake",
    "letterAudio": "letter-t"
  },
  {
    "id": "mask",
    "word": "маска",
    "image": "mask.webp",
    "onset": "m",
    "target": true,
    "wordAudio": "word-mask",
    "letterAudio": "letter-m"
  },
  {
    "id": "bucket",
    "word": "ведро",
    "image": "bucket.webp",
    "onset": "v-soft",
    "target": false,
    "wordAudio": "word-bucket",
    "letterAudio": "letter-v"
  },
  {
    "id": "balloon",
    "word": "шар",
    "image": "balloon.webp",
    "onset": "sh",
    "target": false,
    "wordAudio": "word-balloon",
    "letterAudio": "letter-sh"
  }
];
return Object.freeze(Object.fromEntries(items.map(item=>[item.id,Object.freeze(item)])));
});

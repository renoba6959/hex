/* 朧 OBORO：数値の既定値と保存（ゲーム画面と数値調整タブで共有） */
const DEFAULTS = {
  units:{
    spear:{name:'槍兵',ch:'槍',hp:10,men:10,atk:10,def:12,mp:4,rmin:1,rmax:1},
    cav:{name:'騎兵',ch:'騎',hp:9,men:10,atk:13,def:9,mp:6,rmin:1,rmax:1},
    archer:{name:'弓兵',ch:'弓',hp:7,men:10,atk:9,def:7,mp:4,rmin:1,rmax:3}
  },
  base:2, side:1.5, rear:2.0, disorder:0.8, counter:0.8,
  turnCost:2, contactTurnCost:4, mvF:1, mvFD:2, mvRD:2, mvR:3,
  spearFrontDef:1.5,
  // 地形：move＝進入時の追加コスト、def／atk＝そこにいる部隊の防御・攻撃倍率
  terrain:{
    forest:{move:2,def:1.3,atk:1},
    hill:{move:1,def:1.2,atk:1.15},
    river:{move:3,def:0.8,atk:0.8},
    mountain:{move:3,def:1.5,atk:1.1} // 騎兵は進入不可
  },
  cavForest:0.6,
  ambush:1.5, hideCost:2, hideMove:1, // 奇襲の倍率、隠蔽に必要な移動力、隠蔽行軍の追加コスト
  matrix:{
    spear:{spear:1,cav:1.5,archer:1},
    cav:{spear:1,cav:1,archer:1.5},
    archer:{spear:1.3,cav:1,archer:1}
  }
};
const MULT_FIELDS = [
  ['base','殺傷係数（兵士1人あたり）'],['side','斜め後ろからの倍率'],['rear','真後ろからの倍率'],['disorder','隊列乱れの攻防倍率'],['counter','反撃の倍率（0で反撃なし）'],
  ['turnCost','旋回コスト（60度）'],['contactTurnCost','接触中の旋回コスト'],
  ['mvF','前進コスト'],['mvFD','斜め前への移動コスト'],['mvRD','斜め後ろへの移動コスト'],['mvR','後退コスト'],
  ['spearFrontDef','槍兵の正面対騎兵防御'],['cavForest','騎兵の森での攻撃倍率'],['ambush','奇襲の倍率'],['hideCost','隠蔽に必要な移動力'],['hideMove','隠蔽行軍の追加コスト（1マス）']
];
const TYPES=['spear','cav','archer'];
const TER_NAME={plain:'平地',forest:'森',hill:'丘',river:'川',mountain:'山'},TER_TYPES=['forest','hill','mountain','river'];
const STORE='hex-facing-cfg-v2';
const clone=o=>JSON.parse(JSON.stringify(o));
const CFG_MSG='hex-facing-cfg'; // 数値調整タブ → ゲーム画面へのメッセージ
function loadCfg(){
  try{const s=localStorage.getItem(STORE);if(s)return cfgFrom(JSON.parse(s));}catch(e){}
  return cfgFrom(null);
}
function deepMerge(t,s){for(const k in s){if(s[k]&&typeof s[k]==='object'&&t[k]&&typeof t[k]==='object')deepMerge(t[k],s[k]);else if(k in t&&typeof s[k]===typeof t[k])t[k]=s[k];}}
function saveCfg(c){try{localStorage.setItem(STORE,JSON.stringify(c));}catch(e){}}
// 入力値を遊べる範囲に丸める
function sanitizeCfg(c){
  TYPES.forEach(t=>{const U=c.units[t];U.men=Math.max(1,Math.round(U.men));U.hp=Math.max(0.1,U.hp);U.mp=Math.max(0,U.mp);U.rmin=Math.max(1,Math.round(U.rmin));U.rmax=Math.max(U.rmin,Math.round(U.rmax));U.def=Math.max(0.1,U.def);});
  TER_TYPES.forEach(t=>{const T=c.terrain[t];T.move=Math.max(0,T.move);T.def=Math.max(0.1,T.def);T.atk=Math.max(0,T.atk);});
  return c;
}
// 任意の値（保存データや数値調整タブから届いたもの）を既定値に重ねて、正しい形の設定にする
function cfgFrom(o){const c=clone(DEFAULTS);if(o&&typeof o==='object')deepMerge(c,o);return sanitizeCfg(c);}

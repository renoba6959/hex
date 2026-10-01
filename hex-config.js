/* 朧 OBORO：数値の既定値と保存（ゲーム画面と数値調整タブで共有） */
const DEFAULTS = {
  units:{
    spear:{name:'槍兵',ch:'槍',hp:10,men:10,atk:10,def:12,mp:4,rmin:1,rmax:1},
    cav:{name:'騎兵',ch:'騎',hp:9,men:10,atk:13,def:9,mp:6,rmin:1,rmax:1},
    archer:{name:'弓兵',ch:'弓',hp:7,men:10,atk:9,def:7,mp:4,rmin:1,rmax:3},
    supply:{name:'輜重',ch:'輜',hp:6,men:10,atk:0,def:5,mp:3,rmin:1,rmax:1} // 輜重：攻撃も反撃もしない。兵糧を運んで配る
  },
  base:2, side:1.5, rear:2.0, disorder:0.8, counter:0.8,
  obliqueAtk:0.9, obliqueDef:1.1, // 斜め前の敵を攻撃するときの攻撃倍率、斜め前から攻撃されたときの損害倍率
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
  // 士気（部隊ごと、0〜100）：desertLine を切ると毎ターン脱走が出る（士気0で desertMax の割合）
  moraleRecover:10, desertLine:50, desertMax:0.5,
  lossMorale:0.5, flankMorale:10, killMorale:10, allyLostMorale:10, // 兵を失う（最初の兵数の1%あたり）、側面・背後・奇襲を受ける、敵を壊滅させる、近くの味方が壊滅する
  honjinLossMorale:30, honjinOccupiedMorale:10, honjinRetakeMorale:15, // 本陣を占領された、占領されている間（毎ターン）、奪い返した
  // 兵糧と補給：兵糧は「人数×ターン」で数える。部隊は foodTurns ターン分を持ち、手番の終わりに今いる人数分を食べる。尽きると士気が下がる
  foodTurns:5, hungerMorale:20,
  supplyCap:30, supplyRange:3, honjinSupplyRange:3, supplyReturn:0.25, // 輜重の積載（1人あたり）、配れる範囲、本陣から直接届く範囲、本陣へ戻る積み荷の残り（割合）
  visFront:4, visRear:1, visHigh:1, // 視界：前方（左右90°まで）とそれ以外に見えるマス数、丘・山の上で伸びる分
  ambush:1.5, hideCost:2, hideMove:1, // 奇襲の倍率、隠蔽に必要な移動力、隠蔽行軍の追加コスト
  // 拠点：本陣・村（防御と、手番ごとの回復＝最初の兵数に対する割合）。柵・砦は耐久の割合に応じて防御が効く（作りかけ・壊れかけは弱い）
  honjinDef:1.3, honjinHeal:0.2, villageDef:1.2, villageHeal:0.1,
  jinchiDef:2, jinchiHp:500, // 陣地（1マス、槍兵が築く）：中の部隊の防御倍率（完成時）、耐久。二乗則で√2≒1.4倍の兵力が要る
  fortCoreDef:5, fortRingDef:3, fortHp:500, // 砦（7マス、マップに置く）：中央と外周の防御倍率（√5≒2.2倍・√3≒1.7倍の兵力が要る）、1マスごとの耐久
  fortMove:1, // 陣地・砦に入るときの追加コスト
  fenceDef:1.5, fenceMove:4, fenceHp:50,
  buildRate:0.1, // 工事：兵士1人が1手番に積む耐久（10人で1、100人で10）
  demolishRate:0.02, // 破壊：槍兵1人が1回の攻撃で削る耐久（基準）。他の兵種は fenceVs の比を掛ける。工事も破壊も小数点以下は切り捨て
  structSpill:0.3, // こもった部隊を攻撃したとき、柵・砦にも入る損傷（直接攻撃したときに対する割合）
  fenceVs:{spear:1,cav:0.2,archer:0.2,supply:0}, // 柵・砦の壊しやすさ（槍兵を1とした比）
  matrix:{
    spear:{spear:1,cav:1.5,archer:1,supply:1.2},
    cav:{spear:1,cav:1,archer:1.5,supply:1.5},
    archer:{spear:1.3,cav:1,archer:1,supply:1.2},
    supply:{spear:1,cav:1,archer:1,supply:1}
  }
};
const MULT_FIELDS = [
  ['base','殺傷係数（兵士1人あたり）'],['obliqueAtk','斜め前の敵を攻撃するときの攻撃倍率'],['obliqueDef','斜め前から攻撃されたときの損害倍率'],['side','斜め後ろからの倍率'],['rear','真後ろからの倍率'],['disorder','隊列乱れの攻防倍率'],['counter','反撃の倍率（0で反撃なし）'],
  ['turnCost','旋回コスト（60度）'],['contactTurnCost','接触中の旋回コスト'],
  ['mvF','前進コスト'],['mvFD','斜め前への移動コスト'],['mvRD','斜め後ろへの移動コスト'],['mvR','後退コスト'],
  ['spearFrontDef','槍兵の正面対騎兵防御'],['cavForest','騎兵の森での攻撃倍率'],['moraleRecover','士気の回復（毎ターン、敵と接していないとき）'],['desertLine','脱走が出はじめる士気'],['desertMax','士気0での脱走の割合（毎ターン）'],
  ['lossMorale','兵を失ったときの士気の低下（最初の兵数の1%あたり）'],['flankMorale','側面・背後・奇襲を受けたときの士気の低下'],['killMorale','敵を壊滅させたときの士気の上昇'],['allyLostMorale','近く（2マス）の味方が壊滅したときの士気の低下'],
  ['honjinLossMorale','本陣を占領されたときの士気の低下（全部隊）'],['honjinOccupiedMorale','本陣を占領されている間の士気の低下（毎ターン）'],['honjinRetakeMorale','本陣を奪い返したときの士気の上昇（全部隊）'],
  ['foodTurns','部隊が持てる兵糧（ターン分）'],['hungerMorale','兵糧切れの士気の低下（毎ターン）'],['supplyCap','輜重の積載（1人あたり、人×ターン）'],['supplyRange','輜重が兵糧を配れる範囲（マス）'],['honjinSupplyRange','本陣から直接兵糧が届く範囲（マス）'],['supplyReturn','輜重が本陣へ戻る積み荷の残り（割合）'],
  ['visFront','前方の視界（マス）'],['visRear','後方の視界（マス）'],['visHigh','丘・山の上で伸びる視界（マス）'],['ambush','奇襲の倍率'],['hideCost','隠蔽に必要な移動力'],['hideMove','隠蔽行軍の追加コスト（1マス）'],
  ['honjinDef','本陣にいる自軍の防御倍率'],['honjinHeal','本陣での回復（最初の兵数に対する割合）'],['villageDef','村にいる部隊の防御倍率'],['villageHeal','村での回復（最初の兵数に対する割合）'],['jinchiDef','陣地にいる部隊の防御倍率（完成時）'],['jinchiHp','陣地の耐久（完成に必要な工事量）'],['fortCoreDef','砦の中央にいる部隊の防御倍率'],['fortRingDef','砦の外周にいる部隊の防御倍率'],['fortHp','砦の耐久（1マスごと）'],['fortMove','陣地・砦に入る追加コスト'],
  ['fenceDef','柵にいる部隊の防御倍率（完成時）'],['fenceMove','柵に入る移動コスト'],['fenceHp','柵の耐久（完成に必要な工事量）'],['buildRate','工事量（兵士1人・1手番あたり）'],['demolishRate','破壊量（槍兵1人・1回あたり。基準）'],['structSpill','こもった部隊への攻撃で柵・砦に入る損傷の割合'],
  ['fenceVs.spear','柵・砦の壊しやすさ（槍兵＝基準の比）'],['fenceVs.cav','柵・砦の壊しやすさ（騎兵、槍兵に対する比）'],['fenceVs.archer','柵・砦の壊しやすさ（弓兵、槍兵に対する比）']
];
const TYPES=['spear','cav','archer','supply'];
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
  ['moraleRecover','lossMorale','flankMorale','killMorale','allyLostMorale','honjinLossMorale','honjinOccupiedMorale','honjinRetakeMorale'].forEach(k=>{c[k]=Math.max(0,c[k]);});
  c.desertLine=Math.min(100,Math.max(1,c.desertLine));c.desertMax=Math.min(1,Math.max(0,c.desertMax));
  c.foodTurns=Math.max(1,Math.round(c.foodTurns));c.hungerMorale=Math.max(0,c.hungerMorale);c.supplyCap=Math.max(0,c.supplyCap);
  c.supplyRange=Math.max(0,Math.round(c.supplyRange));c.honjinSupplyRange=Math.max(0,Math.round(c.honjinSupplyRange));c.supplyReturn=Math.min(1,Math.max(0,c.supplyReturn));
  ['visFront','visRear','visHigh'].forEach(k=>{c[k]=Math.max(k==='visHigh'?0:1,Math.round(c[k]));});
  c.obliqueAtk=Math.max(0,c.obliqueAtk);c.obliqueDef=Math.max(0.1,c.obliqueDef);
  c.honjinDef=Math.max(0.1,c.honjinDef);c.villageDef=Math.max(0.1,c.villageDef);c.villageHeal=Math.min(1,Math.max(0,c.villageHeal));c.honjinHeal=Math.min(1,Math.max(0,c.honjinHeal));
  ['jinchiDef','fortCoreDef','fortRingDef'].forEach(k=>{c[k]=Math.max(0.1,c[k]);});c.jinchiHp=Math.max(1,Math.round(c.jinchiHp));c.fortHp=Math.max(1,Math.round(c.fortHp));c.buildRate=Math.max(0,c.buildRate);c.demolishRate=Math.max(0,c.demolishRate);c.structSpill=Math.min(1,Math.max(0,c.structSpill));c.fortMove=Math.max(0,c.fortMove);c.fenceDef=Math.max(0.1,c.fenceDef);c.fenceMove=Math.max(1,c.fenceMove);c.fenceHp=Math.max(1,Math.round(c.fenceHp));
  TYPES.forEach(t=>{c.fenceVs[t]=Math.max(0,c.fenceVs[t]);});
  return c;
}
// 任意の値（保存データや数値調整タブから届いたもの）を既定値に重ねて、正しい形の設定にする
function cfgFrom(o){const c=clone(DEFAULTS);if(o&&typeof o==='object')deepMerge(c,o);return sanitizeCfg(c);}

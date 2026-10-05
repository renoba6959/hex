/* 朧 OBORO：数値の既定値と保存（ゲーム画面と数値調整タブで共有） */
const DEFAULTS = {
  units:{
    spear:{name:'槍兵',ch:'槍',hp:10,men:10,atk:10,def:12,mp:4,rmin:1,rmax:1,eat:1},
    cav:{name:'騎兵',ch:'騎',hp:9,men:10,atk:13,def:9,mp:6,rmin:1,rmax:1,eat:5}, // 騎兵は兵士1＋馬4で、兵糧を5倍食べる
    archer:{name:'弓兵',ch:'弓',hp:7,men:10,atk:9,def:7,mp:4,rmin:1,rmax:3,eat:1},
    supply:{name:'輜重',ch:'輜',hp:6,men:10,atk:0,def:5,mp:3,rmin:1,rmax:1,eat:1} // 輜重：攻撃も反撃もしない。兵糧を運んで配る
  },
  base:2, side:1.5, rear:2.0, disorder:0.9, confusion:0.7, counter:0.8, // disorder＝隊列の乱れ（軽い）、confusion＝混乱（重い。反撃もできない）
  obliqueAtk:0.9, obliqueDef:1.1, // 斜め前の敵を攻撃するときの攻撃倍率、斜め前から攻撃されたときの損害倍率
  turnCost:1, contactTurnCost:2, aboutCost:2, contactAboutCost:4, mvF:1, mvFD:2, mvRD:2, mvR:2, // 旋回（60度）、回れ右（180度）。接敵中は高くつき、隊列が乱れる
  spearFrontDef:1.5,
  // 地形：move＝進入時の追加コスト、def／atk＝そこにいる部隊の防御・攻撃倍率
  terrain:{
    forest:{move:2,def:1.3,atk:1},
    hill:{move:1,def:1.2,atk:1.15},
    river:{move:3,def:0.8,atk:0.8},
    mountain:{move:3,def:1.5,atk:1.1} // 騎兵は進入不可
  },
  cavForest:0.6,
  // 士気（部隊ごと、0〜100）：desertLine を切ると手番ごとに脱走が出る（士気0で desertMax の割合）
  moraleRecover:10, desertLine:50, desertMax:0.5,
  lossMorale:0.5, flankMorale:10, killMorale:10, allyLostMorale:10, // 兵を失う（最初の兵数の1%あたり）、側面・背後・奇襲を受ける、敵を壊滅させる、近くの味方が壊滅する
  honjinLossMorale:30, honjinOccupiedMorale:10, honjinRetakeMorale:15, // 本陣を占領された、占領されている間（手番ごとに）、奪い返した
  // 兵糧と補給：兵糧は「1人1食分＝1」で数える。食事は朝と夜の1日2回（自軍の手番の終わり）で、今いる人数分を食べる
  foodDays:5, hungerMorale:10, // 部隊が持てる兵糧（日分＝2食×日）、食事を抜いたときの士気の低下（1日で2回）
  supplyCap:30, supplyRange:3, honjinSupplyRange:3, supplyReturn:0.25, // 輜重の積載（1人あたり）、配れる範囲、本陣から直接届く範囲、本陣へ戻る積み荷の残り（割合）
  // 戦闘の後：失った兵のうち負傷の割合、勝ち／負けで復帰する負傷兵の割合、勝ち／負け（生き残った部隊）で入る経験
  woundRate:0.6, recoverWin:0.9, recoverLose:0.5, expWin:15, expLose:5,
  visFront:4, visRear:1, visHigh:1, visFrontNight:2, visRearNight:0, nightRaid:1.2, // 夜（夜・深夜）の視界、夜襲（相手から見えていない位置からの攻撃）の倍率 // 視界：前方（左右90°まで）とそれ以外に見えるマス数、丘・山の上で伸びる分
  ambush:1.5, ambushNoticed:1.2, hideCost:2, hideMove:1, // ambushNoticed＝敵の背後で動いて気配を悟られたあとの奇襲の倍率 // 奇襲の倍率、隠蔽に必要な移動力、隠蔽行軍の追加コスト
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
  ['base','殺傷係数（兵士1人あたり）'],['obliqueAtk','斜め前の敵を攻撃するときの攻撃倍率'],['obliqueDef','斜め前から攻撃されたときの損害倍率'],['side','斜め後ろからの倍率'],['rear','真後ろからの倍率'],['disorder','隊列の乱れの攻防倍率（接敵中の旋回・入れ替え）'],['confusion','混乱の攻防倍率（奇襲・工事中の襲撃。反撃もできない）'],['counter','反撃の倍率（0で反撃なし）'],
  ['turnCost','旋回コスト（60度）'],['contactTurnCost','接触中の旋回コスト'],['aboutCost','回れ右のコスト（180度）'],['contactAboutCost','接触中の回れ右のコスト'],
  ['mvF','前進コスト'],['mvFD','斜め前への移動コスト'],['mvRD','斜め後ろへの移動コスト'],['mvR','後退コスト'],
  ['spearFrontDef','槍兵の正面対騎兵防御'],['cavForest','騎兵の森での攻撃倍率'],['moraleRecover','士気の回復（手番ごとに、敵と接していないとき）'],['desertLine','脱走が出はじめる士気'],['desertMax','士気0での脱走の割合（手番ごとに）'],
  ['lossMorale','兵を失ったときの士気の低下（最初の兵数の1%あたり）'],['flankMorale','側面・背後・奇襲を受けたときの士気の低下'],['killMorale','敵を壊滅させたときの士気の上昇'],['allyLostMorale','近く（2マス）の味方が壊滅したときの士気の低下'],
  ['honjinLossMorale','本陣を占領されたときの士気の低下（全部隊）'],['honjinOccupiedMorale','本陣を占領されている間の士気の低下（手番ごとに）'],['honjinRetakeMorale','本陣を奪い返したときの士気の上昇（全部隊）'],
  ['foodDays','部隊が持てる兵糧（日分）'],['hungerMorale','兵糧切れで食事を抜いたときの士気の低下（1回の食事ごと）'],['supplyCap','輜重の積載（1人あたり、食）'],['supplyRange','輜重が兵糧を配れる範囲（マス）'],['honjinSupplyRange','本陣から直接兵糧が届く範囲（マス）'],['supplyReturn','輜重が本陣へ戻る積み荷の残り（割合）'],
  ['woundRate','失った兵のうち負傷の割合（残りは戦死）'],['recoverWin','勝ったときに復帰する負傷兵の割合'],['recoverLose','負けたときに復帰する負傷兵の割合'],['expWin','勝ったときの経験（攻撃・守備それぞれ）'],['expLose','負けて生き残ったときの経験（攻撃・守備それぞれ）'],
  ['visFront','前方の視界（マス）'],['visRear','後方の視界（マス）'],['visHigh','丘・山の上で伸びる視界（マス）'],['visFrontNight','夜の前方の視界（マス）'],['visRearNight','夜の後方の視界（マス）'],['nightRaid','夜襲の倍率（相手から見えていない位置から攻撃）'],['ambush','奇襲の倍率'],['ambushNoticed','気取られた奇襲の倍率（敵の背後で動いたあと）'],['hideCost','隠蔽に必要な移動力'],['hideMove','隠蔽行軍の追加コスト（1マス）'],
  ['honjinDef','本陣にいる自軍の防御倍率'],['honjinHeal','本陣での回復（最初の兵数に対する割合）'],['villageDef','村にいる部隊の防御倍率'],['villageHeal','村での回復（最初の兵数に対する割合）'],['jinchiDef','陣地にいる部隊の防御倍率（完成時）'],['jinchiHp','陣地の耐久（完成に必要な工事量）'],['fortCoreDef','砦の中央にいる部隊の防御倍率'],['fortRingDef','砦の外周にいる部隊の防御倍率'],['fortHp','砦の耐久（1マスごと）'],['fortMove','陣地・砦に入る追加コスト'],
  ['fenceDef','柵にいる部隊の防御倍率（完成時）'],['fenceMove','柵に入る移動コスト'],['fenceHp','柵の耐久（完成に必要な工事量）'],['buildRate','工事量（兵士1人・1手番あたり）'],['demolishRate','破壊量（槍兵1人・1回あたり。基準）'],['structSpill','こもった部隊への攻撃で柵・砦に入る損傷の割合'],
  ['fenceVs.spear','柵・砦の壊しやすさ（槍兵＝基準の比）'],['fenceVs.cav','柵・砦の壊しやすさ（騎兵、槍兵に対する比）'],['fenceVs.archer','柵・砦の壊しやすさ（弓兵、槍兵に対する比）']
];
const TYPES=['spear','cav','archer','supply'];
// 練度：攻撃と守備に分かれ、それぞれ経験がたまると上がる。mul＝攻撃（守備なら防御）の倍率、morale＝損害で士気が下がる量の倍率（守備）、steady＝接敵中の旋回・入れ替えで隊列が乱れない（守備）
const RANKS=[
  {name:'新兵',ch:'新',exp:0,  mul:0.85,morale:1.2, steady:false},
  {name:'並',  ch:'',  exp:100,mul:1,   morale:1,   steady:false},
  {name:'熟練',ch:'熟',exp:250,mul:1.1, morale:0.85,steady:false},
  {name:'精鋭',ch:'精',exp:450,mul:1.2, morale:0.7, steady:true},
  {name:'古強者',ch:'古',exp:700,mul:1.3,morale:0.6, steady:true}
];
const rankOfExp=e=>{let i=0;RANKS.forEach((r,k)=>{if(e>=r.exp)i=k;});return i;};
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
  TYPES.forEach(t=>{const U=c.units[t];U.men=Math.max(1,Math.round(U.men));U.hp=Math.max(0.1,U.hp);U.mp=Math.max(0,U.mp);U.rmin=Math.max(1,Math.round(U.rmin));U.rmax=Math.max(U.rmin,Math.round(U.rmax));U.def=Math.max(0.1,U.def);U.eat=Math.max(0,U.eat);});
  TER_TYPES.forEach(t=>{const T=c.terrain[t];T.move=Math.max(0,T.move);T.def=Math.max(0.1,T.def);T.atk=Math.max(0,T.atk);});
  ['moraleRecover','lossMorale','flankMorale','killMorale','allyLostMorale','honjinLossMorale','honjinOccupiedMorale','honjinRetakeMorale'].forEach(k=>{c[k]=Math.max(0,c[k]);});
  c.desertLine=Math.min(100,Math.max(1,c.desertLine));c.desertMax=Math.min(1,Math.max(0,c.desertMax));
  ['woundRate','recoverWin','recoverLose'].forEach(k=>{c[k]=Math.min(1,Math.max(0,c[k]));});c.expWin=Math.max(0,c.expWin);c.expLose=Math.max(0,c.expLose);
  c.foodDays=Math.max(1,c.foodDays);c.visFrontNight=Math.max(1,Math.round(c.visFrontNight));c.visRearNight=Math.max(0,Math.round(c.visRearNight));c.nightRaid=Math.max(1,c.nightRaid);c.hungerMorale=Math.max(0,c.hungerMorale);c.supplyCap=Math.max(0,c.supplyCap);
  c.supplyRange=Math.max(0,Math.round(c.supplyRange));c.honjinSupplyRange=Math.max(0,Math.round(c.honjinSupplyRange));c.supplyReturn=Math.min(1,Math.max(0,c.supplyReturn));
  ['visFront','visRear','visHigh'].forEach(k=>{c[k]=Math.max(k==='visHigh'?0:1,Math.round(c[k]));});
  c.ambushNoticed=Math.max(1,c.ambushNoticed);c.disorder=Math.max(0.1,c.disorder);c.confusion=Math.max(0.1,c.confusion);
  c.obliqueAtk=Math.max(0,c.obliqueAtk);c.obliqueDef=Math.max(0.1,c.obliqueDef);
  c.honjinDef=Math.max(0.1,c.honjinDef);c.villageDef=Math.max(0.1,c.villageDef);c.villageHeal=Math.min(1,Math.max(0,c.villageHeal));c.honjinHeal=Math.min(1,Math.max(0,c.honjinHeal));
  ['jinchiDef','fortCoreDef','fortRingDef'].forEach(k=>{c[k]=Math.max(0.1,c[k]);});c.jinchiHp=Math.max(1,Math.round(c.jinchiHp));c.fortHp=Math.max(1,Math.round(c.fortHp));c.buildRate=Math.max(0,c.buildRate);c.demolishRate=Math.max(0,c.demolishRate);c.structSpill=Math.min(1,Math.max(0,c.structSpill));c.fortMove=Math.max(0,c.fortMove);c.fenceDef=Math.max(0.1,c.fenceDef);c.fenceMove=Math.max(1,c.fenceMove);c.fenceHp=Math.max(1,Math.round(c.fenceHp));
  TYPES.forEach(t=>{c.fenceVs[t]=Math.max(0,c.fenceVs[t]);});
  return c;
}
// 任意の値（保存データや数値調整タブから届いたもの）を既定値に重ねて、正しい形の設定にする
function cfgFrom(o){const c=clone(DEFAULTS);if(o&&typeof o==='object')deepMerge(c,o);return sanitizeCfg(c);}

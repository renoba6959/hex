/* 朧 OBORO：盤面（座標・地形・マップ・描画）。ゲーム画面とマップ編集で共有 */
// 判定は正六角形の座標(toPix)で行い、描画だけ縦をKだけつぶして立体タイルに合わせる
const S=36, SQ3=Math.sqrt(3), EPS=1e-6;
let COLS=14, ROWS=10; // 盤の大きさはマップごと（useMap で変わる）
const SIZE_MIN={cols:8,rows:6}, SIZE_MAX={cols:40,rows:30};
const DIRS=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]; // 右, 右下, 左下, 左, 左上, 右上
const cells=new Map();
const key=(q,r)=>q+','+r;
const fromCR=(col,row)=>({q:col-((row-(row&1))/2),r:row}); // 奇数行が右にずれる配置
const colOf=(q,r)=>q+((r-(r&1))/2);
const toPix=(q,r)=>({x:S*SQ3*(q+r/2),y:S*1.5*r});
// タイル画像（1254px四方の元画像基準）：上面の幅1040px、上面中心(625,595)、行の間隔715px
const TILE={src:1254,faceW:1040,cx:625,cy:595,rowStep:715,top:75,bottom:1200};
const IMG_S=S*SQ3/TILE.faceW, K=TILE.rowStep*IMG_S/(1.5*S);
const toScreen=(q,r)=>{const p=toPix(q,r);return {x:p.x,y:p.y*K};};
const VB=[0,0,0,0]; // 盤の表示範囲（viewBox）
// 盤を作り直す。マスは奥の行から順に並べる（描画順）
function setBoardSize(cols,rows){
  COLS=cols;ROWS=rows;cells.clear();
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const {q,r}=fromCR(col,row),p=toScreen(q,r);cells.set(key(q,r),{q,r,x:p.x,y:p.y});}
  const xs=[...cells.values()].map(c=>c.x),ys=[...cells.values()].map(c=>c.y);
  VB[0]=Math.min(...xs)-S*SQ3/2-6;VB[1]=Math.min(...ys)-(TILE.cy-TILE.top)*IMG_S-4;
  VB[2]=Math.max(...xs)-Math.min(...xs)+S*SQ3+12;VB[3]=Math.max(...ys)-Math.min(...ys)+(TILE.bottom-TILE.top)*IMG_S+8;
  ZONE.red=[COLS-3,COLS-1];
}
const hexPts=(x,y)=>{let p=[];for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;p.push((x+S*Math.cos(a)).toFixed(1)+','+(y+S*K*Math.sin(a)).toFixed(1));}return p.join(' ');};
const DIR_NAME=['右','右下','左下','左','左上','右上'];
// aから見たbの方向（6方向のどれに近いか）
const dirTo=(a,b)=>{const p=toPix(a.q,a.r),o=toPix(b.q,b.r);return ((Math.round(Math.atan2(o.y-p.y,o.x-p.x)*3/Math.PI)%6)+6)%6;};
const SANG=DIRS.map(([dq,dr])=>{const p=toScreen(dq,dr);return Math.atan2(p.y,p.x)*180/Math.PI;}); // 画面上の各方向の角度
const ZONE={blue:[0,2],red:[11,13]}; // 配置範囲を塗っていないマップの既定（両端の3列）
setBoardSize(COLS,ROWS);
const zoneAt=new Map(); // 編成で部隊を動かせるマス → 'blue' | 'red'
const inZone=(side,q,r)=>cells.has(key(q,r))&&zoneAt.get(key(q,r))===side;
function defaultZones(){const z={};for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){if(col<=ZONE.blue[1])z[col+','+row]='blue';else if(col>=ZONE.red[0])z[col+','+row]='red';}return z;}

/* ---- マップ ---- */
// terrain は「列,行」→ 地形（書いていないマスは平地）。zones は「列,行」→ 配置範囲（未設定なら両端の3列）
// cols・rows は盤の大きさ。features は「列,行」→ 拠点 {type:'honjin',side} | {type:'village'} | {type:'jinchi'} | {type:'fence'}
//   | 7ヘックスの砦 {type:'fort',part:'core'|'ring',fid:中央の「列,行」}（本陣は各軍に1つ）
// units は初期配置 {side,type,col,row,f,men}。rev は部隊を編集するたびに増える（配置画面で保存した配置を古くするため）
const TERRAINS=['plain','forest','hill','mountain','river'];
const FEATURES=['honjin','village','jinchi','fort','fence'];
const BUILTIN_MAPS=[
  {id:'standard',name:'標準',builtin:true,cols:14,rows:10,terrain:{"7,0":"forest", "8,0":"forest", "8,1":"forest", "9,0":"forest", "4,9":"forest", "5,9":"forest", "5,8":"forest", "6,9":"forest", "4,4":"hill", "4,5":"hill", "5,5":"hill", "6,2":"mountain", "6,3":"mountain", "7,3":"mountain", "7,4":"river", "7,5":"river", "8,6":"river", "7,7":"river", "7,8":"river", "7,9":"river"},rev:2,
   features:{'0,4':{type:'honjin',side:'blue'},'13,4':{type:'honjin',side:'red'},'3,7':{type:'village'},'10,2':{type:'village'},
     '3,4':{type:'fence'},'3,5':{type:'fence'},'10,4':{type:'fence'},'10,5':{type:'fence'}},
   units:[
    ...[2,4,6].map(r=>({side:'blue',type:'spear',col:2,row:r,f:0})),...[0,8].map(r=>({side:'blue',type:'cav',col:2,row:r,f:0})),...[3,5].map(r=>({side:'blue',type:'archer',col:1,row:r,f:0})),
    ...[2,4,6].map(r=>({side:'red',type:'spear',col:11,row:r,f:3})),...[0,8].map(r=>({side:'red',type:'cav',col:11,row:r,f:3})),...[3,5].map(r=>({side:'red',type:'archer',col:12,row:r,f:3}))
  ]}
];
const MAPS_STORE='hex-facing-maps-v1', MAP_MSG='hex-facing-map'; // マップ編集タブ → ゲーム画面へのメッセージ
// 保存しているのは自作のマップと、ゲームで使うマップのidだけ
function loadMaps(){
  const db={current:'standard',maps:BUILTIN_MAPS.map(m=>JSON.parse(JSON.stringify(m)))};
  try{
    const o=JSON.parse(localStorage.getItem(MAPS_STORE));
    if(o&&Array.isArray(o.maps))o.maps.forEach(m=>{if(m&&typeof m.id==='string'&&!db.maps.some(x=>x.id===m.id))db.maps.push(cleanMap(m));});
    if(o&&db.maps.some(m=>m.id===o.current))db.current=o.current;
  }catch(e){}
  return db;
}
function saveMaps(db){try{localStorage.setItem(MAPS_STORE,JSON.stringify({current:db.current,maps:db.maps.filter(m=>!m.builtin)}));}catch(e){}}
const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const UNIT_TYPES=['spear','cav','archer'];
// 赤軍AIの作戦（マップごとに決められる。random＝戦闘ごとにランダムに選び、決着まで伏せる）
const AI_STYLES={rush:'猛進',careful:'慎重',ambush:'伏兵',hold:'要地'};
const AI_STYLE_DESC={rush:'隠れずに敵の本陣の占領を狙う。多少の損害は気にしない',careful:'危険を避け、不利な戦いはしない。隙を見せた敵を叩く',
  ambush:'敵の視界の外を回り込み、隠れて奇襲を狙う',hold:'丘・森・砦・村など守りやすい場所を取り、迎え撃つ'};
// 保存データや読み込んだデータを正しい形に整える
function cleanMap(m){
  const clamp=(v,a,b,d)=>{v=Math.round(Number(v));return v>=a&&v<=b?v:d;};
  const cols=clamp(m.cols,SIZE_MIN.cols,SIZE_MAX.cols,14),rows=clamp(m.rows,SIZE_MIN.rows,SIZE_MAX.rows,10);
  const inside=k=>{if(!/^\d+,\d+$/.test(k))return false;const [c,r]=k.split(',').map(Number);return c<cols&&r<rows;};
  const out={id:String(m.id),name:String(m.name||'無題'),cols,rows,terrain:{},features:{},units:[],rev:Number(m.rev)||0};
  if(isObj(m.terrain))Object.entries(m.terrain).forEach(([k,t])=>{if(inside(k)&&TERRAINS.includes(t)&&t!=='plain')out.terrain[k]=t;});
  if(isObj(m.features))Object.entries(m.features).forEach(([k,f])=>{
    if(!inside(k)||!isObj(f)||!FEATURES.includes(f.type))return;
    if(f.type==='fort'&&!f.part){out.features[k]={type:'jinchi'};return;} // 以前の1マスの砦は陣地として読む
    if(f.type==='fort'){if((f.part==='core'||f.part==='ring')&&typeof f.fid==='string')out.features[k]={type:'fort',part:f.part,fid:f.fid};return;}
    if(f.type==='honjin'){
      if(f.side!=='blue'&&f.side!=='red')return;
      Object.keys(out.features).forEach(x=>{const o=out.features[x];if(o.type==='honjin'&&o.side===f.side)delete out.features[x];}); // 本陣は各軍に1つ
      out.features[k]={type:'honjin',side:f.side};
    }else out.features[k]={type:f.type};
  });
  // 中央を失った砦のかけらは消す
  Object.keys(out.features).forEach(k=>{const f=out.features[k];if(f.type==='fort'&&out.features[f.fid]?.part!=='core')delete out.features[k];});
  if(m.ai==='random'||m.ai in AI_STYLES)out.ai=m.ai;
  if(isObj(m.zones)){out.zones={};Object.entries(m.zones).forEach(([k,z])=>{if(inside(k)&&(z==='blue'||z==='red'))out.zones[k]=z;});}
  if(Array.isArray(m.units))m.units.forEach(u=>{
    if(!u||!UNIT_TYPES.includes(u.type)||(u.side!=='blue'&&u.side!=='red'))return;
    const col=u.col|0,row=u.row|0;if(col<0||col>=cols||row<0||row>=rows||out.units.some(x=>x.col===col&&x.row===row))return;
    const o={side:u.side,type:u.type,col,row,f:((u.f|0)%6+6)%6};if(u.men>0)o.men=Math.round(u.men);
    out.units.push(o);
  });
  return out;
}
const findMap=(db,id)=>db.maps.find(m=>m.id===id)||db.maps[0];
const terrainAt=new Map(), featureAt=new Map(); // featureAt：拠点（本陣・村・陣地・砦・柵）
function useMap(map){
  setBoardSize(map.cols||14,map.rows||10);
  featureAt.clear();
  Object.entries(map.features||{}).forEach(([k,f])=>{const [col,row]=k.split(',').map(Number);const c=fromCR(col,row);if(cells.has(key(c.q,c.r)))featureAt.set(key(c.q,c.r),f);});
  zoneAt.clear();
  Object.entries(map.zones||defaultZones()).forEach(([k,z])=>{const [col,row]=k.split(',').map(Number);const c=fromCR(col,row);if(cells.has(key(c.q,c.r)))zoneAt.set(key(c.q,c.r),z);});
  terrainAt.clear();
  Object.entries(map.terrain||{}).forEach(([k,t])=>{
    const [col,row]=k.split(',').map(Number);
    if(col>=0&&col<COLS&&row>=0&&row<ROWS&&t!=='plain'&&TERRAINS.includes(t)){const c=fromCR(col,row);terrainAt.set(key(c.q,c.r),t);}
  });
}
const terOf=p=>terrainAt.get(key(p.q,p.r))||'plain';
const featOf=p=>featureAt.get(key(p.q,p.r))||null;

/* ---- 川：隣り合う川マスを自動でつなぐ ---- */
// 川マスがつながる方向。行き止まりのマスは、山（水源）か盤の外（河口）へ延ばす
function riverLinks(c){
  const nb=d=>({q:c.q+DIRS[d][0],r:c.r+DIRS[d][1]});
  const links=[];
  for(let d=0;d<6;d++){const n=nb(d);if(cells.has(key(n.q,n.r))&&terOf(n)==='river')links.push(d);}
  if(links.length===1){
    const back=(links[0]+3)%6;
    for(const e of [back,(back+1)%6,(back+5)%6,(back+2)%6,(back+4)%6]){const n=nb(e);if(!cells.has(key(n.q,n.r))||terOf(n)==='mountain'){links.push(e);break;}}
  }
  return links;
}
// 線で描く川の下地は平地。どこにもつながらない川マスだけ川のタイルを使う
const tileOf=p=>{const t=terOf(p);return t==='river'&&riverLinks(p).length?'plain':t;};
// 各川マスの中で、隣のマスとの境目の中点どうしを結ぶ。境目で向きがそろうので、つなぐと1本の流れになる
function riverPaths(){
  const out=[],fall=((TILE.bottom-TILE.cy-TILE.rowStep*0.68)*IMG_S).toFixed(1);
  cells.forEach(c=>{
    if(terOf(c)!=='river')return;
    const L=riverLinks(c);if(!L.length)return;
    const f=p=>p.x.toFixed(1)+','+p.y.toFixed(1);
    const mid=d=>{const o=toScreen(DIRS[d][0],DIRS[d][1]);return {x:c.x+o.x/2,y:c.y+o.y/2};};
    const drop=d=>(d===1||d===2)&&!cells.has(key(c.q+DIRS[d][0],c.r+DIRS[d][1]))?' l0,'+fall:''; // 盤の手前の端では土の側面を流れ落ちる
    if(L.length===1)out.push('M'+f(c)+' L'+f(mid(L[0]))+drop(L[0]));
    else if(L.length===2){const [a,b]=drop(L[0])?[L[1],L[0]]:L;out.push('M'+f(mid(a))+' Q'+f(c)+' '+f(mid(b))+drop(b));}
    else L.forEach(d=>out.push('M'+f(c)+' L'+f(mid(d))+drop(d)));
  });
  return out;
}
// 拠点の仮の記号（本陣＝軍の色の旗、村＝家、陣地＝土塁と幟、柵＝杭の並び。砦はタイルで描くので耐久の棒だけ）。hp は柵・砦の耐久の割合、building は工事中（薄く描く）
function featureSVG(f,c,hp,building){
  let h='<g class="feat" transform="translate('+c.x.toFixed(1)+','+c.y.toFixed(1)+')"'+(building?' opacity=".45"':'')+'>';
  if(f.type==='honjin'){
    const col=f.side==='blue'?'var(--blue)':'var(--red)';
    h+='<ellipse rx="'+(S*0.74).toFixed(1)+'" ry="'+(S*0.74*K).toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="2.5" stroke-dasharray="6 3"/>'+
      '<line x1="19" y1="8" x2="19" y2="-30" stroke="#3E2E1C" stroke-width="2"/><rect x="19" y="-30" width="11" height="18" fill="'+col+'" stroke="#1E2922" stroke-width="1"/>'+
      '<text x="24.5" y="-21" font-size="8" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="var(--serif)">本</text>';
  }else if(f.type==='village'){
    const house=(x,y)=>'<g transform="translate('+x+','+y+')"><path d="M-6,5 L-6,-2 L6,-2 L6,5 Z" fill="#D8B37A" stroke="#4A3824" stroke-width="1"/><path d="M-8,-1 L0,-8 L8,-1 Z" fill="#8E4B32" stroke="#4A3824" stroke-width="1"/></g>';
    h+=house(-21,6)+house(21,6)+house(0,-17);
  }else if(f.type==='jinchi'){
    // 土を盛った塁と幟
    h+='<path d="M-26,12 Q-26,-2 -12,-4 L12,-4 Q26,-2 26,12 Z" fill="#9C7A4E" stroke="#4A3824" stroke-width="1.1"/><path d="M-20,8 Q0,2 20,8" stroke="#6E5536" stroke-width="1" fill="none"/>'+
      '<line x1="-16" y1="-3" x2="-16" y2="-24" stroke="#3E2E1C" stroke-width="1.5"/><rect x="-16" y="-24" width="7" height="12" fill="#C9B27A" stroke="#3E2E1C" stroke-width=".8"/>'+
      '<line x1="17" y1="-3" x2="17" y2="-24" stroke="#3E2E1C" stroke-width="1.5"/><rect x="17" y="-24" width="7" height="12" fill="#C9B27A" stroke="#3E2E1C" stroke-width=".8"/>';
  }else if(f.type==='fence'){
    h+='<line x1="-25" y1="9" x2="25" y2="9" stroke="#4A3824" stroke-width="2.2"/><line x1="-25" y1="3" x2="25" y2="3" stroke="#4A3824" stroke-width="2.2"/>';
    for(let x=-24;x<=24;x+=6)h+='<path d="M'+(x-1.6)+',13 L'+(x-1.6)+',-3 L'+x+',-6 L'+(x+1.6)+',-3 L'+(x+1.6)+',13 Z" fill="#A67C4A" stroke="#3E2E1C" stroke-width=".8"/>';
  }
  if(hp!=null&&hp<1)h+='<rect x="-14" y="17" width="28" height="3" fill="#6B5A44" opacity="1"/><rect x="-14" y="17" height="3" width="'+(28*hp).toFixed(1)+'" fill="#E8C27A"/>';
  return h+'</g>';
}
// 砦のタイル：中央は fort-core、外周は中央から見た方向（DIRS の番号）の fort-ring-0〜5
function fortTile(c,f){
  if(f.part==='core')return 'fort-core';
  const [col,row]=f.fid.split(',').map(Number),o=fromCR(col,row);
  const d=DIRS.findIndex(([dq,dr])=>o.q+dq===c.q&&o.r+dr===c.r);
  return d<0?null:'fort-ring-'+d;
}
// 地形タイル・川・拠点（ゲーム画面・マップ編集で共通の下地）。st＝{hp:{キー→{hp,done}},max:{fence,jinchi,fort}} を渡すと、柵・陣地・砦を耐久に応じて描く
function boardSVG(st){
  let h='<g>';
  const tw=(TILE.src*IMG_S).toFixed(1);
  cells.forEach(c=>{
    let t=tileOf(c);const f=featOf(c);
    if(f&&f.type==='fort'){const s=st&&st.hp[key(c.q,c.r)];if(!st||(s&&s.hp>0))t=fortTile(c,f)||t;} // 壊れた砦のマスは地形のタイルに戻す
    h+='<image class="tile" href="tiles/'+t+'.png" x="'+(c.x-TILE.cx*IMG_S).toFixed(1)+'" y="'+(c.y-TILE.cy*IMG_S).toFixed(1)+'" width="'+tw+'" height="'+tw+'"/>';
  });
  h+='</g><g>';
  riverPaths().forEach(d=>{h+='<path class="rv rv-bank" d="'+d+'" stroke-width="'+(S*.36).toFixed(1)+'"/><path class="rv rv-water" d="'+d+'" stroke-width="'+(S*.24).toFixed(1)+'"/><path class="rv rv-shine" d="'+d+'" stroke-width="'+(S*.1).toFixed(1)+'"/>';});
  h+='</g><g style="pointer-events:none">';
  featureAt.forEach((f,k)=>{
    const c=cells.get(k);if(!c)return;
    if((f.type==='fence'||f.type==='fort'||f.type==='jinchi')&&st){const s=st.hp[k];if(!s||!(s.hp>0))return;h+=featureSVG(f,c,s.hp/st.max[f.type],!s.done);}
    else h+=featureSVG(f,c,null,false);
  });
  return h+'</g>';
}
const dist=(a,b)=>{const dq=a.q-b.q,dr=a.r-b.r;return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2;};

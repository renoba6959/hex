/* 朧 OBORO：盤面（座標・地形・マップ・描画）。ゲーム画面とマップ編集で共有 */
// 判定は正六角形の座標(toPix)で行い、描画だけ縦をKだけつぶして立体タイルに合わせる
const S=36, SQ3=Math.sqrt(3), EPS=1e-6, COLS=14, ROWS=10;
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
for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){ // 奥の行から順に（描画順）
  const {q,r}=fromCR(col,row),p=toScreen(q,r);cells.set(key(q,r),{q,r,x:p.x,y:p.y});
}
const xs=[...cells.values()].map(c=>c.x),ys=[...cells.values()].map(c=>c.y);
const VB=[Math.min(...xs)-S*SQ3/2-6,Math.min(...ys)-(TILE.cy-TILE.top)*IMG_S-4,
  Math.max(...xs)-Math.min(...xs)+S*SQ3+12,Math.max(...ys)-Math.min(...ys)+(TILE.bottom-TILE.top)*IMG_S+8];
const hexPts=(x,y)=>{let p=[];for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;p.push((x+S*Math.cos(a)).toFixed(1)+','+(y+S*K*Math.sin(a)).toFixed(1));}return p.join(' ');};
const DIR_NAME=['右','右下','左下','左','左上','右上'];
// aから見たbの方向（6方向のどれに近いか）
const dirTo=(a,b)=>{const p=toPix(a.q,a.r),o=toPix(b.q,b.r);return ((Math.round(Math.atan2(o.y-p.y,o.x-p.x)*3/Math.PI)%6)+6)%6;};
const SANG=DIRS.map(([dq,dr])=>{const p=toScreen(dq,dr);return Math.atan2(p.y,p.x)*180/Math.PI;}); // 画面上の各方向の角度
const ZONE={blue:[0,2],red:[COLS-3,COLS-1]}; // 配置範囲を塗っていないマップの既定（両端の3列）
const zoneAt=new Map(); // 編成で部隊を動かせるマス → 'blue' | 'red'
const inZone=(side,q,r)=>cells.has(key(q,r))&&zoneAt.get(key(q,r))===side;
function defaultZones(){const z={};for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){if(col<=ZONE.blue[1])z[col+','+row]='blue';else if(col>=ZONE.red[0])z[col+','+row]='red';}return z;}

/* ---- マップ ---- */
// terrain は「列,行」→ 地形（書いていないマスは平地）。zones は「列,行」→ 配置範囲（未設定なら両端の3列）
// units は初期配置 {side,type,col,row,f,men}。rev は部隊を編集するたびに増える（配置画面で保存した配置を古くするため）
const TERRAINS=['plain','forest','hill','mountain','river'];
const BUILTIN_MAPS=[
  {id:'standard',name:'標準',builtin:true,terrain:{"7,0":"forest", "8,0":"forest", "8,1":"forest", "9,0":"forest", "4,9":"forest", "5,9":"forest", "5,8":"forest", "6,9":"forest", "4,4":"hill", "4,5":"hill", "5,5":"hill", "6,2":"mountain", "6,3":"mountain", "7,3":"mountain", "7,4":"river", "7,5":"river", "8,6":"river", "7,7":"river", "7,8":"river", "7,9":"river"},rev:1,
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
// 保存データや読み込んだデータを正しい形に整える
function cleanMap(m){
  const out={id:String(m.id),name:String(m.name||'無題'),terrain:{},units:[],rev:Number(m.rev)||0};
  if(isObj(m.terrain))Object.entries(m.terrain).forEach(([k,t])=>{if(/^\d+,\d+$/.test(k)&&TERRAINS.includes(t)&&t!=='plain')out.terrain[k]=t;});
  if(isObj(m.zones)){out.zones={};Object.entries(m.zones).forEach(([k,z])=>{if(/^\d+,\d+$/.test(k)&&(z==='blue'||z==='red'))out.zones[k]=z;});}
  if(Array.isArray(m.units))m.units.forEach(u=>{
    if(!u||!UNIT_TYPES.includes(u.type)||(u.side!=='blue'&&u.side!=='red'))return;
    const col=u.col|0,row=u.row|0;if(col<0||col>=COLS||row<0||row>=ROWS||out.units.some(x=>x.col===col&&x.row===row))return;
    const o={side:u.side,type:u.type,col,row,f:((u.f|0)%6+6)%6};if(u.men>0)o.men=Math.round(u.men);
    out.units.push(o);
  });
  return out;
}
const findMap=(db,id)=>db.maps.find(m=>m.id===id)||db.maps[0];
const terrainAt=new Map();
function useMap(map){
  zoneAt.clear();
  Object.entries(map.zones||defaultZones()).forEach(([k,z])=>{const [col,row]=k.split(',').map(Number);const c=fromCR(col,row);if(cells.has(key(c.q,c.r)))zoneAt.set(key(c.q,c.r),z);});
  terrainAt.clear();
  Object.entries(map.terrain||{}).forEach(([k,t])=>{
    const [col,row]=k.split(',').map(Number);
    if(col>=0&&col<COLS&&row>=0&&row<ROWS&&t!=='plain'&&TERRAINS.includes(t)){const c=fromCR(col,row);terrainAt.set(key(c.q,c.r),t);}
  });
}
const terOf=p=>terrainAt.get(key(p.q,p.r))||'plain';

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
// 地形タイルと川（ゲーム画面・マップ編集で共通の下地）
function boardSVG(){
  let h='<g>';
  const tw=(TILE.src*IMG_S).toFixed(1);
  cells.forEach(c=>{h+='<image class="tile" href="tiles/'+tileOf(c)+'.png" x="'+(c.x-TILE.cx*IMG_S).toFixed(1)+'" y="'+(c.y-TILE.cy*IMG_S).toFixed(1)+'" width="'+tw+'" height="'+tw+'"/>';});
  h+='</g><g>';
  riverPaths().forEach(d=>{h+='<path class="rv rv-bank" d="'+d+'" stroke-width="'+(S*.36).toFixed(1)+'"/><path class="rv rv-water" d="'+d+'" stroke-width="'+(S*.24).toFixed(1)+'"/><path class="rv rv-shine" d="'+d+'" stroke-width="'+(S*.1).toFixed(1)+'"/>';});
  return h+'</g>';
}
const dist=(a,b)=>{const dq=a.q-b.q,dr=a.r-b.r;return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2;};

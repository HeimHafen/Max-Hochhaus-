export const count = 50;
export const heightAt = level => level === 0 ? 0 : 6 + (level - 1) * 3.8;
const coreLeft = 8.1, coreRight = 15.8;
const stairBack = 3.05, stairFront = 9.2;
const lane = [[8.4,11.65],[12.25,15.5]];

export function buildTower(T, scene) {
 const floors=[], walls=[], batches=new Map();
 const mat=(color,roughness=.68,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
 const stone=mat(0x48444a), deck=mat(0x77736b), bronze=mat(0x8f582d,.35,{metalness:.59});
 const dark=mat(0x232d39), handrail=mat(0xffb163,.4,{emissive:0xff8f41,emissiveIntensity:1.38});
 const foliage=mat(0x394632,.92);
 const lamp=mat(0xffc487,.35,{emissive:0xffad5d,emissiveIntensity:1.18});
 const glazing=mat(0x729bd2,.24,{transparent:true,opacity:.22,depthWrite:false});
 const panels=[0x172b48,0x243957,0x344761,0x5c4b3b].map((color,index)=>mat(color,.29,{
  transparent:true,opacity:index===3?.68:.79,depthWrite:false,
  emissive:index===3?0x6e411f:0x102538,emissiveIntensity:index===3?.43:.26
 }));
 function box(material,x,y,z,w,h,d,rotation=0){
  if(!batches.has(material))batches.set(material,[]);
  batches.get(material).push([x,y,z,w,h,d,rotation]);
 }
 function slab(a,b,c,d,y,material=deck,thick=.22) {
  floors.push([a,b,c,d,y]);
  box(material,(a+b)/2,y-thick/2,(c+d)/2,b-a,thick,d-c);
 }
 function barrier(a,b,c,d,low,high){walls.push([a,b,c,d,low,high]);}
 function guard(x,a,b,start,end){
  const center=(a+b)/2,length=Math.hypot(b-a,end-start);
  box(handrail,x,(start+end)/2+1.02,center,.048,.058,length,Math.atan2(start-end,b-a));
  for(let i=0;i<=5;i++){
   const t=i/5;
   box(bronze,x,start+(end-start)*t+.51,a+(b-a)*t,.038,1.02,.038);
  }
 }
 function flight([left,right],a,b,low,high,steps){
  const width=right-left;
  for(let i=0;i<steps;i++){
   const z0=a+(b-a)*i/steps,z1=a+(b-a)*(i+1)/steps;
   const y=low+(high-low)*(i+1)/steps;
   slab(left,right,Math.min(z0,z1),Math.max(z0,z1),y,deck,.30);
   for(const x of [left,right])barrier(x-.02,x+.02,Math.min(z0,z1),Math.max(z0,z1),y+.035,y+1.05);
  }
  for(const x of [left,right])guard(x,a,b,low,high);
  box(stone,(left+right)/2,(low+high)/2-.24,(a+b)/2,width-.12,.18,Math.hypot(b-a,high-low),Math.atan2(low-high,b-a));
 }
 const top=heightAt(count-1)+5;
 for(let level=0;level<count;level++){
  const y=heightAt(level),h=level===count-1?5:heightAt(level+1)-y;
  slab(-15.8,coreLeft,-11.8,12,y);
  slab(coreLeft,15.8,-11.8,1.25,y);
  slab(coreLeft,15.8,stairFront,12,y);
  box(bronze,12,y+.57,1.25,7.6,1.14,.061);
  barrier(coreLeft,15.8,1.21,1.29,y+.08,y+1.15);
  for(const [l,r] of [[coreLeft,8.4],[11.65,12.25],[15.5,15.8]]){
   box(bronze,(l+r)/2,y+.53,stairFront,r-l,1.06,.055);
   barrier(l,r,stairFront-.04,stairFront+.04,y+.08,y+1.15);
  }
  box(dark,coreLeft-.04,y+h/2,5.22,.15,h,7.94);
  barrier(coreLeft-.12,coreLeft+.03,1.25,stairFront,y,y+h);
  if(level===count-1){
   box(bronze,10.025,y+.57,stairFront,3.25,1.14,.06);
   barrier(8.4,11.65,stairFront-.04,stairFront+.04,y+.08,y+1.15);
  }
  if(level<count-1){
   const mid=y+h/2,steps=level===0?16:10;
   slab(coreLeft,15.8,1.25,stairBack,mid);
   flight(lane[0],stairFront,stairBack,y,mid,steps);
   flight(lane[1],stairBack,stairFront,mid,y+h,steps);
   box(lamp,12,mid-.26,2.04,6.7,.04,.07);
  }
  for(const z of [-11.96,11.96]){
   const front=z>0;
   for(let col=0;col<12;col++){
    const x=-14.63+col*2.66;
    if(front&&(x>8 || level===0&&Math.abs(x)<3))continue;
    const material=level===0||level===count-1?glazing:panels[(col*7+level*13+(front?1:0))%11<2?3:(col+level)%3];
    box(material,x,y+h/2,z,2.56,h-.23,.055);
    if(level>0&&(col*17+level*7)%9<2){
     box(lamp,x,y+h-.58,z*.81,1.50,.065,.12);
    }
   }
   if(front&&level===0){
    for(const x of [-9.48,9.48])box(bronze,x,y+.10,z,13.19,.18,.30);
   }else box(bronze,0,y+.10,z,32.15,.18,.30);
  }
  for(const x of [-16,16]){
   for(let col=0;col<9;col++){
    const z=-10.65+col*2.66;
    const material=x>0&&z>1.2||level===0||level===count-1?glazing:panels[(col+level*5)%4];
    box(material,x,y+h/2,z,.055,h-.23,2.56);
   }
   box(bronze,x,y+.10,0,.30,.18,24);
  }
  box(glazing,12,y+h/2,11.96,7.86,h-.22,.06);
  for(const x of [-10,-4,2,8])box(lamp,x,y+h-.32,-3,.10,.045,11);
 }
 for(const z of [-12.04,12.04])for(let i=0;i<=12;i++){
  const x=-16+i*32/12;
  if(z>0&&Math.abs(x)<3.1) {
   box(bronze,x,(top+3.9)/2,z,.15,top-3.9,.20);
  } else box(bronze,x,top/2,z,.15,top,.20);
 }
 for(const x of [-16.04,16.04])for(let i=0;i<=9;i++)box(bronze,x,top/2,-12+i*24/9,.22,top,.16);
 for(const x of [-15.65,-8.5,8,15.65])box(stone,x,3,11.6,.85,6,1.3);
 for(let x=-16;x<=16;x+=1.6)for(const z of [-12.18,12.18])box(bronze,x,top-1,z,.17,3.4,.54);
 for(let z=-12;z<=12;z+=1.6)for(const x of [-16.18,16.18])box(bronze,x,top-1,z,.54,3.4,.17);
 for(const x of [-15.61,7.91,15.82]){
  box(bronze,x,(top+5.8)/2,12.19,.39,top-5.8,.51);
  box(handrail,x-.13,(top+5.8)/2,12.45,.037,top-5.8,.048);
 }
 box(stone,0,top,0,32.35,.42,24.34);
 box(bronze,0,4.1,13.0,8.5,.24,3.2);
 box(lamp,0,3.97,13.1,6.7,.038,.12);
 for(const x of [-4.0,4.0])box(bronze,x,2.05,14.1,.16,4.1,.16);
 barrier(-16.15,-15.8,-12.14,12.14,0,top);
 barrier(15.8,16.15,-12.14,12.14,0,top);
 barrier(-16.15,16.15,-12.14,-11.8,0,top);
 for(const [l,r] of [[-16.15,-2.8],[2.8,16.15]])barrier(l,r,11.8,12.14,0,top);
 barrier(-2.8,2.8,11.8,12.14,3.55,top);
 slab(-110,110,12,135,0,dark,.08);
 slab(-110,110,-135,-12,0,dark,.08);
 slab(-110,-16,-12,12,0,dark,.08);
 slab(16,110,-12,12,0,dark,.08);
 // Plaza stone joints, low planters and a subdued city silhouette.
 const paving=mat(0x6c6663,.61);
 box(paving,0,-.025,47,77,.05,70);
 for(let x=-37.5;x<=37.5;x+=2.5)box(stone,x,.005,47,.023,.01,70);
 for(let z=13;z<=82;z+=2.5)box(stone,0,.006,z,77,.01,.023);
 const crowns=[];
 for(const x of [-22,22,-30,30]) {
  box(stone,x,.48,24,3.8,.96,4);
  box(dark,x,2,24,.24,3.5,.24);
  for(let i=0;i<22;i++){
   const angle=i*2.39996,radius=1.75*Math.sqrt(i/22);
   crowns.push([x+radius*Math.cos(angle),4.25+.78*Math.cos(i*1.71),
    24+.83*radius*Math.sin(angle),.62+.10*(i%5)]);
  }
  box(lamp,x,.48,26.02,1.7,.06,.08);
  barrier(x-1.9,x+1.9,22,26,0,1.35);
 }
 for(let i=0;i<14;i++){
  const x=(i-6.5)*12,h=7+(i*23%17);
  box(stone,x,h/2,-39-(i%3)*8,10,h,10);
 }
 const model=new T.Group();
 const cuboid=new T.BoxGeometry(1,1,1), pose=new T.Object3D();
 for(const [material,items] of batches){
  const mesh=new T.InstancedMesh(cuboid,material,items.length);
  items.forEach(([x,y,z,w,h,d,angle],i)=>{
   pose.position.set(x,y,z);pose.scale.set(w,h,d);pose.rotation.set(angle,0,0);pose.updateMatrix();
   mesh.setMatrixAt(i,pose.matrix);
  });
  model.add(mesh);
 }
 const canopy=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),foliage,crowns.length);
 crowns.forEach(([x,y,z,size],i)=>{
  pose.position.set(x,y,z);pose.scale.set(size,size*.82,size);pose.rotation.set(0,i,0);
  pose.updateMatrix();canopy.setMatrixAt(i,pose.matrix);
 });
 model.add(canopy);
 scene.add(model);
 return {floors,walls,model};
}

export function move(nav, p, x, z) {
 let y=-Infinity;
 for(const [l,r,b,f,h] of nav.floors){
  if(x>=l&&x<=r&&z>=b&&z<=f&&h>=p.y-.25&&h<=p.y+.24)y=Math.max(y,h);
 }
 if(!Number.isFinite(y))return p;
 const rad=.22;
 if(nav.walls.some(([l,r,b,f,min,max])=>
  x+rad>l&&x-rad<r&&z+rad>b&&z-rad<f&&y+.043<max&&y+1.65>min))return p;
 return {x,y,z};
}

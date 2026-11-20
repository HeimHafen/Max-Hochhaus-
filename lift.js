import {count,heightAt} from './tower.js';

export function addLift(T,scene,nav){
 const frame=new T.MeshStandardMaterial({color:0x815940,metalness:.65,roughness:.32});
 const glass=new T.MeshStandardMaterial({color:0x80b6e5,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide});
 const floor=new T.MeshStandardMaterial({color:0x4b4544,roughness:.45});
 const shine=new T.MeshBasicMaterial({color:0xffce95});
 function box(group,mat,x,y,z,w,h,d){
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);group.add(mesh);return mesh;
 }
 const top=heightAt(count-1)+4.8;
 const shaft=new T.Group(), cabin=new T.Group();
 scene.add(shaft,cabin);
 for(const x of [-1.72,1.72]){
  box(shaft,glass,x,top/2,-13.84,.04,top,3.82);
  for(const z of [-15.77,-12.04])box(shaft,frame,x,top/2,z,.16,top,.16);
 }
 box(shaft,glass,0,top/2,-15.77,3.44,top,.04);
 box(shaft,frame,0,top,-13.88,3.55,.28,3.88);
 box(cabin,floor,0,-.115,-13.88,3.34,.23,3.72);
 box(cabin,frame,0,2.65,-13.88,3.34,.17,3.72);
 for(const x of [-1.56,1.56]){
  box(cabin,glass,x,1.32,-13.88,.06,2.64,3.60);
  box(cabin,shine,x*.89,2.55,-13.88,.06,.04,3.18);
 }
 box(cabin,glass,0,1.32,-15.65,3.12,2.64,.06);
 box(cabin,frame,0,1.04,-15.6,3.12,.08,.08);
 const doors=Array.from({length:count},(_,i)=>[-1,1].map(side=>
  box(shaft,glass,side*.59,heightAt(i)+1.32,-11.99,1.16,2.64,.085)));
 for(let i=0;i<count;i++){
  const y=heightAt(i);
  for(const x of [-1.19,1.19]){
   box(shaft,frame,x,y+1.36,-11.98,.11,2.72,.17);
   box(shaft,shine,x*1.13,y+1.05,-11.82,.074,.22,.04);
  }
  box(shaft,frame,0,y+2.71,-11.98,2.48,.12,.17);
 }
 const cabinFloor=[-1.62,1.62,-15.66,-11.80,0];
 const gate=[-1.16,1.16,-12.05,-11.91,0,top];
 nav.walls.push(
  [-1.85,-1.52,-15.85,-11.80,0,top],
  [1.52,1.85,-15.85,-11.80,0,top],
  [-1.85,1.85,-15.85,-15.63,0,top]
 );
 nav.floors.push(cabinFloor);
 nav.walls.push(gate);
 let current=0, target=0, start=0, elapsed=0, duration=0, opening=0, riding=false;
 const api={
  get current(){return current;},
  get moving(){return duration>0;},
  inside:p=>Math.abs(p.x)<1.51&&p.z<-12.10&&p.z>-15.66,
  near:p=>Math.abs(p.x)<2.65&&p.z>-11.91&&p.z<-8.4,
  request(level,passenger=false){
   if(duration||!Number.isInteger(level)||level<0||level>=count||level===current)return false;
   target=level;start=cabin.position.y;elapsed=0;riding=passenger;
   duration=Math.max(2.1,Math.abs(heightAt(target)-start)/12+1.4);
   opening=0;
   return true;
  },
  update(dt,p){
   if(duration){
    elapsed+=dt;
    const t=Math.min(1,elapsed/duration);
    cabin.position.y=start+(heightAt(target)-start)*t*t*(3-2*t);
    if(riding)p.y=cabin.position.y;
    if(t===1){current=target;duration=0;riding=false;}
   }else{
    opening=Math.min(1,opening+dt*2);
   }
   cabinFloor[4]=cabin.position.y;
   // Preserve a barrier at every landing except the open doors of the parked cabin.
   gate[4]=0;gate[5]=top;
   nav.liftOpening=duration||opening<.86?null:heightAt(current);
   for(let i=0;i<count;i++){
    const gap=i===current&&!duration?opening*.60:0;
    doors[i][0].position.x=-.59-gap;
    doors[i][1].position.x=.59+gap;
   }
  }
 };
 nav.liftGate=gate;
 return api;
}

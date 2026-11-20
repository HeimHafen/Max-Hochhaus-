import {addLift} from './lift.js';
import * as T from './vendor/three.module.js';
import {buildTower,count,heightAt,move} from './tower.js';

try { run(); } catch(error) {
 document.querySelector('#error').hidden=false;
 console.error(error);
}

function run(){
 const canvas=document.querySelector('canvas'), renderer=new T.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();
 scene.fog=new T.FogExp2(0x222f4b,.0025);
 const sky=new T.Mesh(new T.SphereGeometry(295,32,16),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,
  vertexShader:`varying vec3 direction;
   void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 direction;
   void main(){
    vec3 d=normalize(direction);
    float altitude=max(0.0,d.y);
    vec3 dusk=mix(vec3(.47,.35,.39),vec3(.12,.21,.40),smoothstep(0.0,.31,altitude));
    vec3 color=mix(dusk,vec3(.06,.12,.27),smoothstep(.31,.91,altitude));
    float cloud=sin(d.x*36.0+sin(d.z*38.0)*1.8+d.y*88.0)*sin(d.z*26.0+d.y*84.0);
    color*=1.0-.19*smoothstep(.26,.88,cloud)*(1.0-smoothstep(.18,.49,altitude));
    gl_FragColor=vec4(color,1.0);
   }`
 }));
 sky.renderOrder=-100;
 scene.add(sky);
 scene.add(new T.HemisphereLight(0x9db9ff,0x8a5f44,1.58));
 const sun=new T.DirectionalLight(0xffce9c,1.65);
 sun.position.set(36,30,38);
 scene.add(sun);
 const nav=buildTower(T,scene),lift=addLift(T,scene,nav);
 for(const x of [-10,0,9,14]){
  const light=new T.PointLight(0xffb769,97,14,2);
  light.position.set(x,3.9,9);scene.add(light);
  const crownLight=new T.PointLight(0xffbd80,82,13,2);
  crownLight.position.set(x,heightAt(count-1)+3.2,7);scene.add(crownLight);
 }
 const camera=new T.PerspectiveCamera(64,1,.06,380);
 camera.rotation.order='YXZ';
 const menu=document.querySelector('#menu'), button=document.querySelector('#places'), selector=document.querySelector('#floor');
 const label=document.querySelector('#position');
 const floorTitle=i=>i===0?'Lobby':i===count-1?'50. Etage · Aussicht':'Etage '+(i+1);
 for(let i=0;i<count;i++)selector.add(new Option(floorTitle(i),i));
 let p, yaw, pitch, eye, choosingLift=false;
 const liftButton=document.querySelector('#lift'),go=document.querySelector('#go');
 const contacts=new Map(),keys=new Set();
 const close=()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');};
 function point(x,y,z,angle,tilt){
  p={x,y,z};eye=y+1.65;yaw=angle;pitch=tilt;
  contacts.clear();close();
 }
 function plaza(){point(42,0,118,.342,.49);}
 plaza();
 button.onclick=()=>{if(lift.moving&&lift.inside(p))return;choosingLift=false;go.textContent='Betreten';menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));contacts.clear();};
 document.querySelector('#plaza').onclick=plaza;
 const floorIndex=y=>y<6?0:Math.min(count-1,1+Math.floor((y-6+.01)/3.8));
 go.onclick=()=>{
  const target=Number(selector.value);
  if(choosingLift){lift.request(target,true);close();}
  else point(4,heightAt(target),10.45,-.8,0);
 };
 liftButton.onclick=()=>{
  if(lift.moving)return;
  if(lift.inside(p)){
   choosingLift=true;selector.value=lift.current;go.textContent='Fahren';
   menu.hidden=false;button.setAttribute('aria-expanded','true');contacts.clear();
  }else lift.request(floorIndex(p.y));
 };
 canvas.onpointerdown=e=>{
  if(!menu.hidden){close();return;}
  canvas.setPointerCapture(e.pointerId);
  contacts.set(e.pointerId,{walk:e.pointerType!=='mouse'&&e.clientX<innerWidth/2,x:e.clientX,y:e.clientY,s:0,f:0});
 };
 canvas.onpointermove=e=>{
  const t=contacts.get(e.pointerId);
  if(!t)return;
  if(t.walk){
   t.s=T.MathUtils.clamp((e.clientX-t.x)/48,-1,1);t.f=T.MathUtils.clamp((t.y-e.clientY)/48,-1,1);
  }else{
   yaw-=(e.clientX-t.x)*.005;pitch=T.MathUtils.clamp(pitch+(t.y-e.clientY)*.005,-1.32,1.40);
   t.x=e.clientX;t.y=e.clientY;
  }
 };
 canvas.onpointerup=canvas.onlostpointercapture=canvas.onpointercancel=e=>contacts.delete(e.pointerId);
 addEventListener('keydown',e=>keys.add(e.code));
 addEventListener('keyup',e=>keys.delete(e.code));
 addEventListener('blur',()=>{keys.clear();contacts.clear();});
 function size(){
  renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 }
 addEventListener('resize',size);size();
 let last=performance.now();
 renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-last)/1000,.04);last=now;
  lift.update(dt,p);
  const inside=lift.inside(p);
  if(menu.hidden&&!(inside&&lift.moving)){
   let f=Number(keys.has('KeyW'))-Number(keys.has('KeyS')),s=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
   for(const touch of contacts.values())if(touch.walk){f+=touch.f;s+=touch.s;}
   const scale=dt*3.9/Math.max(1,Math.hypot(f,s));
   const dx=(s*Math.cos(yaw)-f*Math.sin(yaw))*scale;
   const dz=(-s*Math.sin(yaw)-f*Math.cos(yaw))*scale;
   if(dx||dz){p=move(nav,p,p.x+dx,p.z);p=move(nav,p,p.x,p.z+dz);}
  }
  eye+=(p.y+1.65-eye)*Math.min(1,dt*16);
  camera.position.set(p.x,eye,p.z);sky.position.copy(camera.position);camera.rotation.set(pitch,yaw,0);
  const level=p.y<6?0:Math.min(count-1,1+Math.floor((p.y-6+.01)/3.8));
  liftButton.hidden=!menu.hidden||(!inside&&!lift.near(p));
  liftButton.disabled=lift.moving||(lift.near(p)&&lift.current===level);
  liftButton.textContent=lift.moving?(inside?'Aufzug fährt':'Aufzug unterwegs'):inside?'Etage wählen':lift.current===level?'Aufzug bereit':'Aufzug rufen';
  const location=inside?'Glasaufzug · '+floorTitle(level):Math.abs(p.x)>16||Math.abs(p.z)>12?'Vorplatz':p.x>8.22&&p.z>1.25?'Treppenhaus · '+floorTitle(level):floorTitle(level);
  if(label.textContent!==location)label.textContent=location;
  renderer.render(scene,camera);
 });
}

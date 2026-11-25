/* Our Slice — single-player exploration foundation. No backend or persistence yet. */
const WIDTH=800,HEIGHT=600,WORLD_W=1500,WORLD_H=1100;
const held={left:false,right:false,up:false,down:false};
const hint=document.getElementById('hint'),journal=document.getElementById('journal');
for(const btn of document.querySelectorAll('[data-dir]')){
  const d=btn.dataset.dir;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();held[d]=true;btn.setPointerCapture(e.pointerId)});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>held[d]=false);
}
const config={type:Phaser.AUTO,parent:'game',width:WIDTH,height:HEIGHT,backgroundColor:'#9eae79',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER},scene:{create,update}};
new Phaser.Game(config);
let player,cursors,keys,found=new Set(),discoveries=[];
function create(){
  const s=this; s.cameras.main.setBounds(0,0,WORLD_W,WORLD_H);
  const g=s.add.graphics();
  g.fillStyle(0x9eae79).fillRect(0,0,WORLD_W,WORLD_H);
  // Paths and creek are permanent landscape features.
  g.lineStyle(65,0xb4a47e).beginPath().moveTo(0,470).lineTo(400,480).lineTo(750,680).lineTo(1400,620).strokePath();
  g.lineStyle(42,0x739c9f).beginPath().moveTo(1050,0).lineTo(980,240).lineTo(1100,520).lineTo(1010,800).lineTo(1120,1100).strokePath();
  const rng=new Phaser.Math.RandomDataGenerator(['our-slice-bush-v1']);
  for(let i=0;i<190;i++){
    const x=rng.between(30,WORLD_W-30),y=rng.between(30,WORLD_H-30);
    if(Math.abs(y-(470+(x/1500)*160))<90 || (x>940&&x<1170) || (x>210&&x<550&&y>300&&y<610))continue;
    const r=rng.between(12,28);g.fillStyle(0x526d48).fillCircle(x+4,y+7,r+3);g.fillStyle(i%3?0x66865b:0x79936a).fillCircle(x,y,r);g.fillStyle(0x9ab080,.4).fillCircle(x-5,y-5,r/2);
  }
  for(let i=0;i<30;i++){const x=rng.between(50,1450),y=rng.between(80,1000);g.fillStyle(0x9d9b88).fillEllipse(x,y,rng.between(12,34),rng.between(8,22));}
  const van=s.add.container(355,420);const vg=s.add.graphics();vg.fillStyle(0xe8e2ca).fillRoundedRect(-58,-27,116,54,9);vg.fillStyle(0x516e77).fillRect(-36,-23,38,16);vg.fillStyle(0x516e77).fillRect(12,-23,31,16);vg.fillStyle(0x333d3c).fillRect(-42,23,20,9);vg.fillRect(22,23,20,9);van.add(vg);
  s.add.text(355,468,'OUR CAMPERVAN',{font:'16px monospace',color:'#263b2a',backgroundColor:'#dce1c5'}).setOrigin(.5);
  // Placeholder explorer sprite. Final likeness will replace this artwork.
  const pg=s.add.graphics();pg.fillStyle(0x392e28).fillCircle(0,-16,11);pg.fillStyle(0xe4b59c).fillCircle(0,-11,8);pg.fillStyle(0x596d86).fillRoundedRect(-11,0,22,25,5);pg.fillStyle(0x403b35).fillRect(-9,22,7,10).fillRect(3,22,7,10);
  player=s.add.container(420,500,[pg]);player.setDepth(10);
  const dog=s.add.graphics();dog.fillStyle(0x262726).fillEllipse(0,0,24,13);dog.fillTriangle(-10,-3,-9,-18,-2,-8);dog.fillTriangle(1,-8,10,-20,11,-3);dog.fillStyle(0xe8e6d9).fillCircle(10,3,3);s.dog=s.add.container(390,523,[dog]).setDepth(9);
  discoveries=[{id:'creek',x:1020,y:560,label:'Seasonal creek discovered'},{id:'granite',x:790,y:260,label:'Granite outcrop discovered'},{id:'track',x:680,y:675,label:'Bushwalking track discovered'},{id:'secret',x:1260,y:870,label:'A curious little doorway discovered'}];
  for(const d of discoveries){const marker=s.add.circle(d.x,d.y,9,0xf3d88e).setStrokeStyle(2,0x564e32);s.tweens.add({targets:marker,alpha:.4,duration:1000,yoyo:true,repeat:-1});}
  cursors=s.input.keyboard.createCursorKeys();keys=s.input.keyboard.addKeys('W,A,S,D');
  s.cameras.main.startFollow(player,true,.12,.12);
  s.add.text(18,16,'Explore your bush block',{font:'18px monospace',color:'#fff',backgroundColor:'#344a37',padding:{x:8,y:5}}).setScrollFactor(0).setDepth(20);
}
function update(_time,delta){
  const dt=Math.min(delta,50)/1000,speed=205;let dx=Number(held.right||cursors.right.isDown||keys.D.isDown)-Number(held.left||cursors.left.isDown||keys.A.isDown);let dy=Number(held.down||cursors.down.isDown||keys.S.isDown)-Number(held.up||cursors.up.isDown||keys.W.isDown);
  const norm=Math.hypot(dx,dy)||1;player.x=Phaser.Math.Clamp(player.x+dx/norm*speed*dt,20,WORLD_W-20);player.y=Phaser.Math.Clamp(player.y+dy/norm*speed*dt,25,WORLD_H-25);
  const dog=this.dog;dog.x+=(player.x-29-dog.x)*Math.min(1,dt*3);dog.y+=(player.y+22-dog.y)*Math.min(1,dt*3);
  for(const d of discoveries){if(!found.has(d.id)&&Phaser.Math.Distance.Between(player.x,player.y,d.x,d.y)<48){found.add(d.id);hint.textContent=d.label+'!';journal.textContent=`Discoveries: ${found.size} / ${discoveries.length}`;}}
}

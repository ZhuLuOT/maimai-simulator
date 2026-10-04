(function(root){
  const data={
    door:{id:'glitch',name:'表门 · ERROR',hidden:true,region:'7sRefちほー4',song:'11879',keySongs:[],color:'#2638ff',keyText:'通关棱镜塔后强制进入，通关后不可重选',pool:['11739','11744','11752','11808','11813','11817'],secondPool:['11740','11745','11749','11753','11809','11814','11818'],challengePoolNote:'第 1 首：PRiSM 系列 Perfect Challenge；第 2 首：已解禁门曲；第 3 首：乱码课题'},
    doors:[
      {id:'hope',name:'希望之门',hidden:true,requires:'glitch',region:'maimaiエリア',song:'1819',keySongs:[],color:'#c9a056',keyText:'通关表门后开放，无需额外钥匙',tracks:['1736','10835','1819'],pool:[],challengePoolNote:'固定课题：プリズム△▽リズム → Believe the Rainbow → AFTER PANDORA'},
      {id:'final',name:'里门 · KALEIDXSCOPE',hidden:true,requires:'hope',region:'FINAL',song:'11820',keySongs:[],color:'#b07cff',keyText:'通关希望之门后开放',tracks:['11820'],pool:[],challengePoolNote:'仅一首完整版 Xaleid◆scopiX；首次通关后追加 Ref:rain (for 7th Heaven)'},
      {id:'extra',name:'EXTRA',hidden:true,automatic:true,region:'FINAL',song:'11821',keySongs:[],color:'#7ee0d6',keyText:'首次通关里门后自动演奏',tracks:['11821'],pool:[],challengePoolNote:'Ref:rain (for 7th Heaven)'}
    ],
    song:{id:'11879',title:'�̷�̶⌁̸◆̵�̴⟐̷�̸⌁̶_0x7sRƎF',type:'DX',artist:'xi',genre:'舞萌',bpm:180,version:'maimai でらっくす PRiSM PLUS',isNew:true,ds:[7.9,11,13.7,14.9],level:['7+','11','13+','14+'],notes:[[248,15,6,20,85],[420,43,9,28,92],[515,93,45,28,138],[917,89,105,47,250]],cover:'assets/kaleidxscope/glitch.png'},
    sources:['https://maimai-net.cn/kaleidxscope','https://www.diving-fish.com/api/maimaidxprober/music_data','https://assets.lxns.net/maimai/jacket/1879.png'],
    adaptation:'国服跳过 LINE、DX Pass 与旅行伙伴。自动接续不另投币。里门 LIFE 暂沿用模拟器开放日程；无真实音符时间轴，首次后半严格判定按采样判定顺序模拟。'
  };
  if(typeof module!=='undefined')module.exports=data;else root.GLITCH_DOOR=data;
})(globalThis);

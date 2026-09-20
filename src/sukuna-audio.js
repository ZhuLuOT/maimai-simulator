export const SUKUNA_TRACKS = [
  {id:'yuai',title:'雨爱',src:'assets/audio/sukuna/yuai.mp3'},
  {id:'aizo',title:'AIZO',src:'assets/audio/sukuna/aizo.mp3'}
];

// Keep one player across modal renders and strategy/selection screens.
export function createSukunaAudio({makeAudio=src=>new Audio(src),random=Math.random,onChange=()=>{}}={}) {
  let owner=null, audio=null, status='idle', generation=0;
  const notify=()=>onChange();
  function stop() {
    generation++;
    if(audio){audio.onplaying=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}
    audio=null;owner=null;status='idle';
  }
  async function play() {
    if(!audio||owner.musicPaused||status==='loading'||status==='playing')return;
    const current=audio,token=generation;
    status='loading';notify();
    try {
      await current.play();
      if(token!==generation){if(current!==audio||owner?.musicPaused)current.pause();return;}
      status='playing';notify();
    } catch(e) {
      if(token!==generation)return;
      status=e.name==='NotAllowedError'?'blocked':'error';notify();
    }
  }
  return {
    sync(state) {
      const duel=state.major?.duel;
      if(state.ending||!duel||!['intro','select','battle','win','loss','draw'].includes(duel.stage)){
        if(owner)stop();return false;
      }
      if(owner===duel)return false;
      stop();owner=duel;
      const changed=!SUKUNA_TRACKS.some(t=>t.id===duel.music);
      if(changed)duel.music=SUKUNA_TRACKS[random()<.5?0:1].id;
      audio=makeAudio(SUKUNA_TRACKS.find(t=>t.id===duel.music).src);
      audio.volume=.4;audio.loop=true;audio.preload='auto';
      audio.onerror=()=>{status='error';notify();};
      status=duel.musicPaused?'paused':'ready';
      if(!duel.musicPaused)void play();
      return changed;
    },
    toggle() {
      if(!audio)return;
      if(status==='playing'||status==='loading'){
        generation++;owner.musicPaused=true;audio.pause();status='paused';notify();
      }else{owner.musicPaused=false;void play();}
    },
    retry(){if(status==='blocked')void play();},
    stop,
    get label(){
      const title=SUKUNA_TRACKS.find(t=>t.id===owner?.music)?.title||'';
      return `${status==='playing'||status==='loading'?'暂停':status==='error'?'重试播放':'播放'}《${title}》`;
    },
    get active(){return !!owner;},
    get status(){return status;}
  };
}

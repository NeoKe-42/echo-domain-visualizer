type Props={playing:boolean;name:string;current:number;duration:number;volume:number;level:number;mode:string;onToggle:()=>void;onSeek:(v:number)=>void;onVolume:(v:number)=>void;onFile:(f:File)=>void;onStopMic:()=>void};
const fmt=(n:number)=>Number.isFinite(n)?`${Math.floor(n/60)}:${Math.floor(n%60).toString().padStart(2,'0')}`:'0:00';
export function AudioControls(p:Props){
 if(p.mode==='capture') return <div className="capture-strip"><span className="live-orb"/><div><strong>系统音频已连接</strong><small>QQ 音乐实时频谱</small></div><div className="capture-meter"><i style={{transform:`scaleX(${Math.min(1,p.level)})`}}/></div><button className="text-button" onClick={p.onStopMic}>停止共享</button></div>;
 return <div className="audio-row">
  <button className="icon-button" onClick={p.onToggle} disabled={p.mode!=='file'} aria-label={p.playing?'暂停':'播放'}>{p.playing?'Ⅱ':'▶'}</button>
  <div className="track"><div className="track-title"><span>{p.name|| (p.mode==='mic'?'麦克风正在监听':p.mode==='capture'?'系统音频捕获中':'环境浪潮')}</span><span>{p.mode==='file'?`${fmt(p.current)} / ${fmt(p.duration)}`:p.mode==='mic'||p.mode==='capture'?'LIVE':'IDLE'}</span></div>
   {(p.mode==='mic'||p.mode==='capture')&&<div className="level-meter" title="实时输入电平"><i style={{transform:`scaleX(${Math.min(1,p.level)})`}}/></div>}
   <input aria-label="播放进度" type="range" min="0" max={p.duration||1} step=".01" value={p.current} disabled={p.mode!=='file'} onChange={e=>p.onSeek(+e.target.value)}/></div>
  <label className="volume">音量 <input aria-label="音量" type="range" min="0" max="1" step=".01" value={p.volume} onChange={e=>p.onVolume(+e.target.value)}/></label>
  {p.mode==='mic'||p.mode==='capture'?<button className="text-button" onClick={p.onStopMic}>停止捕获</button>:<label className="text-button">更换音乐<input hidden type="file" accept="audio/*" onChange={e=>e.target.files?.[0]&&p.onFile(e.target.files[0])}/></label>}
 </div>;
}

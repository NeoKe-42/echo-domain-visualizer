import { useEffect,useRef,useState } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { EchoGridScene } from './scene/EchoGridScene';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { AudioControls } from './components/AudioControls';
import { SettingsPanel } from './components/SettingsPanel';
import { DEFAULT_SETTINGS,type AudioFeatures,type VisualSettings } from './types';
import './styles.css';

export default function App(){
 const canvas=useRef<HTMLDivElement>(null),audioEngine=useRef(new AudioEngine());
 const features=useRef<AudioFeatures>({overall:0,bass:0,mid:0,treble:0,beat:0,spectrum:new Float32Array(64)});
 const settingsRef=useRef<VisualSettings>({...DEFAULT_SETTINGS});
 const [settings,setSettings]=useState({...DEFAULT_SETTINGS}),[mode,setMode]=useState<'idle'|'file'|'mic'|'capture'>('idle');
 const [name,setName]=useState(''),[playing,setPlaying]=useState(false),[current,setCurrent]=useState(0),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.8);
 const [inputLevel,setInputLevel]=useState(0);
 const [collapsed,setCollapsed]=useState(false),[message,setMessage]=useState(''),[webglError,setWebglError]=useState('');
 useEffect(()=>{settingsRef.current=settings},[settings]);
 useEffect(()=>{
  let scene:EchoGridScene|undefined,raf=0;
  try{if(!canvas.current) return;scene=new EchoGridScene(canvas.current,()=>features.current,()=>settingsRef.current);}
  catch{setWebglError('无法启动 WebGL。请启用硬件加速或更换现代浏览器。');return;}
  const sample=()=>{features.current=audioEngine.current.sample(settingsRef.current.smoothing,settingsRef.current.sensitivity);raf=requestAnimationFrame(sample)};sample();
  return()=>{cancelAnimationFrame(raf);scene?.dispose();audioEngine.current.dispose()};
 },[]);
 useEffect(()=>{const id=window.setInterval(()=>{const a=audioEngine.current.getAudio();setInputLevel(features.current.overall);if(a){setCurrent(a.currentTime||0);setDuration(a.duration||0);setPlaying(!a.paused)}},250);return()=>clearInterval(id)},[]);
 const load=async(file:File)=>{if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)){setMessage('请选择浏览器支持的音频文件');return}try{setMessage('正在载入本地音频…');const a=await audioEngine.current.loadFile(file);a.volume=volume;a.onended=()=>setPlaying(false);setName(file.name);setMode('file');setPlaying(true);setMessage('')}catch(e){setMessage(e instanceof Error?`无法播放：${e.message}`:'无法播放此文件')}};
 const mic=async()=>{try{setMessage('浏览器将申请麦克风权限，声音仅用于本地分析');await audioEngine.current.startMic();setMode('mic');setName('麦克风');setPlaying(false);setMessage('麦克风正在监听（不会回放）')}catch(e){setMessage(e instanceof Error?`麦克风不可用：${e.message}`:'麦克风权限被拒绝')}};
 const capture=async()=>{try{setMessage('请选择整个屏幕并勾选“共享系统音频”，同时保持 QQ 音乐播放');await audioEngine.current.startCapture(()=>{setMode('idle');setMessage('系统音频共享已结束')});setMode('capture');setName('QQ 音乐 / 系统音频');setPlaying(false);setMessage('')}catch(e){setMode('idle');setMessage(e instanceof Error?`捕获失败：${e.message}`:'系统音频捕获被取消')}};
 useEffect(()=>{const prevent=(e:DragEvent)=>e.preventDefault();const drop=(e:DragEvent)=>{e.preventDefault();if(e.dataTransfer?.files[0])void load(e.dataTransfer.files[0])};window.addEventListener('dragover',prevent);window.addEventListener('drop',drop);return()=>{window.removeEventListener('dragover',prevent);window.removeEventListener('drop',drop)}});
 const stopMic=()=>{audioEngine.current.stopStream();setMode('idle');setMessage('已停止音频捕获，回到环境浪潮')};
 const change=(p:Partial<VisualSettings>)=>setSettings(v=>({...v,...p}));
 return <main onPointerDown={e=>e.stopPropagation()}>
  <div className="scene" ref={canvas}/><div className="vignette"/>
  <header><div className="brand"><i/> ECHO DOMAIN <em>/ 音域回响</em></div><div className={`status ${mode}`}>{mode==='mic'?'● LIVE MIC':mode==='capture'?'● SYSTEM AUDIO':mode==='file'?'● LOCAL AUDIO':'○ AMBIENT'}</div></header>
  <WelcomeOverlay active={mode==='idle'} onCapture={()=>void capture()}/>
  {message&&<div className="toast" role="status">{message}<button onClick={()=>setMessage('')}>×</button></div>}
  {webglError&&<div className="compat">{webglError}</div>}
  {mode!=='idle'&&<section className={`panel ${collapsed?'collapsed':''}`}>
   <button className="collapse" onClick={()=>setCollapsed(v=>!v)}>{collapsed?'⌃ 控制台':'⌄'}</button>
   {!collapsed&&<><AudioControls playing={playing} name={name} current={current} duration={duration} volume={volume} level={inputLevel} mode={mode} onToggle={()=>void audioEngine.current.toggle()} onSeek={v=>{const a=audioEngine.current.getAudio();if(a)a.currentTime=v;features.current.beat=0}} onVolume={v=>{setVolume(v);audioEngine.current.setVolume(v)}} onFile={f=>void load(f)} onStopMic={stopMic}/><SettingsPanel settings={settings} onChange={change} onReset={()=>setSettings({...DEFAULT_SETTINGS})}/></>}
  </section>}
 </main>;
}

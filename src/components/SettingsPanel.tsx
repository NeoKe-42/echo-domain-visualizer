import type { VisualSettings } from '../types';
type Props={settings:VisualSettings;onChange:(patch:Partial<VisualSettings>)=>void;onReset:()=>void};
export function SettingsPanel({settings:s,onChange,onReset}:Props){
 return <div className="settings">
  <label>灵敏度 <span>{s.sensitivity.toFixed(1)}</span><input type="range" min=".5" max="2" step=".1" value={s.sensitivity} onChange={e=>onChange({sensitivity:+e.target.value})}/></label>
  <label>柱阵强度 <span>{s.intensity.toFixed(1)}</span><input type="range" min=".5" max="1.8" step=".1" value={s.intensity} onChange={e=>onChange({intensity:+e.target.value})}/></label>
  <label>平滑度 <span>{Math.round(s.smoothing*100)}%</span><input type="range" min=".25" max=".95" step=".05" value={s.smoothing} onChange={e=>onChange({smoothing:+e.target.value})}/></label>
  <div className="select-grid"><label>画质<select value={s.quality} onChange={e=>onChange({quality:e.target.value as VisualSettings['quality']})}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>
  <label>配色<select value={s.palette} onChange={e=>onChange({palette:e.target.value as VisualSettings['palette']})}><option value="deep">深海</option><option value="aurora">极光</option><option value="lava">熔岩</option></select></label></div>
  <div className="setting-actions"><label className="switch"><input type="checkbox" checked={s.autoCamera} onChange={e=>onChange({autoCamera:e.target.checked})}/> 自动镜头</label><button onClick={onReset}>重置参数</button><button onClick={()=>void document.documentElement.requestFullscreen?.()}>全屏</button></div>
 </div>;
}

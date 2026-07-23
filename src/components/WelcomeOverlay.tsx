type Props={active:boolean;onCapture:()=>void};
export function WelcomeOverlay({active,onCapture}:Props){
  return <section className={`welcome ${active?'':'welcome--hidden'}`}>
    <div className="eyebrow">REALTIME AUDIO FIELD</div><h1>音域回响</h1><p>让频率成为光的地形</p>
    <div className="welcome-actions">
      <button className="primary button capture-main" onClick={onCapture}><span className="pulse-dot"/>连接系统音频</button>
    </div>
    <small>在系统弹窗中启用“共享系统音频” · 所有分析仅在本地完成</small>
  </section>;
}

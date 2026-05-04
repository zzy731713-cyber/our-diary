import { useState, useEffect } from 'react'
import './App.css'
import html2canvas from 'html2canvas'
// ✨ 新增下面这一行：呼叫 Supabase 云端大脑！
import { supabase } from './supabase'

function App() {
  // --- 🧭 页面导航状态 ---
  const [activeTab, setActiveTab] = useState('diary');
  const [calView, setCalView] = useState('month'); 
  const [expandedTimeline, setExpandedTimeline] = useState({}); // 🌳 记住时光树里哪些枝桠被折叠了

  // --- 🌟 核心动态数据 🌟 ---
// --- 🌟 核心动态数据 🌟 ---

  // 1. 日记数据（初始为空屏幕）
  const [diaries, setDiaries] = useState([]);

  // ✨ 云端魔法 1：网页刚打开时，自动去 Supabase 把你们的日记拉下来！
  useEffect(() => {
    const fetchDiaries = async () => {
      // 告诉 Supabase：去 diaries 表里，把所有数据拿过来，按日期倒序排
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .order('date', { ascending: false }); 
      
      if (error) {
        console.error("读取云端日记失败:", error);
      } else if (data) {
        setDiaries(data); // 把拿到的云端日记展示到网页上
      }
    };
    fetchDiaries();
  }, []); // 空数组表示只在网页刚打开时拉取一次

  // 2. 回收站数据
  const [trashDiaries, setTrashDiaries] = useState(() => {
    const saved = localStorage.getItem('love_trash');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 照片墙数据
  const [standalonePhotos, setStandalonePhotos] = useState(() => {
    const saved = localStorage.getItem('love_photos');
    return saved ? JSON.parse(saved) : [
      'https://images.pexels.com/photos/3178818/pexels-photo-3178818.jpeg?auto=compress&cs=tinysrgb&w=600'
    ];
  });

  // 4. 关于我们照片数据
  const [aboutPhotos, setAboutPhotos] = useState(() => {
    const saved = localStorage.getItem('love_about_photos');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 💾 自动存档魔法 (只要你在网页上发了日记或删了东西，瞬间自动存入浏览器) ---
  useEffect(() => { localStorage.setItem('love_diaries', JSON.stringify(diaries)); }, [diaries]);
  useEffect(() => { localStorage.setItem('love_trash', JSON.stringify(trashDiaries)); }, [trashDiaries]);
  useEffect(() => { localStorage.setItem('love_photos', JSON.stringify(standalonePhotos)); }, [standalonePhotos]);
  useEffect(() => { localStorage.setItem('love_about_photos', JSON.stringify(aboutPhotos)); }, [aboutPhotos]);

  // --- 📝 表单状态 ---
  const [newDiaryDate, setNewDiaryDate] = useState(""); 
  const [newDiaryText, setNewDiaryText] = useState("");
  const [newDiaryImg, setNewDiaryImg] = useState(null);

  // --- ✏️ 编辑状态 ---
  const [editingDiaryId, setEditingDiaryId] = useState(null); // 记住正在修改哪篇日记
  const [viewingDiaryId, setViewingDiaryId] = useState(null); // 记住当前进入了哪一天的“专属隔间”
  const [editDate, setEditDate] = useState("");
  const [editText, setEditText] = useState("");
  const [editImg, setEditImg] = useState(null);
  // --- 🎬 幻灯片播放器状态 ---
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const allPhotos = [...diaries.map(d => d.img).filter(Boolean), ...standalonePhotos, ...aboutPhotos];

  // --- 📅 动态万年历引擎 ---
  const [calYear, setCalYear] = useState(2026); 
  const [calMonth, setCalMonth] = useState(5);  

  const daysInSelectedMonth = new Date(calYear, calMonth, 0).getDate(); 
  const calDaysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1); 
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay(); 
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i); 

  // --- 🛠️ 交互函数 🛠️ ---

  // 1. 发布日记
  // 1. 发布日记 (🚀 云端发射升级版)
  const handlePostDiary = async () => {
    if (!newDiaryDate) return alert("请先选择发生的日期哦！📅");
    if (!newDiaryText && !newDiaryImg) return alert("写点内容或者传张照片吧！");
    
    const newPost = {
      id: `post-${Date.now()}`,
      date: newDiaryDate,
      content: newDiaryText,
      img: newDiaryImg 
    };

    // ✨ 云端魔法 2：向 Supabase 数据库发射数据！
    const { error } = await supabase.from('diaries').insert([newPost]);
    
    if (error) {
      alert("保存到云端失败啦，请看控制台报错！");
      console.error(error);
    } else {
      // 发射成功后，才在网页上显示出来
      setDiaries([newPost, ...diaries]);
      setNewDiaryText("");
      setNewDiaryImg(null);
      setNewDiaryDate("");
    }
  };

  // 2. 本地图片上传
  // 2. 图片上传 (🚀 升级为云端直传引擎)
  const handleImageUpload = async (e, setImgState, isArray = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. 给照片起个独一无二的名字 (时间戳 + 原始后缀)，防止重名覆盖
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. 给用户一点视觉反馈
    alert("🚀 照片正在飞向云端，请稍等几秒钟...");

    // 3. 上传到 Supabase 的 love-photos 储物间
    const { data, error } = await supabase.storage
      .from('love-photos')
      .upload(filePath, file);

    if (error) {
      console.error("上传照片失败:", error);
      alert("❌ 照片上传失败了，请看控制台报错！");
      return;
    }

    // 4. 上传成功后，向云端要回这张照片的“全球公网访问链接”
    const { data: publicUrlData } = supabase.storage
      .from('love-photos')
      .getPublicUrl(filePath);

    const finalUrl = publicUrlData.publicUrl;

    // 5. 把这个真实的云端链接存进状态里
    if (isArray) {
      setImgState(prev => [finalUrl, ...prev]);
    } else {
      setImgState(finalUrl);
    }

    alert("✅ 照片上传成功！现在可以点击【保存日记】啦！");
  };

  // 3. 生成回忆海报
  const generatePoster = (diaryId, date) => {
    const targetElement = document.getElementById(diaryId);
    if (!targetElement) return;

    html2canvas(targetElement, { backgroundColor: '#ffffff', scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `我们的专属回忆-${date}.png`;
      link.click();
    });
  };

 // 4. 日历和照片墙的任意门：直接进入该日记的专属隔间！
  const jumpToDiary = (postId) => {
    setActiveTab('diary');
    setViewingDiaryId(postId); // ✨ 新增：告诉大脑现在进入了哪个隔间
  };

  // 5. 删除日记并移入回收站
  // 3. 删除日记 (🚀 云端彻底粉碎版)
 // 3. 删除日记 (🚀 云端彻底删除 + 回收站备份版)
  // 3. 删除日记 (🚀 云端彻底删除 + 回收站倒计时备份版)
  const handleDeleteDiary = async (id) => {
    const isConfirm = window.confirm("真的要删除这篇珍贵的日记吗？删了云端也找不回了哦！🥺");
    if (!isConfirm) return;

    // ✨ 在删除前，先把它找出来备份
    const diaryToTrash = diaries.find(d => d.id === id);

    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id); 

    if (error) {
      console.error("云端删除失败:", error);
      alert("❌ 删除失败，请看控制台报错！");
    } else {
      setDiaries(diaries.filter(diary => diary.id !== id));
      
      if (diaryToTrash) {
        // ✨ 重点：打上此时此刻的“删除时间戳”，为了以后算 30 天过期用
        const trashItem = { ...diaryToTrash, deletedAt: Date.now() };
        setTrashDiaries(prev => [trashItem, ...prev]);
      }
    }
  };
  // ✨ 开启修改模式：把原来的内容填进框里
  const handleStartEdit = (diary) => {
    setEditingDiaryId(diary.id);
    setEditDate(diary.date);
    setEditText(diary.content);
    setEditImg(diary.img);
  };

  // ✨ 保存修改：用新内容覆盖旧内容
  // 4. 保存编辑 (🚀 云端同步更新版)
  const handleSaveEdit = async (id) => {
    // 假设你编辑框里的内容存在 editText 这个状态里
    // ✨ 云端魔法 4：告诉 Supabase，把对应 id 的日记的 content 更新为新的内容！
    const { error } = await supabase
      .from('diaries')
      .update({ content: editText }) // 把 content 字段更新为 editText
      .eq('id', id); // 同样，必须要告诉数据库是更新哪一篇

    if (error) {
      console.error("云端更新失败:", error);
      alert("❌ 修改保存失败，请重试！");
    } else {
      // 云端更新成功后，更新网页显示的内容，并退出编辑模式
      setDiaries(diaries.map(diary => 
        diary.id === id ? { ...diary, content: editText } : diary
      ));
      setEditingDiaryId(null);; // 退出编辑状态
      alert("✅ 修改已同步到云端！");
    }
  };

  // ✨ 取消修改
  const handleCancelEdit = () => {
    setEditingDiaryId(null);
  };

  // 7. 从回收站恢复日记
  // 7. 从回收站恢复日记 (🚀 云端浴火重生版)
  const handleRestoreDiary = async (diaryToRestore) => {
    // 把附加的 deletedAt 属性去掉，只保留原始清爽的数据发给云端
    const { deletedAt, ...originalDiary } = diaryToRestore;

    // ✨ 云端魔法：把它重新塞回 Supabase 数据库的 diaries 表里
    const { error } = await supabase.from('diaries').insert([originalDiary]);

    if (error) {
      console.error("恢复失败:", error);
      alert("❌ 恢复失败，请看控制台！");
    } else {
      // 1. 从回收站列表里踢出去
      setTrashDiaries(trashDiaries.filter(d => d.id !== diaryToRestore.id));
      // 2. 塞回正常的日记列表（因为它的 date 没变，时光档案馆会自动把它排回原来的位置）
      setDiaries([originalDiary, ...diaries]);
      alert("✅ 恢复成功！它已经回到原来的那一天了！");
    }
  };
  // 6. 自动幻灯片播放
  useEffect(() => {
    let timer;
    if (activeTab === 'about' && allPhotos.length > 0) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % allPhotos.length);
      }, 3500); 
    }
    return () => clearInterval(timer);
  }, [activeTab, allPhotos.length]);

  // ✨ 回收站 30 天自动清理保洁员 (网页打开时自动检查)
  useEffect(() => {
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30天的毫秒数
    // 过滤出还没过期的日记（保留）
    const validTrash = trashDiaries.filter(d => !d.deletedAt || (now - d.deletedAt) < THIRTY_DAYS);
    
    // 如果发现有超时的被清理了，就更新本地回收站
    if (validTrash.length !== trashDiaries.length) {
      setTrashDiaries(validTrash);
    }
  }, []); // 空数组表示每次刷新网页时执行一次检查
  // ✨ 8. 键盘左右键翻页魔法 (仅在隔间模式生效)
  // ✨ 8. 键盘左右键翻页魔法 (按【日期】翻页)
  useEffect(() => {
    if (!viewingDiaryId) return; // 没进隔间就不监听

    const handleKeyDown = (e) => {
      // 如果正在输入框里打字，不要触发翻页！
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // 1. 找出当前所在日期的那一篇
      const currentViewingDiary = diaries.find(d => d.id === viewingDiaryId);
      if (!currentViewingDiary) return;

      // 2. 提取出所有记录过日记的“唯一日期”列表
      const uniqueDates = [...new Set(diaries.map(d => d.date))];
      const currentDateIndex = uniqueDates.indexOf(currentViewingDiary.date);

      if (e.key === 'ArrowLeft') {
        // 左键：翻到更早的一天
        if (currentDateIndex < uniqueDates.length - 1) {
          const targetEntry = diaries.find(d => d.date === uniqueDates[currentDateIndex + 1]);
          if (targetEntry) setViewingDiaryId(targetEntry.id);
        }
      } else if (e.key === 'ArrowRight') {
        // 右键：翻到更晚的一天
        if (currentDateIndex > 0) {
          const targetEntry = diaries.find(d => d.date === uniqueDates[currentDateIndex - 1]);
          if (targetEntry) setViewingDiaryId(targetEntry.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); 
  }, [viewingDiaryId, diaries]);


  // ===================== 页面渲染 =====================
  return (
    <div className="app-layout">
      {/* 🟢 左侧导航栏 */}
      <div className="side-navigation">
        <div className="sidebar-profile">
          <div className="avatar">💌</div>
          <h3>我们的恋爱日记</h3>
        </div>
        <div className="sidebar-menu">
          <button 
            className={activeTab === 'diary' && !viewingDiaryId ? 'menu-btn active' : 'menu-btn'} 
            onClick={() => { setActiveTab('diary'); setViewingDiaryId(null); }}
          >📖 全部日记</button>
          <button className={activeTab === 'calendar' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('calendar')}>📅 时光日历</button>
          <button className={activeTab === 'photos' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('photos')}>📸 专属照片墙</button>
          <button className={activeTab === 'about' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('about')}>❤️ 关于我们</button>
          <button className={activeTab === 'trash' ? 'menu-btn active' : 'menu-btn'} onClick={() => setActiveTab('trash')}>🗑️ 回收站</button>
        </div>
      </div>

      {/* 🔴 右侧主内容区 */}
      <div className="main-content">
        
        {/* --- 📖 房间 1：全部日记 --- */}
        {activeTab === 'diary' && (
          <div className="fade-in">
            {/* 顶部分岔路口：如果处于隔间模式，就显示退出按钮；否则显示原来的写日记表单 */}
              {viewingDiaryId ? (
                <div style={{ marginBottom: '20px' }}>
                  <button 
                    onClick={() => setViewingDiaryId(null)}
                    style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                  >
                    ⬅️ 退出隔间
                  </button>
                </div>
              ) : (
              <>
                <h2 className="section-title">✍️ 添加日记</h2>
                <div className="compose-box" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>📅 填写的年月日：</span>
                    <input type="date" className="date-picker" value={newDiaryDate} onChange={(e) => setNewDiaryDate(e.target.value)} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <textarea placeholder="在这里输入你们的日记内容..." value={newDiaryText} onChange={(e) => setNewDiaryText(e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc', outline:'none', fontFamily:'inherit' }} />
                  <div className="compose-actions" style={{ borderTop: 'none', paddingTop: '0', marginTop: '0' }}>
                    <label className="upload-btn">
                      {newDiaryImg ? '🖼️ 重新选择照片' : '📎 选择照片'}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewDiaryImg)} hidden />
                    </label>
                    <button className="send-btn" onClick={handlePostDiary}>💾 保存日记</button>
                  </div>
                  {newDiaryImg && (
                    <div><span style={{ fontSize: '12px', color: '#94a3b8' }}>已选照片预览：</span><br/><img src={newDiaryImg} alt="预览" className="preview-img" style={{ marginTop: '5px' }} /></div>
                  )}
                </div>
              </>
            )}

            <div className="diary-layout" style={{ marginTop: '40px' }}>
            {/* 仅在正常列表模式下显示时间轴索引 */}
              {!viewingDiaryId && (
                <div className="timeline-index" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: '10px' }}>
                  <div className="timeline-title" style={{ marginBottom: '20px', fontSize: '18px' }}>📍 时光档案馆</div>
                  
                  <div className="timeline-tree">
                    {Object.entries(
                      // 💡 魔法 1：把扁平的日记列表，自动收纳成 年 -> 月 -> 日 的树状结构
                      diaries.reduce((acc, diary) => {
                        if(!diary.date) return acc;
                        const [y, m, d] = diary.date.split('-');
                        if (!acc[y]) acc[y] = {};
                        if (!acc[y][m]) acc[y][m] = {};
                        if (!acc[y][m][d]) acc[y][m][d] = [];
                        acc[y][m][d].push(diary);
                        return acc;
                      }, {})
                    )
                    .sort((a, b) => b[0] - a[0]) // 年份倒序（最新的一年排最前）
                    .map(([year, months]) => (
                      <div key={year} className="timeline-year-group" style={{ marginBottom: '15px' }}>
                        
                        
                        <div 
                          onClick={() => setExpandedTimeline(p => ({...p, [year]: !p[year]}))}
                          style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#475569', padding: '5px 0', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                        >
                          <span style={{ transform: expandedTimeline[year] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', width: '22px', fontSize: '12px' }}>▼</span>
                           {year}年
                        </div>
                        
                        
                        {!expandedTimeline[year] && Object.entries(months).sort((a, b) => b[0] - a[0]).map(([month, days]) => {
                          const monthKey = `${year}-${month}`; // 组合键值防止不同年份的相同月份冲突
                          return (
                            <div key={monthKey} style={{ paddingLeft: '22px', marginTop: '8px' }}>
                              <div 
                                onClick={() => setExpandedTimeline(p => ({...p, [monthKey]: !p[monthKey]}))}
                                style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', color: '#db2777', padding: '4px 0', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                              >
                                <span style={{ transform: expandedTimeline[monthKey] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', width: '20px', fontSize: '10px' }}>▼</span>
                                 {month}月
                              </div>
                              
                              
                              {!expandedTimeline[monthKey] && (
                                <ul style={{ listStyle: 'none', paddingLeft: '20px', margin: '6px 0', borderLeft: '2px solid #fbcfe8' }}>
                                  {Object.entries(days).sort((a, b) => b[0] - a[0]).map(([day, dayDiaries]) => (
                                    <li key={`${monthKey}-${day}`} style={{ margin: '10px 0', position: 'relative' }}>
                                      
                                      <div style={{ position: 'absolute', left: '-25px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6', border: '2px solid #fff' }}></div>
                                      
                                      
                                      <a 
                                        href={`#${dayDiaries[0].id}`} 
                                        style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', display: 'block', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.target.style.color = '#db2777'; e.target.style.fontWeight = 'bold'; }}
                                        onMouseLeave={(e) => { e.target.style.color = '#64748b'; e.target.style.fontWeight = 'normal'; }}
                                      >
                                        {month}月{day}日 
                                        
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal', marginLeft: '5px' }}>
                                          ({dayDiaries.length} 篇)
                                        </span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
             <div className="diary-feed">
                {(() => {
                  // 1. 识别当前在看哪一天
                  const currentViewingDiary = diaries.find(d => d.id === viewingDiaryId);
                  const viewingDate = currentViewingDiary ? currentViewingDiary.date : null;
                  
                  // 2. 提取唯一日期，用于计算箭头
                  const uniqueDates = [...new Set(diaries.map(d => d.date))];
                  const currentDateIndex = uniqueDates.indexOf(viewingDate);

                  // 3. 过滤出要展示的日记
                  const displayedDiaries = diaries.filter(diary => viewingDate ? diary.date === viewingDate : true);

                  return (
                    <div style={{ position: 'relative', width: '100%' }}>
                      
                      {/* ✨ 注入侧边透明箭头的高级样式 (固定悬浮版) ✨ */}
                      {viewingDiaryId && (
                        <style>{`
                          .side-arrow {
                            position: fixed;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 50px;
                            height: 50px;
                            background: transparent;
                            color: #cbd5e1;
                            font-size: 55px;
                            border: none;
                            cursor: pointer;
                            opacity: 0.3;
                            transition: all 0.3s ease;
                            z-index: 999;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          }
                          .side-arrow:hover:not(:disabled) {
                            opacity: 1;
                            color: #64748b;
                            transform: translateY(-50%) scale(1.1);
                          }
                          .side-arrow:disabled {
                            display: none;
                          }
                          /* 动态计算位置，防止箭头挡住日记内容 */
                          .arrow-left { left: 280px; } 
                          .arrow-right { right: 40px; } 
                        `}</style>
                      )}

                      {/* 👈 左侧悬浮箭头 (更早的一天) */}
                      {viewingDiaryId && (
                        <button 
                          className="side-arrow arrow-left" 
                          disabled={currentDateIndex >= uniqueDates.length - 1} 
                          onClick={() => {
                            const nextDate = uniqueDates[currentDateIndex + 1];
                            const nextEntry = diaries.find(d => d.date === nextDate);
                            if (nextEntry) setViewingDiaryId(nextEntry.id);
                          }}
                        >
                          ❮
                        </button>
                      )}

                      {/* 👉 右侧悬浮箭头 (更晚的一天) */}
                      {viewingDiaryId && (
                        <button 
                          className="side-arrow arrow-right" 
                          disabled={currentDateIndex <= 0} 
                          onClick={() => {
                            const prevDate = uniqueDates[currentDateIndex - 1];
                            const prevEntry = diaries.find(d => d.date === prevDate);
                            if (prevEntry) setViewingDiaryId(prevEntry.id);
                          }}
                        >
                          ❯
                        </button>
                      )}

                      {/* 🌟 新增：专属隔间的【聚合日期头部】 🌟 */}
                      {viewingDiaryId && (
                        <div style={{ textAlign: 'center', marginBottom: '30px', padding: '15px', backgroundColor: '#fdf2f8', color: '#db2777', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px', border: '1px solid #fbcfe8' }}>
                          📅 这是 {viewingDate} 的专属隔间（共 {displayedDiaries.length} 篇回忆）
                        </div>
                      )}

                      {/* 🌟 日记卡片竖向排列区：加入 gap 强制保证不融合，一张一张排好 🌟 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {displayedDiaries.map((diary) => (
                          <div id={diary.id} className="diary-post" key={diary.id} style={{ margin: 0, width: '100%', boxSizing: 'border-box', boxShadow: viewingDiaryId ? '0 4px 20px rgba(0,0,0,0.08)' : '' }}>
                            
                            {/* 判断：如果当前日记正在被修改，就显示修改框；否则正常显示 */}
                            {editingDiaryId === diary.id ? (
                              /* ✏️ 修改模式 UI */
                              <div className="edit-mode-box" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontWeight: 'bold', color: '#db2777' }}>✏️ 修改日期：</span>
                                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fbcfe8', outline: 'none' }} />
                                </div>
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #fbcfe8', backgroundColor: '#fff', outline: 'none', fontFamily: 'inherit' }} />
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <label className="upload-btn" style={{ padding: '8px 15px', fontSize: '13px', backgroundColor: '#fdf2f8', color: '#db2777' }}>
                                    {editImg ? '🖼️ 更换照片' : '📎 添加照片'}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditImg)} hidden />
                                  </label>
                                  <button onClick={handleSaveEdit(diary.id)} style={{ backgroundColor: '#10b981', color: 'white', padding: '8px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✅ 保存修改</button>
                                  <button onClick={handleCancelEdit} style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '8px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>❌ 取消</button>
                                </div>
                                {editImg && <img src={editImg} alt="预览" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', marginTop: '10px', border: '2px solid #fbcfe8' }} />}
                              </div>
                            ) : (
                              /* 📖 正常展示 UI */
                              <>
                                <div className="post-header"><span className="post-date">📅 {diary.date}</span></div>
                                <div className="post-content">
                                  {diary.img && <img src={diary.img} alt="日记配图" className="post-image" />}
                                  <div className="post-text-area">
                                    <p className="post-text">{diary.content}</p>
                                    
                                    <div className="post-actions" style={{ marginTop: '15px' }}>
                                      {/* ✨ 核心：只有在列表状态下，才显示“进入隔间”按钮 ✨ */}
                                      {!viewingDiaryId && (
                                        <button onClick={() => setViewingDiaryId(diary.id)} style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>🚪 进入沉浸隔间</button>
                                      )}
                                      <button onClick={() => generatePoster(diary.id, diary.date)} style={{ backgroundColor: '#fff0f5', color: '#ff69b4', padding: '10px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>📸 生成回忆海报</button>
                                      <button onClick={() => handleStartEdit(diary)} style={{ backgroundColor: '#fdf2f8', color: '#db2777', padding: '10px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>✏️ 修改</button>
                                      <button onClick={() => handleDeleteDiary(diary.id)} style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '10px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>❌ 删除</button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* --- 📅 房间 2：时光日历 --- */}
        {activeTab === 'calendar' && (
          <div className="fade-in">
            <h2 className="section-title">时光日历</h2>
            <div className="calendar-widget">
              
              <div className="calendar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={() => { if(calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }} 
                    style={{ border: 'none', background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                  >◀</button>
                  <h3 className="calendar-title" style={{ margin: 0 }}>{calYear}年 {calMonth}月</h3>
                  <button 
                    onClick={() => { if(calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }} 
                    style={{ border: 'none', background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                  >▶</button>
                </div>
                
                <div className="cal-toggles">
                  <button className={calView === 'year' ? 'active' : ''} onClick={() => setCalView('year')}>年</button>
                  <button className={calView === 'month' ? 'active' : ''} onClick={() => setCalView('month')}>月</button>
                </div>
              </div>

              {calView === 'month' && (
                <div className="calendar-grid grid-month">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (<div className="cal-head" key={day}>{day}</div>))}
                  
                  {emptyDays.map(emptyDay => (
                    <div className="cal-cell empty" key={`empty-${emptyDay}`}></div>
                  ))}
                  
                  {calDaysArray.map(day => {
                    const dateString = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const foundDiary = diaries.find(d => d.date === dateString);
                    return (
                      <div 
                        onClick={foundDiary ? () => jumpToDiary(foundDiary.id) : undefined} 
                        className={`cal-cell ${foundDiary ? 'has-record' : ''}`} 
                        key={day}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              )}

              {calView === 'year' && (
                <div className="calendar-grid grid-year">
                  {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((monthName, index) => {
                    const monthNum = index + 1;
                    const hasDiaryThisMonth = diaries.some(d => d.date.startsWith(`${calYear}-${String(monthNum).padStart(2, '0')}`));
                    return (
                      <div 
                        className={`cal-month-cell ${calMonth === monthNum ? 'current-month' : ''}`} 
                        key={monthName}
                        onClick={() => { setCalMonth(monthNum); setCalView('month'); }} 
                      >
                        {monthName}
                        {hasDiaryThisMonth && <div className="month-dot"></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 📸 房间 3：照片墙 --- */}
        {activeTab === 'photos' && (
           <div className="fade-in">
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
               <h2 className="section-title">专属照片墙</h2>
               <label className="upload-btn upload-primary">
                  ➕ 独立传照片
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setStandalonePhotos, true)} hidden />
               </label>
             </div>
             <div className="photo-grid-demo" style={{marginTop:'20px'}}>
               {allPhotos.map((imgSrc, idx) => {
                 // 去日记本里找找，这张照片是不是某篇日记里的？
                 const linkedDiary = diaries.find(d => d.img === imgSrc);
                 
                 return (
                   <div 
                     className="photo-placeholder" 
                     key={idx}
                     // ✨ 如果找到了对应的日记，就绑定点击跳转魔法
                     onClick={linkedDiary ? () => jumpToDiary(linkedDiary.id) : undefined}
                     // 给有日记的照片变成“小手”图标，提示可以点击
                     style={{ cursor: linkedDiary ? 'pointer' : 'default', position: 'relative' }}
                     title={linkedDiary ? `点击穿越回 ${linkedDiary.date} 的日记` : ''}
                   >
                     <img src={imgSrc} alt="照片墙" />
                     
                     {/* ✨ 给可以跳转的照片角落加个半透明的日期小提示 ✨ */}
                     {linkedDiary && (
                       <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backdropFilter: 'blur(4px)' }}>
                         📖 跳转日记
                       </span>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        )}

        {/* --- ❤️ 房间 4：关于我们 --- */}
        {activeTab === 'about' && (
          <div className="fade-in">
            <h2 className="section-title">我们的故事</h2>
            <div className="memory-widget">
              {allPhotos.length > 0 ? (
                <>
                  <img key={currentSlideIndex} src={allPhotos[currentSlideIndex]} className="ken-burns-img" alt="回忆" />
                  <div className="memory-overlay">
                    <h3>💑 专属回忆正在生成...</h3>
                    <p>为你自动提取了 {allPhotos.length} 张恋爱瞬间</p>
                  </div>
                </>
              ) : (
                <div className="memory-empty">快去写日记或上传照片，这里会自动生成回忆大片！</div>
              )}
            </div>
            <div className="about-card">
              <p>这里是专属两个人的小世界。照片会在这里汇总成自动播放的回忆集。</p>
              <div style={{marginTop:'20px'}}>
                <label className="upload-btn">
                    💌 继续添加私密回忆照片
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setAboutPhotos, true)} hidden />
                </label>
              </div>
              {aboutPhotos.length > 0 && (
                <div className="photo-grid-demo" style={{marginTop:'20px'}}>
                  {aboutPhotos.map((img, idx) => (
                    <div className="photo-placeholder" key={`about-${idx}`}><img src={img} alt="关于" /></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 🗑️ 房间 5：回收站 --- */}
        {activeTab === 'trash' && (
          <div className="fade-in">
            <h2 className="section-title">🗑️ 回收站</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>这里存放着你删掉的日记，30天后将自动彻底销毁。支持上下滑动查看哦！</p>

            {trashDiaries.length === 0 ? (
              <div className="about-card" style={{ textAlign: 'center', color: '#94a3b8' }}>回收站空空如也~</div>
            ) : (
              // ✨ 这里加入了 maxHeight 和 overflowY，打造专属的上下滑动视口
              <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {trashDiaries.map((diary) => {
                    // 动态计算还剩多少天过期
                    const daysLeft = diary.deletedAt 
                      ? Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - diary.deletedAt)) / (1000 * 60 * 60 * 24))
                      : 30;

                    return (
                      <div className="diary-post" key={diary.id} style={{ margin: 0, opacity: 0.85, border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="post-date" style={{ color: '#94a3b8' }}>📅 原日期：{diary.date}</span>
                          <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '12px' }}>
                            ⏳ 还剩 {daysLeft > 0 ? daysLeft : 0} 天销毁
                          </span>
                        </div>
                        <div className="post-content">
                          {diary.img && <img src={diary.img} alt="废弃配图" className="post-image" style={{ filter: 'grayscale(30%)' }} />}
                          <div className="post-text-area">
                            <p className="post-text" style={{ color: '#64748b' }}>{diary.content}</p>
                            <div className="post-actions" style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleRestoreDiary(diary)} 
                                style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                ♻️ 恢复到 {diary.date}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default App
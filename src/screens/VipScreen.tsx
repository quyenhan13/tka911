import React from 'react';

const VipScreen: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-32 pt-10">
      <div className="px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 p-8 shadow-2xl shadow-orange-500/20">
          {/* Sparkles Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="relative z-10">
            <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Premium Member</span>
            <h2 className="text-4xl font-black text-white mt-4 leading-tight">VTEEN <br/>PRO PLUS</h2>
            <p className="text-white/80 text-sm mt-4 font-medium leading-relaxed">
              Trải nghiệm xem phim không quảng cáo, chất lượng 4K và ưu tiên cập nhật sớm nhất.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4">
        <h3 className="text-sm font-black text-text-dim uppercase tracking-widest">Quyền lợi đặc biệt</h3>
        
        <div className="grid grid-cols-1 gap-3">
          {[
            { title: 'Chất lượng 4K Ultra HD', icon: '💎' },
            { title: 'Tốc độ tải siêu nhanh', icon: '⚡' },
            { title: 'Không quảng cáo', icon: '🚫' },
            { title: 'Xem trước tập mới nhất', icon: '🆕' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-card border border-white/5 p-5 rounded-3xl group active:scale-95 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-bold text-white/90">{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-4">
        <button className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-white/5 active:scale-95 transition-all">
          NÂNG CẤP CHỈ 50K/THÁNG
        </button>
        <p className="text-center text-[10px] text-text-dim mt-4 uppercase tracking-tighter">Hủy bất cứ lúc nào • Thanh toán an toàn</p>
      </div>
    </div>
  );
};

export default VipScreen;

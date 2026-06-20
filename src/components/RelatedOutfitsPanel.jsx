export default function RelatedOutfitsPanel({ cloth, outfits, panelWidth, onClose, onSelectOutfit, isPortrait = false }) {
  const relatedOutfits = outfits.filter(outfit =>
    cloth && cloth.id && outfit.clothes && outfit.clothes.some(c => c.id === cloth.id)
  )

  const gridCols = 'grid-cols-2'
  const gap = panelWidth >= 350 ? 'gap-2.5' : 'gap-3'
  const nameSize = panelWidth >= 350 ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className={`h-full flex flex-col glass-card gallery-shadow overflow-hidden animate-slide-in ${isPortrait ? 'rounded-l-3xl m-0' : 'rounded-3xl m-4 ml-1'}`}>
      <div className="px-4 py-3 border-b border-gray-200/20 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-gray-400 font-medium">关联搭配</p>
          <p className="text-[11px] tracking-wide text-gray-600 mt-0.5 truncate max-w-[160px]">
            {cloth ? cloth.name : '点击画布单品'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100/50 transition-all duration-200 text-gray-400 hover:text-gray-600"
          title="关闭"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 subtle-scroll">
        {relatedOutfits.length > 0 ? (
          <div className={`grid ${gridCols} ${gap}`}>
            {relatedOutfits.map((outfit) => (
              <div
                key={outfit.id}
                className="relative group cursor-pointer animate-fade-in"
                onClick={() => onSelectOutfit(outfit)}
              >
                <div className="aspect-square bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-white/50">
                  <img
                    src={outfit.screenshot}
                    alt={outfit.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                {outfit.palette && outfit.palette.length > 0 && (
                  <div className="flex items-center justify-center mt-0.5">
                    {outfit.palette.map((hex, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-full border border-gray-300/60 shadow-sm"
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: hex,
                          marginLeft: i > 0 ? '-2px' : '0',
                        }}
                        title={hex}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-300 px-4">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[11px] tracking-wide font-light leading-relaxed">
                暂无关联方案
              </p>
              <p className="text-[10px] mt-0.5 opacity-50 leading-relaxed">
                快去搭配一个吧！
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
